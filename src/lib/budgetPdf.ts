import type { Search, Stay } from "../types";
import { budgetCategories, type CalculatedEntry } from "./detailedBudget";

type BudgetPdfData = {
  destination: string;
  people: number;
  names: string[];
  entries: CalculatedEntry[];
  lodgingCents: number;
  totalCents: number;
  sharedCents: number;
  individualTotals: number[];
  contributions: number[];
};

export async function downloadBudgetPdf(data: BudgetPdfData, search: Search, stay?: Stay) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const euro = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;
  let y = 18;
  function space(height: number) {
    if (y + height > 275) {
      pdf.addPage();
      y = 20;
    }
  }
  function heading(text: string) {
    space(15);
    pdf.setDrawColor(221, 228, 240);
    pdf.line(16, y, 194, y);
    y += 7;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(32, 47, 73);
    pdf.text(text, 16, y);
    y += 8;
  }
  function row(label: string, amount: number, detail = "") {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(label, 128) as string[];
    const height = Math.max(8, lines.length * 5 + (detail ? 4 : 0));
    space(height + 2);
    pdf.setTextColor(38, 47, 65);
    pdf.text(lines, 16, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(euro(amount), 194, y, { align: "right" });
    if (detail) {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(105, 117, 135);
      pdf.setFontSize(8);
      pdf.text(detail, 16, y + lines.length * 5);
    }
    y += height;
  }

  pdf.setFillColor(55, 105, 223);
  pdf.rect(0, 0, 210, 43, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("CERCA · Presupuesto del grupo", 16, 23);
  pdf.setFontSize(10);
  pdf.text(`Destino: ${data.destination}`, 16, 34, { maxWidth: 178 });
  y = 53;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(70, 80, 100);
  pdf.setFontSize(10);
  pdf.text(`${data.people} viajeros · ${search.checkIn} a ${search.checkOut}`, 16, y);
  y += 8;
  pdf.text("Gastos comunes repartidos por igual; importes individuales añadidos a cada viajero.", 16, y, { maxWidth: 178 });
  y += 8;

  heading("Gastos del viaje");
  if (stay) row(`Alojamiento CERCA: ${stay.name}`, data.lodgingCents, "Estimación para toda la estancia; no es una reserva ni un precio confirmado.");
  for (const entry of data.entries) {
    const scope = entry.scope === "group" ? "Importe total" : entry.scope === "person" ? "Por persona" : entry.scope === "personDay" ? `Por persona y día · ${entry.days} días` : "Importes individuales detallados a continuación";
    row(`${entry.category}: ${entry.concept}`, entry.cents, scope);
    if (entry.scope === "individual") entry.individualCents?.forEach((cents, index) => {
      if (cents > 0) row(`  ${data.names[index]}`, cents);
    });
  }
  if (!stay && !data.entries.length) row("Sin gastos añadidos", 0);
  heading("Totales por categoría");
  for (const category of budgetCategories) {
    const cents = data.entries.filter((entry) => entry.category === category).reduce((sum, entry) => sum + entry.cents, 0) + (category === "Alojamiento" ? data.lodgingCents : 0);
    if (cents > 0) row(category, cents);
  }
  heading("Resumen");
  row("Gastos comunes", data.sharedCents);
  if (data.individualTotals.some((amount) => amount > 0)) row("Gastos individuales", data.individualTotals.reduce((sum, amount) => sum + amount, 0));
  row("Total del grupo", data.totalCents);
  heading("Aportación de cada viajero");
  data.names.forEach((name, index) => row(name, data.contributions[index], `Individual: ${euro(data.individualTotals[index])}; resto: gastos comunes.`));
  space(16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(105, 117, 135);
  pdf.text("Los gastos introducidos por el usuario no se verifican. Los precios de CERCA son orientativos", 16, y);
  y += 4;
  pdf.text("y pueden cambiar por disponibilidad, eventos o festivos. Confirma cargos e impuestos.", 16, y);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(130, 140, 155);
    pdf.text(`Página ${page} de ${pages}`, 194, 290, { align: "right" });
  }
  const filename = data.destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "viaje";
  pdf.save(`presupuesto-cerca-${filename}.pdf`);
}
