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
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
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
      default:
        throw new Error("無効なリクエストです。'action'パラメータが正しく指定されているか確認してください。(例: ?action=addProduct)");
    }
    
    responsePayload = {
      status: 'success',
      version: 'shizai-tanaoroshi-gas-ts v1.0',
      data: payload
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
