/**
 * ui.js
 * 
 * Responsable de todas las manipulaciones del DOM.
 * Renderiza la tabla, el resumen, los modales y el contenido del PDF.
 */

import { state } from './state.js';
import { calculateItemCost, calculateSummary, calculateProratedItemCost } from './calculations.js';

const categorySelect = document.getElementById('category-select');
const materialSelect = document.getElementById('material-select');
const addItemForm = document.getElementById('add-item-form');
const quoteTableBody = document.getElementById('quote-table-body');
const emptyRow = document.getElementById('empty-row');
const summaryContainer = document.getElementById('summary-container');
const catalogModal = document.getElementById('catalog-modal');
const addMaterialModal = document.getElementById('add-material-modal');
const pdfPreviewModal = document.getElementById('pdf-preview-modal');

const formatCurrency = (value) => `S/. ${Number(value).toFixed(2)}`;

/**
 * Renderiza la tabla de cotización completa.
 * @param {object} summary - El objeto de resumen con los totales calculados.
 */
export function renderQuoteTable(summary) {
    quoteTableBody.innerHTML = '';

    if (state.quoteItems.length === 0) {
        quoteTableBody.appendChild(emptyRow);
        return;
    }

    state.quoteItems.forEach(item => {
        const rawItemCost = calculateItemCost(item, state.materials); // Muestra el costo crudo
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        row.dataset.itemId = item.id;

        row.innerHTML = `
            <td class="p-3">${state.materials.find(m => m.codigo === item.materialCode)?.nombre || 'N/A'}</td>
            <td class="p-3">${item.width}</td>
            <td class="p-3">${item.height}</td>
            <td class="p-3 font-semibold text-right">
                ${formatCurrency(rawItemCost)}
            </td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center space-x-3">
                    <button data-action="view-item" title="Ver Detalles" class="text-blue-400 hover:text-blue-300 text-lg">👁️</button>
                    <button data-action="edit-item" title="Editar" class="text-yellow-400 hover:text-yellow-300 text-lg">✏️</button>
                    <button data-action="delete-item" title="Eliminar" class="text-red-500 hover:text-red-400 text-lg">🗑️</button>
                </div>
            </td>
        `;
        quoteTableBody.appendChild(row);
    });
}

/**
 * Renderiza el panel de resumen de costos.
 * @param {object} summary - El objeto de resumen con los totales calculados.
 */
export function renderSummary(summary) {
    document.getElementById('summary-subtotal').textContent = formatCurrency(summary.subtotal);
    document.getElementById('summary-waste').textContent = formatCurrency(summary.wasteCost);
    document.getElementById('summary-labor').textContent = formatCurrency(summary.laborCost);
    document.getElementById('summary-project-subtotal').textContent = formatCurrency(summary.projectSubtotal);
    document.getElementById('summary-margin').textContent = formatCurrency(summary.marginAmount);
    document.getElementById('summary-total').textContent = formatCurrency(summary.grandTotal);
}

/**
 * Renderiza el catálogo de materiales en su modal.
 * @param {string} filter - 'active' o 'deleted'.
 * @param {string} searchTerm - The text to filter material names by.
 */
