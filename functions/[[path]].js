export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 设置 CORS (虽然同域不需要，但为了本地开发方便还是加上)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders });
  }

  // 2. 路由判断 (直接用 pathname)
  let targetUrl = '';
  if (url.pathname === '/upload') {
    targetUrl = 'https://api.coze.cn/v1/files/upload';
  } else if (url.pathname === '/chat') {
    targetUrl = 'https://api.coze.cn/v3/chat';
  } else if (url.pathname === '/retrieve') {
    targetUrl = `https://api.coze.cn/v3/chat/retrieve${url.search}`;
  } else if (url.pathname === '/message/list') {
    targetUrl = `https://api.coze.cn/v3/chat/message/list${url.search}`;
  } else {
    // 如果不是 API 请求，就放行，让 Pages 去加载 index.html
    return context.next();
  }

  // 3. 构造请求头 (带上 Token)
  const proxyHeaders = new Headers();
  // 注意：在 Pages 设置里，变量名我们会设为 COZE_API_KEY
  proxyHeaders.set('Authorization', `Bearer ${env.COZE_API_KEY}`);
  
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    proxyHeaders.set('Content-Type', contentType);
  } else {
    proxyHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: request.body 
    });

    const data = await response.arrayBuffer();
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
