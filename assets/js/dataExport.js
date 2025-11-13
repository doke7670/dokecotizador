/**
 * dataExport.js
 * 
 * Funciones para exportar e importar datos a archivos JSON
 */

/**
 * Descarga los materiales como archivo JSON
 */
export function downloadMaterials(materials) {
    const dataStr = JSON.stringify(materials, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'materials.json';
    link.click();
    
    console.log('📥 Archivo materials.json descargado');
}

/**
 * Descarga las categorías como archivo JSON
 */
export function downloadCategories(categories) {
    const dataStr = JSON.stringify(categories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'categories.json';
    link.click();
    
    console.log('📥 Archivo categories.json descargado');
}

/**
 * Crea un botón para descargar los datos actualizados
 */
export function createExportButton(container, materials, categories) {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg';
    exportBtn.textContent = '📥 Descargar Datos Actualizados (JSON)';
    
    exportBtn.addEventListener('click', () => {
        downloadMaterials(materials);
        setTimeout(() => downloadCategories(categories), 500);
        alert('📁 Archivos descargados. Reemplaza los archivos en la carpeta data/ con estos nuevos archivos para hacer los cambios permanentes.');
    });
    
    container.appendChild(exportBtn);
}