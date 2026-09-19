import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Provider } from "../../shared/types.ts";
import { COUNTRIES } from "../../shared/constants.ts";

function wrap(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildDirectoryPdf(providers: Provider[], title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.094, 0.165, 0.224);
  const muted = rgb(0.408, 0.482, 0.537);
  const teal = rgb(0.031, 0.494, 0.471);
  let page = pdf.addPage([595, 842]);
  let y = 800;

  const ensure = (needed: number) => {
    if (y - needed < 48) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  };

  page.drawText("Financial Navigator", { x: 48, y, size: 11, font: bold, color: teal });
  y -= 22;
  page.drawText(title, { x: 48, y, size: 18, font: bold, color: ink });
  y -= 18;
  page.drawText(`${providers.length} records · Netherlands, Germany and Nordics · not a live quote`, {
    x: 48,
    y,
    size: 9,
    font,
    color: muted,
  });
  y -= 28;

  for (const provider of providers) {
    const lending = provider.lending;
    const countries = COUNTRIES.filter((country) => provider.countries[country]).join(", ");
    const body = [
      provider.service || provider.countryFocus || "No description added.",
      `Upper age: ${provider.upperAgeStatus}`,
      countries ? `Markets: ${countries}` : "",
      lending ? `${lending.type} · ${lending.minimum || "Not verified"} · ${lending.security}` : "",
      provider.mining ? `${provider.mining.productType} · ${provider.mining.withdrawalRating.replace("_", " / ")} · ${provider.mining.payoutMethod}` : "",
    ].filter(Boolean);

    const lines = body.flatMap((line) => wrap(line, 88));
    ensure(36 + lines.length * 12);
    page.drawText(provider.name, { x: 48, y, size: 12, font: bold, color: ink });
    y -= 14;
    page.drawText(provider.category, { x: 48, y, size: 9, font, color: teal });
    y -= 14;
    for (const line of lines) {
      page.drawText(line, { x: 48, y, size: 9, font, color: muted });
      y -= 12;
    }
    y -= 10;
  }

  return pdf.save();
}

export async function inspectPdf(bytes: Uint8Array): Promise<{ pages: number; excerpt: string }> {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({ data: bytes });
    const doc = await task.promise;
    const first = await doc.getPage(1);
    const content = await first.getTextContent();
    const excerpt = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .slice(0, 280);
    const pages = doc.numPages;
    if ("destroy" in doc && typeof doc.destroy === "function") await doc.destroy();
    return { pages, excerpt };
  } catch {
    return { pages: 0, excerpt: "" };
  }
}

export async function buildDirectoryDocx(providers: Provider[], title: string): Promise<Buffer> {
  const header = new TableRow({
    children: ["Provider", "Category", "Markets", "Upper age", "Amount / note"].map(
      (label) =>
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        }),
    ),
  });

  const rows = providers.map(
    (provider) =>
      new TableRow({
        children: [
          provider.name,
          provider.category,
          COUNTRIES.filter((country) => provider.countries[country]).join(", "),
          provider.upperAgeStatus,
          provider.lending?.minimum || provider.service || provider.countryFocus || "",
        ].map(
          (value) =>
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              children: [new Paragraph(value)],
            }),
        ),
      }),
  );

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Financial Navigator", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${providers.length} records. Listed is not approval. Sources reviewed 18 September 2026.`,
                italics: true,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [header, ...rows],
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}
