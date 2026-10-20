import assert from "node:assert/strict";
import { preview } from "vite";
const server = await preview({
  preview: { host: "127.0.0.1", port: 0, strictPort: true, open: false },
});
try {
  const address = server.httpServer.address();
  assert.ok(address && typeof address === "object");
  const response = await fetch(`http://127.0.0.1:${address.port}`, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<title>CERCA · Encuentra tu lugar<\/title>/);
  const root = new URL("./", response.url);
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
    (match) => match[1],
  );
  assert.ok(
    assets.some((asset) => asset.endsWith(".js")),
    "Debe haber JavaScript compilado",
  );
  assert.ok(
    assets.some((asset) => asset.endsWith(".css")),
    "Debe haber CSS compilado",
  );
  for (const asset of assets) {
    const result = await fetch(new URL(asset, root), {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(result.status, 200, asset);
    assert.match(
      result.headers.get("content-type") ?? "",
      asset.endsWith(".js") ? /javascript/ : /text\/css/,
    );
    assert.ok((await result.text()).length > 0);
  }
  const manifestResponse = await fetch(new URL("manifest.webmanifest", root));
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.short_name, "CERCA");
  assert.equal(manifest.display, "standalone");
  assert.ok(
    manifest.icons.some(
      (icon) => icon.sizes === "512x512" && icon.purpose === "maskable",
    ),
  );
  for (const icon of manifest.icons) {
    const result = await fetch(new URL(icon.src, root));
    assert.equal(result.status, 200);
    assert.match(result.headers.get("content-type") ?? "", /image\/png/);
    const bytes = new Uint8Array(await result.arrayBuffer());
    assert.deepEqual(
      Array.from(bytes.slice(0, 8)),
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
  }
  // La oferta ODbL debe servir las bases utilizadas, no el HTML de la SPA.
  for (const file of [
    "osm-stays.json",
    "curated-stays.json",
    "venue-markets.json",
    "granada-markets.json",
    "venues.json",
  ]) {
    const result = await fetch(new URL(`data/${file}`, root));
    assert.equal(result.status, 200, file);
    assert.match(result.headers.get("content-type") ?? "", /json/);
    const data = await result.json();
    assert.ok(
      Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0,
      file,
    );
  }
  const dataNotice = await fetch(new URL("data/README.md", root));
  assert.equal(dataNotice.status, 200);
  assert.match(await dataNotice.text(), /ODbL 1.0/);
  const sw = await fetch(new URL("sw.js", root));
  assert.equal(sw.status, 200);
  assert.ok((await sw.text()).length > 100);
  console.log(
    `Smoke OK: CERCA, ${assets.length} recursos, manifiesto PWA, iconos y service worker.`,
  );
} finally {
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}
