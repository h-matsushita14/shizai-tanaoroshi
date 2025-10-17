function addProduct(productData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Product_Master");
  if (!sheet) throw new Error("Product_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const productCodeIndex = headers.indexOf("商品コード");

  if (productCodeIndex === -1) {
    throw new Error("Product_Masterシートに'商品コード'カラムが見つかりません。");
  }

  // 「商品コード」の一意性をチェック
  const existingProduct = data.find(row => row[productCodeIndex] === productData["商品コード"]);
  if (existingProduct) {
    throw new Error(`商品コード '${productData["商品コード"]}' は既に存在します。`);
  }

  const newRow = [];

  // ヘッダーの順序に従ってデータを整形
  headers.forEach(header => {
    if (header === "最終更新日") {
      newRow.push(new Date()); // 最終更新日を自動設定
    } else if (productData[header] !== undefined) {
      newRow.push(productData[header]);
    } else {
      newRow.push(""); // データがない場合は空欄
    }
  });

  sheet.appendRow(newRow);
  return { message: "商品が正常に追加されました。", product: productData };
}

function editProduct(productData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Product_Master");
  if (!sheet) throw new Error("Product_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const productCodeIndex = headers.indexOf("商品コード");

  if (productCodeIndex === -1) {
    throw new Error("Product_Masterシートに'商品コード'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) { // ヘッダー行をスキップ
    if (data[i][productCodeIndex] === productData["商品コード"]) {
      rowIndex = i + 1; // スプレッドシートの行番号は1から始まる
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`商品コード '${productData["商品コード"]}' の商品が見つかりません。`);
  }

  const updatedRow = [];
  headers.forEach((header, index) => {
    if (header === "最終更新日") {
      updatedRow.push(new Date()); // 最終更新日を自動設定
    } else if (productData[header] !== undefined) {
      updatedRow.push(productData[header]);
    } else {
      updatedRow.push(data[rowIndex - 1][index]); // 既存の値を保持
    }
  });

  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  return { message: "商品が正常に更新されました。", product: productData };
}

function deleteProduct(productData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Product_Master");
  if (!sheet) throw new Error("Product_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const productCodeIndex = headers.indexOf("商品コード");

  if (productCodeIndex === -1) {
    throw new Error("Product_Masterシートに'商品コード'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) { // ヘッダー行をスキップ
    if (data[i][productCodeIndex] === productData["商品コード"]) {
      rowIndex = i + 1; // スプレッドシートの行番号は1から始まる
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`商品コード '${productData["商品コード"]}' の商品が見つかりません。`);
  }

  sheet.deleteRow(rowIndex);
  return { message: "商品が正常に削除されました。", productCode: productData["商品コード"] };
}

function getProducts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const productSheet = ss.getSheetByName("Product_Master");
  if (!productSheet) throw new Error("Product_Masterシートが見つかりません。");

  const supplierSheet = ss.getSheetByName("Supplier_Master");
  if (!supplierSheet) throw new Error("Supplier_Masterシートが見つかりません。");

  const productData = productSheet.getDataRange().getValues();
  const productHeaders = productData.shift(); // ヘッダー行を削除

  const supplierData = supplierSheet.getDataRange().getValues();
  const supplierHeaders = supplierData.shift(); // ヘッダー行を削除

  const supplierIdIndex = supplierHeaders.indexOf("仕入先ID");
  const supplierNameIndex = supplierHeaders.indexOf("仕入先名");

  if (supplierIdIndex === -1 || supplierNameIndex === -1) {
    throw new Error("Supplier_Masterシートに必要なカラム（仕入先ID, 仕入先名）が見つかりません。");
  }

  // 仕入先マスターをマップに変換して検索を高速化
  const supplierMap = new Map();
  supplierData.forEach(row => {
    supplierMap.set(row[supplierIdIndex], row[supplierNameIndex]);
  });

  const products = productData.map(row => {
    const product = {};
    productHeaders.forEach((header, index) => {
      product[header] = row[index];
    });

    // 仕入先IDから仕入先名を取得して追加
    const supplierId = product["仕入先ID"];
    product["仕入先名"] = supplierMap.get(supplierId) || ''; // 見つからない場合は空文字列

    return product;
  });

  return products;
}