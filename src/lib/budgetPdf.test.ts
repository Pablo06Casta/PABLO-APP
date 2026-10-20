import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultVenue, townForVenue } from "../data/venues";
import type { Search } from "../types";
import { downloadBudgetPdf, type BudgetPdfData } from "./budgetPdf";

const pdfCalls = vi.hoisted(() => ({ text: vi.fn(), save: vi.fn() }));

vi.mock("jspdf", () => ({
  jsPDF: class {
    addPage() {}
    getNumberOfPages() { return 1; }
    line() {}
    rect() {}
    save(name: string) { pdfCalls.save(name); }
    setDrawColor() {}
    setFillColor() {}
    setFont() {}
    setFontSize() {}
    setPage() {}
    setTextColor() {}
    splitTextToSize(value: string) { return [value]; }
    text(value: string, ...args: unknown[]) { pdfCalls.text(value, ...args); }
  },
}));

const search: Search = {
  town: townForVenue(defaultVenue),
  venue: defaultVenue,
  checkIn: "2026-11-10",
  checkOut: "2026-11-13",
  guests: 2,
};

describe("PDF del presupuesto", () => {
  beforeEach(() => {
    pdfCalls.text.mockClear();
    pdfCalls.save.mockClear();
  });

  it("incluye el nombre del equipo y lo utiliza en el archivo", async () => {
    const data: BudgetPdfData = {
      groupName: "Club Bádminton Tudela",
      destination: "Tudela de Duero",
      people: 2,
      names: ["Ana", "Luis"],
      entries: [],
      lodgingCents: 0,
      totalCents: 0,
      sharedCents: 0,
      individualTotals: [0, 0],
      contributions: [0, 0],
    };

    await downloadBudgetPdf(data, search);

    expect(pdfCalls.text.mock.calls.map(([text]) => text)).toContain(
      "Equipo o grupo: Club Bádminton Tudela",
    );
    expect(pdfCalls.save).toHaveBeenCalledWith(
      "presupuesto-cerca-club-badminton-tudela.pdf",
    );
  });
});
