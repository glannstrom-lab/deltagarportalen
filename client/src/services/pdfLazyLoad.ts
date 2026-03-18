/**
 * Lazy-load PDF bibliotek för att minska initial bundle-storlek
 *
 * jspdf + html2canvas är ~300KB+ tillsammans
 * Genom att lazy-loada sparar vi detta från initial bundle
 */

// Cache för laddade moduler
let jsPDFModule: typeof import('jspdf') | null = null
let html2canvasModule: typeof import('html2canvas') | null = null

/**
 * Ladda jsPDF dynamiskt
 */
export async function loadJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf')
  }
  return jsPDFModule.default
}

/**
 * Ladda html2canvas dynamiskt
 */
export async function loadHtml2Canvas() {
  if (!html2canvasModule) {
    html2canvasModule = await import('html2canvas')
  }
  return html2canvasModule.default
}

/**
 * Ladda båda PDF-biblioteken parallellt
 */
export async function loadPDFLibraries() {
  const [jsPDF, html2canvas] = await Promise.all([
    loadJsPDF(),
    loadHtml2Canvas(),
  ])
  return { jsPDF, html2canvas }
}

/**
 * Ladda jsPDF med autoTable plugin
 */
export async function loadJsPDFWithAutoTable() {
  const [jsPDF, autoTable] = await Promise.all([
    loadJsPDF(),
    import('jspdf-autotable').then((m) => m.default),
  ])
  return { jsPDF, autoTable }
}

/**
 * Preload PDF-bibliotek (t.ex. vid hover på export-knapp)
 */
export function preloadPDFLibraries() {
  // Starta laddning i bakgrunden
  void loadPDFLibraries()
}
