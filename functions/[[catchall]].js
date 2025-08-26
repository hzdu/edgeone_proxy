// functions/[[catchall]].js

// 定义一个辅助函数，用于创建异步延迟
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  let targetDomain = null;
  let strippedPath = '';

  // 1. 根据路径前缀，选择目标域名并剥离前缀
  if (path.startsWith('/gt/')) {
    targetDomain = 'github.ctnis.com';
    strippedPath = path.substring('/gt/'.length); 
  } else if (path.startsWith('/se/')) {
    targetDomain = 'joyhubsetting.ctnis.com';
    strippedPath = path.substring('/se/'.length);
  } else if (path.startsWith('/60s/')) {
    targetDomain = '60s.ctnis.com';
    strippedPath = path.substring('/60s/'.length);
  } else if (path.startsWith('/api/')) {
    targetDomain = 'joyhubapi.ctnis.com';
    // 【错误修正】这里之前错误地使用了 '/60s/'.length，已修正为 '/api/'.length
    strippedPath = path.substring('/api/'.length);
  }

  // 2. 如果成功匹配到一个前缀
  if (targetDomain) {
    const newPath = '/' + strippedPath;
    const targetUrl = new URL(newPath + url.search, `https://${targetDomain}`);
    const upstreamRequest = new Request(targetUrl, request);
    upstreamRequest.headers.set('Host', targetDomain);

    // ==================== 新增：失败重试逻辑 ====================
    const maxAttempts = 4; // 1次初始尝试 + 3次重试
    const retryDelayMs = 3000; // 3秒
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(upstreamRequest.clone()); // 使用 .clone() 以便在重试时可以复用请求体

        // 如果响应成功，或者是一个客户端错误(4xx)，则不重试，直接返回
        if (response.ok || response.status < 500) {
          return response;
        }
        
        // 如果是服务器端错误(5xx)，记录错误并准备重试
        lastError = new Error(`Attempt ${attempt} failed with status: ${response.status} ${response.statusText}`);

      } catch (error) {
        // 如果是网络错误等，记录错误并准备重试
        lastError = error;
      }

      // 如果不是最后一次尝试，则等待指定时间后再进行下一次循环
      if (attempt < maxAttempts) {
        await delay(retryDelayMs);
      }
    }
    
    // 如果所有尝试都失败了，返回一个 502 Bad Gateway 错误
    return new Response(`Proxy failed after ${maxAttempts} attempts. Last error: ${lastError.message}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain' },
    });
    // ==========================================================

  }

  // 3. 如果没有任何前缀匹配，返回 404 错误
  return new Response('Invalid path prefix. Use /gt/, /se/, /60s/, or /api/.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  });
}