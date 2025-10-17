/**
 * 指定された年月の末日を起点として、各商品ごとに最も近い棚卸記録を抽出するヘルパー関数
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
    // 対象月の末日を計算
    // targetMonth は 1-12 なので、Dateコンストラクタの月は -1 する
    const targetDate = new Date(targetYear, targetMonth - 1, new Date(targetYear, targetMonth, 0).getDate());
    targetDate.setHours(23, 59, 59, 999); // 末日の終わり
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
        let bestRecord = null;
        let closestAfterTarget = null; // 末日以降で最も古い記録
        let closestBeforeTarget = null; // 末日以前で最も新しい記録
        productRecords.forEach(record => {
            const recordTimestamp = new Date(record[timestampColumnIndex]);
            if (recordTimestamp > targetDate) {
                if (closestAfterTarget === null || recordTimestamp < new Date(closestAfterTarget[timestampColumnIndex])) {
                    closestAfterTarget = record;
                }
            }
            else {
                if (closestBeforeTarget === null || recordTimestamp > new Date(closestBeforeTarget[timestampColumnIndex])) {
                    closestBeforeTarget = record;
                }
            }
        });
        if (closestAfterTarget !== null) {
            bestRecord = closestAfterTarget;
        }
        else if (closestBeforeTarget !== null) {
            bestRecord = closestBeforeTarget;
        }
        if (bestRecord) {
            resultRecords.push(bestRecord);
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
    const sheet = ss.getSheetByName("Inventory_Records");
    if (!sheet)
        throw new Error("Inventory_Recordsシートが見つかりません。");
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
    const sheet = ss.getSheetByName("Inventory_Records");
    if (!sheet)
        throw new Error("Inventory_Recordsシートが見つかりません。");
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
