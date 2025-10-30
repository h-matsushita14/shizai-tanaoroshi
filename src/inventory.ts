/**
 * 指定された年月の末日を基準に、各商品ごとに最適な棚卸記録を抽出するヘルパー関数
 * 新ルール：基本は「基準日以前で最新」の記録。ただし「基準日から10日以内の未来」に記録があればそちらを優先する。
 * @param {Array<Array<any>>} allRecords - Inventory_Recordsシートの全データ（ヘッダー含む）
 * @param {number} targetYear - 対象年
 * @param {number} targetMonth - 対象月 (1-12)
 * @returns {Array<Array<any>>} 抽出された棚卸記録のデータ（ヘッダー含む）
 */
function filterInventoryRecordsByClosestDate(allRecords, targetYear, targetMonth) {
  if (allRecords.length <= 1) { // ヘッダーのみ、またはデータがない場合
    return allRecords;
  }

  const headers = allRecords[0];
  const data = allRecords.slice(1); // ヘッダー行を除外

  const timestampColumnIndex = headers.indexOf("記録日時");
  const productCodeColumnIndex = headers.indexOf("商品コード");

  if (timestampColumnIndex === -1 || productCodeColumnIndex === -1) {
    throw new Error("Inventory_Recordsシートに'記録日時'または'商品コード'カラムが見つかりません。");
  }

  // 基準日（対象月の末日）を設定
  const targetDate = new Date(targetYear, targetMonth, 0);
  targetDate.setHours(23, 59, 59, 999); // 末日の終わり

  // 未来を許容する猶予期間（10日間）を設定
  const gracePeriodEndDate = new Date(targetDate);
  gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 10);

  const recordsByProduct = {}; // 商品コードごとに記録をグループ化

  data.forEach(row => {
    const productCode = row[productCodeColumnIndex];
    if (!recordsByProduct[productCode]) {
      recordsByProduct[productCode] = [];
    }
    recordsByProduct[productCode].push(row);
  });

  const resultRecords = [];

  for (const productCode in recordsByProduct) {
    const productRecords = recordsByProduct[productCode];

    let closestBeforeTarget = null; // 基準日以前で最も新しい記録
    let closestInGracePeriod = null; // 猶予期間内で最も古い記録

    productRecords.forEach(record => {
      const recordTimestamp = new Date(record[timestampColumnIndex]);

      if (recordTimestamp > targetDate && recordTimestamp <= gracePeriodEndDate) {
        // 猶予期間内の記録
        if (closestInGracePeriod === null || recordTimestamp < new Date(closestInGracePeriod[timestampColumnIndex])) {
          closestInGracePeriod = record;
        }
      } else if (recordTimestamp <= targetDate) {
        // 基準日以前の記録
        if (closestBeforeTarget === null || recordTimestamp > new Date(closestBeforeTarget[timestampColumnIndex])) {
          closestBeforeTarget = record;
        }
      }
    });

    // 優先順位： 1. 猶予期間内の記録, 2. 基準日以前の最新記録
    if (closestInGracePeriod !== null) {
      resultRecords.push(closestInGracePeriod);
    } else if (closestBeforeTarget !== null) {
      resultRecords.push(closestBeforeTarget);
    }
  }

  return [headers, ...resultRecords];
}

/**
 * Inventory_Recordsシートから指定された年月の棚卸記録を取得する
 * @param {number} year - 取得する年 (例: 2023)
 * @param {number} month - 取得する月 (1-12)
 * @returns {Array<Array<any>>} 棚卸記録のデータ（ヘッダー含む）
 */
function getInventoryRecords(year, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Cost_Calculation");
  if (!sheet) throw new Error("Cost_Calculationシートが見つかりません。");

  const allRecords = sheet.getDataRange().getValues();
  return filterInventoryRecordsByClosestDate(allRecords, year, month);
}

/**
 * Inventory_Recordsシートから指定された年月の棚卸記録を取得する (JSON形式)
 * @param {number} year - 取得する年 (例: 2023)
 * @param {number} month - 取得する月 (1-12)
 * @returns {Array<Object>} 棚卸記録のデータ（オブジェクトの配列）
 */
