// ============================================
// NATIVE DOWNLOAD ENGINE (Blob API, sin librerias externas)
// ============================================

/**
 * Crea un Blob, genera un object URL, fuerza el click en un <a> oculto
 * y luego limpia el DOM revocando la URL.
 */
export function triggerDownload(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapa parentesis y backslashes para incrustar texto en un PDF.
 */
function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Genera el contenido de un PDF minimo pero valido (1 pagina) con un titulo
 * y lineas de texto. Suficiente para que el navegador y los lectores lo abran.
 */
export function buildSimplePdf(title: string, lines: string[] = []): string {
  const textCommands: string[] = [
    "BT",
    "/F1 18 Tf",
    "50 760 Td",
    `(${escapePdfText(title)}) Tj`,
    "/F1 11 Tf",
    "0 -32 Td",
  ];
  lines.forEach((line) => {
    textCommands.push(`(${escapePdfText(line)}) Tj`);
    textCommands.push("0 -18 Td");
  });
  textCommands.push("ET");
  const stream = textCommands.join("\n");

  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;
}

/**
 * Genera y descarga un PDF simulado en una sola llamada.
 */
export function downloadSimplePdf(filename: string, title: string, lines: string[] = []) {
  triggerDownload(filename, buildSimplePdf(title, lines), "application/pdf");
}
