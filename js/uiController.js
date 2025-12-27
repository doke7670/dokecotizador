// js/uiController.js
// Manipulación del DOM: actualizar tabla, totales, etc.
const uiController = (() => {
    const DOMElements = {
        searchInput: document.getElementById('search-input'),
        searchResults: document.getElementById('search-results'),
        itemForm: document.getElementById('item-form'),
        selectedMaterialInfo: document.getElementById('selected-material-info'),
        rbProveedor: document.getElementById('rb-proveedor'),
        rbCliente: document.getElementById('rb-cliente'),
        descriptionInput: document.getElementById('description-input'),
        heightInput: document.getElementById('height-input'),
        widthInput: document.getElementById('width-input'),
        areaDisplay: document.getElementById('area-display'),
        
        ventaParamsCard: document.getElementById('venta-params-card'),
        vpWasteActive: document.getElementById('vp-waste-active'),
        vpWastePctInput: document.getElementById('vp-waste-pct-input'),
        vpLaborActive: document.getElementById('vp-labor-active'),
        vpLaborCostInput: document.getElementById('vp-labor-cost-input'),
        vpProfitActive: document.getElementById('vp-profit-active'),
        vpProfitType: document.getElementById('vp-profit-type'),
        vpProfitValueInput: document.getElementById('vp-profit-value-input'),
        previewPrecioVenta: document.getElementById('preview-precio-venta'),

        addItemBtn: document.getElementById('add-item-btn'),
        jobsTableBody: document.querySelector('#jobs-table tbody'),
        
        summaryTotal: document.getElementById('summary-total'), 
        
        finalNotes: document.getElementById('final-notes'),
        generatePdfBtn: document.getElementById('generate-pdf-btn'),
        printThermalBtn: document.getElementById('print-thermal-btn'),
        printGenericBtn: document.getElementById('print-generic-btn'),
        themeToggleBtn: document.getElementById('theme-toggle-btn')
    };

    function displaySearchResults(results) {
        DOMElements.searchResults.innerHTML = '';
        if (results.length > 0) {
            results.forEach(material => {
                const div = document.createElement('div');
                div.dataset.codigo = material.codigo;
                div.textContent = `${material.codigo} - ${material.marca} ${material.modelo} (${material.tipo})`;
                DOMElements.searchResults.appendChild(div);
            });
            DOMElements.searchResults.style.display = 'block';
        } else {
            DOMElements.searchResults.style.display = 'none';
        }
    }

    function hideSearchResults() {
        DOMElements.searchResults.style.display = 'none';
    }

    function displaySelectedMaterial(material) {
        if (material) {
            DOMElements.selectedMaterialInfo.innerHTML = `
                <strong>Material:</strong> ${material.marca} ${material.modelo}<br>
                <strong>Tipo:</strong> ${material.tipo}<br>
                <strong>Ancho Rollo:</strong> ${material.ancho_rollo} m
            `;
            DOMElements.itemForm.style.display = 'block';
            DOMElements.searchInput.value = material.codigo;
        } else {
            DOMElements.selectedMaterialInfo.innerHTML = '';
            DOMElements.itemForm.style.display = 'none';
        }
    }

    function updateAreaDisplay(area) {
        DOMElements.areaDisplay.textContent = area.toFixed(2);
    }

    function updatePreviewPrecioVenta(precio) {
        DOMElements.previewPrecioVenta.textContent = `S/ ${precio.toFixed(2)}`;
    }

    // MODIFICADO: Ganancia es un input, y el orden de columnas ha cambiado.
    function addJobToTable(job, index) {
        const row = DOMElements.jobsTableBody.insertRow();
        row.dataset.index = index;
        row.innerHTML = `
            <td>${job.material.codigo}</td>
            <td>${job.descripcion || ''}</td>
            <td>${job.medidas.area.toFixed(2)}</td>
            <td class="job-costo-cell">S/ ${job.costoMaterialTotal.toFixed(2)}</td>
            <td>
                <input 
                    type="number" 
                    class="quantity-input small-input" 
                    value="${job.cantidad}" 
                    data-index="${index}" 
                    min="1">
            </td>
            <td class="job-precio-unit-cell">S/ ${job.precioVentaUnitario.toFixed(2)}</td>
            <td class="job-ganancia-cell">
                <input
                    type="number"
                    class="ganancia-input small-input"
                    value="${job.gananciaTotalItem.toFixed(2)}"
                    data-index="${index}"
                    min="0">
            </td>
            <td class="job-subtotal-cell">S/ ${job.subtotal.toFixed(2)}</td>
            <td><button class="delete-button" data-index="${index}">Eliminar</button></td>
        `;
    }

    // NUEVA FUNCIÓN: Actualiza una fila existente sin re-renderizar toda la tabla
    function updateRow(row, job) {
        row.querySelector('.job-costo-cell').textContent = `S/ ${job.costoMaterialTotal.toFixed(2)}`;
        row.querySelector('.job-precio-unit-cell').textContent = `S/ ${job.precioVentaUnitario.toFixed(2)}`;
        row.querySelector('.ganancia-input').value = job.gananciaTotalItem.toFixed(2);
        row.querySelector('.job-subtotal-cell').textContent = `S/ ${job.subtotal.toFixed(2)}`;
    }

    function updateJobsTable(jobs) {
        DOMElements.jobsTableBody.innerHTML = '';
        jobs.forEach((job, index) => addJobToTable(job, index));
    }



    function updateSummary(summary) {
        DOMElements.summaryTotal.textContent = `S/ ${summary.totalFinal.toFixed(2)}`;
    }
    
    function toggleVentaParamsInputs(ventaParams) {
        // Inputs are now always enabled as per user request.
        // The commented out lines previously controlled their disabled state.
        // DOMElements.vpWastePctInput.disabled = !ventaParams.desperdicioActivo;
        // DOMElements.vpLaborCostInput.disabled = !ventaParams.manoDeObraActiva;
        // DOMElements.vpProfitType.disabled = !ventaParams.gananciaActiva;
        // DOMElements.vpProfitValueInput.disabled = !ventaParams.gananciaActiva;
    }

    function resetItemForm() {
        DOMElements.selectedMaterialInfo.innerHTML = '';
        DOMElements.itemForm.style.display = 'none';
        DOMElements.ventaParamsCard.style.display = 'none';
        DOMElements.rbProveedor.checked = true;
        DOMElements.descriptionInput.value = '';
        DOMElements.heightInput.value = '';
        DOMElements.widthInput.value = '';
        DOMElements.areaDisplay.textContent = '0.00';
        DOMElements.searchInput.value = '';
        DOMElements.previewPrecioVenta.textContent = 'S/ 0.00';
    }


    return {
        DOMElements,
        displaySearchResults,
        hideSearchResults,
        displaySelectedMaterial,
        updateAreaDisplay,
        updatePreviewPrecioVenta,
        addJobToTable, // Aún se necesita para añadir nuevas filas
        updateRow, // Nueva función para actualizaciones eficientes
        updateJobsTable, // Se usa al eliminar
        updateSummary,
        toggleVentaParamsInputs,
        resetItemForm
    };
})();
