import assert from 'node:assert/strict'
import { preview } from 'vite'

const server = await preview({
  preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false },
})

try {
  const address = server.httpServer.address()
  assert.ok(address && typeof address === 'object', 'El servidor debe tener un puerto asignado')
  const base = `http://127.0.0.1:${address.port}`
  const response = await fetch(base, { signal: AbortSignal.timeout(10000) })
  assert.equal(response.status, 200, 'La página debe responder con HTTP 200')
  const html = await response.text()
  assert.match(html, /<html lang="es">/)
  assert.match(html, /<title>PABLO APP<\/title>/)
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
  assert.ok(assets.some((asset) => asset.endsWith('.js')), 'Debe haber JavaScript compilado')
  assert.ok(assets.some((asset) => asset.endsWith('.css')), 'Debe haber CSS compilado')
  for (const asset of assets) {
    const result = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(10000) })
    assert.equal(result.status, 200, asset)
    assert.match(result.headers.get('content-type') ?? '', asset.endsWith('.js') ? /javascript/ : /text\/css/)
    assert.ok((await result.text()).length > 0, asset)
  }
  console.log(`Smoke OK: página en español y ${assets.length} recursos compilados accesibles.`)
} finally {
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve())
  })
}
