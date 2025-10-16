import {
  getInventoryRecordsJson,
  exportInventoryRecordsCsv,
  exportInventoryRecordsExcel,
  exportInventoryRecordsPdf,
} from './inventory.js';
import {
  getLocations,
  getLocationsMaster,
  addLocation,
  editLocation,
  deleteLocation,
} from './locations.js';
import {
  getProductsByLocation,
  addLocationProduct,
  deleteLocationProduct,
} from './mappings.js';
import {
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
} from './products.js';
import {
  getSuppliers,
  addSupplier,
  editSupplier,
  deleteSupplier,
} from './suppliers.js';
import { setupInventoryAppSheets } from './setup.js';

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
        return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.TEXT);
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
      version: 'Code.js v5.0 (webpack)',
      data: payload,
    };
    const output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    Logger.log("エラー発生 (GET): " + error.message);
    const errorResponse = {
      status: 'error',
      version: 'Code.js v5.0 (webpack)',
      message: error.message,
    };
    const output = ContentService.createTextOutput(JSON.stringify(errorResponse));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
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
      version: 'Code.js v5.0 (webpack)',
      data: payload,
    };

    const output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    Logger.log("エラー発生 (POST): " + error.message);
    const errorResponse = {
      status: 'error',
      version: 'Code.js v5.0 (webpack)',
      message: error.message,
    };
    const output = ContentService.createTextOutput(JSON.stringify(errorResponse));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

// Expose functions to global scope for Google Apps Script
global.doGet = doGet;
global.doPost = doPost;
global.setupInventoryAppSheets = setupInventoryAppSheets;