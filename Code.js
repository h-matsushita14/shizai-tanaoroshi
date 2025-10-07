/**
 * 資材棚卸アプリ用のスプレッドシート構成を初期設定する
 * * 以下のシートを作成し、指定されたヘッダー行を設定します。
 * 1. Product_Master (商品マスター)
 * 2. Supplier_Master (仕入先マスター)
 * 3. Location_Master (ロケーションマスター)
 * 4. Inventory_Records (棚卸記録) - 「記録時単価」を追加し、過去の金額を固定
 * 5. Cost_Calculation (金額算出) - 自動計算用
 * 6. Stock_Summary (在庫サマリー) - VIEW用
 */
function setupInventoryAppSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsConfig = [
    { 
      name: "Product_Master", 
      headers: [
        "商品コード", "区分", "商品名", "社内名称", "仕入先ID", "規格", 
        "単価", "ケース入数", "バラ単位", "ロット", "ロット単位", 
        "リードタイム (日)", "安全在庫数", "バーコード/QRコード", 
        "備考1", "備考2", "備考3", "最終更新日"
      ],
      description: "商品情報と発注情報（流用可能）"
    },
    { 
      name: "Supplier_Master", 
      headers: ["仕入先ID", "仕入先名", "連絡先", "住所"],
      description: "仕入先情報（流用可能）"
    },
    { 
      name: "Location_Master", 
      headers: ["ロケーションID", "保管場所", "詳細①", "備考"],
      description: "棚卸ロケーション情報 (階層構造)"
    },
    { 
      name: "Inventory_Records", 
      headers: [
        "記録日時", "商品ID", "ロケーションID", "棚卸数量", 
        "記録時単価", // <-- 【変更点1】単価をトランザクションに固定
        "担当者", "備考"
      ],
      description: "実際の棚卸記録（トランザクションデータ）"
    },
    { 
      name: "Cost_Calculation", 
      headers: [
        "記録日時", "商品ID", "棚卸数量", "単価", "合計金額", 
        "ロケーションID", "担当者"
      ],
      formulaSheet: true,
      description: "記録データから金額を自動算出"
    },
    { 
      name: "Stock_Summary", 
      headers: [
        "ロケーションID", "保管場所", "詳細①", "詳細②", 
        "商品ID", "商品名", "棚卸数量", "記録日時"
      ],
      summarySheet: true, // 新しいフラグ
      description: "ロケーションと商品名、数量を結合した全記録ビュー（棚卸ヒント用）"
    }
  ];

  sheetsConfig.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    
    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      Logger.log(`シート '${config.name}' を作成しました。`);
    } else {
      // 既存のシートの内容をクリアし、再設定する
      sheet.clearContents();
      sheet.clearFormats();
      Logger.log(`既存のシート '${config.name}' の内容をクリアしました。`);
    }

    // ヘッダーを設定
    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange.setValues([config.headers]);
    headerRange.setFontWeight("bold").setBackground("#D9EAD3").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    // 金額算出シートに計算式を設定 (自動計算)
    if (config.formulaSheet) {
      setCalculationFormulas(sheet);
    }
    
    // 在庫サマリーシートに結合式を設定 (VIEW)
    if (config.summarySheet) {
      setSummaryViewFormula(sheet);
    }
    
    // 見やすくするために列幅を調整
    sheet.autoResizeColumns(1, config.headers.length);
  });
  
  // 初期シート（通常作成時にあるシート1）を非表示または削除 (もしあれば)
  const initialSheet = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (initialSheet) {
    initialSheet.hideSheet();
  }
}

/**
 * 金額算出シートに、棚卸記録（記録時単価）を参照するARRAYFORMULAを設定する
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Cost_Calculationシートオブジェクト
 */
function setCalculationFormulas(sheet) {
  // Inventory_Recordsの列構成: A: 記録日時, B: 商品ID, C: ロケーションID, D: 棚卸数量, E: 記録時単価, F: 担当者
  
  // A: 記録日時 (A2:A)
  const timestampFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!A2:A),, Inventory_Records!A2:A))';
  sheet.getRange("A2").setFormula(timestampFormula);
  
  // B: 商品ID (B2:B)
  const productIdFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!B2:B),, Inventory_Records!B2:B))';
  sheet.getRange("B2").setFormula(productIdFormula);

  // C: 棚卸数量 (C2:C) (Inventory_RecordsのD列を参照)
  const quantityFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!D2:D),, Inventory_Records!D2:D))';
  sheet.getRange("C2").setFormula(quantityFormula);

  // D: 単価 (D2:D) (Inventory_RecordsのE列、すなわち記録時単価を参照)
  // 【変更点2】VLOOKUPから、Inventory_RecordsのE列（記録時単価）の直接参照に変更
  const unitCostFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!E2:E),, Inventory_Records!E2:E))';
  sheet.getRange("D2").setFormula(unitCostFormula);
  
  // E: 合計金額 (棚卸数量 * 単価) (E2:E)
  const totalValueFormula = '=ARRAYFORMULA(IF(ISBLANK(C2:C),, C2:C * D2:D))';
  sheet.getRange("E2").setFormula(totalValueFormula);

  // F: ロケーションID (F2:F) (参照用) (Inventory_RecordsのC列を参照)
  const locationIdFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!C2:C),, Inventory_Records!C2:C))';
  sheet.getRange("F2").setFormula(locationIdFormula);
  
  // G: 担当者 (G2:G) (参照用) (Inventory_RecordsのF列を参照)
  const countedByFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!F2:F),, Inventory_Records!F2:F))';
  sheet.getRange("G2").setFormula(countedByFormula);
  
  // 金額列のフォーマットを調整
  sheet.getRange("D:E").setNumberFormat("¥#,##0");
}

