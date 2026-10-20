import assert from "node:assert/strict";

const base = new URL(process.env.CERCA_LIVE_URL ?? "https://pablo06casta.github.io/PABLO-APP/");

async function request(path, kind = "text") {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const url = new URL(path, base);
      url.searchParams.set("health-check", Date.now().toString());
      const response = await fetch(url, {
        headers: { "cache-control": "no-cache" },
        signal: AbortSignal.timeout(15000),
      });
      assert.equal(response.status, 200, `${url.pathname}: HTTP ${response.status}`);
      return kind === "json" ? response.json() : response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

const html = await request("");
assert.match(html, /<html lang="es">/);
assert.match(html, /<title>CERCA · Encuentra tu lugar<\/title>/);
const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
  (match) => match[1],
);
assert.ok(assets.some((asset) => asset.endsWith(".js")), "Falta el JavaScript publicado");
assert.ok(assets.some((asset) => asset.endsWith(".css")), "Falta el CSS publicado");
await Promise.all(assets.slice(0, 4).map((asset) => request(asset)));

const manifest = await request("manifest.webmanifest", "json");
assert.equal(manifest.short_name, "CERCA");
assert.equal(manifest.display, "standalone");

const venues = await request("data/venues.json", "json");
assert.ok(Array.isArray(venues) && venues.length >= 24, "El catálogo de sedes está incompleto");
assert.ok(
  venues.some((venue) => venue.name === "Polideportivo San Roque"),
  "Falta el Polideportivo San Roque",
);
const priceModel = await request("data/price-model.json", "json");
assert.equal(priceModel.currency, "EUR");
assert.match(priceModel.source, /no contiene tarifas observadas/);
assert.match(priceModel.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);

const serviceWorker = await request("sw.js");
assert.ok(serviceWorker.length > 100, "El service worker publicado está vacío");

console.log(`Web pública OK: ${base.href} · ${assets.length} recursos · ${venues.length} sedes.`);
