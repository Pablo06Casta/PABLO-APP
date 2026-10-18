import type { Town } from "../types";
import municipalities from "./municipalities.json";
const featured: Town[] = [
  {
    id: "granada",
    name: "Granada",
    region: "Andalucía",
    lat: 37.1765,
    lng: -3.5983,
  },
  {
    id: "malaga",
    name: "Málaga",
    region: "Andalucía",
    lat: 36.7213,
    lng: -4.4214,
  },
  {
    id: "madrid",
    name: "Madrid",
    region: "Comunidad de Madrid",
    lat: 40.4168,
    lng: -3.7038,
  },
  {
    id: "valencia",
    name: "Valencia",
    region: "Comunidad Valenciana",
    lat: 39.4699,
    lng: -0.3763,
  },
  {
    id: "sevilla",
    name: "Sevilla",
    region: "Andalucía",
    lat: 37.3891,
    lng: -5.9845,
  },
  {
    id: "barcelona",
    name: "Barcelona",
    region: "Cataluña",
    lat: 41.3874,
    lng: 2.1686,
  },
  {
    id: "cadiz",
    name: "Cádiz",
    region: "Andalucía",
    lat: 36.5297,
    lng: -6.292,
  },
  {
    id: "cordoba",
    name: "Córdoba",
    region: "Andalucía",
    lat: 37.8882,
    lng: -4.7794,
  },
  {
    id: "ronda",
    name: "Ronda",
    region: "Málaga, Andalucía",
    lat: 36.7462,
    lng: -5.1612,
  },
  {
    id: "nerja",
    name: "Nerja",
    region: "Málaga, Andalucía",
    lat: 36.7452,
    lng: -3.8777,
  },
  {
    id: "frigiliana",
    name: "Frigiliana",
    region: "Málaga, Andalucía",
    lat: 36.7916,
    lng: -3.8947,
  },
  {
    id: "salamanca",
    name: "Salamanca",
    region: "Castilla y León",
    lat: 40.9701,
    lng: -5.6635,
  },
  {
    id: "toledo",
    name: "Toledo",
    region: "Castilla-La Mancha",
    lat: 39.8628,
    lng: -4.0273,
  },
  {
    id: "bilbao",
    name: "Bilbao",
    region: "País Vasco",
    lat: 43.263,
    lng: -2.935,
  },
  {
    id: "donostia",
    name: "San Sebastián",
    region: "País Vasco",
    lat: 43.3183,
    lng: -1.9812,
  },
  {
    id: "santiago",
    name: "Santiago de Compostela",
    region: "Galicia",
    lat: 42.8805,
    lng: -8.5457,
  },
  {
    id: "santander",
    name: "Santander",
    region: "Cantabria",
    lat: 43.4623,
    lng: -3.81,
  },
  {
    id: "oviedo",
    name: "Oviedo",
    region: "Asturias",
    lat: 43.3619,
    lng: -5.8494,
  },
  {
    id: "zaragoza",
    name: "Zaragoza",
    region: "Aragón",
    lat: 41.6488,
    lng: -0.8891,
  },
  {
    id: "palma",
    name: "Palma",
    region: "Illes Balears",
    lat: 39.5696,
    lng: 2.6502,
  },
  {
    id: "alicante",
    name: "Alicante",
    region: "Comunidad Valenciana",
    lat: 38.3452,
    lng: -0.481,
  },
  {
    id: "caceres",
    name: "Cáceres",
    region: "Extremadura",
    lat: 39.4753,
    lng: -6.3724,
  },
  {
    id: "cuenca",
    name: "Cuenca",
    region: "Castilla-La Mancha",
    lat: 40.0704,
    lng: -2.1374,
  },
  {
    id: "segovia",
    name: "Segovia",
    region: "Castilla y León",
    lat: 40.9429,
    lng: -4.1088,
  },
  {
    id: "laspalmas",
    name: "Las Palmas de Gran Canaria",
    region: "Canarias",
    lat: 28.1235,
    lng: -15.4363,
  },
  {
    id: "pamplona",
    name: "Pamplona",
    region: "Navarra",
    lat: 42.8125,
    lng: -1.6458,
  },
];
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const featuredNames = new Set(featured.map((town) => normalize(town.name)));
export const towns: Town[] = [
  ...featured,
  ...Object.entries(municipalities)
    .flatMap(([province, cities]) =>
      cities.map(([name, code, lat, lng]) => ({
        id: "ine-" + code,
        name: String(name),
        region: province,
        lat: Number(lat),
        lng: Number(lng),
        approximate: true,
      })),
    )
    .filter((town) => !featuredNames.has(normalize(town.name))),
];
const index = towns.map((town) => ({
  town,
  name: normalize(town.name),
  text: normalize(town.name + " " + town.region),
}));
export function localTowns(query: string) {
  const text = normalize(query);
  if (!text) return featured.slice(0, 5);
  return index
    .filter((item) => item.text.includes(text))
    .sort((a, b) => {
      const rank = (name: string) =>
        name === text ? 0 : name.startsWith(text) ? 1 : 2;
      return rank(a.name) - rank(b.name);
    })
    .slice(0, 6)
    .map((item) => item.town);
}
