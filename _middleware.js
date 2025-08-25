// functions/_middleware.js

// 注意：在使用了 edgeone.json 的情况下，这个函数可能不是必需的。
// 除非你有配置文件无法完成的动态逻辑。
export async function onRequest(context) {
  // context 对象包含了 request, env, next 等属性
  const { request, next } = context;

  // 调用 next() 将执行 edgeone.json 中定义的重写和头规则
  const response = await next();

  // 如果需要，可以在这里对响应进行二次处理
  // 例如，添加一个额外的自定义响应头
  response.headers.set('X-Powered-By', 'EdgeOne-Pages');

  return response;
}