/**
 * state.js
 * 
 * Gestiona el estado centralizado de la aplicación.
 * Esto incluye el catálogo de materiales, los ítems de la cotización actual
 * y los costos adicionales.
 */

export const state = {
    materials: [], // Catálogo completo de materiales.
    categories: [], // Catálogo de categorías.
    quoteItems: [], // Piezas en la cotización actual.
    additionalCosts: {
        waste: 10,   // %
        labor: 50,   // S/.
        margin: 20,  // %
    },
    nextId: 1, // Para IDs únicos en las filas de la cotización.
    editingItemId: null, // ID del item que se está editando, o null si no hay ninguno.
    editingMaterialCode: null, // Código del material que se está editando.
    editingCategoryId: null, // ID de la categoría que se está editando.
};

// --- Funciones para modificar el estado (solo en memoria) ---

// --- Funciones para modificar el estado (Mutations) ---

export function setMaterials(materials) {
    state.materials = materials;
}

export function setCategories(categories) {
    state.categories = categories;
}

export function addQuoteItem(item) {
    state.quoteItems.push(item);
}

export function removeQuoteItem(itemId) {
    state.quoteItems = state.quoteItems.filter(item => item.id !== itemId);
}

export function updateQuoteItem(itemId, updatedValues) {
    const itemIndex = state.quoteItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        state.quoteItems[itemIndex] = { ...state.quoteItems[itemIndex], ...updatedValues };
    }
}

export function updateAdditionalCosts(costs) {
    state.additionalCosts = { ...state.additionalCosts, ...costs };
}

export function addCategory(category) {
    state.categories.push(category);
}

export function updateCategory(categoryId, updatedValues) {
    const categoryIndex = state.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex !== -1) {
        state.categories[categoryIndex] = { ...state.categories[categoryIndex], ...updatedValues };
    }
}

export function updateMaterial(materialCode, updatedValues) {
    const materialIndex = state.materials.findIndex(m => m.codigo === materialCode);
    if (materialIndex !== -1) {
        state.materials[materialIndex] = { ...state.materials[materialIndex], ...updatedValues };
    }
}

export function addMaterial(material) {
    state.materials.push(material);
}
