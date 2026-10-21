import { describe, expect, it } from "vitest";
import { calculateCarTrip, passengerNames, paymentTotals } from "./teamUtilities";

describe("utilidades del equipo", () => {
  it("calcula combustible, peajes y reparto del viaje", () => {
    const result = calculateCarTrip({ distanceKm: "100", journeys: "2", consumption: "6,5", fuelPrice: "1,70", tolls: "10", people: "4" });
    expect(result.totalKm).toBe(200);
    expect(result.litres).toBe(13);
    expect(result.totalCost).toBeCloseTo(32.1);
    expect(result.perPerson).toBeCloseTo(8.025);
  });

  it("cuenta pasajeros escritos con comas y pagos pendientes", () => {
    expect(passengerNames("Ana, Luis,  Marta ")).toEqual(["Ana", "Luis", "Marta"]);
    expect(paymentTotals([
      { id: "1", name: "Ana", amount: "12,50", paid: true },
      { id: "2", name: "Luis", amount: "8", paid: false },
    ])).toEqual({ total: 20.5, paid: 12.5, pending: 8 });
  });
});
