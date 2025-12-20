/**
 * ui.js
 * 
 * Responsable de todas las manipulaciones del DOM.
 * Renderiza la tabla, el resumen, los modales y el contenido del PDF.
 */

import { state } from './state.js';
import { calculateItemCost, calculateSummary, calculateProratedItemCost } from './calculations.js';

// Referencias a elementos del DOM
let materialSearchInput;
let materialSuggestions;
let selectedMaterialInfo;
let addItemForm;
let quoteTableBody;
let emptyRow;

// Función para inicializar las referencias del DOM
function initializeDOMReferences() {
    materialSearchInput = document.getElementById('material-search-input');
    materialSuggestions = document.getElementById('material-suggestions');
    selectedMaterialInfo = document.getElementById('selected-material-info');
    addItemForm = document.getElementById('add-item-form');
    quoteTableBody = document.getElementById('quote-table-body');
    emptyRow = document.getElementById('empty-row');
    
    console.log('🔗 Referencias DOM inicializadas:', {
        materialSearchInput: !!materialSearchInput,
        materialSuggestions: !!materialSuggestions,
        selectedMaterialInfo: !!selectedMaterialInfo
    });
}

// Estado local para el material seleccionado
let selectedMaterial = null;
let selectedPriceType = null; // 'provider' o 'client'
let highlightedIndex = -1;
let filteredMaterials = [];

const formatCurrency = (value) => `S/. ${Number(value).toFixed(2)}`;

/**
 * Renderiza la tabla de cotización completa.
 * @param {object} summary - El objeto de resumen con los totales calculados.
 */
