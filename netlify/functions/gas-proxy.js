// netlify/functions/gas-proxy.js
exports.handler = async (event, context) => {
  const gasUrl = process.env.VITE_GAS_API_URL; // Netlifyの環境変数からGASのURLを取得
  const { path, httpMethod, headers, body } = event;

  // GASへのパスを構築 (例: /api/gas/someAction -> GAS_URL)
  // ここではシンプルにGAS_URLに転送
  const targetUrl = gasUrl; 

  try {
    const response = await fetch(targetUrl, {
      method: httpMethod,
      headers: {
        'Content-Type': headers['content-type'] || 'application/json',
        // 必要に応じて他のヘッダーも転送
      },
      body: body, // POSTリクエストの場合
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*', // ここでCORSヘッダーを設定
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};