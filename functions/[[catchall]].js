// functions/[[catchall]].js

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  let targetDomain = null;
  let strippedPath = '';

  // 1. 根据路径前缀，选择目标域名并剥离前缀
  if (path.startsWith('/gt/')) {
    targetDomain = 'github.ctnis.com';
    // 截取 "/gt/" 后面的部分 (e.g., /gt/foo -> foo)
    strippedPath = path.substring('/gt/'.length); 
  } else if (path.startsWith('/se/')) {
    targetDomain = 'joyhubsetting.ctnis.com';
    // 截取 "/se/" 后面的部分
    strippedPath = path.substring('/se/'.length);
  } else if (path.startsWith('/60s/')) {
    targetDomain = '60s.ctnis.com';
    // 截取 "/60s/" 后面的部分
    strippedPath = path.substring('/60s/'.length);
  }

  // 2. 如果成功匹配到一个前缀
  if (targetDomain) {
    // 重新构建要转发的路径，确保以 "/" 开头
    const newPath = '/' + strippedPath;
    
    // 构建完整的上游 URL
    const targetUrl = new URL(newPath + url.search, `https://${targetDomain}`);

    // 创建代理请求
    const upstreamRequest = new Request(targetUrl, request);
    upstreamRequest.headers.set('Host', targetDomain);

    // 发起请求并返回响应
    return fetch(upstreamRequest);
  }

  // 3. 如果没有任何前缀匹配，返回 404 错误
  return new Response('Invalid path prefix. Use /gt/, /se/, or /60s/.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  });
}