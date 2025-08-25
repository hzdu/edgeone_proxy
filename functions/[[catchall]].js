// functions/[[catchall]].js

export async function onRequest(context) {
  // 1. 获取原始的请求对象
  const { request } = context;
  const url = new URL(request.url);

  // 2. 定义我们的唯一目标域名
  const targetDomain = 'github.ctnis.com';

  // 3. 构建发往目标服务器的新 URL
  // 我们保留了原始请求的路径和查询参数
  const targetUrl = new URL(url.pathname + url.search, `https://${targetDomain}`);

  // 4. 创建一个新的请求对象，用于转发
  const upstreamRequest = new Request(targetUrl, request);

  // 5. 设置正确的 Host 请求头
  upstreamRequest.headers.set('Host', targetDomain);

  // 6. 发起代理请求，并直接返回响应
  return fetch(upstreamRequest);
}