/**
 * 在庫サマリーシートに、棚卸記録、商品マスター、ロケーションマスターを結合する
 * VIEW（SQLライクなQUERY関数）を設定する。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Stock_Summaryシートオブジェクト
 */
function setSummaryViewFormula(sheet) {
  // Inventory_Records (A: 記録日時, B: 商品ID, C: ロケーションID, D: 棚卸数量, E: 記録時単価)
  // Product_Master (A: 商品ID, C: 商品名)
  // Location_Master (A: ロケーションID, B: 保管場所, C: 詳細①, D: 詳細②)
  
  // QUERY関数を使って、Inventory_Recordsに、ロケーション情報と商品名を結合する
  // 目的: ロケーション ID, 保管場所, 詳細①, 詳細②, 商品ID, 商品名, 棚卸数量, 記録日時
  // Product_MasterのVLOOKUP参照列は商品名(C列)のインデックス3のまま
  const queryFormula = 
    '=ARRAYFORMULA(' +
      'QUERY({' +
        'Inventory_Records!C2:C, ' + // Col1: ロケーションID (Inventory)
        'IFERROR(VLOOKUP(Inventory_Records!C2:C, Location_Master!A:D, {2, 3, 4}, FALSE), {"", "", ""}), ' + // Col2-4: 保管場所, 詳細1, 詳細2 (Location Master VLOOKUP)
        'Inventory_Records!B2:B, ' + // Col5: 商品ID (Inventory)
        'IFERROR(VLOOKUP(Inventory_Records!B2:B, Product_Master!A:C, 3, FALSE), ""), ' + // Col6: 商品名 (Product Master VLOOKUP)
        'Inventory_Records!D2:D, ' + // Col7: 棚卸数量 (Inventory)
        'Inventory_Records!A2:A ' + // Col8: 記録日時 (Inventory)
      '}, ' +
      '"SELECT Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8 WHERE Col1 IS NOT NULL ORDER BY Col8 DESC", 0)' +
    ')';

  sheet.getRange("A2").setFormula(queryFormula);
  
  // 日時列のフォーマットを調整
  sheet.getRange("H:H").setNumberFormat("yyyy/MM/dd HH:mm");
  
  // 列幅を再調整
  sheet.autoResizeColumns(1, 8);
}

// --- ここからAPI用のコードを追加 ---

const SPREADSHEET_ID = "1l7H7IusQbqPukypEoEn4tKotVR9PfGS95Yz2vuZNFNI";

function doGet(e) {
  // リクエストの内容をログに出力してデバッグしやすくする
  Logger.log("リクエスト受信: " + JSON.stringify(e));

  const action = e.parameter.action;
  let payload;

  try {
    switch (action) {
      case 'getLocations':
        payload = getLocations();
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
    Logger.log("エラー発生: " + error.message);
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

function getLocations() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const idIndex = headers.indexOf("ロケーションID");
  const locationIndex = headers.indexOf("ロケーション");
  const storageIndex = headers.indexOf("保管場所");
  const detail1Index = headers.indexOf("詳細①");

  if ([idIndex, locationIndex, storageIndex, detail1Index].includes(-1)) {
    throw new Error("必要なカラム（ロケーションID, ロケーション, 保管場所, 詳細①）が見つかりません。");
  }

  const hierarchy = {};

  // データから階層構造を構築
  data.forEach(row => {
    const id = row[idIndex];
    const category = row[locationIndex];
    const storage = row[storageIndex];
    const detail = row[detail1Index];

    if (!category || !storage) return; // カテゴリか保管場所がなければスキップ

    // カテゴリ（例: 工場1F）がなければ初期化
    if (!hierarchy[category]) {
      hierarchy[category] = {};
    }

    // 保管場所（例: 資材室）がなければ初期化
    if (!hierarchy[category][storage]) {
      // 保管場所の親となる行（詳細①が空欄）を探して、そのIDを基準とする
      const baseRow = data.find(r => r[locationIndex] === category && r[storageIndex] === storage && !r[detail1Index]);
      hierarchy[category][storage] = {
        id: baseRow ? baseRow[idIndex] : id, // 親のID、見つからなければ今の行のID
        name: storage,
        details: []
      };
    }

    // 詳細①があれば、details配列に追加
    if (detail) {
      hierarchy[category][storage].details.push({ id: id, name: detail });
    }
  });

  // 階層オブジェクトをソート可能な配列に変換
  const result = Object.keys(hierarchy).map(categoryKey => {
    const storageAreas = Object.values(hierarchy[categoryKey]);
    
    // 各保管場所内の詳細をIDでソート
    storageAreas.forEach(area => {
      area.details.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    });

    // 保管場所をIDでソート
    storageAreas.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // カテゴリをソートするために、そのカテゴリ内で最小のIDを見つける
    const minId = storageAreas.length > 0 ? storageAreas[0].id : '';

    return {
      category: categoryKey,
      minId: minId,
      storageAreas: storageAreas
    };
  })
  .sort((a, b) => a.minId.localeCompare(b.minId, undefined, { numeric: true }));

  // ソート用の一時的なminIdプロパティを削除
  result.forEach(r => delete r.minId);

  return result;
}