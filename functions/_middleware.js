// functions/_middleware.js

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // ====================== 调试探针 ======================
  // 1. 我们添加一个特殊的路径 "/ping"。
  // 如果访问这个路径，函数必须返回 "Pong!"。
  // 这可以 100% 确认函数是否被平台执行了。
  if (url.pathname === '/ping') {
    return new Response('Pong! The EdgeOne function is running correctly.', { status: 200 });
  }
  // ======================================================

  // 2. 如果不是 /ping，则执行之前的代理逻辑
  // 我们在代理逻辑外层包裹一个 try...catch，以便捕获任何潜在的错误
  try {
    const targetDomain = 'github.ctnis.com';
    const targetUrl = new URL(url.pathname + url.search, `https://${targetDomain}`);
    const upstreamRequest = new Request(targetUrl, request);
    upstreamRequest.headers.set('Host', targetDomain);

    // 发起代理请求
    return await fetch(upstreamRequest);

  } catch (error) {
    // 3. 如果代理过程中出现任何错误，我们不再沉默地失败，
    // 而是将错误信息明确地返回给用户。
    return new Response(`An error occurred in the proxy function: ${error.message}`, { status: 502 });
  }
}