export function renderCatalog(filter = 'active', searchTerm = '') {
    const catalogList = document.getElementById('catalog-list');
    catalogList.innerHTML = '';

    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

    const materialsToRender = state.materials.filter(m => {
        const isActive = m.isActive ?? true; // Default to true if undefined
        const matchesFilter = filter === 'active' ? isActive : !isActive;
        const matchesSearch = lowerCaseSearchTerm === '' || m.nombre.toLowerCase().includes(lowerCaseSearchTerm);
        return matchesFilter && matchesSearch;
    });

    if (materialsToRender.length === 0) {
        catalogList.innerHTML = `<p class="col-span-full text-center text-gray-500">No se encontraron materiales con esos criterios.</p>`;
        return;
    }

    materialsToRender.forEach(material => {
        const categoryName = state.categories.find(c => c.id === material.categoria_id)?.nombre || 'Sin categoría';
        const card = document.createElement('div');
        card.className = 'border border-gray-700 bg-gray-900 rounded-lg p-4 flex flex-col justify-between shadow-sm';
        card.dataset.materialCode = material.codigo;

        const actionButtons = filter === 'active'
            ? `<button data-action="edit-material" title="Editar" class="text-yellow-400 hover:text-yellow-300 text-lg">✏️</button>
               <button data-action="delete-material" title="Eliminar" class="text-red-500 hover:text-red-400 text-lg">🗑️</button>`
            : `<button data-action="restore-material" title="Restaurar" class="text-green-400 hover:text-green-300 text-lg">♻️</button>`;

        card.innerHTML = `
            <div>
                <img src="${material.ruta_imagen}" alt="${material.nombre}" class="w-full h-24 object-cover rounded-md mb-2">
                <h4 class="font-bold text-md text-white">${material.nombre}</h4>
                <p class="text-sm text-gray-400">${categoryName}</p>
            </div>
            <div class="text-xs mt-4 text-gray-400 border-t border-gray-700 pt-2 flex justify-between items-center">
                <span>Costo: ${formatCurrency(material.costo_crudo)}</span>
                <div class="flex gap-3">${actionButtons}</div>
            </div>
        `;
        catalogList.appendChild(card);
    });
}

/**
 * Popula el select de categorías con valores únicos del catálogo.
 */
export function populateCategorySelect() {
    const activeCategories = state.categories.filter(c => c.isActive ?? true);
    categorySelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
    activeCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nombre;
        categorySelect.appendChild(option);
    });
}

/**
 * Popula el select de categorías en el modal de agregar material.
 */
export function populateCategorySelectInModal() {
    const activeCategories = state.categories.filter(c => c.isActive ?? true);
    const modalCategorySelect = document.getElementById('material-categoria-select');
    modalCategorySelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
    activeCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nombre;
        modalCategorySelect.appendChild(option);
    });
}

/**
 * Actualiza el select de materiales basado en la categoría seleccionada.
 * @param {string} selectedCategoryId - El ID de la categoría elegida.
 */
export function updateMaterialSelect(selectedCategoryId) {
    materialSelect.innerHTML = '<option value="">Seleccionar material...</option>';

    if (!selectedCategoryId) {
        materialSelect.disabled = true;
        return;
    }

    const filteredMaterials = state.materials
        .filter(m => m.categoria_id === selectedCategoryId && (m.isActive ?? true))
        .sort((a, b) => a.nombre.localeCompare(b.nombre)); // Ordenar alfabéticamente
    
    filteredMaterials.forEach(material => {
        const option = document.createElement('option');
        option.value = material.codigo;
        option.textContent = material.nombre;
        materialSelect.appendChild(option);
    });

    materialSelect.disabled = false;
}

/**
 * Limpia y resetea el formulario de "Agregar Pieza".
 * Mantiene la categoría y material seleccionados.
 */
export function resetAddItemForm() {
    document.getElementById('item-width-input').value = '';
    document.getElementById('item-height-input').value = '';
    document.getElementById('item-width-input').focus();
}

/**
 * Muestra u oculta un modal.
 * @param {string} modalId - El ID del elemento modal.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden', !show);
    }
}

/**
 * Limpia y resetea el formulario de "Agregar Material".
 */
export function resetMaterialForm() {
    state.editingMaterialCode = null;
    const form = document.getElementById('add-material-form');
    form.reset();
    
    const title = document.getElementById('material-modal-title');
    title.textContent = 'Agregar Nuevo Material';
    
    const submitBtn = document.getElementById('material-submit-btn');
    submitBtn.textContent = 'Guardar Material';
    submitBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

    populateCategorySelectInModal();
}

/**
 * Renderiza el contenido del modal de detalles de la pieza.
 * @param {number} itemId - El ID del ítem a mostrar.
 */
