export const TEAM_UTILITIES_STORAGE_KEY = "cerca-team-utilities-v1";

export type TripCalculator = {
  distanceKm: string;
  journeys: string;
  consumption: string;
  fuelPrice: string;
  tolls: string;
  people: string;
};

export type TeamCar = {
  id: string;
  driver: string;
  passengerSeats: string;
  passengers: string;
  departure: string;
  time: string;
};

export type TeamPayment = {
  id: string;
  name: string;
  amount: string;
  paid: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export type TeamUtilitiesData = {
  trip: TripCalculator;
  cars: TeamCar[];
  payments: TeamPayment[];
  checklist: ChecklistItem[];
};

const checklistLabels = [
  "Raquetas",
  "Volantes",
  "Equipación y calzado",
  "Documentación e inscripción",
  "Agua y comida",
  "Botiquín básico",
];

export function initialTeamUtilities(people = 2): TeamUtilitiesData {
  return {
    trip: {
      distanceKm: "",
      journeys: "2",
      consumption: "",
      fuelPrice: "",
      tolls: "0",
      people: String(Math.max(1, people)),
    },
    cars: [],
    payments: [],
    checklist: checklistLabels.map((label, index) => ({
      id: `default-${index + 1}`,
      label,
      checked: false,
    })),
  };
}

function decimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateCarTrip(trip: TripCalculator) {
  const distanceKm = decimal(trip.distanceKm);
  const journeys = Math.max(1, Math.min(20, Math.trunc(decimal(trip.journeys)) || 1));
  const consumption = decimal(trip.consumption);
  const fuelPrice = decimal(trip.fuelPrice);
  const tolls = decimal(trip.tolls);
  const people = Math.max(1, Math.min(100, Math.trunc(decimal(trip.people)) || 1));
  const totalKm = distanceKm * journeys;
  const litres = (totalKm * consumption) / 100;
  const fuelCost = litres * fuelPrice;
  const totalCost = fuelCost + tolls;
  return { totalKm, litres, fuelCost, tolls, totalCost, people, perPerson: totalCost / people };
}

export function passengerNames(value: string) {
  return value.split(",").map((name) => name.trim()).filter(Boolean);
}

export function paymentTotals(payments: TeamPayment[]) {
  return payments.reduce(
    (totals, payment) => {
      const amount = decimal(payment.amount);
      totals.total += amount;
      if (payment.paid) totals.paid += amount;
      else totals.pending += amount;
      return totals;
    },
    { total: 0, paid: 0, pending: 0 },
  );
}

export function sanitizeTeamUtilities(value: TeamUtilitiesData): TeamUtilitiesData {
  const fallback = initialTeamUtilities();
  if (!value || typeof value !== "object") return fallback;
  return {
    trip: value.trip && typeof value.trip === "object"
      ? Object.fromEntries(Object.keys(fallback.trip).map((key) => [key, String(value.trip[key as keyof TripCalculator] ?? fallback.trip[key as keyof TripCalculator])])) as TripCalculator
      : fallback.trip,
    cars: Array.isArray(value.cars) ? value.cars.slice(0, 20).filter((car) => car && typeof car === "object").map((car, index) => ({
      id: String(car.id || `restored-car-${index}`), driver: String(car.driver ?? "").slice(0, 60), passengerSeats: String(car.passengerSeats ?? ""),
      passengers: String(car.passengers ?? "").slice(0, 500), departure: String(car.departure ?? "").slice(0, 100), time: String(car.time ?? "").slice(0, 5),
    })) : [],
    payments: Array.isArray(value.payments) ? value.payments.slice(0, 100).filter((payment) => payment && typeof payment === "object").map((payment, index) => ({
      id: String(payment.id || `restored-payment-${index}`), name: String(payment.name ?? "").slice(0, 60), amount: String(payment.amount ?? "").slice(0, 20), paid: payment.paid === true,
    })) : [],
    checklist: Array.isArray(value.checklist) ? value.checklist.slice(0, 100).filter((item) => item && typeof item === "object").map((item, index) => ({
      id: String(item.id || `restored-item-${index}`), label: String(item.label ?? "").slice(0, 100), checked: item.checked === true,
    })).filter((item) => item.label) : fallback.checklist,
  };
}
