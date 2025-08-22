/**
 * pdfGenerator.js
 * 
 * Lógica para generar el PDF de la cotización utilizando jsPDF.
 */

const { jsPDF } = window.jspdf;

/**
 * Genera y descarga un PDF a partir de un elemento HTML.
 * @param {string} elementId - El ID del elemento HTML que contiene el preview.
 * @param {string} fileName - El nombre del archivo PDF a generar.
 */
export function generatePdfFromHtml(elementId, fileName = 'cotizacion.pdf') {
    const doc = new jsPDF();
    const source = document.getElementById(elementId);

    doc.html(source, {
        callback: (doc) => doc.save(fileName),
        x: 10,
        y: 10,
        width: 190,
        windowWidth: source.offsetWidth
    });
}
