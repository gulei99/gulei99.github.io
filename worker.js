// 站点访问计数：/api/hit?p=<path> 计一次并返回该路径累计阅读量。
// 其余请求全部转给静态资源（assets binding）。
const TTL = 60 * 60 * 24 * 365 // KV 计数保留一年，访问会续期

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/hit') {
      if (request.method !== 'POST') {
        return new Response('method not allowed', { status: 405 })
      }
      const p = (url.searchParams.get('p') || '/').slice(0, 200)
      const key = '/' + p.replace(/^\/+/, '')
      const current = parseInt((await env.HITS.get(key)) || '0', 10)
      const views = Number.isFinite(current) ? current + 1 : 1
      await env.HITS.put(key, String(views), { expirationTtl: TTL })
      return new Response(JSON.stringify({ views }), {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
      })
    }

    return env.ASSETS.fetch(request)
  },
}
