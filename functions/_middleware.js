// functions/_middleware.js

export async function onRequest(context) {
  // 从上下文中解构出请求对象和 next 函数
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  let upstreamUrl;

  // 1. 根据路径前缀选择上游目标
  if (path.startsWith('/api/')) {
    // 截取 /api/ 后面的路径，拼接到 GitHub API 域名上
    upstreamUrl = new URL(path.substring(5), 'https://api.github.com');
  } else if (path.startsWith('/raw/')) {
    upstreamUrl = new URL(path.substring(5), 'https://raw.githubusercontent.com');
  } else if (path.startsWith('/archive/')) {
    upstreamUrl = new URL(path.substring(9), 'https://github.com');
  } else {
    // 如果没有任何规则匹配，则不处理，继续执行或让其他规则处理
    // 在这里我们可以选择返回一个提示信息
    return new Response('Invalid path. Use /api/, /raw/, or /archive/ prefix.', { status: 400 });
  }

  // 2. 将原始请求的查询参数（?后面的部分）附加到新的 URL 上
  upstreamUrl.search = url.search;

  // 3. 创建一个新的请求，发往上游目标
  // 复制原始请求的方法、头部和body
  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow', // 自动处理重定向
  });

  // 设置正确的 Host 请求头，这对于很多服务器是必需的
  upstreamRequest.headers.set('Host', upstreamUrl.hostname);
  // 添加一个自定义的 User-Agent
  upstreamRequest.headers.set('User-Agent', 'EdgeOne-Proxy-Worker');

  // 4. 发起请求并获取响应
  const response = await fetch(upstreamRequest);

  // 5. 创建一个新的、可修改的响应头
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', '*'); // 允许所有头部

  // 6. 将上游的响应返回给客户端，并附上新的响应头
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}