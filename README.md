# フロントエンド（React + Vite）からGASへのAPI連携ベストプラクティス

## 環境変数の設定（重要）

### Vite環境変数の特性

**重要**: Viteの環境変数（`VITE_`プレフィックス）は**ビルド時に静的にバンドルされます**。

```
環境変数を設定 → ビルド実行 → 値がJSに埋め込まれる → デプロイ
```

つまり:
- デプロイ後に環境変数を変更しても反映されない
- 変更後は**必ず再ビルド・再デプロイが必要**
- ビルド後のJSファイルに直接URLが埋め込まれる（公開情報になる）

### Netlifyでの環境変数設定手順

#### 1. Netlify管理画面で設定

```
Site settings 
  → Environment variables 
  → Add a variable

Key: VITE_GAS_API_URL
Value: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**注意**: 
- 必ず`VITE_`プレフィックスをつける
- プレフィックスがないとクライアント側で参照できない

#### 2. 再デプロイ（必須）

```
Deploys 
  → Trigger deploy 
  → Clear cache and deploy site
```

#### 3. ビルドログで確認

```bash
Building with environment variables:
  VITE_GAS_API_URL=https://script.google.com/...
```

### 推奨: フォールバック値を設定する

環境変数が設定されていない場合でも動作するように:

```javascript
// src/config.js
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/YOUR_DEFAULT_DEPLOYMENT_ID/exec';

export const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_URL;

// 開発時に警告を出す
if (import.meta.env.DEV && !import.meta.env.VITE_GAS_API_URL) {
  console.warn(
    '⚠️ VITE_GAS_API_URL is not set. Using default URL:',
    DEFAULT_GAS_URL
  );
}

// 本番環境でも確認
if (import.meta.env.PROD) {
  console.log('Using GAS URL:', GAS_WEB_APP_URL);
}
```

### ローカル開発環境での設定

#### .env.local（gitignoreに追加）

```bash
# ローカル開発用
VITE_GAS_API_URL=https://script.google.com/macros/s/DEV_ID/exec
```

#### .env.production（オプション）

```bash
# 本番環境用のデフォルト値（Netlifyの環境変数で上書き可能）
VITE_GAS_API_URL=https://script.google.com/macros/s/PROD_ID/exec
```

#### .gitignore

```
.env.local
```

### 環境変数の確認方法

#### ブラウザコンソールで確認

```javascript
console.log('GAS URL:', import.meta.env.VITE_GAS_API_URL);
console.log('Mode:', import.meta.env.MODE);
console.log('Is Dev:', import.meta.env.DEV);
console.log('Is Prod:', import.meta.env.PROD);
```

#### ビルド後のソースで確認

デベロッパーツール → Sources → ビルド後のJSファイル:
```javascript
// 環境変数が正しく埋め込まれている
const url = "https://script.google.com/macros/s/.../exec";
```

## 基本原則

### GETリクエスト
- actionをURLクエリパラメータとして送信
- シンプルなfetchで実装

### POSTリクエスト
- actionをリクエストボディに含める
- `Content-Type: application/json` を使用
- プリフライトリクエスト（OPTIONS）が自動的に発生することを理解する

## 推奨される実装パターン

### 1. 設定ファイルの作成

```javascript
// src/config.js
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

export const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_URL;

// 環境変数の状態をログ出力
if (import.meta.env.DEV) {
  console.log('🔧 Development mode');
  if (!import.meta.env.VITE_GAS_API_URL) {
    console.warn('⚠️ VITE_GAS_API_URL not set, using default');
  }
}

if (import.meta.env.PROD) {
  console.log('🚀 Production mode, GAS URL:', GAS_WEB_APP_URL);
}
```

### 2. 共通POST関数の実装

```javascript
// src/api/gas.js
import { GAS_WEB_APP_URL } from '../config';

/**
 * GASへPOSTリクエストを送信する共通関数
 * @param {string} action - 実行するアクション名
 * @param {object} additionalData - 追加データ
 * @returns {Promise<object>} レスポンスデータ
 */
