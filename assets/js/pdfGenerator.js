/**
 * pdfGenerator.js
 * 
 * Lógica para generar el PDF de la cotización utilizando jsPDF y html2canvas.
 */

/**
 * Genera y descarga un PDF a partir de un elemento HTML.
 * @param {string} elementId - El ID del elemento HTML que contiene el preview.
 * @param {string} fileName - El nombre del archivo PDF a generar.
 */
export async function generatePdfFromHtml(elementId, fileName = 'cotizacion.pdf') {
    try {
        const { jsPDF } = window.jspdf;
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error('❌ Elemento no encontrado:', elementId);
            alert('Error: No se pudo encontrar el contenido para generar el PDF');
            return;
        }

        console.log('📄 Generando PDF...');
        
        // Usar html2canvas para convertir el HTML a imagen
        const canvas = await html2canvas(element, {
            scale: 2, // Mayor calidad
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calcular dimensiones para ajustar al PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(fileName);
        
        console.log('✅ PDF generado exitosamente:', fileName);
        
    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
}

/**
 * Genera un PDF simple usando solo texto (alternativa más confiable)
 * @param {object} quoteData - Datos de la cotización
 * @param {string} fileName - Nombre del archivo
 */
export function generateSimplePdf(quoteData, fileName = 'cotizacion.pdf') {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración
        let yPosition = 20;
        const lineHeight = 7;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Título
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('COTIZACIÓN', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight * 2;
        
        // Fecha
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        const now = new Date();
        doc.text(`Fecha: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 20, yPosition);
        yPosition += lineHeight * 2;
        
        // Línea separadora
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += lineHeight;
        
        // Encabezados de tabla
        doc.setFont(undefined, 'bold');
        doc.text('Descripción', 20, yPosition);
        doc.text('Medidas', 100, yPosition);
        doc.text('Cant.', 140, yPosition);
        doc.text('Precio', 170, yPosition);
        yPosition += lineHeight;
        
        // Línea separadora
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += lineHeight;
        
        // Items
        doc.setFont(undefined, 'normal');
        quoteData.items.forEach(item => {
            if (yPosition > 250) { // Nueva página si es necesario
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(item.name, 20, yPosition);
            doc.text(item.dimensions, 100, yPosition);
            doc.text('1', 140, yPosition);
            doc.text(item.price, 170, yPosition);
            yPosition += lineHeight;
        });
        
        // Línea separadora
        yPosition += lineHeight;
        doc.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += lineHeight;
        
        // Total
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text('TOTAL:', 140, yPosition);
        doc.text(quoteData.total, 170, yPosition);
        
        // Pie de página
        yPosition += lineHeight * 3;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Gracias por su preferencia.', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight;
        doc.text('Esta es una cotización generada por sistema.', pageWidth / 2, yPosition, { align: 'center' });
        
        doc.save(fileName);
        console.log('✅ PDF simple generado exitosamente:', fileName);
        
    } catch (error) {
        console.error('❌ Error al generar PDF simple:', error);
        alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
}
