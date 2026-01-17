// js/outputGenerator.js
// Lógica para generar PDF y preparar la impresión
const outputGenerator = (() => {
    // Logo en base64 (SVG embebido)
    const logoBase64 = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAyMDAxMDkwNC8vRU4iCiAiaHR0cDovL3d3dy53My5vcmcvVFIvMjAwMS9SRUMtU1ZHLTIwMDEwOTA0L0RURC9zdmcxMC5kdGQiPgo8c3ZnIHZlcnNpb249IjEuMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogd2lkdGg9IjIyMzQuMDAwMDAwcHQiIGhlaWdodD0iNzAwLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgMjIzNCA3MDAiCiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0Ij4KCjwhLS0gTcOhcyBlc3BhY2lvIGFycmliYSB5IGFiYWpvIGNvbiBudWV2byB2aWV3Qm94IC0tPgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw2NDAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMTExMSA1Nzc4IGMtNDA5IC00IC03NDYgLTEwIC03NDggLTEyIC0yIC0yIDE5MSAtMjg4IDQyOSAtNjM1IGw0MzMKLTYzMiAxMDY1IDYgYzE1NzcgMTAgMTY4NiAyIDE5NDIgLTE1MSA5NSAtNTcgMjU0IC0yMDggMzE1IC0yOTkgMTQ0IC0yMTUgMjEzCi00NDggMjEzIC03MTggMCAtMzIxIC04MSAtNTQ1IC0yODQgLTc4OSAtMTA4IC0xMzAgLTI0NiAtMjI3IC00MDAgLTI3OSAtMTQ1Ci01MCAtMjYxIC02MSAtNzExIC02OCAtNTAzIC04IC00NDkgOSAtNjM4IC0xOTkgLTczIC04MSAtMTg5IC0yMDUgLTI1OCAtMjc3Ci03MCAtNzEgLTI2NiAtMjc4IC00MzcgLTQ2MCAtMjkxIC0zMDggLTMxMCAtMzMwIC0yODkgLTM0MCAzNSAtMTYgMTg4NSAtMTMgMjA2NyAzIDQyNiAzOCA2NjAgMTA4IDk2OSAyOTEgMzkwIDIzMSA2ODkgNTUzIDg5NyA5NjcgMjgwIDU1OCAzNDUgMTE4OCAxODggMTgyNCAtMTQ5IDYwNCAtNTA0IDExMDEgLTEwMTQgMTQyMCAtMjY1IDE2NiAtNjI0IDI5MSAtOTQ5IDMzMCAtMjM3IDI4IC0xMzExIDM1IC0yNzkwIDE4eiIvPgo8cGF0aCBkPSJNODUzNSA1NTkzIGMtMzQ4IC0yOSAtNjE4IC05OSAtODkwIC0yMzIgLTIyNSAtMTEwIC0zNzMgLTIxNyAtNTU4Ci0zOTkgLTMzMyAtMzI5IC01NDEgLTc0NSAtNjIyIC0xMjQ3IC0yNiAtMTU1IC0zMSAtNTI5IC0xMSAtNjg1IDM1IC0yNjcgMTAyCi00OTIgMjExIC03MTUgMjIzIC00NTQgNjM2IC04NzEgMTA5MSAtMTA5OCA1MjkgLTI2NCAxMTkzIC0zMDkgMTc2NiAtMTIwIDczNiAyNDMgMTMzMSA5MTAgMTQ4MiAxNjYzIDM4IDE4NyA0OSAzMzkgNDMgNTU1IC0xMSAzNjMgLTc5IDY0OSAtMjI3IDk1MCAtMjYyIDUzNCAtNzU4IDk4NyAtMTMwNCAxMTkwIC0yOTQgMTA5IC02NzkgMTYzIC05ODEgMTM4eiIgbTM0NSAtMTMyOCBjIDIwNiAtMzEgMzc0IC0xMTQgNTMwIC0yNjIgMjI3IC0yMTQgMzMwIC00NjggMzE3IC03ODAgLTggLTE5NiAtNTQgLTM0MCAtMTU4IC00OTUgLTY1IC05OCAtMjExIC0yMzUgLTMxNCAtMjk2IC0yNTkgLTE1MyAtNjAzIC0xNzMgLTg4NyAtNTIgLTE0OSA2MyAtMzIwIDIwMiAtNDI2IDM0NSAtMjA0IDI3NSAtMjQ1IDY3NiAtMTAyIDk5MSA2NCAxNDEgMjE2IDMxNyAzNTMgNDA3IDE5OSAxMzIgNDM1IDE4MSA2ODcgMTQyeiIvPgo8cGF0aCBkPSJNMTE2NDIgNTU3MCBjLTM3IC05IC03NyAtNDIgLTk4IC04MSAtMTEgLTIyIC0xNSAtNDAwIC0yNCAtMjIyNCAtMTAgLTIxMjMgLTEwIC0yMTk4IDggLTIyMjkgMTAgLTE3IDMzIC00MSA1MiAtNTMgbDMzIC0yMyA1NTYgMCBjNTMzIDAgNTU3IDEgNTg4IDIwIDcxIDQzIDY3IDkgNzMgNjY1IDYgNjY0IDEgNjMwIDgzIDY3NSA1MCAyOCAxMTYgMjMgMTU0IC0xMSAxNCAtMTMgMjU5IC0zMTcgNTQ0IC02NzUgMzQ3IC00MzYgNTI4IC02NTUgNTQ2IC02NjMgMjEgLTggMjEyIC0xMSA3MDggLTkgbDY4MCAzIDMyIDIzIGM0NCAzMiA3MCAxMDAgNTUgMTUwIC04IDI1IC0yMzQgMzEwIC03MTMgODk3IC0zODYgNDczIC03NTggOTI5IC04MjcgMTAxNCAtMTIwIDE0NiAtMTI2IDE1NiAtMTMwIDIwNiAtMiAyOSAwIDYxIDYgNzEgNSAxMCAzODYgNDc1IDg0NiAxMDMzIDYxNyA3NDggODM3IDEwMjMgODQyIDEwNDcgMTQgNzUgLTMwIDE0MyAtMTA0IDE2MyAtMjkgOCAtMjM3IDExIC03MDEgOSAtNjUwIC0zIC02NjAgLTMgLTY4OCAtMjQgLTE1IC0xMSAtMjYzIC0zMTMgLTU1MCAtNjcwIC0yODcgLTM1NyAtNTM2IC02NTkgLTU1NCAtNjcxIC02MCAtNDMgLTE1MyAtMjIgLTE5NiA0NCAtMTcgMjYgLTE4IDYyIC0xNSA2MTggMyA1NjkgMyA1OTEgLTE2IDYyNSAtMTEgMTkgLTM1IDQ0IC01MyA1NSAtMzMgMTkgLTU0IDIwIC01NjkgMjIgLTI5NCAxIC01NTAgLTIgLTU2OCAtN3oiLz4KPHBhdGggZD0iTTE2MjQ3IDU1NjYgYy00NyAtMTcgLTY0IC0zMSAtODUgLTcwIC0xNSAtMjggLTE3IC0yMTcgLTI1IC0yMjMzIC05IC0yMTQxIC05IC0yMjAzIDkgLTIyMzQgMTEgLTE3IDM1IC00MCA1NCAtNTAgMzMgLTE4IDkyIC0xOSAxNjA2IC0xOSBsMTU3MSAwIDM0IDIzIGMyOSAxOSA3NCAxMDEgMzA4IDU2MiAyOTYgNTgzIDMwMiA1OTggMjYyIDY2MiAtMTEgMTggLTMyIDQwIC00OCA1MCAtMjYgMTcgLTkyIDE4IC0xMjE0IDIzIGwtMTE4OCA1IC0zMSAzMCBjLTc1IDcyIC01OCAyMDUgMzMgMjQ4IDMxIDE1IDg2IDE3IDQ5NSAxNyAzMDIgMCA0NzAgNCA0ODkgMTEgMTUgNiAzOSAyMCA1MiAzMiAxMyAxMiAxNDcgMjY5IDI5OCA1NzEgMjM3IDQ3NiAyNzMgNTUzIDI2OCA1ODAgLTExIDUwIC0zOCA5MCAtNzUgMTA4IC0zMiAxNyAtOTAgMTggLTc2NSAxOCAtNjg4IDAgLTczMiAxIC03NjQgMTggLTUwIDI3IC03MSA3MyAtNzEgMTU1IDAgODQgMTkgMTI5IDY5IDE1OSBsMzYgMjMgOTIwIDUgYzg0OCA1IDkyMyA2IDk0NyAyMiAxOSAxMyAxMDIgMTY2IDMwNCA1NjUgMjM2IDQ2NiAyNzcgNTU0IDI3NyA1OTEgMCA0NiAtMjAgODEgLTY3IDExNiBsLTI3IDIxIC0xODE3IDIgYy0xNTAzIDIgLTE4MjMgMCAtMTg1NSAtMTF6Ii8+CjxwYXRoIGQ9Ik0yMDkzMCA1MDM1IGwwIC01MzUgMTMwIC0xMDkwIGM3MiAtNTk5IDEzMCAtMTA5MSAxMzAgLTEwOTQgMCAtMyAxOTYgLTYgNDM1IC02IGw0MzQgMCA1IDMzIGMzIDE3IDY0IDUwNiAxMzYgMTA4NSBsMTMwIDEwNTMgMCA1NDUgMCA1NDQgLTcwMCAwIC03MDAgMCAwIC01MzV6Ii8+CjwhLS0gVHLDoW5ndWxvIG5hcmFuamEgLSBTSUVNUFJFIE5BUkFOSkEgLS0+CjxwYXRoIGQ9Ik01ODIgMjIyMSBsLTEwMyAtNiAxOTEgLTI3NyBsMTkwIC0yNzggLTM4NCAtNzQyIGMtMjExIC00MDkgLTQwMgotNzgxIC00MjUgLTgyNyBsLTQyIC04MyAxMzggNCBjMTAzIDMgMTQ2IDggMTY5IDIxIDE4IDkgODEgNzIgMTQyIDE0MCA2MCA2OAo1MDcgNTQ2IDk5MiAxMDYzIDQ4NiA1MTYgODk0IDk1MSA5MDggOTY3IGwyNiAyNyAtODUwIC0yIGMtNDY3IC0xIC04OTUgLTQgLTk1MiAtN3oiIGZpbGw9IiNGRjY2MDAiLz4KPHBhdGggZD0iTTIwOTcwIDE0MDAgbDAgLTU4MCA2NjAgMCA2NjAgMCAwIDU4MCAwIDU4MCAtNjYwIDAgLTY2MCAwIDAgLTU4MHoiLz4KPC9nPgo8L3N2Zz4=';

    /**
     * Crea el HTML del template con datos inyectados
     */
    function _createTemplateHTML(appState) {
        const jobsHtml = appState.trabajos.map(job => `
            <tr>
                <td>${job.descripcion || '-'}</td>
                <td class="text-center">${job.medidas.area.toFixed(2)}</td>
                <td class="text-right">S/ ${job.precioVentaUnitario.toFixed(2)}</td>
                <td class="text-center">${job.cantidad}</td>
                <td class="text-right">S/ ${job.subtotal.toFixed(2)}</td>
            </tr>
        `).join('');
        
        const notesHtml = appState.notas ? `
            <div class="proforma-notes">
                <div class="proforma-notes-title">Notas:</div>
                <div>${appState.notas}</div>
            </div>
        ` : '';
        
        // Datos del cliente
        const clientDataHtml = (appState.clientData && (appState.clientData.nombre || appState.clientData.telefono || appState.clientData.email)) ? `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <div style="font-weight: bold; margin-bottom: 10px;">Datos del Cliente:</div>
                ${appState.clientData.nombre ? `<p style="margin: 3px 0;"><strong>Nombre:</strong> ${appState.clientData.nombre}</p>` : ''}
                ${appState.clientData.telefono ? `<p style="margin: 3px 0;"><strong>Teléfono:</strong> ${appState.clientData.telefono}</p>` : ''}
                ${appState.clientData.email ? `<p style="margin: 3px 0;"><strong>Email:</strong> ${appState.clientData.email}</p>` : ''}
                ${appState.clientData.direccion ? `<p style="margin: 3px 0;"><strong>Dirección:</strong> ${appState.clientData.direccion}</p>` : ''}
                ${appState.clientData.ruc ? `<p style="margin: 3px 0;"><strong>RUC/DNI:</strong> ${appState.clientData.ruc}</p>` : ''}
            </div>
        ` : '';
        
        const now = new Date();
        
        return `
            <div class="proforma-container">
                <div class="proforma-header">
                    <div class="logo-section">
                        <img src="${logoBase64}" alt="Logo Empresa" style="max-width: 120px; height: auto;">
                    </div>
                    <div class="title-section">
                        <h1 style="font-size: 32px; color: #FF6600; margin-bottom: 5px;">PROFORMA</h1>
                        <p style="font-size: 12px; color: #666;">Cotización de Servicios</p>
                    </div>
                    <div class="info-section">
                        <p><span style="font-weight: bold;">Fecha:</span> ${now.toLocaleDateString()}</p>
                        <p><span style="font-weight: bold;">Hora:</span> ${now.toLocaleTimeString()}</p>
                    </div>
                </div>
                
                ${clientDataHtml}
                
                <div class="proforma-content">
                    <table class="proforma-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead style="background-color: #222; color: #fff;">
                            <tr>
                                <th style="padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd;">Descripción</th>
                                <th style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #ddd;">Área (m²)</th>
                                <th style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #ddd;">P. Unitario (S/)</th>
                                <th style="padding: 12px; text-align: center; font-weight: bold; border: 1px solid #ddd;">Cantidad</th>
                                <th style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Subtotal (S/)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${jobsHtml}
                        </tbody>
                    </table>
                </div>
                
                <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                    <div style="width: 300px; border: 2px solid #FF6600; border-radius: 5px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                            <span>Subtotal:</span>
                            <span>S/ ${appState.summary.totalFinal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 2px solid #FF6600; padding-top: 10px; font-size: 18px; font-weight: bold; color: #FF6600;">
                            <span>TOTAL FINAL:</span>
                            <span>S/ ${appState.summary.totalFinal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                ${notesHtml}
                
                <div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 11px; color: #666;">
                    <p style="margin: 3px 0;">________________________________</p>
                    <p style="margin: 3px 0;">¡Gracias por tu preferencia!</p>
                    <p style="margin: 3px 0;">________________________________</p>
                </div>
            </div>
        `;
    }

    function generatePdf(appState) {
        // Verificación de librerías
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

        let currentY = 15;

        // Título y fecha
        doc.setFontSize(16);
        doc.text("DOKE", 105, currentY, { align: "center" });
        currentY += 7;
        doc.setFontSize(11);
        doc.text("Car Wrap Films", 105, currentY, { align: "center" });
        currentY += 7;
        doc.setFontSize(24);
        doc.text("PROFORMA", 105, currentY, { align: "center" });
        currentY += 10;
        doc.setFontSize(11);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, currentY, { align: "center" });
        currentY += 8;

        // Datos del cliente si existen
        if (appState.clientData && (appState.clientData.nombre || appState.clientData.telefono || appState.clientData.email || appState.clientData.direccion || appState.clientData.ruc)) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("Datos del Cliente:", 15, currentY);
            currentY += 5;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            if (appState.clientData.nombre) {
                doc.text(`Nombre: ${appState.clientData.nombre}`, 15, currentY);
                currentY += 4;
            }
            if (appState.clientData.telefono) {
                doc.text(`Teléfono: ${appState.clientData.telefono}`, 15, currentY);
                currentY += 4;
            }
            if (appState.clientData.email) {
                doc.text(`Email: ${appState.clientData.email}`, 15, currentY);
                currentY += 4;
            }
            if (appState.clientData.direccion) {
                doc.text(`Dirección: ${appState.clientData.direccion}`, 15, currentY);
                currentY += 4;
            }
            if (appState.clientData.ruc) {
                doc.text(`RUC/DNI: ${appState.clientData.ruc}`, 15, currentY);
                currentY += 4;
            }
            currentY += 4;
        }

        // Tabla de items
        const head = [['Descripción', 'Área (m²)', 'P. Unit. (S/)', 'Cant.', 'Subtotal (S/)']];
        const body = appState.trabajos.map(job => [
            job.descripcion || '-',
            job.medidas.area.toFixed(2),
            job.precioVentaUnitario.toFixed(2),
            job.cantidad,
            job.subtotal.toFixed(2)
        ]);

        doc.autoTable({
            startY: currentY,
            head: head,
            body: body,
            headStyles: { 
                fillColor: [34, 40, 49],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            bodyStyles: { textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { halign: 'center', fontSize: 10 },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'center' },
                4: { halign: 'right' }
            },
            margin: { top: currentY, right: 15, bottom: 60, left: 15 },
            didDrawPage: function(data) {
                // Footer en cada página
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.getHeight();
                doc.setFontSize(9);
                doc.text('________________________________', 105, pageHeight - 30, { align: 'center' });
                doc.text('¡Gracias por tu preferencia!', 105, pageHeight - 25, { align: 'center' });
                doc.text('________________________________', 105, pageHeight - 20, { align: 'center' });
            }
        });

        // Total final
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(255, 102, 0); // Naranja
        doc.text("TOTAL FINAL:", 150, finalY, { align: "right" });
        doc.text(`S/ ${appState.summary.totalFinal.toFixed(2)}`, 200, finalY, { align: "right" });
        doc.setTextColor(0, 0, 0);

        // Notas si existen
        if (appState.notas) {
            const splitNotes = doc.splitTextToSize(appState.notas, 170);
            doc.setFontSize(9);
            doc.text("Notas:", 15, finalY + 15);
            doc.text(splitNotes, 15, finalY + 20);
        }

        doc.save(`Proforma_SISDOKE_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    function printThermal(appState) {
        const templateHTML = _createTemplateHTML(appState);
        
        const printStyles = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; background-color: #fff; }
            .proforma-container { max-width: 80mm; margin: 0 auto; padding: 10px; }
            .proforma-header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .logo-section { display: none; }
            .title-section h1 { font-size: 12px; margin: 0; }
            .title-section p { font-size: 9px; margin: 2px 0; }
            .info-section { font-size: 9px; text-align: center; }
            .info-section p { margin: 2px 0; }
            .proforma-content { margin: 10px 0; }
            .proforma-table { width: 100%; border-collapse: collapse; font-size: 9px; }
            .proforma-table th { background-color: #000; color: #fff; padding: 3px; text-align: left; border-bottom: 1px dashed #000; }
            .proforma-table td { padding: 2px 3px; border-bottom: 1px dashed #000; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .proforma-summary { display: none; }
            .proforma-notes { margin: 10px 0; font-size: 8px; text-align: center; }
            .proforma-notes-title { font-weight: bold; margin-bottom: 3px; }
            .proforma-footer { text-align: center; font-size: 8px; margin-top: 10px; }
            @page { size: 80mm auto; margin: 0; }
            @media print { body { margin: 0; padding: 0; } }
        `;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.contentDocument.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>${printStyles}</style>
                </head>
                <body>${templateHTML}</body>
                </html>
            `);
            iframe.contentDocument.close();
            
            setTimeout(() => {
                iframe.contentWindow.print();
                document.body.removeChild(iframe);
            }, 250);
        } else {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('No se pudo abrir la ventana de impresión.');
                return;
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>${printStyles}</style>
                </head>
                <body>${templateHTML}</body>
                </html>
            `);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    }

    function printGeneric(appState) {
        const templateHTML = _createTemplateHTML(appState);
        
        const printStyles = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
            .proforma-container { max-width: 900px; margin: 0 auto; padding: 20px; }
            .proforma-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #FF6600; padding-bottom: 20px; }
            .logo-section img { max-width: 100px; height: auto; }
            .title-section { flex: 2; text-align: center; }
            .title-section h1 { font-size: 28px; color: #FF6600; margin: 0; }
            .title-section p { font-size: 12px; color: #666; margin: 5px 0; }
            .info-section { flex: 1; text-align: right; font-size: 11px; }
            .info-section p { margin: 3px 0; }
            .proforma-content { margin: 20px 0; }
            .proforma-table { width: 100%; border-collapse: collapse; }
            .proforma-table th { background-color: #222; color: #fff; padding: 12px; text-align: left; font-weight: bold; }
            .proforma-table td { padding: 10px 12px; border: 1px solid #ddd; }
            .proforma-table tbody tr:nth-child(even) { background-color: #f9f9f9; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .proforma-summary { display: flex; justify-content: flex-end; margin: 30px 0; }
            .summary-box { width: 300px; border: 2px solid #FF6600; border-radius: 5px; padding: 15px; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .summary-row.total { border-top: 2px solid #FF6600; padding-top: 10px; font-size: 16px; font-weight: bold; color: #FF6600; }
            .proforma-notes { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #FF6600; margin: 20px 0; font-size: 11px; }
            .proforma-notes-title { font-weight: bold; margin-bottom: 5px; }
            .proforma-footer { text-align: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 10px; color: #666; }
            .proforma-footer p { margin: 3px 0; }
            @page { size: A4; margin: 20mm; }
            @media print { body { margin: 0; padding: 10mm; } }
        `;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('No se pudo abrir la ventana de impresión.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>${printStyles}</style>
            </head>
            <body>${templateHTML}</body>
            </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    return {
        generatePdf,
        printThermal,
        printGeneric
    };
})();
