import type { Search, Stay } from "../types";

// Planning assumptions, NOT a quote or a claim about a property's tariff.
// Unknown hotel room prices use the same category/city model, never a random
// amount or a value generated from the name/ID to suggest a cheapest property.
export function estimateStay(stay: Stay, search: Search) {
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(search.checkOut) - Date.parse(search.checkIn)) / 86400000,
    ),
  );
  const month = Number(search.checkIn.slice(5, 7));
  const city = search.town.name.toLocaleLowerCase("es");
  const cityFactor = /ibiza|eivissa/.test(city)
    ? 1.65
    : /madrid|barcelona/.test(city)
      ? 1.3
      : /santander|benalm|alicante|vitoria/.test(city)
        ? 1.1
        : 1;
  const season = month >= 6 && month <= 8 ? 1.2 : 1;
  const observed = Boolean(stay.observedNightly && stay.observedNightly > 0);
  const rooms = stay.platform === "Airbnb" ? 1 : Math.ceil(search.guests / 2);
  const base = observed
    ? stay.observedNightly!
    : stay.type === "Habitación"
      ? 50
      : stay.type === "Apartamento"
        ? 100
        : 75;
  const nightlyGroup = Math.round(
    base * rooms * (observed ? 1 : cityFactor) * season,
  );
  const perPersonNight = Math.round(nightlyGroup / search.guests);
  return {
    nightlyGroup,
    perPersonNight,
    totalGroup: nightlyGroup * days,
    rooms,
    low: Math.max(1, Math.round(perPersonNight * 0.7)),
    high: Math.round(perPersonNight * 1.4),
    source: observed ? ("historical" as const) : ("model" as const),
    explanation: observed
      ? `Referencia de Inside Airbnb del ${stay.observedAt}. Ajuste de verano ×${season}. No incluye cargos adicionales ni confirma disponibilidad.`
      : `Modelo propio de CERCA: ${base} € por habitación doble × factor de ciudad ${cityFactor} × temporada ${season} × ${rooms} habitación(es). No es una tarifa observada de este hotel. Extras e impuestos no confirmados.`,
  };
}
