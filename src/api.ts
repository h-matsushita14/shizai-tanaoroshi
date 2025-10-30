/**
 * OPTIONSリクエスト (CORSプリフライト)
 * POSTリクエストの前にブラウザが自動的に送信
 */
function doOptions(e: any) {
  Logger.log("OPTIONSリクエスト受信: " + JSON.stringify(e));
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 全てのマスターデータを取得する
 */
function getMasterData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Product_Master
  const productSheet = ss.getSheetByName("Product_Master");
  if (!productSheet) throw new Error("Product_Masterシートが見つかりません。");
  const productData = productSheet.getDataRange().getValues();
  const productHeaders = productData.shift() || [];
  const products = productData.map(row => {
    const product: { [key: string]: any } = {};
    productHeaders.forEach((header, index) => {
      product[header] = row[index];
    });
    return product;
  });

  // Supplier_Master
  const supplierSheet = ss.getSheetByName("Supplier_Master");
  if (!supplierSheet) throw new Error("Supplier_Masterシートが見つかりません。");
  const supplierData = supplierSheet.getDataRange().getValues();
  const supplierHeaders = supplierData.shift() || [];
  const suppliers = supplierData.map(row => {
    const supplier: { [key: string]: any } = {};
    supplierHeaders.forEach((header, index) => {
      supplier[header] = row[index];
    });
    return supplier;
  });

  // Location_Master
  const locationMasterSheet = ss.getSheetByName("Location_Master");
  if (!locationMasterSheet) throw new Error("Location_Masterシートが見つかりません。");
  const locationMasterData = locationMasterSheet.getDataRange().getValues();
  const locationMasterHeaders = locationMasterData.shift() || [];
  const locationsMaster = locationMasterData.map(row => {
    const location: { [key: string]: any } = {};
    locationMasterHeaders.forEach((header, index) => {
      location[header] = row[index];
    });
    return location;
  });

  // Location_Product_Mapping
  const lpmSheet = ss.getSheetByName("Location_Product_Mapping");
  if (!lpmSheet) throw new Error("Location_Product_Mappingシートが見つかりません。");
  const lpmData = lpmSheet.getDataRange().getValues();
  const lpmHeaders = lpmData.shift() || [];
  const locationProductMappings = lpmData.map(row => {
    const mapping: { [key: string]: any } = {};
    lpmHeaders.forEach((header, index) => {
      mapping[header] = row[index];
    });
    return mapping;
  });

  // Inventory_Records
  const inventoryRecordsSheet = ss.getSheetByName("Inventory_Records");
  if (!inventoryRecordsSheet) throw new Error("Inventory_Recordsシートが見つかりません。");
  const inventoryRecordsData = inventoryRecordsSheet.getDataRange().getValues();
  const inventoryRecordsHeaders = inventoryRecordsData.shift() || [];
  const inventoryRecords = inventoryRecordsData.map(row => {
    const record: { [key: string]: any } = {};
    inventoryRecordsHeaders.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  });

  // ロケーションデータを階層構造に変換
  const groupedLocations: { [key: string]: any } = {};

  locationsMaster.forEach(loc => {
    const category = loc["ロケーション"]; // 例: 資材室, 出荷準備室
    const storageAreaName = loc["保管場所"]; // 例: 棚A, 棚B
    const detailName = loc["詳細①"]; // 例: 上段, 中段, 下段
    const locationId = loc["ロケーションID"];

    if (!groupedLocations[category]) {
      groupedLocations[category] = {
        category: category,
        storageAreas: [],
        storageAreaMap: {}, // 重複チェック用
      };
    }

    const currentCategory = groupedLocations[category];
    let currentStorageArea = currentCategory.storageAreaMap[storageAreaName];

    if (!currentStorageArea) {
      currentStorageArea = {
        id: locationId, // 保管場所のIDとして最初のロケーションIDを使用
        name: storageAreaName,
        products: [], // products プロパティを追加
        details: [],
        detailMap: {}, // 重複チェック用
        inventoryStatus: 'unrecorded', // デフォルト
      };
      currentCategory.storageAreas.push(currentStorageArea);
      currentCategory.storageAreaMap[storageAreaName] = currentStorageArea;
    }

    let currentDetail = currentStorageArea.detailMap[detailName];
    if (!currentDetail) {
      currentDetail = {
        id: locationId, // 詳細のIDとしてロケーションIDを使用
        name: detailName,
        products: [],
        inventoryStatus: 'unrecorded', // デフォルト
      };
      currentStorageArea.details.push(currentDetail);
      currentStorageArea.detailMap[detailName] = currentDetail;
    }

    // ロケーションに紐づく商品情報を追加
    const productsInLocation = locationProductMappings
      .filter(mapping => mapping["ロケーションID"] === locationId)
      .map(mapping => {
        const product = products.find(p => p["商品コード"] === mapping["商品コード"]);
        if (product) {
          // Inventory_Recordsから棚卸数量と記録日時を取得
          const recordsForProduct = inventoryRecords.filter(r =>
            r["ロケーションID"] === locationId && r["商品コード"] === product["商品コード"]
          );

          let totalInventoryQuantity = 0;
          let latestRecordedDate: Date | null = null;

          recordsForProduct.forEach(record => {
            // ロット単位の数値部分を抽出して計算に利用
            const lotUnitValue = record["ロット単位"] ? parseInt(String(record["ロット単位"]).match(/(\d+)/)?.[1] || '1') : 1;
            totalInventoryQuantity += (record["ロット数量"] || 0) * lotUnitValue;
            totalInventoryQuantity += (record["バラ数量"] || 0);

            const recordDate = new Date(record["記録日時"]);
            if (latestRecordedDate === null || recordDate > latestRecordedDate) {
              latestRecordedDate = recordDate;
            }
          });

          return {
            productCode: product["商品コード"],
            productName: product["商品名"],
            internalName: product["社内名称"],
            unitPrice: product["単価"],
            caseQuantity: product["ケース入数"],
            pieceUnit: product["バラ単位"],
            lotUnit: product["ロット単位"],
            inventoryQuantity: totalInventoryQuantity, // Inventory_Recordsから計算
            記録日時: latestRecordedDate ? latestRecordedDate.toISOString() : null, // 直近の記録日時を追加
          };
        }
        Logger.log("Debug: Product in productsInLocation - " + JSON.stringify({
          productCode: mapping["商品コード"],
          internalName: "N/A", // product が null のため
          lotUnit: "N/A", // product が null のため
          pieceUnit: "N/A", // product が null のため
          lastRecordedDate: null, // product が null のため latestRecordedDate も null
        }));
        return null;
      })
      .filter(Boolean); // nullを除外

    currentDetail.products.push(...productsInLocation);

    // もし詳細名がなく、保管場所自身が商品を持つ場合
    if (!detailName && productsInLocation.length > 0) {
      if (!currentStorageArea.products) {
        currentStorageArea.products = [];
      }
      currentStorageArea.products.push(...productsInLocation);
    }

    // 棚卸状況の更新
    if (productsInLocation.length > 0 && productsInLocation.every(p => p.inventoryQuantity > 0)) {
      currentDetail.inventoryStatus = 'recorded';
    } else if (productsInLocation.length > 0 && productsInLocation.some(p => p.inventoryQuantity > 0)) {
      currentDetail.inventoryStatus = 'partial'; // 一部入力済み
    }

    // 保管場所レベルの棚卸状況を更新
    const allDetailsRecorded = currentStorageArea.details.every(d => d.inventoryStatus === 'recorded');
    const someDetailsRecorded = currentStorageArea.details.some(d => d.inventoryStatus === 'recorded' || d.inventoryStatus === 'partial');

    if (allDetailsRecorded) {
      currentStorageArea.inventoryStatus = 'recorded';
    } else if (someDetailsRecorded) {
      currentStorageArea.inventoryStatus = 'partial';
    }
  });

  const formattedLocations = Object.values(groupedLocations).map((group: any) => {
    group.storageAreas = group.storageAreas.map((area: any) => {
      delete area.detailMap; // 不要なマップを削除
      return area;
    });
    delete group.storageAreaMap; // 不要なマップを削除
    return group;
  });

  return {
    products,
    suppliers,
    locationsMaster: locationsMaster, // Location_Masterシートの生データ
    locationsHierarchy: formattedLocations, // 階層構造のロケーションデータ
    locationProductMappings,
  };
}

