// src/config.js
export const PROXY_GAS_URL = '/api/gas'; // Netlifyのプロキシエンドポイント

// 開発時に警告を出す (VITE_GAS_API_URLはNetlify Function側で必要になるため、ここでは不要)
if (import.meta.env.DEV) {
  console.log('🔧 Development mode');
  console.log('Using Proxy URL:', PROXY_GAS_URL);
}

// 本番環境でも確認
if (import.meta.env.PROD) {
  console.log('🚀 Production mode, Using Proxy URL:', PROXY_GAS_URL);
}