export const sendPostRequest = async (action, additionalData = {}) => {
  try {
    const requestBody = {
      action,
      ...additionalData
    };
    
    console.log('Sending POST request:', requestBody);
    
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('POST response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('POST response result:', result);
    
    return result;
  } catch (err) {
    console.error('POST request error:', err);
    throw err;
  }
};

/**
 * GASへGETリクエストを送信する共通関数
 * @param {string} action - 実行するアクション名
 * @param {object} params - クエリパラメータ
 * @returns {Promise<object>} レスポンスデータ
 */
export const sendGetRequest = async (action, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      action,
      ...params
    });
    
    const url = `${GAS_WEB_APP_URL}?${queryParams}`;
    console.log('Sending GET request:', url);
    
    const response = await fetch(url);
    
    console.log('GET response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('GET response result:', result);
    
    return result;
  } catch (err) {
    console.error('GET request error:', err);
    throw err;
  }
};
```

### 3. コンポーネントでの使用例

```javascript
import React, { useState, useEffect } from 'react';
import { sendGetRequest, sendPostRequest } from '../api/gas';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sendGetRequest('getProducts');
      
      if (result.status === 'success') {
        setProducts(result.data);
      } else {
        throw new Error(result.message || 'データの取得に失敗しました。');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const result = await sendPostRequest('addProduct', {
        productCode: productData.code,
        productName: productData.name,
        supplierId: productData.supplierId
      });

      if (result.status === 'success') {
        alert(result.data?.message || '商品を追加しました。');
        fetchProducts(); // データを再取得
      } else {
        throw new Error(result.message || '商品の追加に失敗しました。');
      }
    } catch (err) {
      alert(`エラーが発生しました: ${err.message}`);
      console.error('Error adding product:', err);
    }
  };

  const handleDeleteProduct = async (productCode) => {
    if (!window.confirm('削除してもよろしいですか？')) {
      return;
    }
    
    try {
      const result = await sendPostRequest('deleteProduct', {
        productCode
      });

      if (result.status === 'success') {
        alert(result.data?.message || '商品を削除しました。');
        fetchProducts();
      } else {
        throw new Error(result.message || '商品の削除に失敗しました。');
      }
    } catch (err) {
      alert(`エラーが発生しました: ${err.message}`);
      console.error('Error deleting product:', err);
    }
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.商品コード}>
          {product.商品名}
          <button onClick={() => handleDeleteProduct(product.商品コード)}>
            削除
          </button>
        </div>
      ))}
    </div>
  );
}
```

## エラーハンドリングのベストプラクティス

### レスポンス形式の統一

GASからのレスポンスは常に以下の形式を期待:

```javascript
// 成功時
{
  status: 'success',
  version: 'shizai-tanaoroshi-gas-ts v1.0',
  data: { /* 実際のデータ */ }
}

// エラー時
{
  status: 'error',
  version: 'shizai-tanaoroshi-gas-ts v1.0',
  message: 'エラーメッセージ'
}
```

## CORS問題のトラブルシューティング

### チェックリスト

#### 環境変数関連
- [ ] Netlifyで`VITE_GAS_API_URL`が設定されている（`VITE_`プレフィックス必須）
- [ ] 環境変数設定後に再デプロイした
- [ ] ビルドログで環境変数が読み込まれているか確認
- [ ] ブラウザコンソールで`import.meta.env.VITE_GAS_API_URL`を確認
- [ ] フォールバック値が設定されている

#### GAS側（バックエンド）
- [ ] `doOptions`関数が実装されている
- [ ] `doPost`関数で`requestBody.action`を取得している
- [ ] デプロイ設定で「アクセスできるユーザー: 全員」になっている
- [ ] 最新バージョンとして再デプロイした
- [ ] GASログで関数が呼ばれているか確認

#### フロントエンド側
- [ ] POSTのactionがボディに含まれている
- [ ] `Content-Type: application/json`を設定している
- [ ] 環境変数`VITE_GAS_API_URL`が正しく設定されている
- [ ] ブラウザのキャッシュをクリアした（Ctrl+Shift+R）

#### ブラウザのデベロッパーツールで確認
- [ ] Networkタブを開く
- [ ] リクエストURLが`undefined`になっていないか
- [ ] OPTIONSリクエストが送信されているか
- [ ] OPTIONSのレスポンスステータスが200か
- [ ] POSTリクエストが実際に送信されているか
- [ ] エラーレスポンスの内容を確認

### よくある問題と解決策

#### 問題1: `fetch(undefined)` エラー

**原因**: 環境変数が設定されていない、またはビルドに反映されていない

**解決策**: 
```javascript
// フォールバック値を設定
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_API_URL || 
  'https://script.google.com/macros/s/DEFAULT_ID/exec';
