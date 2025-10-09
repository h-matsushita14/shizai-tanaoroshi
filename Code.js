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
      name: "Stock_Summary", 
      headers: [
        "ロケーションID", "保管場所", "詳細①", "詳細②", 
        "商品ID", "商品名", "棚卸数量", "記録日時"
      ],
      summarySheet: true, // 新しいフラグ
      description: "ロケーションと商品名、数量を結合した全記録ビュー（棚卸ヒント用）"
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
  const totalQuantityFormula = 
    '=ARRAYFORMULA(IF(ISBLANK(Inventory_Records!B2:B),, ' +
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

/**
 * 在庫サマリーシートに、棚卸記録、商品マスター、ロケーションマスターを結合する
 * VIEW（SQLライクなQUERY関数）を設定する。
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Stock_Summaryシートオブジェクト
 */
function setSummaryViewFormula(sheet) {
  // Inventory_Records (A: 記録日時, B: 商品コード, C: ロケーションID, D: ロット数量, E: ロット単位, F: バラ数量, G: バラ単位, H: 記録時単価)
  // Product_Master (A: 商品コード, C: 商品名, H: ケース入数)
  // Location_Master (A: ロケーションID, B: 保管場所, C: 詳細①, D: 備考)
  
  // QUERY関数を使って、Inventory_Recordsに、ロケーション情報と商品名を結合する
  // 目的: ロケーション ID, 保管場所, 詳細①, 商品ID, 商品名, 棚卸数量 (合計), 記録日時
  const queryFormula = 
    '=ARRAYFORMULA(' +
      'QUERY({' +
        'Inventory_Records!C2:C, ' + // Col1: ロケーションID (Inventory)
        'IFERROR(VLOOKUP(Inventory_Records!C2:C, Location_Master!A:C, {2, 3}, FALSE), {"", ""}), ' + // Col2-3: 保管場所, 詳細1 (Location Master VLOOKUP)
        'Inventory_Records!B2:B, ' + // Col4: 商品ID (Inventory)
        'IFERROR(VLOOKUP(Inventory_Records!B2:B, Product_Master!A:C, 3, FALSE), ""), ' + // Col5: 商品名 (Product Master VLOOKUP)
        '(N(Inventory_Records!D2:D) * IFERROR(VLOOKUP(Inventory_Records!B2:B, Product_Master!A:H, 8, FALSE), 0)) + N(Inventory_Records!F2:F), ' + // Col6: 棚卸数量 (合計) = (ロット数量 * ケース入数) + バラ数量
        'Inventory_Records!A2:A ' + // Col7: 記録日時 (Inventory)
      '}, ' +
      '"SELECT Col1, Col2, Col3, Col4, Col5, Col6, Col7 WHERE Col1 IS NOT NULL ORDER BY Col7 DESC", 0)' +
    ')';

  sheet.getRange("A2").setFormula(queryFormula);
  
  // 日時列のフォーマットを調整
  sheet.getRange("G:G").setNumberFormat("yyyy/MM/dd HH:mm"); // 日時列がG列に移動
  
  // 列幅を再調整
  sheet.autoResizeColumns(1, 7); // 列数が7に減少
}

// --- ここからAPI用のコードを追加 ---

const SPREADSHEET_ID = "1l7H7IusQbqPukypEoEn4tKotVR9PfGS95Yz2vuZNFNI";

function doGet(e) {
  // リクエストの内容をログに出力してデバッグしやすくする
  Logger.log("リクエスト受信 (GET): " + JSON.stringify(e));

  const action = e.parameter.action;
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

function getLocations() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Location_Master");
  if (!sheet) throw new Error("Location_Masterシートが見つかりません。");

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const idIndex = headers.indexOf("ロケーションID");
  const categoryIndex = headers.indexOf("ロケーション"); // 新しいカテゴリ列
  const storageAreaIndex = headers.indexOf("保管場所"); // 新しい保管場所列
  const detailIndex = headers.indexOf("詳細①"); // 新しい詳細列

  if ([idIndex, categoryIndex, storageAreaIndex, detailIndex].includes(-1)) {
    throw new Error("必要なカラム（ロケーションID, ロケーション, 保管場所, 詳細①）が見つかりません。");
  }

  // ロケーションIDでデータをソート
  data.sort((a, b) => {
    const idA = a[idIndex];
    const idB = b[idIndex];
    // 数値として比較するために、必要であればパースする
    // 例: "L0001" -> 1
    const numA = parseInt(idA.replace(/[^0-9]/g, ''), 10);
    const numB = parseInt(idB.replace(/[^0-9]/g, ''), 10);
    return numA - numB;
  });

  const hierarchy = {};

  data.forEach(row => {
    const id = row[idIndex];
    const category = row[categoryIndex];
    const storageArea = row[storageAreaIndex];
    const detail = row[detailIndex];

    if (!category) return; // カテゴリがなければスキップ

    if (!hierarchy[category]) {
      hierarchy[category] = {
        category: category,
        storageAreas: {} // ここをオブジェクトにして、保管場所名でアクセスできるようにする
      };
    }

    if (storageArea) { // 保管場所があれば
      if (!hierarchy[category].storageAreas[storageArea]) {
        hierarchy[category].storageAreas[storageArea] = {
          id: id, // 保管場所のID
          name: storageArea,
          details: []
        };
      }

      if (detail) { // 詳細があれば
        hierarchy[category].storageAreas[storageArea].details.push({ id: id, name: detail });
      }
    }
  });

  // 階層オブジェクトをソート可能な配列に変換
  const result = Object.values(hierarchy).map(categoryGroup => {
    const storageAreas = Object.values(categoryGroup.storageAreas);

    // 各保管場所内の詳細をIDでソート
    storageAreas.forEach(area => {
      area.details.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    });

    // 保管場所をIDでソート
    storageAreas.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    return {
      category: categoryGroup.category,
      storageAreas: storageAreas
    };
  });

  // カスタムカテゴリ順を定義
  const customCategoryOrder = ["工場1F", "工場2F", "その他"];

  // カテゴリをカスタム順でソート
  result.sort((a, b) => {
    const indexA = customCategoryOrder.indexOf(a.category);
    const indexB = customCategoryOrder.indexOf(b.category);

    // customCategoryOrderに含まれないカテゴリは最後に配置（または既存のlocaleCompareでソート）
    if (indexA === -1 && indexB === -1) {
      return a.category.localeCompare(b.category, undefined, { numeric: true });
    }
    if (indexA === -1) return 1; // aがカスタム順になければbより後
    if (indexB === -1) return -1; // bがカスタム順になければaより後

    return indexA - indexB;
  });

  return result;
}

function getProductsByLocation(locationId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const locationProductSheet = ss.getSheetByName("Location_Product_Mapping");
  if (!locationProductSheet) throw new Error("Location_Product_Mappingシートが見つかりません。");

  const productSheet = ss.getSheetByName("Product_Master");
  if (!productSheet) throw new Error("Product_Masterシートが見つかりません。");

  const supplierSheet = ss.getSheetByName("Supplier_Master");
  if (!supplierSheet) throw new Error("Supplier_Masterシートが見つかりません。");

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