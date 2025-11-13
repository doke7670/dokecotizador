/**
 * main.js
 * 
 * Punto de entrada de la aplicación.
 * Orquesta la carga de datos, la inicialización de la UI
 * y la gestión de eventos.
 */

console.log("✅ main.js cargado y ejecutándose...");

import { state, setMaterials, addQuoteItem, removeQuoteItem, updateAdditionalCosts, setCategories, updateQuoteItem, updateMaterial, addCategory, updateCategory, addMaterial } from './state.js';
import { updateUI, toggleModal, resetMaterialForm, renderCatalog, renderPdfPreview, populateCategorySelect, updateMaterialSelect, resetAddItemForm, renderItemDetailsModal, populateFormForEdit, cancelEditMode, populateMaterialFormForEdit, renderCategoryManagementModal, populateCategoryFormForEdit, cancelCategoryEditMode } from './ui.js';
import { generatePdfFromHtml, generateSimplePdf } from './pdfGenerator.js';
import { downloadMaterials, downloadCategories } from './dataExport.js';
import { calculateSummary, calculateItemCost, calculateProratedItemCost } from './calculations.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Carga los datos iniciales y configura los listeners.
 */
async function initializeApp() {
    try {
        // Carga los datos desde los archivos JSON base
        console.log("📁 Cargando datos desde archivos JSON...");
        const [materialsRes, categoriesRes] = await Promise.all([
            fetch('data/materials.json'),
            fetch('data/categories.json')
        ]);
        const materials = await materialsRes.json();
        const categories = await categoriesRes.json();

        // Establece el estado, asegurando que la propiedad `isActive` exista.
        const allCategoriesWithStatus = categories.map(c => ({ ...c, isActive: c.isActive ?? true }));
        const allMaterialsWithStatus = materials.map(m => ({ ...m, isActive: m.isActive ?? true }));

        setCategories(allCategoriesWithStatus);
        setMaterials(allMaterialsWithStatus);

        // Sincronizar los inputs de costos adicionales con el estado inicial
        document.getElementById('waste-input').value = state.additionalCosts.waste;
        document.getElementById('labor-input').value = state.additionalCosts.labor;
        document.getElementById('margin-input').value = state.additionalCosts.margin;

        setupEventListeners();
        updateUI();
        populateCategorySelect();
        renderCatalog();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        alert('No se pudo cargar el catálogo de materiales. Por favor, recarga la página.');
    }
}

/**
 * Configura todos los event listeners de la aplicación.
 */
function setupEventListeners() {
    // Formulario para agregar piezas
    document.getElementById('add-item-form').addEventListener('submit', handleAddItemFormSubmit);
    document.getElementById('category-select').addEventListener('change', handleCategoryChange);
    document.getElementById('cancel-edit-btn').addEventListener('click', handleCancelEdit);

    // Event delegation para la tabla de cotización
    document.getElementById('quote-table-body').addEventListener('click', handleTableClick);

    // Inputs de costos adicionales
    document.getElementById('waste-input').addEventListener('input', handleAdditionalCostsChange);
    document.getElementById('labor-input').addEventListener('input', handleAdditionalCostsChange);
    document.getElementById('margin-input').addEventListener('input', handleAdditionalCostsChange);

    // Modales
    document.getElementById('open-catalog-modal-btn').addEventListener('click', () => toggleModal('catalog-modal', true));
    document.getElementById('close-catalog-modal-btn').addEventListener('click', () => toggleModal('catalog-modal', false));
    
    document.getElementById('open-add-material-modal-btn').addEventListener('click', () => {
        resetMaterialForm();
        toggleModal('add-material-modal', true);
    });
    document.getElementById('cancel-add-material-btn').addEventListener('click', () => toggleModal('add-material-modal', false));
    
    document.getElementById('close-view-item-modal-btn').addEventListener('click', () => toggleModal('view-item-modal', false));

    // Formulario para agregar nuevo material
    document.getElementById('add-material-form').addEventListener('submit', handleAddMaterialSubmit);

    // Generación de PDF
    document.getElementById('generate-pdf-btn').addEventListener('click', handleGeneratePdf);
    document.getElementById('close-pdf-preview-btn').addEventListener('click', () => toggleModal('pdf-preview-modal', false));
    document.getElementById('download-pdf-btn').addEventListener('click', handleDownloadPdf);
    
    // Exportar datos
    document.getElementById('export-data-btn').addEventListener('click', handleExportData);
    
    // PDF simple alternativo
    document.getElementById('simple-pdf-btn').addEventListener('click', handleDownloadSimplePdf);

    // Listeners del Catálogo de Materiales
    document.getElementById('catalog-search-input').addEventListener('input', handleCatalogSearch);
    document.getElementById('catalog-filter-controls').addEventListener('click', handleCatalogFilterClick);
    document.getElementById('catalog-list').addEventListener('click', handleCatalogListClick);

    // Listeners de Administración de Categorías
    document.getElementById('open-category-modal-btn').addEventListener('click', handleOpenCategoryModal);
    document.getElementById('close-category-modal-btn').addEventListener('click', () => toggleModal('category-management-modal', false));
    document.getElementById('category-form').addEventListener('submit', handleCategoryFormSubmit);
    document.getElementById('cancel-category-edit-btn').addEventListener('click', handleCancelCategoryEdit);
    document.getElementById('active-categories-list').addEventListener('click', handleCategoryActions);
    document.getElementById('deleted-categories-list').addEventListener('click', handleCategoryActions);
}

function handleAddItemFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const materialCode = form.elements['material-select'].value;
    const width = Number(form.elements['item-width-input'].value);
    const height = Number(form.elements['item-height-input'].value);

    if (!materialCode || width <= 0 || height <= 0) {
        alert('Por favor, completa todos los campos del formulario con valores válidos.');
        return;
    }

    const itemData = { materialCode, width, height };

    if (state.editingItemId !== null) {
        // Actualizar ítem existente
        updateQuoteItem(state.editingItemId, itemData);
    } else {
        // Agregar nuevo ítem
        const newItem = {
            id: state.nextId++,
            ...itemData,
        };
        addQuoteItem(newItem);
    }
    
    updateUI();
    
    if (state.editingItemId !== null) {
        cancelEditMode(); // Resetear completamente el formulario después de editar
    } else {
        resetAddItemForm(); // Resetear parcialmente el formulario después de agregar
    }
}

function handleTableClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const row = button.closest('tr');
    const itemId = Number(row.dataset.itemId);

    if (action === 'delete-item') {
        if (confirm('¿Estás seguro de que quieres eliminar esta pieza?')) {
            if (state.editingItemId === itemId) {
                cancelEditMode(); // Si se elimina el ítem que se está editando, cancelar edición.
            }
            removeQuoteItem(itemId);
            updateUI();
        }
    } else if (action === 'view-item') {
        renderItemDetailsModal(itemId);
    } else if (action === 'edit-item') {
        populateFormForEdit(itemId);
    }
}

function handleCategoryChange(e) {
    updateMaterialSelect(e.target.value);
}

function handleCancelEdit() {
    cancelEditMode();
}

function handleAdditionalCostsChange() {
    const waste = Number(document.getElementById('waste-input').value) || 0;
    const labor = Number(document.getElementById('labor-input').value) || 0;
    const margin = Number(document.getElementById('margin-input').value) || 0;
    updateAdditionalCosts({ waste, labor, margin });
    updateUI();
}

async function handleAddMaterialSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const imageFile = form.elements['material-imagen-input'].files[0];
    let imageUrl;

    if (imageFile) {
        try {
            imageUrl = await readFileAsDataURL(imageFile);
        } catch (error) {
            console.error("Error al leer la imagen:", error);
            alert("Hubo un error al procesar la imagen. Se usará una por defecto.");
        }
    }

    const materialData = {
        nombre: form.elements['material-nombre'].value,
        categoria_id: form.elements['material-categoria-select'].value,
        ancho_cm: Number(form.elements['material-ancho'].value),
        alto_cm: Number(form.elements['material-alto'].value),
        costo_crudo: Number(form.elements['material-costo'].value),
        descripcion: form.elements['material-descripcion'].value,
    };

    if (imageUrl) {
        materialData.ruta_imagen = imageUrl;
    }

    if (state.editingMaterialCode) {
        // Actualizar material existente
        updateMaterial(state.editingMaterialCode, materialData);
    } else {
        // Crear nuevo material
        const newMaterial = {
            ...materialData,
            codigo: `CUSTOM-${Date.now()}`,
            isActive: true,
            ruta_imagen: imageUrl || 'https://via.placeholder.com/150/808080/FFFFFF?text=Custom',
        };
        addMaterial(newMaterial);
    }
    
    toggleModal('add-material-modal', false);
    renderCatalog();
    populateCategorySelect();
    updateUI(); 
}

function handleGeneratePdf() {
    renderPdfPreview();
    toggleModal('pdf-preview-modal', true);
}

function handleDownloadPdf() {
    try {
        // Intentar generar PDF con html2canvas primero
        generatePdfFromHtml('pdf-content', `Cotizacion-${Date.now()}.pdf`);
    } catch (error) {
        console.error('Error con método principal, usando método alternativo:', error);
        // Si falla, usar el método simple
        handleDownloadSimplePdf();
    }
}

