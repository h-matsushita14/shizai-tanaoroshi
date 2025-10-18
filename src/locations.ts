// 型定義
type InventoryStatus = 'recorded' | 'unrecorded';

interface ProductInventory {
  商品コード: string;
  商品名: string;
  棚卸数量: number;
  記録日時: Date;
}

interface LocationDetail {
  id: string;
  name: string;
  inventoryStatus: InventoryStatus;
  products?: ProductInventory[]; // 製品情報を追加
}

interface StorageArea {
  id: string;
  name: string;
  details: LocationDetail[];
  inventoryStatus: InventoryStatus;
  products?: ProductInventory[]; // 製品情報を追加
}

interface CategoryGroup {
  category: string;
  storageAreas: { [name: string]: StorageArea };
}

interface Hierarchy {
  [category: string]: CategoryGroup;
}

interface LocationMasterData {
  [key: string]: string | number;
}

function getLocations() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const locationSheet = ss.getSheetByName("Location_Master");
  if (!locationSheet) throw new Error("Location_Masterシートが見つかりません。");

  const inventorySheet = ss.getSheetByName("Inventory_Records");
  if (!inventorySheet) throw new Error("Inventory_Recordsシートが見つかりません。");

  const locationProductMappingSheet = ss.getSheetByName("Location_Product_Mapping");
  if (!locationProductMappingSheet) throw new Error("Location_Product_Mappingシートが見つかりません。");

  const productMasterSheet = ss.getSheetByName("Product_Master");
  if (!productMasterSheet) throw new Error("Product_Masterシートが見つかりません。");

  // --- Product_Masterから商品情報を取得 ---
  const productMasterData = productMasterSheet.getDataRange().getValues();
  const productMasterHeaders = productMasterData.shift() || [];
  const pmProductCodeIndex = productMasterHeaders.indexOf("商品コード");
  const pmProductNameIndex = productMasterHeaders.indexOf("商品名");

  if (pmProductCodeIndex === -1 || pmProductNameIndex === -1) {
    throw new Error("Product_Masterシートに必要なカラム（商品コード, 商品名）が見つかりません。");
  }

  const productMasterMap = new Map<string, { 商品名: string }>();
  productMasterData.forEach(row => {
    const productCode = String(row[pmProductCodeIndex]);
    const productName = String(row[pmProductNameIndex]);
    productMasterMap.set(productCode, { 商品名: productName });
  });

  // --- Location_Product_Mappingからロケーションと商品の紐付けを取得 ---
  const locationProductMappingData = locationProductMappingSheet.getDataRange().getValues();
  const locationProductMappingHeaders = locationProductMappingData.shift() || [];
  const lpmLocationIdIndex = locationProductMappingHeaders.indexOf("ロケーションID");
  const lpmProductCodeIndex = locationProductMappingHeaders.indexOf("商品コード");

  if (lpmLocationIdIndex === -1 || lpmProductCodeIndex === -1) {
    throw new Error("Location_Product_Mappingシートに必要なカラム（ロケーションID, 商品コード）が見つかりません。");
  }

  const locationProductMap = new Map<string, string[]>(); // Map<locationId, productCode[]>
  locationProductMappingData.forEach(row => {
    const locationId = String(row[lpmLocationIdIndex]);
    const productCode = String(row[lpmProductCodeIndex]);
    if (!locationProductMap.has(locationId)) {
      locationProductMap.set(locationId, []);
    }
    locationProductMap.get(locationId)?.push(productCode);
  });

  // --- Inventory_Recordsから最新の棚卸記録を取得と処理 ---
  const inventoryData = inventorySheet.getDataRange().getValues();
  const inventoryHeaders = inventoryData.shift() || [];
  const invLocationIdIndex = inventoryHeaders.indexOf("ロケーションID");
  const invTimestampIndex = inventoryHeaders.indexOf("記録日時");
  const invProductCodeIndex = inventoryHeaders.indexOf("商品コード");
  const invLotQuantityIndex = inventoryHeaders.indexOf("ロット数量");
  const invLooseQuantityIndex = inventoryHeaders.indexOf("バラ数量");

  if (invLocationIdIndex === -1 || invTimestampIndex === -1 || invProductCodeIndex === -1 || invLotQuantityIndex === -1 || invLooseQuantityIndex === -1) {
    throw new Error("Inventory_Recordsシートに必要なカラム（ロケーションID, 記録日時, 商品コード, ロット数量, バラ数量）が見つかりません。");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const recordedLocationIds = new Set<string>();
  const latestProductInventoryMap = new Map<string, Map<string, ProductInventory>>(); // Map<locationId, Map<productCode, ProductInventory>>

  inventoryData.forEach(row => {
    const locationId = String(row[invLocationIdIndex]);
    const timestamp = new Date(row[invTimestampIndex]);
    const productCode = String(row[invProductCodeIndex]);
    const lotQuantity = typeof row[invLotQuantityIndex] === 'number' ? row[invLotQuantityIndex] : 0;
    const looseQuantity = typeof row[invLooseQuantityIndex] === 'number' ? row[invLooseQuantityIndex] : 0;

    const productName = productMasterMap.get(productCode)?.商品名 || productCode; // Product_Masterから商品名を取得

    const currentProductInventory: ProductInventory = {
      商品コード: productCode,
      商品名: productName,
      棚卸数量: lotQuantity + looseQuantity,
      記録日時: timestamp,
    };

    if (timestamp >= today && timestamp < tomorrow) {
      recordedLocationIds.add(locationId);
    }

    if (!latestProductInventoryMap.has(locationId)) {
      latestProductInventoryMap.set(locationId, new Map<string, ProductInventory>());
    }

    const productsInLocation = latestProductInventoryMap.get(locationId)!;
    const existingProduct = productsInLocation.get(productCode);

    if (!existingProduct || existingProduct.記録日時 < currentProductInventory.記録日時) {
      productsInLocation.set(productCode, currentProductInventory);
    }
  });

  // --- ロケーションマスターの取得と処理 ---
  const locationData = locationSheet.getDataRange().getValues();
  const locationHeaders = locationData.shift() || [];

  const idIndex = locationHeaders.indexOf("ロケーションID");
  const categoryIndex = locationHeaders.indexOf("ロケーション");
  const storageAreaIndex = locationHeaders.indexOf("保管場所");
  const detailIndex = locationHeaders.indexOf("詳細①");

  if ([idIndex, categoryIndex, storageAreaIndex, detailIndex].includes(-1)) {
    throw new Error("必要なカラム（ロケーションID, ロケーション, 保管場所, 詳細①）が見つかりません。");
  }

  locationData.sort((a, b) => {
    const idA = a[idIndex];
    const idB = b[idIndex];
    const numA = parseInt(String(idA).replace(/[^0-9]/g, ''), 10);
    const numB = parseInt(String(idB).replace(/[^0-9]/g, ''), 10);
    return numA - numB;
  });

  const hierarchy: Hierarchy = {};

  locationData.forEach(row => {
    const id = String(row[idIndex]);
    const category = String(row[categoryIndex]);
    const storageArea = String(row[storageAreaIndex]);
    const detail = String(row[detailIndex]);
    const status: InventoryStatus = recordedLocationIds.has(id) ? 'recorded' : 'unrecorded';

    if (!category) return;

    if (!hierarchy[category]) {
      hierarchy[category] = {
        category: category,
        storageAreas: {}
      };
    }

    if (storageArea) {
      if (!hierarchy[category].storageAreas[storageArea]) {
        const areaStatus: InventoryStatus = recordedLocationIds.has(id) ? 'recorded' : 'unrecorded';
        hierarchy[category].storageAreas[storageArea] = {
          id: id,
          name: storageArea,
          details: [],
          inventoryStatus: areaStatus,
          products: [] // 初期化
        };
      }

      if (detail) {
        hierarchy[category].storageAreas[storageArea].details.push({
          id: id,
          name: detail,
          inventoryStatus: status,
          products: [] // 初期化
        });
      }
    }
  });

  // ロケーションに紐づく製品情報を追加
  Object.values(hierarchy).forEach(categoryGroup => {
    Object.values(categoryGroup.storageAreas).forEach(area => {
      const locationIdsToProcess = [area.id, ...area.details.map(d => d.id)];

      locationIdsToProcess.forEach(locationId => {
        const productCodesForLocation = locationProductMap.get(locationId) || [];
        const productsForLocation: ProductInventory[] = [];

        productCodesForLocation.forEach(productCode => {
          const productMaster = productMasterMap.get(productCode);
          const latestInventory = latestProductInventoryMap.get(locationId)?.get(productCode);

          if (productMaster) {
            productsForLocation.push({
              商品コード: productCode,
              商品名: productMaster.商品名,
              棚卸数量: latestInventory?.棚卸数量 || 0,
              記録日時: latestInventory?.記録日時 || new Date(0), // デフォルト値
            });
          }
        });

        // productsを適切な場所に追加
        if (area.id === locationId) {
          area.products = productsForLocation;
        } else {
          const detail = area.details.find(d => d.id === locationId);
          if (detail) {
            detail.products = productsForLocation;
          }
        }
      });
    });
  });


  const result = Object.values(hierarchy).map((categoryGroup: CategoryGroup) => {
    const storageAreas: StorageArea[] = Object.values(categoryGroup.storageAreas);

    storageAreas.forEach((area: StorageArea) => {
      const hasRecordedDetail = area.details.some(d => d.inventoryStatus === 'recorded');
      if (hasRecordedDetail) {
        area.inventoryStatus = 'recorded';
      }
      area.details.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    });

    storageAreas.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    return {
      category: categoryGroup.category,
      storageAreas: storageAreas
    };
  });

  const customCategoryOrder = ["工場1F", "工場2F", "その他"];
  result.sort((a, b) => {
    const indexA = customCategoryOrder.indexOf(a.category);
    const indexB = customCategoryOrder.indexOf(b.category);
    if (indexA === -1 && indexB === -1) {
      return a.category.localeCompare(b.category, undefined, { numeric: true });
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return result;
}

function getLocationsMaster(): LocationMasterData[] {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift() || [];

  const locations = data.map(row => {
    const location: LocationMasterData = {};
    headers.forEach((header, index) => {
      location[header] = row[index];
    });
    return location;
  });
  return locations;
}

function addLocation(locationData: LocationMasterData): { message: string; location: LocationMasterData } {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const locationIdIndex = headers.indexOf("ロケーションID");

  if (locationIdIndex === -1) {
    throw new Error("Location_Masterシートに'ロケーションID'カラムが見つかりません。");
  }

  const existingLocation = data.find(row => row[locationIdIndex] === locationData["ロケーションID"]);
  if (existingLocation) {
    throw new Error(`ロケーションID '${locationData["ロケーションID"]}' は既に存在します。`);
  }

  const newRow = headers.map(header => locationData[header] !== undefined ? locationData[header] : "");

  sheet.appendRow(newRow);
  return { message: "ロケーションが正常に追加されました。", location: locationData };
}

function editLocation(locationData: LocationMasterData): { message: string; location: LocationMasterData } {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const locationIdIndex = headers.indexOf("ロケーションID");

  if (locationIdIndex === -1) {
    throw new Error("Location_Masterシートに'ロケーションID'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][locationIdIndex] === locationData["ロケーションID"]) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`ロケーションID '${locationData["ロケーションID"]}' のロケーションが見つかりません。`);
  }

  const updatedRow = headers.map((header, index) => {
    return locationData[header] !== undefined ? locationData[header] : data[rowIndex - 1][index];
  });

  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  return { message: "ロケーションが正常に更新されました。", location: locationData };
}

function deleteLocation(locationId: string): { message: string; locationId: string } {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const locationIdIndex = headers.indexOf("ロケーションID");

  if (locationIdIndex === -1) {
    throw new Error("Location_Masterシートに'ロケーションID'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][locationIdIndex] === locationId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`ロケーションID '${locationId}' のロケーションが見つかりません。`);
  }

  sheet.deleteRow(rowIndex);
  return { message: "ロケーションが正常に削除されました。", locationId: locationId };
}