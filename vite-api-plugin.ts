import type { Plugin, ViteDevServer } from 'vite'

// Mirrors Vercel's /api/*.ts serverless function convention so that
// `npm run dev` gives a fully working stack (frontend + Claude proxy
// endpoints) without needing the Vercel CLI. Each route is transpiled
// on the fly via Vite's SSR module loader and invoked the same way
// Vercel invokes a Node serverless function: (req, res) => void.
const ROUTES: Record<string, string> = {
  '/api/extract': '/api/extract.ts',
  '/api/generate-drill': '/api/generate-drill.ts',
  '/api/grade': '/api/grade.ts',
}

export default function apiDevPlugin(): Plugin {
  return {
    name: 'senpai-api-dev-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        const modulePath = url ? ROUTES[url] : undefined
        if (!modulePath) return next()
        try {
          const mod = await server.ssrLoadModule(modulePath)
          await mod.default(req, res)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[api-dev] ${url} failed:`, err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }))
        }
      })
    },
  }
}
