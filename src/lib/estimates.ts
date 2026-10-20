import type { Search, Stay } from "../types";
import priceModel from "../data/real/price-model.json";

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
  const cityFactor = priceModel.cityFactors.find((rule) =>
    new RegExp(rule.pattern, "i").test(city)
  )?.factor ?? 1;
  const season = priceModel.summer.months.includes(month)
    ? priceModel.summer.factor
    : 1;
  const rooms = stay.platform === "Airbnb" ? 1 : Math.ceil(search.guests / 2);
  const base = priceModel.bases[stay.type];
  const nightlyGroup = Math.round(
    base * rooms * cityFactor * season,
  );
  const perPersonNight = Math.round(nightlyGroup / search.guests);
  return {
    nightlyGroup,
    perPersonNight,
    totalGroup: nightlyGroup * days,
    rooms,
    low: Math.max(1, Math.round(perPersonNight * priceModel.range.low)),
    high: Math.round(perPersonNight * priceModel.range.high),
    source: "model" as const,
    reviewedAt: priceModel.reviewedAt,
    explanation: `Modelo propio de CERCA: ${base} € por unidad de planificación × factor de ciudad ${cityFactor} × temporada ${season} × ${rooms} ${stay.platform === "Airbnb" ? "alojamiento(s)" : "habitación(es)"}. No es una tarifa observada de este alojamiento. Extras e impuestos no confirmados.`,
  };
}
