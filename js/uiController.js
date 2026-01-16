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
        cbAdicional: document.getElementById('cb-adicional'),
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
        cancelEditBtn: document.getElementById('cancel-edit-btn'),
        jobsTableBody: document.querySelector('#jobs-table tbody'),
        jobsCardsContainer: document.getElementById('jobs-cards-container'),
        
        summaryTotal: document.getElementById('summary-total'), 
        
        finalNotes: document.getElementById('final-notes'),
        generatePdfBtn: document.getElementById('generate-pdf-btn'),
        printThermalBtn: document.getElementById('print-thermal-btn'),
        printGenericBtn: document.getElementById('print-generic-btn'),

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
            let colorsHTML = '';
            if (material.colores) {
                colorsHTML = `<strong>Colores:</strong> ${material.colores}<br>`;
            }

            DOMElements.selectedMaterialInfo.innerHTML = `
                <div><span class="label">Material:</span> ${material.marca} ${material.modelo}</div>
                ${colorsHTML}
                <div><span class="label">Tipo:</span> ${material.tipo}</div>
                <div><span class="label">Ancho Rollo:</span> ${material.ancho_rollo} m</div>
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
            <td>
                <button class="add-more-button" data-index="${index}">+</button>
                <button class="edit-button" data-index="${index}">Editar</button>
                <button class="delete-button" data-index="${index}">Eliminar</button>
            </td>
        `;
    }

    // NUEVA FUNCIÓN: Actualiza una fila existente sin re-renderizar toda la tabla
    function updateRow(row, job) {
        row.querySelector('.job-costo-cell').textContent = `S/ ${job.costoMaterialTotal.toFixed(2)}`;
        row.querySelector('.job-precio-unit-cell').textContent = `S/ ${job.precioVentaUnitario.toFixed(2)}`;
        row.querySelector('.ganancia-input').value = job.gananciaTotalItem.toFixed(2);
        row.querySelector('.job-subtotal-cell').textContent = `S/ ${job.subtotal.toFixed(2)}`;
    }

    function addJobCard(job, index) {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="job-card-header">
                <span class="job-card-codigo">${job.material.codigo}</span>
                <span class="job-card-descripcion">${job.descripcion || 'Sin descripción'}</span>
            </div>
            <div class="job-card-body">
                <div class="job-card-row">
                    <span class="job-card-label">Área:</span>
                    <span class="job-card-value">${job.medidas.area.toFixed(2)} m²</span>
                </div>
                <div class="job-card-row">
                    <span class="job-card-label">Cantidad:</span>
                    <input type="number" class="quantity-input small-input" value="${job.cantidad}" data-index="${index}" min="1">
                </div>
                <div class="job-card-row">
                    <span class="job-card-label">Precio Unit.:</span>
                    <span class="job-card-value">S/ ${job.precioVentaUnitario.toFixed(2)}</span>
                </div>
                <div class="job-card-row">
                    <span class="job-card-label">Ganancia:</span>
                    <input type="number" class="ganancia-input small-input" value="${job.gananciaTotalItem.toFixed(2)}" data-index="${index}" min="0">
                </div>
                <div class="job-card-row total">
                    <span class="job-card-label">Subtotal:</span>
                    <span class="job-card-value">S/ ${job.subtotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="job-card-footer">
                <button class="add-more-button" data-index="${index}">+</button>
                <button class="edit-button" data-index="${index}">Editar</button>
                <button class="delete-button" data-index="${index}">Eliminar</button>
            </div>
        `;
        DOMElements.jobsCardsContainer.appendChild(card);
    }

    function updateJobsTable(jobs) {
        DOMElements.jobsTableBody.innerHTML = '';
        DOMElements.jobsCardsContainer.innerHTML = '';
        jobs.forEach((job, index) => {
            addJobToTable(job, index);
            addJobCard(job, index);
        });
    }



    function updateSummary(summary) {
        DOMElements.summaryTotal.textContent = `S/ ${summary.totalFinal.toFixed(2)}`;
    }
    
    function toggleVentaParamsInputs(ventaParams) {
        // Deshabilitar inputs según el estado de los checkboxes
        uiController.DOMElements.vpWastePctInput.disabled = !ventaParams.desperdicioActivo;
        uiController.DOMElements.vpLaborCostInput.disabled = !ventaParams.manoDeObraActiva;
        uiController.DOMElements.vpProfitType.disabled = !ventaParams.gananciaActiva;
        uiController.DOMElements.vpProfitValueInput.disabled = !ventaParams.gananciaActiva;
    }

    function resetItemForm() {
        DOMElements.selectedMaterialInfo.innerHTML = '';
        DOMElements.itemForm.style.display = 'none';
        DOMElements.ventaParamsCard.style.display = 'none';
        DOMElements.rbProveedor.checked = true;
        DOMElements.cbAdicional.checked = false;
        DOMElements.descriptionInput.value = '';
        DOMElements.heightInput.value = '';
        DOMElements.widthInput.value = '';
        DOMElements.areaDisplay.textContent = '0.00';
        DOMElements.searchInput.value = '';
        DOMElements.previewPrecioVenta.textContent = 'S/ 0.00';
    }

    function setEditingMode(isEditing) {
        if (isEditing) {
            DOMElements.addItemBtn.textContent = 'Actualizar Trabajo';
            DOMElements.cancelEditBtn.style.display = 'inline-block';
        } else {
            DOMElements.addItemBtn.textContent = 'Agregar a la cotización';
            DOMElements.cancelEditBtn.style.display = 'none';
        }
    }

    function showToast(message, type = 'success') {
        const toastElement = document.getElementById('toast-notification');
        toastElement.textContent = message;
        toastElement.className = `toast-notification toast-${type} show`;
        
        setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3000);
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
        resetItemForm,
        setEditingMode,
        showToast
    };
})();
