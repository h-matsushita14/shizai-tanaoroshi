// netlify/functions/gas-proxy.js
exports.handler = async (event, context) => {
  const gasUrl = process.env.VITE_GAS_API_URL; // Netlifyの環境変数からGASのURLを取得
  const { path, httpMethod, headers, body, queryStringParameters } = event; // Add queryStringParameters

  let targetUrl = gasUrl;

  // If it's a GET request and there are query parameters, append them to the targetUrl
  if (httpMethod === 'GET' && queryStringParameters) {
    const queryString = new URLSearchParams(queryStringParameters).toString();
    targetUrl = `${gasUrl}?${queryString}`;
  }

  console.log('GAS_PROXY: gasUrl:', gasUrl);
  console.log('GAS_PROXY: targetUrl:', targetUrl);
  console.log('GAS_PROXY: httpMethod:', httpMethod);
  console.log('GAS_PROXY: headers:', headers);
  console.log('GAS_PROXY: body:', body);

  try {
    const response = await fetch(targetUrl, {
      method: httpMethod,
      headers: {
        'Content-Type': headers['content-type'] || 'application/json',
        // 必要に応じて他のヘッダーも転送
      },
      body: body, // POSTリクエストの場合
    });

    console.log('GAS_PROXY: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GAS_PROXY: Error response from GAS:', errorText);
      throw new Error(`GAS responded with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('GAS_PROXY: Result from GAS:', result);

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*', // ここでCORSヘッダーを設定
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('GAS_PROXY: Fetch error:', error.message);
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