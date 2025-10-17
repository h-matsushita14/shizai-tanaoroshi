function getLocations() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const locationSheet = ss.getSheetByName("Location_Master");
    if (!locationSheet)
        throw new Error("Location_Masterシートが見つかりません。");
    const inventorySheet = ss.getSheetByName("Inventory_Records");
    if (!inventorySheet)
        throw new Error("Inventory_Recordsシートが見つかりません。");
    // --- 棚卸記録の取得と処理 ---
    const inventoryData = inventorySheet.getDataRange().getValues();
    const inventoryHeaders = inventoryData.shift() || [];
    const invLocationIdIndex = inventoryHeaders.indexOf("ロケーションID");
    const invTimestampIndex = inventoryHeaders.indexOf("記録日時");
    if (invLocationIdIndex === -1 || invTimestampIndex === -1) {
        throw new Error("Inventory_Recordsシートに必要なカラム（ロケーションID, 記録日時）が見つかりません。");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const recordedLocationIds = new Set();
    inventoryData.forEach(row => {
        const timestamp = new Date(row[invTimestampIndex]);
        if (timestamp >= today && timestamp < tomorrow) {
            recordedLocationIds.add(row[invLocationIdIndex]);
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
    const hierarchy = {};
    locationData.forEach(row => {
        const id = row[idIndex];
        const category = row[categoryIndex];
        const storageArea = row[storageAreaIndex];
        const detail = row[detailIndex];
        const status = recordedLocationIds.has(id) ? 'recorded' : 'unrecorded';
        if (!category)
            return;
        if (!hierarchy[category]) {
            hierarchy[category] = {
                category: category,
                storageAreas: {}
            };
        }
        if (storageArea) {
            if (!hierarchy[category].storageAreas[storageArea]) {
                const areaStatus = recordedLocationIds.has(id) ? 'recorded' : 'unrecorded';
                hierarchy[category].storageAreas[storageArea] = {
                    id: id,
                    name: storageArea,
                    details: [],
                    inventoryStatus: areaStatus
                };
            }
            if (detail) {
                hierarchy[category].storageAreas[storageArea].details.push({ id: id, name: detail, inventoryStatus: status });
            }
        }
    });
    const result = Object.values(hierarchy).map((categoryGroup) => {
        const storageAreas = Object.values(categoryGroup.storageAreas);
        storageAreas.forEach((area) => {
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
        if (indexA === -1)
            return 1;
        if (indexB === -1)
            return -1;
        return indexA - indexB;
    });
    return result;
}
function getLocationsMaster() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Master");
    if (!sheet)
        throw new Error("Location_Masterシートが見つかりません。");
    const data = sheet.getDataRange().getValues();
    const headers = data.shift() || [];
    const locations = data.map(row => {
        const location = {};
        headers.forEach((header, index) => {
            location[header] = row[index];
        });
        return location;
    });
    return locations;
}
function addLocation(locationData) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Master");
    if (!sheet)
        throw new Error("Location_Masterシートが見つかりません。");
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
function editLocation(locationData) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Master");
    if (!sheet)
        throw new Error("Location_Masterシートが見つかりません。");
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
function deleteLocation(locationId) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Master");
    if (!sheet)
        throw new Error("Location_Masterシートが見つかりません。");
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