async function handleDownloadSimplePdf() {
    const summary = calculateSummary(state.quoteItems, state.additionalCosts, state.materials);
    
    const quoteData = {
        items: state.quoteItems.map(item => {
            const material = state.materials.find(m => m.codigo === item.materialCode);
            const rawItemCost = calculateItemCost(item, state.materials);
            const finalItemCost = calculateProratedItemCost(rawItemCost, summary.subtotal, summary.grandTotal);
            
            return {
                name: material?.nombre || 'N/A',
                dimensions: `${item.width}cm x ${item.height}cm`,
                price: `S/. ${finalItemCost.toFixed(2)}`
            };
        }),
        total: `S/. ${summary.grandTotal.toFixed(2)}`
    };
    
    try {
        await generateSimplePdf(quoteData, `Cotizacion-${Date.now()}.pdf`);
        console.log('✅ PDF simple generado con logo');
    } catch (error) {
        console.error('❌ Error generando PDF simple:', error);
        alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
}

function handleExportData() {
    if (confirm('¿Deseas descargar los archivos JSON actualizados?\n\nEsto descargará materials.json y categories.json con todos tus cambios.\nLuego deberás reemplazar manualmente los archivos en la carpeta data/.')) {
        downloadMaterials(state.materials);
        setTimeout(() => {
            downloadCategories(state.categories);
            alert('📁 Archivos descargados exitosamente!\n\n1. Ve a tu carpeta de Descargas\n2. Reemplaza materials.json y categories.json en la carpeta data/\n3. Los cambios serán permanentes');
        }, 500);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// --- Nuevas Funciones de Catálogo y Categorías ---

function handleCatalogSearch(e) {
    const searchTerm = e.target.value;
    const activeFilterButton = document.querySelector('#catalog-filter-controls button.bg-orange-500');
    const activeFilter = activeFilterButton ? activeFilterButton.dataset.filter : 'active';
    renderCatalog(activeFilter, searchTerm);
}

function handleCatalogFilterClick(e) {
    const button = e.target.closest('button[data-filter]');
    if (!button) return;

    // Actualizar estilos de botones de filtro
    document.querySelectorAll('#catalog-filter-controls button').forEach(btn => {
        btn.classList.remove('bg-orange-500');
        btn.classList.add('bg-gray-600', 'hover:bg-gray-500');
    });
    button.classList.add('bg-orange-500');
    button.classList.remove('bg-gray-600', 'hover:bg-gray-500');

    const searchTerm = document.getElementById('catalog-search-input').value;
    renderCatalog(button.dataset.filter, searchTerm);
}

function handleCatalogListClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const card = button.closest('[data-material-code]');
    const materialCode = card.dataset.materialCode;

    if (action === 'edit-material') {
        populateMaterialFormForEdit(materialCode);
    } else if (action === 'delete-material') {
        if (confirm('¿Seguro que quieres eliminar este material? Quedará oculto y podrás restaurarlo.')) {
            updateMaterial(materialCode, { isActive: false });
            renderCatalog();
        }
    } else if (action === 'restore-material') {
        updateMaterial(materialCode, { isActive: true });
        renderCatalog('deleted');
    }
}

function handleOpenCategoryModal() {
    renderCategoryManagementModal();
    toggleModal('category-management-modal', true);
}

function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('category-name-input');
    const name = nameInput.value.trim();
    if (!name) return;

    if (state.editingCategoryId) {
        // Editar
        updateCategory(state.editingCategoryId, { nombre: name });
    } else {
        // Agregar
        const newCategory = {
            id: `CAT-CUSTOM-${Date.now()}`,
            nombre: name,
            isActive: true,
        };
        addCategory(newCategory);
    }

    cancelCategoryEditMode();
    renderCategoryManagementModal();
    populateCategorySelect();
    populateCategorySelectInModal();
}

function handleCancelCategoryEdit() {
    cancelCategoryEditMode();
}

function handleCategoryActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const li = button.closest('[data-category-id]');
    const categoryId = li.dataset.categoryId;

    if (action === 'edit-category') {
        populateCategoryFormForEdit(categoryId);
    } else if (action === 'delete-category') {
        // Check if the category is being used by any active material
        const isCategoryInUse = state.materials.some(material => 
            material.categoria_id === categoryId && (material.isActive ?? true)
        );

        if (isCategoryInUse) {
            alert('No se puede eliminar esta categoría porque todavía hay materiales activos que la están utilizando.\n\nPor favor, elimine o reasigne esos materiales primero.');
            return; // Stop the deletion process
        }

        if (confirm('¿Seguro que quieres eliminar esta categoría? Quedará oculta y podrás restaurarla.')) {
            updateCategory(categoryId, { isActive: false });
            renderCategoryManagementModal();
            populateCategorySelect();
            populateCategorySelectInModal();
        }
    } else if (action === 'restore-category') {
        updateCategory(categoryId, { isActive: true });
        renderCategoryManagementModal();
        populateCategorySelect();
        populateCategorySelectInModal();
    }
}