```

#### 問題2: 環境変数を変更したのに反映されない

**原因**: ビルド時に埋め込まれるため、再ビルドが必要

**解決策**: 
```
Netlify → Deploys → Trigger deploy → Clear cache and deploy site
```

#### 問題3: ローカルでは動くがNetlifyで動かない

**原因**: 
- Netlifyの環境変数が設定されていない
- プレフィックスが間違っている（`GAS_API_URL`ではなく`VITE_GAS_API_URL`）

**解決策**: 
1. Netlifyの環境変数を確認
2. ビルドログを確認
3. フォールバック値を設定

### デバッグ用コンソールログの例

```javascript
// src/config.js に追加
console.group('🔧 Environment Configuration');
console.log('Mode:', import.meta.env.MODE);
console.log('VITE_GAS_API_URL:', import.meta.env.VITE_GAS_API_URL);
console.log('Using GAS URL:', GAS_WEB_APP_URL);
console.log('Is Development:', import.meta.env.DEV);
console.log('Is Production:', import.meta.env.PROD);
console.groupEnd();
```

## プリフライトリクエスト（OPTIONS）について

### 発生条件
以下のいずれかに該当する場合、ブラウザは自動的にOPTIONSリクエストを送信:
- `Content-Type: application/json`を使用
- カスタムヘッダーを追加
- GET/POST以外のメソッド（PUT、DELETE等）

### リクエストの流れ
```
1. ブラウザ → GAS: OPTIONS リクエスト (プリフライト)
   ↓
2. GAS → ブラウザ: 200 OK (doOptions関数で処理)
   ↓
3. ブラウザ → GAS: POST リクエスト (実際のデータ送信)
   ↓
4. GAS → ブラウザ: 200 OK + データ (doPost関数で処理)
```

## React Hooks使用時の注意点

### useEffectでのデータ取得

```javascript
useEffect(() => {
  if (open) {
    fetchData();
  }
}, [open, locationId]); // 依存配列を正しく設定
```

### 非同期関数の扱い

```javascript
// ❌ 間違い
useEffect(async () => {
  await fetchData();
}, []);

// ✅ 正しい
useEffect(() => {
  const loadData = async () => {
    await fetchData();
  };
  loadData();
}, []);
```

## プロジェクト構成の推奨

```
src/
  ├── config.js              # 環境変数とGAS URLの設定
  ├── api/
  │   └── gas.js            # GAS API呼び出しの共通関数
  ├── components/
  │   └── ProductList.jsx   # コンポーネント
  └── App.jsx

.env.local                  # ローカル開発用（gitignore）
.env.production            # 本番デフォルト値（オプション）
```

## コード生成時の指示

React + Vite + GASの連携コードを生成する際は:
1. **config.jsを作成** - 環境変数とフォールバック値を管理
2. **api/gas.jsを作成** - 共通のGET/POST関数
3. **環境変数チェック** - 開発時に警告を出力
4. **詳細なログ出力** - デバッグしやすくする
5. **適切なエラーハンドリング** - ユーザーフレンドリーなメッセージ
6. **レスポンス形式を統一** - status/data/messageの構造
7. **プリフライトリクエストを考慮** - OPTIONSの存在を理解
8. **Netlifyの環境変数設定を前提** - ただしフォールバック値も必須

# Google Apps Script (GAS) CORS対応の重要な制約事項

## 絶対に守るべきルール

### ❌ やってはいけないこと
**Google Apps ScriptのContentServiceには`setHeader`メソッドが存在しません。**
以下のようなコードは**エラーになります**:

```typescript
// ❌ これは動作しません
output.setHeader('Access-Control-Allow-Origin', '*');
(output as any).setHeader('Access-Control-Allow-Origin', 'https://example.com');
```

### ✅ 正しい対応方法

#### 1. GASデプロイメント設定でCORS対応する（推奨）
Google Apps Scriptをウェブアプリとしてデプロイする際の設定:
- **アクセスできるユーザー**: 「全員」を選択
- **次のユーザーとして実行**: 「自分」を選択
- これにより、GET/POST/OPTIONSすべてのリクエストでCORSが自動的に許可されます

#### 2. 正しいコード実装

```typescript
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
```

## CORS問題の理解

### 通信の流れ
```
フロントエンド (Netlify)  ←→  バックエンド (GAS)
https://example.netlify.app  ←→  https://script.google.com/...
```

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