/**
 * GETリクエストハンドラ
 * GETの場合はactionをクエリパラメータで受け取る
 */
function doGet(e: GoogleAppsScript.Events.DoGet) {
  Logger.log("リクエスト受信 (GET): " + JSON.stringify(e));
  
  let responsePayload;
  const callback = e.parameter.callback;

  try {
    const action = e.parameter.action;
    const year = e.parameter.year ? parseInt(e.parameter.year, 10) : null;
    const month = e.parameter.month ? parseInt(e.parameter.month, 10) : null;
    const locationId = e.parameter.locationId;
    
    if (!action) {
      throw new Error("'action'パラメータが指定されていません。");
    }
    
    let payload;
    
    switch (action) {
      case 'getLocations':
        payload = getLocations();
        break;
      case 'getMasterData': // 新しいアクション
        payload = getMasterData();
        break;
      case 'getProducts':
        payload = getProducts();
        break;
      case 'getProductsByLocation':
        if (!locationId) {
          throw new Error("'locationId'パラメータが指定されていません。");
        }
        payload = getProductsByLocation(locationId);
        break;
      case 'getSuppliers':
        payload = getSuppliers();
        break;
      case 'getLocationsMaster':
        payload = getLocationsMaster();
        break;
      case 'getInventoryRecordsJson':
        if (!year || !month) {
          throw new Error("'year'と'month'パラメータが必要です。");
        }
        payload = getInventoryRecordsJson(year, month);
        break;
      case 'exportInventoryRecordsCsv':
        if (!year || !month) {
          throw new Error("'year'と'month'パラメータが必要です。");
        }
        payload = exportInventoryRecordsCsv(year, month);
        return ContentService.createTextOutput(payload)
          .setMimeType(ContentService.MimeType.TEXT);
      case 'exportInventoryRecordsExcel':
        if (!year || !month) {
          throw new Error("'year'と'month'パラメータが必要です。");
        }
        payload = exportInventoryRecordsExcel(year, month);
        break;
      case 'exportInventoryRecordsPdf':
        if (!year || !month) {
          throw new Error("'year'と'month'パラメータが必要です。");
        }
        payload = exportInventoryRecordsPdf(year, month);
        break;
      default:
        throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=getLocations)");
    }
    
    responsePayload = {
      status: 'success',
      version: 'shizai-tanaoroshi-gas-ts v1.0',
      data: payload
    };
      
  } catch (error) {
    Logger.log("エラー発生 (GET): " + error.message);
    Logger.log("スタックトレース: " + error.stack);
    
    responsePayload = {
      status: 'error',
      version: 'shizai-tanaoroshi-gas-ts v1.0',
      message: error.message
    };
  }

  // JSONP対応
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(responsePayload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);  } else {
    return ContentService.createTextOutput(JSON.stringify(responsePayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POSTリクエストハンドラ
 * POSTの場合はactionをリクエストボディで受け取る
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  Logger.log("リクエスト受信 (POST): " + JSON.stringify(e));
  
  let responsePayload;

  try {
    let requestBody: any = {};
    
    // リクエストボディからactionとデータを取得
    if (e.postData && e.postData.contents) {
      try {
        requestBody = JSON.parse(e.postData.contents);
      } catch (parseError) {
        throw new Error("リクエストボディのJSON解析に失敗しました: " + parseError.message);
      }
    }
    
    // actionはボディから取得（フォールバックとしてクエリパラメータもチェック）
    const action = requestBody.action || e.parameter.action;
    
    if (!action) {
      throw new Error("'action'パラメータが指定されていません。");
    }
    
    let payload;
    
    switch (action) {
      case 'addProduct':
        payload = addProduct(requestBody);
        break;
      case 'editProduct':
        payload = editProduct(requestBody);
        break;
      case 'deleteProduct':
        payload = deleteProduct(requestBody);
        break;
      case 'addSupplier':
        payload = addSupplier(requestBody);
        break;
      case 'editSupplier':
        payload = editSupplier(requestBody);
        break;
      case 'deleteSupplier':
        if (!requestBody.supplierId) {
          throw new Error("'supplierId'が指定されていません。");
        }
        payload = deleteSupplier(requestBody.supplierId);
        break;
      case 'addLocation':
        payload = addLocation(requestBody);
        break;
      case 'editLocation':
        payload = editLocation(requestBody);
        break;
      case 'deleteLocation':
        if (!requestBody.locationId) {
          throw new Error("'locationId'が指定されていません。");
        }
        payload = deleteLocation(requestBody.locationId);
        break;
      case 'addLocationProduct':
        if (!requestBody.locationId || !requestBody.productCode) {
          throw new Error("'locationId'と'productCode'が必要です。");
        }
        payload = addLocationProduct(requestBody.locationId, requestBody.productCode);
        break;
      case 'deleteLocationProduct':
        if (!requestBody.locationId || !requestBody.productCode) {
          throw new Error("'locationId'と'productCode'が必要です。");
        }
        payload = deleteLocationProduct(requestBody.locationId, requestBody.productCode);
        break;
      case 'addInventoryRecord':
        payload = addInventoryRecords(requestBody);
        break;
      case 'runCostCalculation':
        payload = updateCostCalculationSheet();
        break;
      default:
        throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=addProduct)");
    }
    
    responsePayload = {
      status: 'success',
      version: 'shizai-tanaoroshi-gas-ts v1.0',
      data: payload,
      message: '操作が完了しました。' // デフォルトメッセージを追加
    };
    
  } catch (error) {
    Logger.log("エラー発生 (POST): " + error.message);
    Logger.log("スタックトレース: " + error.stack);
    
    responsePayload = {
      status: 'error',
      version: 'shizai-tanaoroshi-gas-ts v1.0',
      message: error.message
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}
