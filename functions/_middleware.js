// functions/_middleware.js

export async function onRequest(context) {
  // 1. 获取原始的请求对象
  const { request } = context;
  const url = new URL(request.url);
  console.log(url);

  // 2. 定义我们的唯一目标域名
  const targetDomain = 'github.ctnis.com';

  // 3. 构建发往目标服务器的新 URL
  // 我们保留了原始请求的路径和查询参数
  const targetUrl = new URL(url.pathname + url.search, `https://${targetDomain}`);
  console.log(targetUrl);

  // 4. 创建一个新的请求对象，用于转发
  // 直接传入原始的 request 对象，可以高效地复制 method, body, headers 等
  const upstreamRequest = new Request(targetUrl, request);

  // 5. 关键一步：设置正确的 Host 请求头
  // 确保目标服务器（您的 Cloudflare Pages）收到它期望的 Host
  upstreamRequest.headers.set('Host', targetDomain);

  // 6. 发起代理请求，并直接返回响应
  // fetch() 会返回一个 Response 对象，我们可以直接将其返回给客户端
  // 无需再手动处理 body 和 headers，除非需要修改它们
  return fetch(upstreamRequest);
}