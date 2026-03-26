/**
 * ユーティリティ関数
 */

/**
 * 指定したプロミスにタイムアウトを設定するラッパー関数
 * @param {Promise} promise 実行するプロミス
 * @param {number} ms タイムアウトまでの時間(ミリ秒)
 * @param {string} label ログ出力用のラベル
 * @returns {Promise}
 */
export async function withTimeout(promise, ms = 10000, label = "API Call") {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(`[TIMEOUT] ${label} 処理が ${ms / 1000} 秒を超えたためタイムアウトしましたお！`);
      reject(new Error(`Timeout: ${label} took longer than ${ms}ms`));
    }, ms);
  });

  try {
    console.log(`[START] ${label} 処理を開始するお...`);
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    console.log(`[SUCCESS] ${label} 処理が無事に完了したお！`);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.message && error.message.startsWith('Timeout')) {
      // タイムアウトした場合は、エラーを投げずに空のデータを返す
      return { error: 'Timeout', data: [] };
    }
    console.error(`[ERROR] ${label} 処理中にエラーが発生したお:`, error.message);
    throw error;
  }
}
