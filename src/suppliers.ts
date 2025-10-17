/**
 * Supplier_Masterシートから全ての仕入れ先データを取得する
 * @returns {Array<Object>} 仕入れ先データの配列
 */
function getSuppliers() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Supplier_Master");
  if (!sheet) throw new Error("Supplier_Masterシートが見つかりません。");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // ヘッダー行を削除

  const suppliers = data.map(row => {
    const supplier = {};
    headers.forEach((header, index) => {
      supplier[header] = row[index];
    });
    return supplier;
  });
  return suppliers;
}

/**
 * Supplier_Masterシートに新しい仕入れ先を追加する
 * @param {Object} supplierData - 追加する仕入れ先データ (例: { "仕入先名": "新しい仕入れ先", "連絡先": "...", "住所": "..." })
 * @returns {Object} 追加された仕入れ先データとメッセージ
 */
function addSupplier(supplierData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Supplier_Master");
  if (!sheet) throw new Error("Supplier_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const supplierIdIndex = headers.indexOf("仕入先ID");
  const supplierNameIndex = headers.indexOf("仕入先名"); // 仕入れ先名カラムのインデックスを取得

  if (supplierIdIndex === -1 || supplierNameIndex === -1) {
    throw new Error("Supplier_Masterシートに必要なカラム（仕入先ID, 仕入先名）が見つかりません。");
  }

  const lastRow = sheet.getLastRow();
  const nextId = lastRow > 0 ? Math.max(...sheet.getRange(2, supplierIdIndex + 1, lastRow - 1, 1).getValues().flat().map(id => parseInt(id.replace(/[^0-9]/g, ''), 10) || 0)) + 1 : 1;
  const newSupplierId = `S${String(nextId).padStart(3, '0')}`; // 例: S001

  const newRow = [];
  headers.forEach(header => {
    if (header === "仕入先ID") {
      newRow.push(newSupplierId);
    } else if (supplierData[header] !== undefined) {
      newRow.push(supplierData[header]);
    } else {
      newRow.push(""); // データがない場合は空欄
    }
  });

  sheet.appendRow(newRow);
  return { message: "仕入れ先が正常に追加されました。", supplier: { ...supplierData, "仕入先ID": newSupplierId } };
}

/**
 * Supplier_Masterシートの既存の仕入れ先を更新する
 * @param {Object} supplierData - 更新する仕入れ先データ (仕入先IDが必須)
 * @returns {Object} 更新された仕入れ先データとメッセージ
 */
function editSupplier(supplierData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Supplier_Master");
  if (!sheet) throw new Error("Supplier_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const supplierIdIndex = headers.indexOf("仕入先ID");

  if (supplierIdIndex === -1) {
    throw new Error("Supplier_Masterシートに'仕入先ID'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) { // ヘッダー行をスキップ
    if (data[i][supplierIdIndex] === supplierData["仕入先ID"]) {
      rowIndex = i + 1; // スプレッドシートの行番号は1から始まる
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`仕入先ID '${supplierData["仕入先ID"]}' の仕入れ先が見つかりません。`);
  }

  const updatedRow = [];
  headers.forEach((header, index) => {
    if (supplierData[header] !== undefined) {
      updatedRow.push(supplierData[header]);
    } else {
      updatedRow.push(data[rowIndex - 1][index]); // 既存の値を保持
    }
  });

  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  return { message: "仕入れ先が正常に更新されました。", supplier: supplierData };
}

/**
 * Supplier_Masterシートから仕入れ先を削除する
 * @param {string} supplierId - 削除する仕入れ先のID
 * @returns {Object} 削除された仕入れ先IDとメッセージ
 */
function deleteSupplier(supplierId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Supplier_Master");
  if (!sheet) throw new Error("Supplier_Masterシートが見つかりません。");

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const supplierIdIndex = headers.indexOf("仕入先ID");

  if (supplierIdIndex === -1) {
    throw new Error("Supplier_Masterシートに'仕入先ID'カラムが見つかりません。");
  }

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][supplierIdIndex] === supplierId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`仕入先ID '${supplierId}' の仕入れ先が見つかりません。`);
  }

  sheet.deleteRow(rowIndex);
  return { message: "仕入れ先が正常に削除されました。", supplierId: supplierId };
}