export function renderQuoteTable(summary) {
    if (!quoteTableBody) initializeDOMReferences();
    
    quoteTableBody.innerHTML = '';

    if (state.quoteItems.length === 0) {
        quoteTableBody.appendChild(emptyRow);
        return;
    }

    state.quoteItems.forEach(item => {
        // Usar el tipo de precio guardado con cada item individual
        const itemPriceType = item.priceType === 'client' ? 'precio_venta' : 'costo_crudo';
        const rawItemCost = calculateItemCost(item, state.materials, itemPriceType);
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700';
        row.dataset.itemId = item.id;

        const material = state.materials.find(m => m.codigo === item.materialCode);
        const priceTypeLabel = item.priceType === 'client' ? '(Cliente)' : '(Proveedor)';

        row.innerHTML = `
            <td class="p-3">
                ${material?.nombre || 'N/A'}
                <span class="text-xs text-gray-400 block">${priceTypeLabel}</span>
            </td>
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
 * Inicializa el sistema de búsqueda de materiales
 */
export function initializeMaterialSearch() {
    console.log('🔍 Inicializando búsqueda de materiales...');
    
    // Obtener referencias directamente
    const searchInput = document.getElementById('material-search-input');
    const suggestionsContainer = document.getElementById('material-suggestions');
    const materialInfo = document.getElementById('selected-material-info');
    
    console.log('🔍 Referencias obtenidas:', {
        searchInput: !!searchInput,
        suggestionsContainer: !!suggestionsContainer,
        materialInfo: !!materialInfo
    });
    
    if (!searchInput || !suggestionsContainer) {
        console.error('❌ Elementos no encontrados');
        return;
    }
    
    // Asignar a variables globales
    materialSearchInput = searchInput;
    materialSuggestions = suggestionsContainer;
    selectedMaterialInfo = materialInfo;
    
    // Event listeners para el input de búsqueda
    searchInput.addEventListener('input', handleMaterialSearch);
    searchInput.addEventListener('keydown', handleMaterialSearchKeydown);
    searchInput.addEventListener('blur', handleMaterialSearchBlur);
    searchInput.addEventListener('focus', handleMaterialSearchFocus);
    
    // Event listeners para sugerencias (soporte táctil mejorado)
    suggestionsContainer.addEventListener('click', handleSuggestionClick);
    suggestionsContainer.addEventListener('touchstart', handleSuggestionTouchStart, { passive: true });
    
    // Event listener global para ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick, { passive: true });
    
    console.log('✅ Sistema de búsqueda completo inicializado');
}

/**
 * Maneja el inicio del toque en sugerencias (móvil)
 */
function handleSuggestionTouchStart(e) {
    // Prevenir el scroll accidental durante la selección
    const suggestionItem = e.target.closest('.material-suggestion-item');
    if (suggestionItem) {
        suggestionItem.style.backgroundColor = '#F97316';
    }
}

/**
 * Maneja clics/toques fuera del área de búsqueda
 */
function handleDocumentClick(e) {
    const searchContainer = materialSearchInput.closest('.relative');
    if (!searchContainer.contains(e.target)) {
        hideMaterialSuggestions();
    }
}

/**
 * Maneja la búsqueda de materiales en tiempo real
 */
function handleMaterialSearch(e) {
    console.log('🔍 Búsqueda activada:', e.target.value);
    console.log('🔍 Estado de materiales:', state.materials?.length || 0);
    console.log('🔍 Estado de categorías:', state.categories?.length || 0);
    
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        hideMaterialSuggestions();
        clearSelectedMaterial();
        return;
    }

    // Verificar que tenemos datos
    if (!state.materials || state.materials.length === 0) {
        console.error('❌ No hay materiales cargados en el estado');
        return;
    }

    // Filtrar materiales activos
    filteredMaterials = state.materials.filter(material => {
        if (!(material.isActive ?? true)) return false;
        
        const matchesCode = material.codigo.toLowerCase().includes(query);
        const matchesName = material.nombre.toLowerCase().includes(query);
        const category = state.categories.find(c => c.id === material.categoria_id);
        const matchesCategory = category?.nombre.toLowerCase().includes(query) || false;
        
        return matchesCode || matchesName || matchesCategory;
    });

    console.log('📋 Materiales filtrados:', filteredMaterials.length);
    console.log('📋 Primeros 3 materiales:', filteredMaterials.slice(0, 3));

    // Buscar coincidencia exacta por código
    const exactMatch = filteredMaterials.find(m => m.codigo.toLowerCase() === query);
    if (exactMatch) {
        console.log('✅ Coincidencia exacta encontrada:', exactMatch.codigo);
        selectMaterial(exactMatch);
        hideMaterialSuggestions();
        return;
    }

    // Mostrar sugerencias
    if (filteredMaterials.length > 0) {
        console.log('📋 Mostrando sugerencias...');
        showMaterialSuggestions(filteredMaterials, query);
    } else {
        console.log('📋 No hay sugerencias para mostrar');
        hideMaterialSuggestions();
        clearSelectedMaterial();
    }
}

/**
 * Maneja las teclas de navegación en el input de búsqueda
 */
function handleMaterialSearchKeydown(e) {
    if (!materialSuggestions.classList.contains('hidden')) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, filteredMaterials.length - 1);
                updateHighlight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
                updateHighlight();
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredMaterials[highlightedIndex]) {
                    selectMaterial(filteredMaterials[highlightedIndex]);
                    hideMaterialSuggestions();
                    // Mover foco al siguiente campo
                    document.getElementById('item-width-input').focus();
                }
                break;
            case 'Escape':
                hideMaterialSuggestions();
                break;
        }
    }
}

/**
 * Maneja cuando el input pierde el foco
 */
function handleMaterialSearchBlur(e) {
    // Delay más corto para mejor UX
    setTimeout(() => {
        if (!materialSuggestions.matches(':hover')) {
            hideMaterialSuggestions();
        }
    }, 150);
}

/**
 * Maneja cuando el input recibe el foco
 */
function handleMaterialSearchFocus(e) {
    if (e.target.value.trim() && filteredMaterials.length > 0) {
        showMaterialSuggestions(filteredMaterials, e.target.value.trim().toLowerCase());
    }
}

/**
 * Maneja clics en las sugerencias - Versión simplificada
 */
function handleSuggestionClick(e) {
    // Esta función ya no se usa porque cada sugerencia tiene su propio event listener
    // Mantenemos por compatibilidad
}

/**
 * Muestra las sugerencias de materiales
 */
function showMaterialSuggestions(materials, query) {
    console.log('📋 showMaterialSuggestions llamada con:', materials.length, 'materiales');
    
    if (!materialSuggestions) {
        console.error('❌ Contenedor de sugerencias no encontrado');
        return;
    }
    
    materialSuggestions.innerHTML = '';
    highlightedIndex = -1;

    materials.slice(0, 6).forEach((material, index) => {
        const category = state.categories.find(c => c.id === material.categoria_id);
        const categoryName = category?.nombre || 'Sin categoría';
        
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'material-suggestion-item';
        suggestionItem.dataset.materialCode = material.codigo;
        suggestionItem.setAttribute('role', 'option');
        suggestionItem.setAttribute('tabindex', '-1');
        
        // Resaltar texto coincidente
        const highlightText = (text, query) => {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<mark style="background: #F97316; color: white; padding: 1px 2px; border-radius: 2px;">$1</mark>');
        };

        suggestionItem.innerHTML = `
            <div class="suggestion-main">
                <img src="${material.ruta_imagen}" alt="${material.nombre}" class="suggestion-image" loading="lazy">
                <div class="suggestion-details">
                    <div class="suggestion-title">${highlightText(material.codigo, query)} - ${highlightText(material.nombre, query)}</div>
                    <div class="suggestion-subtitle">${highlightText(categoryName, query)} • ${material.ancho_cm}×${material.alto_cm}cm</div>
                </div>
                <div class="suggestion-price">${formatCurrency(material.costo_crudo)}</div>
            </div>
        `;
        
        // Event listener directo para mejor performance
        suggestionItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectMaterial(material);
            hideMaterialSuggestions();
            // Mover foco al siguiente campo inmediatamente
            setTimeout(() => {
                document.getElementById('item-width-input')?.focus();
            }, 10);
        });
        
        // Soporte táctil mejorado
        suggestionItem.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectMaterial(material);
            hideMaterialSuggestions();
            setTimeout(() => {
                document.getElementById('item-width-input')?.focus();
            }, 10);
        });
        
        materialSuggestions.appendChild(suggestionItem);
    });

    console.log('📋 Sugerencias agregadas al DOM:', materialSuggestions.children.length);
    
    materialSuggestions.classList.remove('hidden');
    materialSuggestions.setAttribute('role', 'listbox');
    materialSuggestions.setAttribute('aria-label', 'Sugerencias de materiales');
    
    console.log('📋 Contenedor de sugerencias mostrado');
}

/**
 * Oculta las sugerencias de materiales
 */
function hideMaterialSuggestions() {
    materialSuggestions.classList.add('hidden');
    highlightedIndex = -1;
}

/**
 * Actualiza el resaltado de la sugerencia seleccionada
 */
function updateHighlight() {
    const items = materialSuggestions.querySelectorAll('.material-suggestion-item');
    items.forEach((item, index) => {
        item.classList.toggle('highlighted', index === highlightedIndex);
    });
}

/**
 * Selecciona un material y muestra las tarjetas de precio
 */
function selectMaterial(material) {
    selectedMaterial = material;
    const category = state.categories.find(c => c.id === material.categoria_id);
    
    // Actualizar el input con el código del material
    materialSearchInput.value = material.codigo;
    
    // Llenar ambas tarjetas con la información del material
    const materialInfo = {
        image: material.ruta_imagen,
        name: `${material.codigo} - ${material.nombre}`,
        details: `${category?.nombre || 'Sin categoría'} • ${material.ancho_cm}×${material.alto_cm}cm`,
        providerCost: formatCurrency(material.costo_crudo),
        clientCost: formatCurrency(material.precio_venta || material.costo_crudo * 1.7)
    };
    
    // Tarjeta proveedor
    document.getElementById('selected-material-image-provider').src = materialInfo.image;
    document.getElementById('selected-material-image-provider').alt = material.nombre;
    document.getElementById('selected-material-name-provider').textContent = materialInfo.name;
    document.getElementById('selected-material-details-provider').textContent = materialInfo.details;
    document.getElementById('selected-material-cost-provider').textContent = materialInfo.providerCost;
    
    // Tarjeta cliente
    document.getElementById('selected-material-image-client').src = materialInfo.image;
    document.getElementById('selected-material-image-client').alt = material.nombre;
    document.getElementById('selected-material-name-client').textContent = materialInfo.name;
    document.getElementById('selected-material-details-client').textContent = materialInfo.details;
    document.getElementById('selected-material-cost-client').textContent = materialInfo.clientCost;
    
    // Mostrar las tarjetas
    selectedMaterialInfo.classList.remove('hidden');
    document.getElementById('price-selection-indicator').classList.remove('hidden');
    
    // Reset visual state
    document.querySelectorAll('.price-card').forEach(card => {
        card.classList.remove('selected-provider', 'selected-client');
    });
    
    // Seleccionar automáticamente la tarjeta de proveedor por defecto
    selectPriceType('provider');
    
    // Mostrar los campos de medidas y botón agregar
    document.getElementById('dimensions-and-submit').classList.remove('hidden');
    
    // Setup click handlers for price cards con soporte táctil mejorado
    const providerCard = document.getElementById('price-card-provider');
    const clientCard = document.getElementById('price-card-client');
    
    // Limpiar event listeners existentes
    providerCard.onclick = null;
    clientCard.onclick = null;
    
    // Agregar event listeners con soporte táctil
    providerCard.addEventListener('click', () => selectPriceType('provider'));
    providerCard.addEventListener('touchend', (e) => {
        e.preventDefault();
        selectPriceType('provider');
    });
    
    clientCard.addEventListener('click', () => selectPriceType('client'));
    clientCard.addEventListener('touchend', (e) => {
        e.preventDefault();
        selectPriceType('client');
    });
    
    // Scroll suave para asegurar que las tarjetas sean visibles en móvil
    setTimeout(() => {
        selectedMaterialInfo.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
        });
    }, 100);
}

/**
 * Limpia la selección de material
 */
function clearSelectedMaterial() {
    if (!selectedMaterialInfo) initializeDOMReferences();
    
    selectedMaterial = null;
    selectedPriceType = null;
    selectedMaterialInfo.classList.add('hidden');
    
    // Ocultar también los campos de medidas y botón
    document.getElementById('dimensions-and-submit').classList.add('hidden');
    
    // Reset visual state
    document.querySelectorAll('.price-card').forEach(card => {
        card.classList.remove('selected-provider', 'selected-client');
    });
}

/**
 * Obtiene el material actualmente seleccionado y su tipo de precio
 */
export function getSelectedMaterial() {
    return selectedMaterial;
}

/**
 * Obtiene el tipo de precio seleccionado
 */
export function getSelectedPriceType() {
    return selectedPriceType;
}

/**
 * Obtiene el precio efectivo basado en la selección
 */
export function getEffectivePrice() {
    if (!selectedMaterial || !selectedPriceType) return null;
    
    if (selectedPriceType === 'provider') {
        return selectedMaterial.costo_crudo;
    } else {
        return selectedMaterial.precio_venta || selectedMaterial.costo_crudo * 1.7;
    }
}



/**
 * Limpia y resetea el formulario de "Agregar Pieza".
 */
export function resetAddItemForm() {
    if (!materialSearchInput) initializeDOMReferences();
    
    // Limpiar campos de medidas de forma más explícita
    const widthInput = document.getElementById('item-width-input');
    const heightInput = document.getElementById('item-height-input');
    
    widthInput.value = '';
    heightInput.value = '';
    
    // Forzar el reset de los valores
    widthInput.setAttribute('value', '');
    heightInput.setAttribute('value', '');
    
    // No limpiar el material seleccionado para mantener la velocidad
    // Los campos de medidas permanecen visibles si hay un material seleccionado
    widthInput.focus();
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
    
    // Seleccionar el material
    selectMaterial(material);

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

    materialSearchInput.value = '';
    clearSelectedMaterial();
    document.getElementById('item-width-input').value = '';
    document.getElementById('item-height-input').value = '';

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
    const now = new Date();

    let itemsHtml = state.quoteItems.map(item => {
        const itemPriceType = item.priceType === 'client' ? 'precio_venta' : 'costo_crudo';
        const rawItemCost = calculateItemCost(item, state.materials, itemPriceType);
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
            <img src="assets/images/logo.svg" alt="Logo" class="h-16 mx-auto mb-4">
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
    // Calcular el resumen usando los tipos de precio individuales de cada item
    const summary = calculateSummary(state.quoteItems, state.additionalCosts, state.materials);
    renderQuoteTable(summary);
    renderSummary(summary);
}

/**
 * Configura los event handlers para las tarjetas de precio
 */
function setupPriceCardHandlers() {
    const providerCard = document.getElementById('price-card-provider');
    const clientCard = document.getElementById('price-card-client');
    
    // Remove existing listeners
    providerCard.replaceWith(providerCard.cloneNode(true));
    clientCard.replaceWith(clientCard.cloneNode(true));
    
    // Get fresh references
    const newProviderCard = document.getElementById('price-card-provider');
    const newClientCard = document.getElementById('price-card-client');
    
    newProviderCard.addEventListener('click', () => selectPriceType('provider'));
    newClientCard.addEventListener('click', () => selectPriceType('client'));
}

/**
 * Selecciona el tipo de precio y actualiza la UI
 */
function selectPriceType(priceType) {
    selectedPriceType = priceType;
    
    // Reset all cards
    document.querySelectorAll('.price-card').forEach(card => {
        card.classList.remove('selected-provider', 'selected-client');
    });
    
    // Highlight selected card
    if (priceType === 'provider') {
        document.getElementById('price-card-provider').classList.add('selected-provider');
        document.getElementById('selected-price-text').textContent = '💼 Calculando con precio de proveedor';
    } else {
        document.getElementById('price-card-client').classList.add('selected-client');
        document.getElementById('selected-price-text').textContent = '💰 Calculando con precio de cliente';
    }
}
