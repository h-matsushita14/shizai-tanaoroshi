function getProductsByLocation(locationId) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const locationProductSheet = ss.getSheetByName("Location_Product_Mapping");
    if (!locationProductSheet)
        throw new Error("Location_Product_Mappingシートが見つかりません。");
    const productSheet = ss.getSheetByName("Product_Master");
    if (!productSheet)
        throw new Error("Product_Masterシートが見つかりません。");
    const supplierSheet = ss.getSheetByName("Supplier_Master");
    if (!supplierSheet)
        throw new Error("Supplier_Masterシートが見つかりません。");
    const locationProductData = locationProductSheet.getDataRange().getValues();
    const locationProductHeaders = locationProductData.shift();
    const productData = productSheet.getDataRange().getValues();
    const productHeaders = productData.shift();
    const supplierData = supplierSheet.getDataRange().getValues();
    const supplierHeaders = supplierData.shift();
    const lpLocationIdIndex = locationProductHeaders.indexOf("ロケーションID");
    const lpProductCodeIndex = locationProductHeaders.indexOf("商品コード");
    const pProductCodeIndex = productHeaders.indexOf("商品コード");
    const sSupplierIdIndex = supplierHeaders.indexOf("仕入先ID");
    const sSupplierNameIndex = supplierHeaders.indexOf("仕入先名");
    if ([lpLocationIdIndex, lpProductCodeIndex, pProductCodeIndex, sSupplierIdIndex, sSupplierNameIndex].includes(-1)) {
        throw new Error("必要なカラムがシートに見つかりません。Location_Product_Mapping: ロケーションID, 商品コード; Product_Master: 商品コード; Supplier_Master: 仕入先ID, 仕入先名");
    }
    // 仕入先マスターをマップに変換
    const supplierMap = new Map();
    supplierData.forEach(row => {
        supplierMap.set(row[sSupplierIdIndex], row[sSupplierNameIndex]);
    });
    // 指定されたロケーションIDに紐づく商品コードを抽出
    const productCodesForLocation = locationProductData
        .filter(row => row[lpLocationIdIndex] === locationId)
        .map(row => row[lpProductCodeIndex]);
    // 商品コードに紐づく商品情報を取得
    const products = productData
        .filter(row => productCodesForLocation.includes(row[pProductCodeIndex]))
        .map(row => {
        const product = {};
        productHeaders.forEach((header, index) => {
            product[header] = row[index];
        });
        // 仕入先名を追加
        const supplierId = product["仕入先ID"];
        product["仕入先名"] = supplierMap.get(supplierId) || '';
        return product;
    });
    return products;
}
/**
 * Location_Product_Mappingシートに商品とロケーションの紐付けを追加する
 * @param {string} locationId - ロケーションID
 * @param {string} productCode - 商品コード
 * @returns {Object} メッセージ
 */
function addLocationProduct(locationId, productCode) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Product_Mapping");
    if (!sheet)
        throw new Error("Location_Product_Mappingシートが見つかりません。");
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const locationIdIndex = headers.indexOf("ロケーションID");
    const productCodeIndex = headers.indexOf("商品コード");
    if (locationIdIndex === -1 || productCodeIndex === -1) {
        throw new Error("Location_Product_Mappingシートに必要なカラムが見つかりません。");
    }
    // 重複チェック
    const data = sheet.getDataRange().getValues();
    const isDuplicate = data.some(row => row[locationIdIndex] === locationId && row[productCodeIndex] === productCode);
    if (isDuplicate) {
        throw new Error(`ロケーションID '${locationId}' に商品コード '${productCode}' は既に登録されています。`);
    }
    sheet.appendRow([locationId, productCode]);
    return { message: "商品とロケーションの紐付けが正常に追加されました。" };
}
/**
 * Location_Product_Mappingシートから商品とロケーションの紐付けを削除する
 * @param {string} locationId - ロケーションID
 * @param {string} productCode - 商品コード
 * @returns {Object} メッセージ
 */
function deleteLocationProduct(locationId, productCode) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Location_Product_Mapping");
    if (!sheet)
        throw new Error("Location_Product_Mappingシートが見つかりません。");
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const locationIdIndex = headers.indexOf("ロケーションID");
    const productCodeIndex = headers.indexOf("商品コード");
    if (locationIdIndex === -1 || productCodeIndex === -1) {
        throw new Error("Location_Product_Mappingシートに必要なカラムが見つかりません。");
    }
    const data = sheet.getDataRange().getValues();
    let rowIndexToDelete = -1;
    for (let i = 1; i < data.length; i++) { // ヘッダー行をスキップ
        if (data[i][locationIdIndex] === locationId && data[i][productCodeIndex] === productCode) {
            rowIndexToDelete = i + 1; // スプレッドシートの行番号は1から始まる
            break;
        }
    }
    if (rowIndexToDelete === -1) {
        throw new Error(`ロケーションID '${locationId}' に商品コード '${productCode}' の紐付けが見つかりません。`);
    }
    sheet.deleteRow(rowIndexToDelete);
    return { message: "商品とロケーションの紐付けが正常に削除されました。" };
}
