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