function getInventoryRecordsJson(year, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Cost_Calculation");
  if (!sheet) throw new Error("Cost_Calculationシートが見つかりません。");

  const allRecords = sheet.getDataRange().getValues();
  const filteredRecords = filterInventoryRecordsByClosestDate(allRecords, year, month);

  if (filteredRecords.length <= 1) { // ヘッダーのみ、またはデータがない場合
    return [];
  }

  const headers = filteredRecords[0];
  const data = filteredRecords.slice(1);

  // オブジェクトの配列に変換
  const recordsAsObjects = data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return recordsAsObjects;
}

/**
 * 棚卸記録をCSV形式で生成する
 * @param {number} year - 取得する年
 * @param {number} month - 取得する月
 * @returns {string} CSV形式の文字列
 */
function exportInventoryRecordsCsv(year, month) {
  const records = getInventoryRecords(year, month);
  if (records.length <= 1) { // ヘッダーのみ、またはデータがない場合
    return records.length === 1 ? records[0].join(',') : ""; // ヘッダーのみの場合はヘッダーを返す
  }

  // ヘッダー行とデータ行をCSV形式に変換
  const csvContent = records.map(row => row.map(cell => {
    // CSVとして適切にエスケープする
    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(',')).join('\n');

  return csvContent;
}

/**
 * 棚卸記録をExcel/スプレッドシート形式で生成し、Google Driveに保存してURLを返す
 * @param {number} year - 取得する年
 * @param {number} month - 取得する月
 * @returns {string} 生成されたスプレッドシートのURL
 */
function exportInventoryRecordsExcel(year, month) {
  const records = getInventoryRecords(year, month);
  if (records.length <= 1) {
    throw new Error("出力する棚卸記録がありません。");
  }

  const newSpreadsheet = SpreadsheetApp.create(`棚卸記録_${year}年${month}月`);
  const newSheet = newSpreadsheet.getSheets()[0];
  newSheet.getRange(1, 1, records.length, records[0].length).setValues(records);

  // スプレッドシートのURLを返す
  return newSpreadsheet.getUrl();
}

/**
 * 棚卸記録をPDF形式で生成し、Google Driveに保存してURLを返す
 * @param {number} year - 取得する年
 * @param {number} month - 取得する月
 * @returns {string} 生成されたPDFファイルのURL
 */
function exportInventoryRecordsPdf(year, month) {
  const records = getInventoryRecords(year, month);
  if (records.length <= 1) {
    throw new Error("出力する棚卸記録がありません。");
  }

  // 一時的にスプレッドシートを作成し、PDFとしてエクスポート
  const tempSpreadsheet = SpreadsheetApp.create(`棚卸記録_PDF一時ファイル_${year}年${month}月_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HHmmss")}`);
  const tempSheet = tempSpreadsheet.getSheets()[0];
  tempSheet.getRange(1, 1, records.length, records[0].length).setValues(records);

  const pdfBlob = tempSpreadsheet.getAs('application/pdf');
  pdfBlob.setName(`棚卸記録_${year}年${month}月.pdf`);

  // 一時スプレッドシートを削除
  DriveApp.getFileById(tempSpreadsheet.getId()).setTrashed(true);

  // PDFファイルをGoogle Driveに保存
  const folder = DriveApp.getRootFolder(); // または特定のフォルダを指定
  const file = folder.createFile(pdfBlob);

  return file.getUrl();
}

/**
 * Inventory_Recordsシートに新しい棚卸記録を複数追加する
 * @param {object} requestBody - リクエストボディ
 * @param {Array<object>} requestBody.records - 追加する棚卸記録データの配列
 * @returns {object} 追加された記録件数とメッセージ
 */
function addInventoryRecords(requestBody) {
  const records = requestBody.records;
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("追加する棚卸記録データが見つかりません。");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const inventorySheet = ss.getSheetByName("Inventory_Records");
  if (!inventorySheet) throw new Error("Inventory_Recordsシートが見つかりません。");

  const productSheet = ss.getSheetByName("Product_Master");
  if (!productSheet) throw new Error("Product_Masterシートが見つかりません。");

  const inventoryHeaders = inventorySheet.getRange(1, 1, 1, inventorySheet.getLastColumn()).getValues()[0];
  const productHeaders = productSheet.getRange(1, 1, 1, productSheet.getLastColumn()).getValues()[0];

  const productCodeColIndex = productHeaders.indexOf("商品コード");
  const unitPriceColIndex = productHeaders.indexOf("単価");

  if (productCodeColIndex === -1 || unitPriceColIndex === -1) {
    throw new Error("Product_Masterシートに'商品コード'または'単価'カラムが見つかりません。");
  }

  // 商品マスターのデータを一度だけ読み込み、マップに変換して高速化
  const productData = productSheet.getDataRange().getValues();
  const productMap = new Map(productData.map(row => [row[productCodeColIndex], row]));

  const timestamp = new Date();
  const newRows = records.map(record => {
    const productRow = productMap.get(record["商品コード"]);
    if (!productRow) {
      // エラーを投げる代わりに、スキップしてログに出力することも可能
      throw new Error(`商品コード '${record["商品コード"]}' がProduct_Masterに見つかりません。`);
    }
    const recordedUnitPrice = productRow[unitPriceColIndex];

    const newRow = [];
    inventoryHeaders.forEach(header => {
      switch (header) {
        case "記録日時":
          newRow.push(timestamp);
          break;
        case "商品コード":
          newRow.push(record["商品コード"]);
          break;
        case "ロケーションID":
          newRow.push(record["ロケーションID"]);
          break;
        case "ロット数量":
          newRow.push(record["ロット数量"]);
          break;
        case "ロット単位":
          newRow.push(record["ロット単位"]);
          break;
        case "バラ数量":
          newRow.push(record["バラ数量"]);
          break;
        case "バラ単位":
          newRow.push(record["バラ単位"]);
          break;
        case "記録時単価":
          newRow.push(recordedUnitPrice);
          break;
        case "担当者":
          newRow.push(record["担当者"]);
          break;
        case "備考":
          newRow.push(record["備考"] || "");
          break;
        default:
          newRow.push(""); // 未知のヘッダーは空欄
      }
    });
    return newRow;
  });

  if (newRows.length > 0) {
    const startRow = inventorySheet.getLastRow() + 1;
    inventorySheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  const addedRecords = newRows.map(row => {
    const record = {};
    inventoryHeaders.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  });

  return { message: `${newRows.length}件の棚卸記録が正常に追加されました。`, count: newRows.length, addedRecords: addedRecords };
}

/**
 * Cost_Calculationシートの内容を、Inventory_Recordsから集計して更新する
 */
function updateCostCalculationSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. 必要なシートを取得
  const inventorySheet = ss.getSheetByName("Inventory_Records");
  const costSheet = ss.getSheetByName("Cost_Calculation");
  const productSheet = ss.getSheetByName("Product_Master");
  const supplierSheet = ss.getSheetByName("Supplier_Master");

  if (!inventorySheet || !costSheet || !productSheet || !supplierSheet) {
    throw new Error("必要なシート(Inventory_Records, Cost_Calculation, Product_Master, Supplier_Master)のいずれかが見つかりません。");
  }

  // 2. マスターデータをMapに変換して高速化
  const productData = productSheet.getDataRange().getValues();
  const productHeaders = productData.shift() || [];
  const productMap = new Map(productData.map(row => [row[0], row])); // 商品コードをキーに

  const supplierData = supplierSheet.getDataRange().getValues();
  const supplierHeaders = supplierData.shift() || [];
  const supplierMap = new Map(supplierData.map(row => [row[0], row])); // 仕入先IDをキーに

  // マスターデータのヘッダーインデックスを取得
  const prodNameIdx = productHeaders.indexOf("商品名");
  const supplierIdIdx = productHeaders.indexOf("仕入先ID");
  const caseCountIdx = productHeaders.indexOf("ケース入数");
  const lotUnitIdx = productHeaders.indexOf("ロット単位");
  const pieceUnitIdx = productHeaders.indexOf("バラ単位");
  const supNameIdx = supplierHeaders.indexOf("仕入先名");

  // 3. 棚卸記録を集約
  const inventoryData = inventorySheet.getDataRange().getValues();
  const inventoryHeaders = inventoryData.shift() || [];
  const invTimestampIdx = inventoryHeaders.indexOf("記録日時");
  const invProductCodeIdx = inventoryHeaders.indexOf("商品コード");
  const invLotQtyIdx = inventoryHeaders.indexOf("ロット数量");
  const invPieceQtyIdx = inventoryHeaders.indexOf("バラ数量");
  const invUnitPriceIdx = inventoryHeaders.indexOf("記録時単価");

  const aggregatedData = new Map();

  inventoryData.forEach(row => {
    const timestamp = row[invTimestampIdx];
    const productCode = row[invProductCodeIdx];
    const lotQty = row[invLotQtyIdx] || 0;
    const pieceQty = row[invPieceQtyIdx] || 0;
    const unitPrice = row[invUnitPriceIdx] || 0;

    if (!productCode) return;

    if (aggregatedData.has(productCode)) {
      const current = aggregatedData.get(productCode);
      current.lotQty += lotQty;
      current.pieceQty += pieceQty;
      if (new Date(timestamp) > new Date(current.timestamp)) {
        current.timestamp = timestamp;
        current.unitPrice = unitPrice; // 最新の記録時の単価を採用
      }
    } else {
      aggregatedData.set(productCode, {
        timestamp: timestamp,
        lotQty: lotQty,
        pieceQty: pieceQty,
        unitPrice: unitPrice,
      });
    }
  });

  // 4. Cost_Calculationシート用の出力データを作成
  const outputRows = [];
  const costHeaders = costSheet.getRange(1, 1, 1, costSheet.getLastColumn()).getValues()[0];

  for (const [productCode, data] of aggregatedData.entries()) {
    const productInfo = productMap.get(productCode);
    if (!productInfo) continue;

    const caseCount = productInfo[caseCountIdx] || 0;
    const totalQty = (data.lotQty * caseCount) + data.pieceQty;
    const totalValue = totalQty * data.unitPrice;
    
    const supplierId = productInfo[supplierIdIdx];
    const supplierInfo = supplierMap.get(supplierId);
    const supplierName = supplierInfo ? supplierInfo[supNameIdx] : "";

    const newRow = costHeaders.map(header => {
        switch(header) {
            case "記録日時": return data.timestamp;
            case "商品コード": return productCode;
            case "商品名": return productInfo[prodNameIdx];
            case "ロット数量": return data.lotQty;
            case "ロット単位": return productInfo[lotUnitIdx];
            case "入数": return caseCount;
            case "入数単位": return productInfo[lotUnitIdx]; // 仮: ロット単位と同じ
            case "バラ数量": return data.pieceQty;
            case "バラ単位": return productInfo[pieceUnitIdx];
            case "合計数量": return totalQty;
            case "単位": return productInfo[pieceUnitIdx]; // 仮: バラ単位と同じ
            case "単価": return data.unitPrice;
            case "合計金額": return totalValue;
            case "仕入先名": return supplierName;
            default: return "";
        }
    });
    outputRows.push(newRow);
  }

  // 5. シートに書き込み
  if (costSheet.getLastRow() > 1) {
    costSheet.getRange(2, 1, costSheet.getLastRow() - 1, costSheet.getLastColumn()).clearContent();
  }
  if (outputRows.length > 0) {
    costSheet.getRange(2, 1, outputRows.length, outputRows[0].length).setValues(outputRows);
  }
  
  return { message: `${outputRows.length}件の商品が集計されました。`, count: outputRows.length };
}
