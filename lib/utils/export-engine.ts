/**
 * export-engine.ts — Motor Nativo de Exportacion para Sequency
 *
 * TRES estrategias confiables, sin librerias de terceros:
 *
 * 1. printAsPdf(htmlContent, title)
 *    Inyecta HTML en una ventana oculta y dispara window.print().
 *    El SO genera el PDF con su motor nativo — 100% legible garantizado.
 *
 * 2. downloadDoc(htmlContent, filename)
 *    Genera un Blob con MIME text/html y extension .doc.
 *    Word/LibreOffice reconoce el HTML y lo renderiza perfectamente.
 *
 * 3. downloadCsv(csvContent, filename)
 *    Genera un Blob text/csv;charset=utf-8; con BOM Unicode.
 *    Excel y Google Sheets lo abren sin corrupcion de tildes/ñ.
 */

// ---------------------------------------------------------------------------
// 1. PDF via window.print() — motor nativo del sistema operativo
// ---------------------------------------------------------------------------
export function printAsPdf(htmlContent: string, title = "Sequency — Documento"): void {
  const printWindow = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!printWindow) {
    // Si el navegador bloquea popups, fallback a iframe oculto
    _printViaIframe(htmlContent);
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      padding: 24mm 20mm;
    }
    pre {
      font-family: "Courier New", Courier, monospace;
      font-size: 9pt;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    h1, h2 { font-family: Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 4pt 6pt; font-size: 9pt; }
    th { background: #f0f0f0; font-weight: bold; }
    @page { margin: 20mm; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>${htmlContent}</body>
</html>`);
  printWindow.document.close();

  // Esperamos a que los recursos carguen antes de imprimir
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Cerramos la ventana despues de que el dialogo de impresion se haya abierto
    setTimeout(() => printWindow.close(), 800);
  };
}

/** Fallback: usa un iframe oculto cuando window.open() es bloqueado */
function _printViaIframe(htmlContent: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body { font-family: "Times New Roman", serif; font-size: 11pt; }
    pre { font-family: "Courier New", monospace; font-size: 9pt; white-space: pre-wrap; }
    @page { margin: 20mm; }
  </style></head><body>${htmlContent}</body></html>`);
  doc.close();

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => document.body.removeChild(iframe), 2000);
}

// ---------------------------------------------------------------------------
// 2. DOC via Blob HTML — Word/LibreOffice lo renderiza perfectamente
// ---------------------------------------------------------------------------
export function downloadDoc(htmlContent: string, filename: string): void {
  // Forzamos extension .doc (no .docx) para que el navegador no intente
  // parsear el binario OOXML — Word acepta HTML con este MIME sin problema.
  const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"
      lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="ProgId" content="Word.Document" />
  <meta name="Generator" content="Sequency Export Engine" />
  <title>${escapeHtml(filename)}</title>
  <style>
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      color: #000;
      margin: 2cm;
    }
    pre {
      font-family: "Courier New", monospace;
      font-size: 10pt;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    h1, h2, h3 { font-family: Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 4pt 6pt; font-size: 10pt; }
    th { background: #ddd; font-weight: bold; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

  _triggerBlobDownload(fullHtml, filename, "application/msword;charset=utf-8;");
}

// ---------------------------------------------------------------------------
// 3. CSV via Blob — compatible con Excel, Sheets, LibreOffice Calc
// ---------------------------------------------------------------------------
export function downloadCsv(csvContent: string, filename: string): void {
  // BOM UTF-8 garantiza que Excel reconozca las tildes y la ñ sin corrupcion
  const BOM = "\uFEFF";
  _triggerBlobDownload(BOM + csvContent, filename, "text/csv;charset=utf-8;");
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/** Wrapper unico para Blob + <a> oculto — un solo lugar para mantener */
function _triggerBlobDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Liberar memoria del objeto URL despues de un tick
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Convierte contenido de texto plano a HTML para impresion/word */
export function plainTextToHtml(text: string): string {
  return `<pre>${escapeHtml(text)}</pre>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
