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