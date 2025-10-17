// CORS preflight request handler
function doOptions(e) {
    return ContentService.createTextOutput()
        .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app")
        .addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .addHeader("Access-Control-Allow-Headers", "Content-Type");
}
// Web App entry points
function doGet(e) {
    Logger.log("リクエスト受信 (GET): " + JSON.stringify(e));
    const action = e.parameter.action;
    const year = parseInt(e.parameter.year, 10);
    const month = parseInt(e.parameter.month, 10);
    let payload;
    try {
        switch (action) {
            case 'getLocations':
                payload = getLocations();
                break;
            case 'getProducts':
                payload = getProducts();
                break;
            case 'getProductsByLocation':
                const locationId = e.parameter.locationId;
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
                payload = getInventoryRecordsJson(year, month);
                break;
            case 'exportInventoryRecordsCsv':
                payload = exportInventoryRecordsCsv(year, month);
                return ContentService.createTextOutput(payload)
                    .setMimeType(ContentService.MimeType.TEXT)
                    .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app");
            case 'exportInventoryRecordsExcel':
                payload = exportInventoryRecordsExcel(year, month);
                break;
            case 'exportInventoryRecordsPdf':
                payload = exportInventoryRecordsPdf(year, month);
                break;
            default:
                throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=getLocations)");
        }
        const response = {
            status: 'success',
            version: 'shizai-tanaoroshi-gas-ts v1.0',
            data: payload,
        };
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON)
            .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app");
    }
    catch (error) {
        Logger.log("エラー発生 (GET): " + error.message);
        const errorResponse = {
            status: 'error',
            version: 'shizai-tanaoroshi-gas-ts v1.0',
            message: error.message,
        };
        return ContentService.createTextOutput(JSON.stringify(errorResponse))
            .setMimeType(ContentService.MimeType.JSON)
            .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app");
    }
}
function doPost(e) {
    Logger.log("リクエスト受信 (POST): " + JSON.stringify(e));
    const action = e.parameter.action;
    let payload;
    try {
        const requestBody = JSON.parse(e.postData.contents);
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
                payload = deleteSupplier(requestBody.supplierId);
                break;
            case 'addLocation':
                payload = addLocation(requestBody);
                break;
            case 'editLocation':
                payload = editLocation(requestBody);
                break;
            case 'deleteLocation':
                payload = deleteLocation(requestBody.locationId);
                break;
            case 'addLocationProduct':
                payload = addLocationProduct(requestBody.locationId, requestBody.productCode);
                break;
            case 'deleteLocationProduct':
                payload = deleteLocationProduct(requestBody.locationId, requestBody.productCode);
                break;
            default:
                throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=addProduct)");
        }
        const response = {
            status: 'success',
            version: 'shizai-tanaoroshi-gas-ts v1.0',
            data: payload,
        };
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON)
            .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app");
    }
    catch (error) {
        Logger.log("エラー発生 (POST): " + error.message);
        const errorResponse = {
            status: 'error',
            version: 'shizai-tanaoroshi-gas-ts v1.0',
            message: error.message,
        };
        return ContentService.createTextOutput(JSON.stringify(errorResponse))
            .setMimeType(ContentService.MimeType.JSON)
            .addHeader("Access-Control-Allow-Origin", "https://shizai-tanaoroshi.netlify.app");
    }
}
