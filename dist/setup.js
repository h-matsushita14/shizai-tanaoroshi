/**
 * 資材棚卸アプリ用のスプレッドシート構成を初期設定する
 * * 以下のシートを作成し、指定されたヘッダー行を設定します。
 * 1. Product_Master (商品マスター)
 * 2. Supplier_Master (仕入先マスター)
 * 3. Location_Master (ロケーションマスター)
 * 4. Inventory_Records (棚卸記録) - 「記録時単価」を追加し、過去の金額を固定
 * 5. Cost_Calculation (金額算出) - 自動計算用
 */
function setupInventoryAppSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetsConfig = [
        {
            name: "Product_Master",
            headers: [
                "商品コード", "区分", "商品名", "社内名称", "仕入先ID", "規格",
                "単価", "ケース入数", "バラ単位", "ロット", "ロット単位",
                "リードタイム (日)", "安全在庫数",
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
            headers: ["ロケーションID", "ロケーション", "保管場所", "詳細①", "備考"],
            description: "棚卸ロケーション情報 (階層構造)"
        },
        {
            name: "Inventory_Records",
            headers: [
                "記録日時", "商品コード", "ロケーションID",
                "ロット数量", "ロット単位", "バラ数量", "バラ単位",
                "記録時単価",
                "担当者", "備考"
            ],
            description: "実際の棚卸記録（トランザクションデータ）"
        },
        {
            name: "Cost_Calculation",
            headers: [
                "記録日時", "商品ID", "合計数量", "単価", "合計金額",
                "ロケーションID", "担当者"
            ],
            formulaSheet: true,
            description: "記録データから金額を自動算出"
        },
        {
            name: "Location_Product_Mapping",
            headers: ["ロケーションID", "商品コード"],
            description: "ロケーションと商品の紐付け"
        }
    ];
    sheetsConfig.forEach(config => {
        let sheet = ss.getSheetByName(config.name);
        // シートが存在しない場合は作成
        if (!sheet) {
            sheet = ss.insertSheet(config.name);
            Logger.log(`シート '${config.name}' を作成しました。`);
        }
        else {
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
    // Inventory_Recordsの列構成: A: 記録日時, B: 商品コード, C: ロケーションID, D: ロット数量, E: ロット単位, F: バラ数量, G: バラ単位, H: 記録時単価, I: 担当者, J: 備考
    // Product_Masterの列構成: A: 商品コード, ..., H: ケース入数
    // A: 記録日時 (A2:A) - Inventory_RecordsのA列
    const timestampFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!A2:A),, Inventory_Records!A2:A))';
    sheet.getRange("A2").setFormula(timestampFormula);
    // B: 商品ID (B2:B) - Inventory_RecordsのB列 (商品コード)
    const productIdFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!B2:B),, Inventory_Records!B2:B))';
    sheet.getRange("B2").setFormula(productIdFormula);
    // C: 合計数量 (C2:C) - (ロット数量 * ケース入数) + バラ数量
    // Inventory_Records!D2:D (ロット数量), Inventory_Records!F2:F (バラ数量)
    // Product_Masterからケース入数をVLOOKUP (Product_Master!A:H の8列目)
    const totalQuantityFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!B2:B),, ' +
        '(N(Inventory_Records!D2:D) * IFERROR(VLOOKUP(Inventory_Records!B2:B, Product_Master!A:H, 8, FALSE), 0)) + ' +
        'N(Inventory_Records!F2:F)' +
        '))';
    sheet.getRange("C2").setFormula(totalQuantityFormula);
    // D: 単価 (D2:D) - Inventory_RecordsのH列 (記録時単価)
    const unitCostFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!H2:H),, Inventory_Records!H2:H))';
    sheet.getRange("D2").setFormula(unitCostFormula);
    // E: 合計金額 (E2:E) - 合計数量 * 単価
    const totalValueFormula = '=ARRAYFORMULA(IF(ISBLANK(C2:C),, C2:C * D2:D))';
    sheet.getRange("E2").setFormula(totalValueFormula);
    // F: ロケーションID (F2:F) - Inventory_RecordsのC列
    const locationIdFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!C2:C),, Inventory_Records!C2:C))';
    sheet.getRange("F2").setFormula(locationIdFormula);
    // G: 担当者 (G2:G) - Inventory_RecordsのI列
    const countedByFormula = '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!I2:I),, Inventory_Records!I2:I))';
    sheet.getRange("G2").setFormula(countedByFormula);
    // 金額列のフォーマットを調整
    sheet.getRange("D:E").setNumberFormat("¥#,##0");
}
