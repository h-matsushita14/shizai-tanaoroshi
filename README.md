# 棚卸作業用アプリケーション

## アプリケーション構成

*   **フロントエンド:** React + Vite
*   **バックエンド:** Google Apps Script (GAS)
    *   TypeScript方式を採用
*   **データベース:** Googleスプレッドシート
*   **デプロイ:** Netlify
*   **リポジトリ:** GitHub

---

# Google Apps Script (GAS) CORS対応の重要な制約事項

## 絶対に守るべきルール

### ❌ やってはいけないこと
**Google Apps ScriptのContentServiceには`setHeader`メソッドが存在しません。**
以下のようなコードは**エラーになります**:

'''typescript
// ❌ これは動作しません
output.setHeader('Access-Control-Allow-Origin', '*');
(output as any).setHeader('Access-Control-Allow-Origin', 'https://example.com');
'''

### ✅ 正しい対応方法

#### 1. GASデプロイメント設定でCORS対応する（推奨）
Google Apps Scriptをウェブアプリとしてデプロイする際の設定:
- **アクセスできるユーザー**: 「全員」を選択
- **次のユーザーとして実行**: 「自分」を選択
- これにより、GET/POST/OPTIONSすべてのリクエストでCORSが自動的に許可されます

#### 2. 正しいコード実装

'''typescript
/**
 * OPTIONSリクエスト (CORSプリフライト)
 * POST/PUT/DELETEなどのリクエスト前にブラウザが自動的に送信
 */
function doOptions(e: GoogleAppsScript.Events.DoPost) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * GETリクエストハンドラ
 */
function doGet(e: GoogleAppsScript.Events.DoGet) {
  let responsePayload;
  const callback = e.parameter.callback;

  try {
    // ビジネスロジック
    const action = e.parameter.action;
    // ... 処理 ...
    
    responsePayload = {
      status: 'success',
      data: payload
    };
  } catch (error) {
    responsePayload = {
      status: 'error',
      message: error.message
    };
  }

  // JSONP対応（CORS回避の古典的な方法）
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(responsePayload)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // 通常のJSON応答
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエストハンドラ
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  let responsePayload;

  try {
    const requestBody = JSON.parse(e.postData.contents);
    // ... 処理 ...
    
    responsePayload = {
      status: 'success',
      data: payload
    };
  } catch (error) {
    responsePayload = {
      status: 'error',
      message: error.message
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}
'''

## CORS問題の理解

### 通信の流れ
'''
フロントエンド (Netlify)  ←→  バックエンド (GAS)
https://example.netlify.app  ←→  https://script.google.com/...
'''

### 影響を受けるリクエスト
- **GET**: データ取得（例: `?action=getLocations`）
- **POST**: データ送信（例: `?action=addProduct`）
- **OPTIONS**: プリフライトリクエスト（POSTの前に自動送信）

**すべてのリクエストタイプで同じCORS制約が適用されます。**

## 重要なポイント

1. **`setHeader`は使用不可**: GASのContentServiceにこのメソッドは存在しない
2. **デプロイ設定が解決策**: 「アクセスできるユーザー: 全員」で自動的にCORS許可
3. **JSONPはオプション**: GET専用だが、追加の安全策として有効
4. **再デプロイ必須**: コード変更後は必ず新しいバージョンとしてデプロイ

## コード生成時の指示

Google Apps Scriptのコードを生成する際は:
- `setHeader`メソッドを使用しない
- `withCors`のようなヘッダー設定関数を作成しない
- デプロイメント設定でCORS対応することを前提とする
- `doOptions`関数は必ず実装する（プリフライト対応）
- JSONP対応は任意だが、推奨される

---

**このプロンプトの内容を常に優先し、GASコードでCORSヘッダーを設定しようとしないでください。**