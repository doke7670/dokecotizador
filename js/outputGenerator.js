// js/outputGenerator.js
// Lógica para generar PDF y preparar la impresión
const outputGenerator = (() => {

    /**
     * Genera el contenido HTML para la impresión.
     * @param {object} appState - El estado actual de la aplicación.
     * @param {string} title - Título del documento.
     * @param {string} styles - Estilos CSS para la impresión.
     * @returns {string} - El contenido HTML completo.
     */
    function _getPrintContent(appState, title, styles) {
        const jobsHtml = appState.trabajos.map(job => `
            <tr>
                <td>${job.descripcion ? job.descripcion.substring(0, 15) : '-'}</td>
                <td>S/ ${job.precioVentaUnitario.toFixed(2)}</td>
                <td>${job.cantidad}</td>
                <td>S/ ${job.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="print-container">
                    <div class="print-header">
                        <h1>${title}</h1>
                        <p>Fecha: ${new Date().toLocaleDateString()}</p>
                        <p>Hora: ${new Date().toLocaleTimeString()}</p>
                        <p>--------------------------------</p>
                    </div>

                    <table class="print-jobs-table">
                        <thead>
                            <tr>
                                <th>Desc</th>
                                <th>P.Unit</th>
                                <th>Cant</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${jobsHtml}</tbody>
                    </table>
                    <p>--------------------------------</p>

                    <div class="print-summary">
                        <p class="total-final"><span>TOTAL FINAL:</span><span>S/ ${appState.summary.totalFinal.toFixed(2)}</span></p>
                    </div>

                    ${appState.notas ? `<div class="print-notes"><p>${appState.notas}</p></div>` : ''}
                    
                    <div class="print-footer">
                        <p>--------------------------------</p>
                        <p>¡Gracias por tu preferencia!</p>
                        <p>--------------------------------</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Función genérica para abrir una ventana de impresión.
     * @param {string} content - El contenido HTML a imprimir.
     */
    function _printWithNewWindow(content) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de ventanas emergentes.');
            return;
        }

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();

        // Usar un pequeño timeout para dar tiempo al navegador a renderizar el contenido
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    function generatePdf(appState) {
        // Verificación profesional de la existencia de las librerías
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('Error: La librería jsPDF no está cargada correctamente.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        if (typeof doc.autoTable !== 'function') {
            alert('Error: El plugin jsPDF-AutoTable no está cargado correctamente.');
            return;
        }

        doc.setFontSize(22);
        doc.text("Cotización de Servicios", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });

        const head = [['Descripción', 'P. Unit. (S/)', 'Cant.', 'Subtotal (S/)']];
        const body = appState.trabajos.map(job => [
            job.descripcion || '-',
            job.precioVentaUnitario.toFixed(2),
            job.cantidad,
            job.subtotal.toFixed(2)
        ]);

        doc.autoTable({
            startY: 45,
            head: head,
            body: body,
            headStyles: { fillColor: [34, 40, 49] }, // Color oscuro para consistencia
            styles: { halign: 'center' },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(16);
        doc.text("TOTAL FINAL:", 150, finalY, { align: "right" });
        doc.text(`S/ ${appState.summary.totalFinal.toFixed(2)}`, 200, finalY, { align: "right" });

        if (appState.notas) {
            const splitNotes = doc.splitTextToSize(appState.notas, 180);
            doc.setFontSize(10);
            doc.text("Notas:", 14, finalY + 20);
            doc.text(splitNotes, 14, finalY + 25);
        }

        doc.save(`Cotizacion_SISDOKE_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    function printThermal(appState) {
        const printStyles = `
            body { margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 10px; color: #000; background-color: #fff; }
            .print-header { text-align: center; margin-bottom: 10px; }
            h1 { font-size: 14px; margin: 0; padding: 0; }
            p { margin: 2px 0; }
            .print-jobs-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { padding: 2px 0; text-align: left; border-bottom: 1px dashed #000; }
            th { font-weight: bold; text-transform: uppercase; }
            td:nth-child(2), td:nth-child(4) { text-align: right; }
            td:nth-child(3) { text-align: center; }
            .print-summary { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .total-final { font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; padding-top: 5px; margin-top: 5px; }
            .print-notes { margin-top: 10px; font-size: 9px; text-align: center; }
            @page { size: 80mm auto; margin: 5mm; }
        `;
        const content = _getPrintContent(appState, 'COTIZACIÓN SISDOKE', printStyles);
        _printWithNewWindow(content);
    }

    function printGeneric(appState) {
        const printStyles = `
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
            .print-header { text-align: center; margin-bottom: 20px; }
            h1 { font-size: 20px; margin: 0; }
            p { margin: 3px 0; }
            .print-jobs-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
            td:nth-child(2), td:nth-child(4) { text-align: right; }
            td:nth-child(3) { text-align: center; }
            .print-summary { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; text-align: right; }
            .total-final { font-size: 16px; font-weight: bold; }
            .print-notes { margin-top: 20px; font-size: 11px; }
            @page { size: A4; margin: 20mm; }
        `;
        const content = _getPrintContent(appState, 'Cotización de Servicios', printStyles);
        _printWithNewWindow(content);
    }

    return {
        generatePdf,
        printThermal,
        printGeneric
    };
})();