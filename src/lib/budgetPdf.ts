import type { Search, Stay } from "../types";
import { budgetCategories, type CalculatedEntry } from "./detailedBudget";
import { nights } from "./search";

export type BudgetPdfData = {
  groupName: string;
  tournamentName?: string;
  season?: string;
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

type Align = "left" | "right" | "center";
type TableColumn = { title: string; width: number; align?: Align };
type TableCell = string | { text: string; bold?: boolean; color?: [number, number, number] };

async function buildBudgetPdf(data: BudgetPdfData, search: Search, stay?: Stay) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const left = 16;
  const right = 194;
  const contentWidth = right - left;
  const pageBottom = 277;
  const lineHeight = 3.6;
  let y = 18;

  const euro = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;
  const date = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return year && month && day ? `${day}/${month}/${year}` : iso;
  };
  const generatedAt = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date());
  const individualCents = data.individualTotals.reduce((sum, amount) => sum + amount, 0);
  const averageCents = data.people ? Math.round(data.totalCents / data.people) : 0;

  function pageHeader() {
    pdf.setFillColor(55, 105, 223);
    pdf.rect(0, 0, 210, 11, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CERCA · PRESUPUESTO DEL GRUPO", left, 7.2);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.groupName || data.destination, right, 7.2, { align: "right", maxWidth: 92 });
  }

  function newPage() {
    pdf.addPage();
    pageHeader();
    y = 19;
  }

  function ensure(height: number) {
    if (y + height > pageBottom) {
      newPage();
      return true;
    }
    return false;
  }

  function sectionTitle(title: string, subtitle = "") {
    const titleHeight = subtitle ? 20 : 15;
    // Reserva también espacio para la cabecera y la primera fila de la tabla.
    ensure(titleHeight + 17);
    pdf.setFillColor(237, 243, 255);
    pdf.rect(left, y, contentWidth, subtitle ? 16 : 11, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(32, 47, 73);
    pdf.text(title, left + 4, y + 7);
    if (subtitle) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(92, 105, 125);
      pdf.text(subtitle, left + 4, y + 12.2, { maxWidth: contentWidth - 8 });
    }
    y += subtitle ? 20 : 15;
  }

  function table(columns: TableColumn[], rows: TableCell[][]) {
    const headerHeight = 8;
    const paddingX = 2.5;
    const paddingY = 1.7;
    const drawHeader = () => {
      pdf.setFillColor(43, 57, 82);
      pdf.rect(left, y, contentWidth, headerHeight, "F");
      let x = left;
      columns.forEach((column) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(255, 255, 255);
        const textX = column.align === "right" ? x + column.width - paddingX : column.align === "center" ? x + column.width / 2 : x + paddingX;
        pdf.text(column.title, textX, y + 5.2, { align: column.align ?? "left", maxWidth: column.width - paddingX * 2 });
        x += column.width;
      });
      y += headerHeight;
    };

    ensure(headerHeight + 7);
    drawHeader();
    rows.forEach((row, rowIndex) => {
      const wrapped = row.map((cell, index) => {
        const text = typeof cell === "string" ? cell : cell.text;
        return pdf.splitTextToSize(text, columns[index].width - paddingX * 2) as string[];
      });
      const rowHeight = Math.max(7, Math.max(...wrapped.map((lines) => Math.max(1, lines.length))) * lineHeight + paddingY * 2);
      if (y + rowHeight > pageBottom) {
        newPage();
        drawHeader();
      }
      const fill = rowIndex % 2 ? [248, 250, 253] as const : [255, 255, 255] as const;
      pdf.setFillColor(fill[0], fill[1], fill[2]);
      pdf.rect(left, y, contentWidth, rowHeight, "F");
      let x = left;
      row.forEach((cell, index) => {
        const style = typeof cell === "string" ? undefined : cell;
        const column = columns[index];
        pdf.setFont("helvetica", style?.bold ? "bold" : "normal");
        pdf.setFontSize(8);
        const color = style?.color ?? [38, 47, 65] as [number, number, number];
        pdf.setTextColor(color[0], color[1], color[2]);
        const textX = column.align === "right" ? x + column.width - paddingX : column.align === "center" ? x + column.width / 2 : x + paddingX;
        pdf.text(wrapped[index], textX, y + paddingY + 2.7, { align: column.align ?? "left", maxWidth: column.width - paddingX * 2 });
        x += column.width;
      });
      pdf.setDrawColor(225, 230, 239);
      pdf.line(left, y + rowHeight, right, y + rowHeight);
      y += rowHeight;
    });
    y += 5;
  }

  function summaryBox(x: number, top: number, width: number, label: string, value: string, accent = false) {
    const fill = accent ? [55, 105, 223] as const : [245, 248, 253] as const;
    const labelColor = accent ? [225, 235, 255] as const : [92, 105, 125] as const;
    const valueColor = accent ? [255, 255, 255] as const : [32, 47, 73] as const;
    pdf.setFillColor(fill[0], fill[1], fill[2]);
    pdf.rect(x, top, width, 22, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    pdf.text(label, x + 4, top + 7);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    pdf.text(value, x + 4, top + 16);
  }

  pdf.setFillColor(55, 105, 223);
  pdf.rect(0, 0, 210, 46, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(21);
  pdf.text("Presupuesto del grupo", left, 21);
  pdf.setFontSize(10);
  pdf.text(data.groupName || "Equipo sin nombre", left, 31, { maxWidth: 128 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`Generado el ${generatedAt}`, right, 20, { align: "right" });
  pdf.text("CERCA · Planificación del viaje", right, 28, { align: "right" });
  y = 54;

  sectionTitle("Datos del viaje");
  const tripRows: TableCell[][] = [
    ["Equipo o grupo", data.groupName || "Sin indicar", "Destino", data.destination],
    ["Torneo", data.tournamentName?.trim() || "Sin indicar", "Temporada", data.season?.trim() || "Sin indicar"],
    ["Entrada", date(search.checkIn), "Salida", date(search.checkOut)],
    ["Duración", `${nights(search)} noches`, "Viajeros", String(data.people)],
    ["Pabellón", search.venue?.name || "Sin pabellón seleccionado", "Alojamiento", stay?.name || "Sin estimación de CERCA"],
  ];
  table(
    [
      { title: "DATO", width: 28 }, { title: "INFORMACIÓN", width: 61 },
      { title: "DATO", width: 28 }, { title: "INFORMACIÓN", width: 61 },
    ],
    tripRows.map((row) => row.map((cell, index) => index % 2 === 0 ? { text: String(cell), bold: true, color: [70, 85, 110] } : cell)),
  );

  ensure(29);
  const gap = 3;
  const boxWidth = (contentWidth - gap * 3) / 4;
  summaryBox(left, y, boxWidth, "TOTAL DEL GRUPO", euro(data.totalCents), true);
  summaryBox(left + boxWidth + gap, y, boxWidth, "GASTOS COMUNES", euro(data.sharedCents));
  summaryBox(left + (boxWidth + gap) * 2, y, boxWidth, "INDIVIDUALES", euro(individualCents));
  summaryBox(left + (boxWidth + gap) * 3, y, boxWidth, "MEDIA / PERSONA", euro(averageCents));
  y += 29;

  sectionTitle("Gastos del viaje", "Cada fila muestra el importe total que se incorpora al presupuesto.");
  const expenseRows: TableCell[][] = [];
  if (stay) {
    expenseRows.push([
      "Alojamiento",
      `${stay.name} · estimación CERCA para ${nights(search)} noches`,
      "Total de la estancia",
      { text: euro(data.lodgingCents), bold: true },
    ]);
  }
  for (const entry of data.entries) {
    const scope = entry.scope === "group"
      ? "Total del grupo"
      : entry.scope === "person"
        ? `Por persona · ${entry.amount.replace(".", ",")} EUR × ${data.people}`
        : entry.scope === "personDay"
          ? `Por persona/día · ${entry.amount.replace(".", ",")} EUR × ${data.people} × ${entry.days}`
          : "Importes distintos por viajero";
    expenseRows.push([entry.category, entry.concept, scope, { text: euro(entry.cents), bold: true }]);
  }
  if (!expenseRows.length) expenseRows.push(["—", "Sin gastos añadidos", "—", { text: euro(0), bold: true }]);
  table(
    [
      { title: "CATEGORÍA", width: 31 },
      { title: "CONCEPTO / DETALLE", width: 69 },
      { title: "REPARTO", width: 48 },
      { title: "TOTAL", width: 30, align: "right" },
    ],
    expenseRows,
  );

  const individualRows: TableCell[][] = [];
  data.entries.forEach((entry) => {
    if (entry.scope !== "individual") return;
    entry.individualCents?.forEach((cents, index) => {
      if (cents > 0) individualRows.push([entry.concept, data.names[index], { text: euro(cents), bold: true }]);
    });
  });
  if (individualRows.length) {
    sectionTitle("Detalle de gastos individuales");
    table(
      [
        { title: "CONCEPTO", width: 88 },
        { title: "VIAJERO", width: 55 },
        { title: "IMPORTE", width: 35, align: "right" },
      ],
      individualRows,
    );
  }

  sectionTitle("Totales por categoría");
  const categoryRows: TableCell[][] = budgetCategories.flatMap((category) => {
    const cents = data.entries
      .filter((entry) => entry.category === category)
      .reduce((sum, entry) => sum + entry.cents, 0) + (category === "Alojamiento" ? data.lodgingCents : 0);
    return cents > 0 ? [[category, { text: euro(cents), bold: true }] as TableCell[]] : [];
  });
  table(
    [{ title: "CATEGORÍA", width: 133 }, { title: "TOTAL", width: 45, align: "right" }],
    categoryRows.length ? categoryRows : [["Sin gastos", { text: euro(0), bold: true }]],
  );

  sectionTitle("Aportaciones por persona", "El total común se reparte por igual; los gastos individuales se suman únicamente a su viajero.");
  const contributionRows = data.names.map((name, index) => [
    name,
    euro(data.contributions[index] - data.individualTotals[index]),
    euro(data.individualTotals[index]),
    { text: euro(data.contributions[index]), bold: true, color: [55, 105, 223] as [number, number, number] },
  ] as TableCell[]);
  table(
    [
      { title: "VIAJERO", width: 70 },
      { title: "PARTE COMÚN", width: 36, align: "right" },
      { title: "INDIVIDUAL", width: 36, align: "right" },
      { title: "TOTAL", width: 36, align: "right" },
    ],
    contributionRows,
  );

  ensure(34);
  pdf.setFillColor(249, 250, 252);
  pdf.rect(left, y, contentWidth, 27, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(55, 67, 88);
  pdf.text("Antes de pagar o reservar", left + 4, y + 6.5);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(92, 105, 125);
  const notes = pdf.splitTextToSize(
    "Los gastos introducidos por el usuario no se verifican. Las estimaciones de CERCA no son reservas ni precios confirmados y pueden cambiar por disponibilidad, eventos, impuestos o cargos. Comprueba los importes finales con cada proveedor.",
    contentWidth - 8,
  ) as string[];
  pdf.text(notes, left + 4, y + 12);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(225, 230, 239);
    pdf.line(left, 284, right, 284);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(125, 136, 153);
    pdf.text("CERCA · Documento de planificación", left, 290);
    pdf.text(`Página ${page} de ${pages}`, right, 290, { align: "right" });
  }

  const filename = (data.groupName || data.destination)
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "viaje";
  return { pdf, filename: `presupuesto-cerca-${filename}.pdf` };
}

export async function downloadBudgetPdf(data: BudgetPdfData, search: Search, stay?: Stay) {
  const { pdf, filename } = await buildBudgetPdf(data, search, stay);
  pdf.save(filename);
}

export async function createBudgetPdfFile(data: BudgetPdfData, search: Search, stay?: Stay) {
  const { pdf, filename } = await buildBudgetPdf(data, search, stay);
  return new File([pdf.output("blob")], filename, { type: "application/pdf" });
}