export function renderItemDetailsModal(itemId) {
    const item = state.quoteItems.find(i => i.id === itemId);
    if (!item) return;

    const material = state.materials.find(m => m.codigo === item.materialCode);
    if (!material) return;

    const category = state.categories.find(c => c.id === material.categoria_id);
    const modalContent = document.getElementById('view-item-modal-content');

    modalContent.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <img src="${material.ruta_imagen}" alt="${material.nombre}" class="w-full md:w-1/3 h-auto object-cover rounded-lg">
            <div class="flex-1 space-y-3">
                <h4 class="text-2xl font-bold text-white">${material.nombre}</h4>
                <p class="text-sm text-gray-400 bg-gray-700 inline-block px-2 py-1 rounded">${category?.nombre || 'N/A'}</p>
                <p class="text-gray-300">${material.descripcion}</p>
                <div class="border-t border-gray-700 pt-3 mt-3">
                    <p class="text-lg"><span class="font-semibold">Medidas de la pieza:</span> ${item.width}cm x ${item.height}cm</p>
                </div>
            </div>
        </div>
    `;
    toggleModal('view-item-modal', true);
}

/**
 * Rellena el formulario principal con los datos de un ítem para editarlo.
 * @param {number} itemId - El ID del ítem a editar.
 */
export function populateFormForEdit(itemId) {
    const itemToEdit = state.quoteItems.find(i => i.id === itemId);
    if (!itemToEdit) return;

    const material = state.materials.find(m => m.codigo === itemToEdit.materialCode);
    if (!material) return;

    state.editingItemId = itemId;

    document.getElementById('form-title').textContent = 'Editando Pieza';
    categorySelect.value = material.categoria_id;
    
    updateMaterialSelect(material.categoria_id);
    materialSelect.value = itemToEdit.materialCode;

    document.getElementById('item-width-input').value = itemToEdit.width;
    document.getElementById('item-height-input').value = itemToEdit.height;

    const submitBtn = document.getElementById('add-item-submit-btn');
    submitBtn.textContent = 'Actualizar';
    submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
    submitBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    
    document.getElementById('edit-mode-controls').classList.remove('hidden');
    
    addItemForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('item-width-input').focus();
}

/**
 * Resetea el formulario y sale del modo de edición.
 */
export function cancelEditMode() {
    state.editingItemId = null;
    
    addItemForm.reset();
    updateMaterialSelect('');

    document.getElementById('form-title').textContent = 'Agregar Pieza';
    const submitBtn = document.getElementById('add-item-submit-btn');
    submitBtn.textContent = '+ Agregar';
    submitBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');

    document.getElementById('edit-mode-controls').classList.add('hidden');
}

/**
 * Rellena el formulario de "Agregar Material" para edición.
 * @param {string} materialCode - El código del material a editar.
 */
export function populateMaterialFormForEdit(materialCode) {
    const material = state.materials.find(m => m.codigo === materialCode);
    if (!material) return;

    // FIX: Populate the category select *before* trying to set its value.
    populateCategorySelectInModal();

    state.editingMaterialCode = materialCode;
    
    document.getElementById('material-modal-title').textContent = 'Editar Material';
    document.getElementById('material-nombre').value = material.nombre;
    document.getElementById('material-categoria-select').value = material.categoria_id;
    document.getElementById('material-ancho').value = material.ancho_cm;
    document.getElementById('material-alto').value = material.alto_cm;
    document.getElementById('material-costo').value = material.costo_crudo;
    document.getElementById('material-descripcion').value = material.descripcion;
    // No se puede pre-rellenar el input de archivo, pero se puede indicar que ya hay una imagen.

    const submitBtn = document.getElementById('material-submit-btn');
    submitBtn.textContent = 'Actualizar Material';
    submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    submitBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');

    toggleModal('add-material-modal', true);
}

/**
 * Renderiza el modal de administración de categorías.
 */
export function renderCategoryManagementModal() {
    const activeList = document.getElementById('active-categories-list');
    const deletedList = document.getElementById('deleted-categories-list');
    activeList.innerHTML = '';
    deletedList.innerHTML = '';

    const renderListItem = (category, isDeleted = false) => {
        const actionButtons = isDeleted
            ? `<button data-action="restore-category" title="Restaurar" class="text-green-400 hover:text-green-300 text-lg">♻️</button>`
            : `<button data-action="edit-category" title="Editar" class="text-yellow-400 hover:text-yellow-300 text-lg">✏️</button>
               <button data-action="delete-category" title="Eliminar" class="text-red-500 hover:text-red-400 text-lg">🗑️</button>`;
        
        return `
            <li data-category-id="${category.id}" class="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                <span>${category.nombre}</span>
                <div class="flex gap-3">${actionButtons}</div>
            </li>
        `;
    };

    state.categories.forEach(category => {
        if (category.isActive ?? true) {
            activeList.innerHTML += renderListItem(category, false);
        } else {
            deletedList.innerHTML += renderListItem(category, true);
        }
    });

    if (activeList.innerHTML === '') {
        activeList.innerHTML = `<p class="text-gray-500">No hay categorías activas.</p>`;
    }
    if (deletedList.innerHTML === '') {
        deletedList.innerHTML = `<p class="text-gray-500">No hay categorías eliminadas.</p>`;
    }
}

/**
 * Rellena el formulario de categorías para edición.
 * @param {string} categoryId - El ID de la categoría a editar.
 */
export function populateCategoryFormForEdit(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    if (!category) return;

    state.editingCategoryId = categoryId;
    document.getElementById('category-name-input').value = category.nombre;
    document.getElementById('category-submit-btn').textContent = 'Actualizar';
    document.getElementById('cancel-category-edit-btn').classList.remove('hidden');
    document.getElementById('category-name-input').focus();
}

/**
 * Resetea el formulario de categorías y sale del modo edición.
 */
export function cancelCategoryEditMode() {
    state.editingCategoryId = null;
    document.getElementById('category-form').reset();
    document.getElementById('category-submit-btn').textContent = 'Agregar';
    document.getElementById('cancel-category-edit-btn').classList.add('hidden');
}


/**
 * Renderiza el contenido de la vista previa del PDF.
 */
export function renderPdfPreview() {
    const contentDiv = document.getElementById('pdf-content');
    const summary = calculateSummary(state.quoteItems, state.additionalCosts, state.materials);
    const { waste, labor, margin } = state.additionalCosts;
    const now = new Date();

    let itemsHtml = state.quoteItems.map(item => {
        const rawItemCost = calculateItemCost(item, state.materials);
        const finalItemCost = calculateProratedItemCost(rawItemCost, summary.subtotal, summary.grandTotal);
        return `
            <div class="grid grid-cols-4 gap-2 py-2 border-b">
                <div>${state.materials.find(m => m.codigo === item.materialCode)?.nombre || 'N/A'}</div>
                <div class="text-right">${item.width}cm x ${item.height}cm</div>
                <div class="text-right">1</div>
                <div class="text-right">${formatCurrency(finalItemCost)}</div>
            </div>
        `;
    }).join('');

    contentDiv.innerHTML = `
        <div class="text-center mb-8">
            <h1 class="text-2xl font-bold">COTIZACIÓN</h1>
            <p>Fecha: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}</p>
        </div>

        <div class="grid grid-cols-4 gap-2 font-bold py-2 border-b-2 border-black">
            <div>Descripción</div>
            <div class="text-right">Medidas</div>
            <div class="text-right">Cant.</div>
            <div class="text-right">Precio</div>
        </div>

        ${itemsHtml}

        <div class="mt-8 flex justify-end">
            <div class="w-1/2 space-y-2">
                <div class="flex justify-between text-xl font-bold border-t-2 border-black pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(summary.grandTotal)}</span>
                </div>
            </div>
        </div>

        <div class="text-center mt-12 text-xs text-gray-500">
            <p>Gracias por su preferencia.</p>
            <p>Esta es una cotización generada por sistema y no requiere firma.</p>
        </div>
    `;
}

/**
 * Actualiza toda la UI basándose en el estado actual.
 */
export function updateUI() {
    const summary = calculateSummary(state.quoteItems, state.additionalCosts, state.materials);
    renderQuoteTable(summary);
    renderSummary(summary);
}
// ```<!--
// [PROMPT_SUGGESTION]¿Cómo puedo añadir una alerta para que no se pueda eliminar una categoría si todavía hay materiales activos usándola?[/PROMPT_SUGGESTION]
// [PROMPT_SUGGESTION]Implementa una función de búsqueda en el catálogo de materiales para filtrar por nombre.[/PROMPT_SUGGESTION]
// -->
