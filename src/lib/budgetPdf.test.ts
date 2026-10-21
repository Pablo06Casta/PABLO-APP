import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultVenue, townForVenue } from "../data/venues";
import type { Search } from "../types";
import { createBudgetPdfFile, downloadBudgetPdf, type BudgetPdfData } from "./budgetPdf";

const pdfCalls = vi.hoisted(() => ({
  text: vi.fn(), save: vi.fn(), output: vi.fn(), rect: vi.fn(), addPage: vi.fn(), pages: 1,
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    addPage() { pdfCalls.pages += 1; pdfCalls.addPage(); }
    getNumberOfPages() { return pdfCalls.pages; }
    line() {}
    output() { pdfCalls.output(); return new Blob(["pdf"], { type: "application/pdf" }); }
    rect(...args: unknown[]) { pdfCalls.rect(...args); }
    save(name: string) { pdfCalls.save(name); }
    setDrawColor() {}
    setFillColor() {}
    setFont() {}
    setFontSize() {}
    setPage() {}
    setTextColor() {}
    splitTextToSize(value: string, width: number) {
      const characters = Math.max(8, Math.floor(width * 1.7));
      return value.match(new RegExp(`.{1,${characters}}(?:\\s|$)`, "g"))?.map((line) => line.trim()) ?? [value];
    }
    text(value: string | string[], ...args: unknown[]) { pdfCalls.text(value, ...args); }
  },
}));

const search: Search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2026-11-10",
  checkOut: "2026-11-13",
  guests: 2,
};

function textValues() {
  return pdfCalls.text.mock.calls.flatMap(([value]) => Array.isArray(value) ? value : [value]);
}

function exampleData(): BudgetPdfData {
  return {
    groupName: "Club Bádminton Tudela",
    tournamentName: "TOP TTR Tudela",
    season: "2026/27",
    destination: "Tudela de Duero",
    people: 2,
    names: ["Ana", "Luis"],
    entries: [
      { id: "1", category: "Gasolina", concept: "Depósito del viaje", amount: "40", scope: "group", days: "1", cents: 4000 },
      { id: "2", category: "Comida", concept: "Cena", amount: "", scope: "individual", days: "1", individualAmounts: ["12", "8"], individualCents: [1200, 800], cents: 2000 },
    ],
    lodgingCents: 0,
    totalCents: 6000,
    sharedCents: 4000,
    individualTotals: [1200, 800],
    contributions: [3200, 2800],
  };
}

describe("PDF del presupuesto", () => {
  beforeEach(() => {
    pdfCalls.text.mockClear();
    pdfCalls.save.mockClear();
    pdfCalls.output.mockClear();
    pdfCalls.rect.mockClear();
    pdfCalls.addPage.mockClear();
    pdfCalls.pages = 1;
  });

  it("crea tablas con todos los datos del viaje, gastos y aportaciones", async () => {
    const data = exampleData();
    await downloadBudgetPdf(data, search);
    const texts = textValues();

    expect(texts).toContain("Presupuesto del grupo");
    expect(texts).toContain("Club Bádminton Tudela");
    expect(texts).toContain("TOP TTR Tudela");
    expect(texts).toContain("2026/27");
    expect(texts).toContain("CATEGORÍA");
    expect(texts).toContain("CONCEPTO / DETALLE");
    expect(texts).toContain("Aportaciones por persona");
    expect(texts).toContain("Ana");
    expect(texts).toContain("Luis");
    expect(texts).toContain("12,00 EUR");
    expect(pdfCalls.rect.mock.calls.length).toBeGreaterThan(15);
    expect(pdfCalls.save).toHaveBeenCalledWith("presupuesto-cerca-club-badminton-tudela.pdf");

    const file = await createBudgetPdfFile(data, search);
    expect(file.name).toBe("presupuesto-cerca-club-badminton-tudela.pdf");
    expect(file.type).toBe("application/pdf");
    expect(pdfCalls.output).toHaveBeenCalled();
  });

  it("crea páginas adicionales y repite las cabeceras de las tablas", async () => {
    const data = exampleData();
    data.entries = Array.from({ length: 50 }, (_, index) => ({
      id: String(index),
      category: "Otros" as const,
      concept: `Gasto ${index + 1} con una explicación suficientemente larga para ocupar más de una línea en la tabla`,
      amount: "10",
      scope: "group" as const,
      days: "1",
      cents: 1000,
    }));
    data.sharedCents = 50000;
    data.totalCents = 50000;
    data.individualTotals = [0, 0];
    data.contributions = [25000, 25000];

    await downloadBudgetPdf(data, search);

    expect(pdfCalls.addPage).toHaveBeenCalled();
    expect(textValues().filter((text) => text === "CATEGORÍA").length).toBeGreaterThan(1);
    expect(textValues()).toContain(`Página ${pdfCalls.pages} de ${pdfCalls.pages}`);
  });
});
