// js/outputGenerator.js
// Lógica para generar PDF y preparar la impresión
const outputGenerator = (() => {

    function generatePdf(appState) {
        const { jsPDF } = window.jspdf;
        if (typeof jsPDF === 'undefined') {
            alert('Error: La librería jsPDF no está cargada.');
            return;
        }

        const doc = new jsPDF();

        // Título
        doc.setFontSize(22);
        doc.text("Cotización de Servicios", 105, 20, { align: "center" });

        // Información de la fecha
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });
        doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 105, 35, { align: "center" });

        // Tabla de trabajos
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
            headStyles: { fillColor: [22, 160, 133] },
            styles: { halign: 'center' },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(16);
        doc.text("TOTAL FINAL:", 150, finalY, { align: "right" });
        doc.text(`S/ ${appState.summary.totalFinal.toFixed(2)}`, 200, finalY, { align: "right" });

        // Notas
        if (appState.notas) {
            const splitNotes = doc.splitTextToSize(appState.notas, 180);
            doc.setFontSize(10);
            doc.text("Notas:", 14, finalY + 20);
            doc.text(splitNotes, 14, finalY + 25);
        }

        // Guardar el PDF
        doc.save(`Cotizacion_SISDOKE_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    function printThermal(appState) {
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            alert('No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de ventanas emergentes para este sitio y vuelve a intentarlo.');
            return;
        }
        
        const printStyles = `
            @media print {
                body > *:not(.print-container) {
                    display: none !important;
                }

                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    color: #000;
                    background-color: #fff;
                }

                .print-header { text-align: center; margin-bottom: 10px; }
                .print-header h1 { font-size: 14px; margin: 0; padding: 0; }
                .print-header p { font-size: 9px; margin: 2px 0; }

                .print-jobs-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .print-jobs-table th, .print-jobs-table td { padding: 2px 0; text-align: left; border-bottom: 1px dashed #000; }
                .print-jobs-table th { font-weight: bold; text-transform: uppercase; }
                .print-jobs-table td:nth-child(1) { width: 40%; } /* Desc */
                .print-jobs-table td:nth-child(2) { width: 25%; text-align: right; } /* P.Unit */
                .print-jobs-table td:nth-child(3) { width: 15%; text-align: center; } /* Cant */
                .print-jobs-table td:nth-child(4) { width: 20%; text-align: right; } /* Subtotal */


                .print-summary { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
                .print-summary .total-final { font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; padding-top: 5px; margin-top: 5px; }
                .print-summary .total-final span:first-child { font-weight: bold; }

                .print-notes { margin-top: 10px; font-size: 9px; text-align: center; }

                @page {
                    size: 80mm auto;
                    margin: 5mm;
                }
            }
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket de Cotización</title>
                <style>${printStyles}</style>
            </head>
            <body>
                <div class="print-container">
                    <div class="print-header">
                        <h1>COTIZACIÓN SISDOKE</h1>
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
                        <tbody>
                            ${appState.trabajos.map(job => `
                                <tr>
                                    <td>${job.descripcion ? job.descripcion.substring(0, 15) : '-'}</td>
                                    <td>S/ ${job.precioVentaUnitario.toFixed(2)}</td>
                                    <td>${job.cantidad}</td>
                                    <td>S/ ${job.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
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
                <script>
                    window.onload = function() {
                        setTimeout(function() { // Pequeño delay para asegurar renderizado
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }, 100);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    function printGeneric(appState) {
        // Eliminar iframes de impresiones anteriores si existen
        const oldIframe = document.getElementById('print-iframe');
        if (oldIframe) {
            oldIframe.remove();
        }

        // Crear el contenido HTML y los estilos (reutilizando la lógica de printThermal)
        const printStyles = `
            body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; }
            .print-header { text-align: center; margin-bottom: 10px; }
            .print-header h1 { font-size: 14px; margin: 0; }
            .print-header p { font-size: 9px; margin: 2px 0; }
            .print-jobs-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .print-jobs-table th, .print-jobs-table td { padding: 2px 0; text-align: left; border-bottom: 1px dashed #000; }
            .print-jobs-table th { font-weight: bold; text-transform: uppercase; }
            .print-jobs-table td:nth-child(1) { width: 40%; }
            .print-jobs-table td:nth-child(2) { width: 25%; text-align: right; }
            .print-jobs-table td:nth-child(3) { width: 15%; text-align: center; }
            .print-jobs-table td:nth-child(4) { width: 20%; text-align: right; }
            .print-summary { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .print-summary .total-final { font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; }
            .print-notes { margin-top: 10px; font-size: 9px; text-align: center; }
            @page { size: 80mm auto; margin: 5mm; }
        `;

        const printHtml = `
            <html>
            <head>
                <title>Ticket de Cotización</title>
                <style>${printStyles}</style>
            </head>
            <body>
                <div class="print-container">
                    <div class="print-header">
                        <h1>COTIZACIÓN SISDOKE</h1>
                        <p>Fecha: ${new Date().toLocaleDateString()}</p>
                        <p>Hora: ${new Date().toLocaleTimeString()}</p>
                        <p>--------------------------------</p>
                    </div>
                    <table class="print-jobs-table">
                        <thead>
                            <tr><th>Desc</th><th>P.Unit</th><th>Cant</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>
                            ${appState.trabajos.map(job => `
                                <tr>
                                    <td>${job.descripcion ? job.descripcion.substring(0, 15) : '-'}</td>
                                    <td>S/ ${job.precioVentaUnitario.toFixed(2)}</td>
                                    <td>${job.cantidad}</td>
                                    <td>S/ ${job.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
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

        // Crear y configurar el iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printHtml);
        iframeDoc.close();

        // Esperar a que el contenido del iframe cargue y luego imprimir
        iframe.onload = function() {
            setTimeout(function() {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Opcional: remover el iframe después de imprimir
                // El timeout aquí es para dar tiempo a que el diálogo de impresión se cierre.
                setTimeout(() => {
                    iframe.remove();
                }, 1000);

            }, 500); // Un timeout para asegurar que todo el contenido (especialmente imágenes si las hubiera) se renderice.
        };
    }

    return {
        generatePdf,
        printThermal,
        printGeneric
    };
})();