const SPREADSHEET_ID = "1l7H7IusQbqPukypEoEn4tKotVR9PfGS95Yz2vuZNFNI";

function doGet(e) {
  // リクエストの内容をログに出力してデバッグしやすくする
  Logger.log("リクエスト受信 (GET): " + JSON.stringify(e));

  const action = e.parameter.action;
  const year = parseInt(e.parameter.year, 10); // 年を取得
  const month = parseInt(e.parameter.month, 10); // 月を取得
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
      case 'getSuppliers': // 追加
        payload = getSuppliers();
        break;
      case 'getLocationsMaster': // 追加
        payload = getLocationsMaster();
        break;

      case 'getInventoryRecordsJson': // 追加
        payload = getInventoryRecordsJson(year, month);
        break;

      case 'exportInventoryRecordsCsv':
        payload = exportInventoryRecordsCsv(year, month); // 年月を渡す
        return ContentService
          .createTextOutput(payload)
          .setMimeType(ContentService.MimeType.TEXT); // CSVはTEXTとして返す

      case 'exportInventoryRecordsExcel':
        payload = exportInventoryRecordsExcel(year, month); // 年月を渡す
        break;

      case 'exportInventoryRecordsPdf':
        payload = exportInventoryRecordsPdf(year, month); // 年月を渡す
        break;

      default:
        // actionが指定されていない、またはサポート外の場合
        throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=getLocations)");
    }
    
    const response = {
      status: 'success',
      version: 'Code.js v4.0', // デプロイ確認用のバージョン情報
      data: payload
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("エラー発生 (GET): " + error.message);
    const errorResponse = {
      status: 'error',
      version: 'Code.js v4.0', // エラー発生時もバージョンを返す
      message: error.message
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
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
      case 'addSupplier': // 追加
        payload = addSupplier(requestBody);
        break;
      case 'editSupplier': // 追加
        payload = editSupplier(requestBody);
        break;
      case 'deleteSupplier': // 追加
        payload = deleteSupplier(requestBody.supplierId); // supplierIdを直接渡す
        break;
      case 'addLocation': // 追加
        payload = addLocation(requestBody);
        break;
      case 'editLocation': // 追加
        payload = editLocation(requestBody);
        break;
      case 'deleteLocation': // 追加
        payload = deleteLocation(requestBody.locationId);
        break;
      case 'addLocationProduct': // 追加
        payload = addLocationProduct(requestBody.locationId, requestBody.productCode);
        break;
      case 'deleteLocationProduct': // 追加
        payload = deleteLocationProduct(requestBody.locationId, requestBody.productCode);
        break;
      default:
        throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=addProduct)");
    }

    const response = {
      status: 'success',
      version: 'Code.js v4.0',
      data: payload
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("エラー発生 (POST): " + error.message);
    const errorResponse = {
      status: 'error',
      version: 'Code.js v4.0',
      message: error.message
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
