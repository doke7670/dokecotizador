/**
 * calculations.js
 * 
 * Contiene toda la lógica de cálculo para la cotización.
 * Son funciones puras que reciben datos y devuelven resultados.
 */

/**
 * Calcula el costo de una sola pieza de la cotización.
 * @param {object} item - El ítem de la cotización.
 * @param {Array} materials - El catálogo de materiales.
 * @param {string} priceType - Tipo de precio a usar ('costo_crudo' o 'precio_venta').
 * @returns {number} - El costo calculado para la pieza.
 */
export function calculateItemCost(item, materials, priceType = 'costo_crudo') {
    if (!item.materialCode || !item.width || !item.height) {
        return 0;
    }

    const material = materials.find(m => m.codigo === item.materialCode);
    if (!material) {
        return 0;
    }

    const materialArea = material.ancho_cm * material.alto_cm;
    if (materialArea === 0) return 0;

    // Usar el tipo de precio seleccionado
    const materialPrice = material[priceType] || material.costo_crudo;
    const unitCost = materialPrice / materialArea; // Costo por cm²
    const itemArea = item.width * item.height;
    
    return itemArea * unitCost;
}

/**
 * Calcula todos los totales para el resumen.
 * @param {Array} quoteItems - Lista de ítems en la cotización.
 * @param {object} additionalCosts - Objeto con desperdicio, mano de obra y margen.
 * @param {Array} materials - El catálogo de materiales.
 * @returns {object} - Un objeto con todos los totales calculados.
 */
export function calculateSummary(quoteItems, additionalCosts, materials) {
    // Calcular subtotal usando el tipo de precio individual de cada item
    const subtotal = quoteItems.reduce((acc, item) => {
        const itemPriceType = item.priceType === 'client' ? 'precio_venta' : 'costo_crudo';
        return acc + calculateItemCost(item, materials, itemPriceType);
    }, 0);
    
    const wasteCost = subtotal * (additionalCosts.waste / 100);
    const laborCost = Number(additionalCosts.labor);
    const projectSubtotal = subtotal + wasteCost + laborCost;
    const marginAmount = projectSubtotal * (additionalCosts.margin / 100);
    const grandTotal = projectSubtotal + marginAmount;

    return { subtotal, wasteCost, laborCost, projectSubtotal, marginAmount, grandTotal };
}

/**
 * Calcula el costo final de un ítem distribuyendo los costos adicionales proporcionalmente.
 * @param {number} rawItemCost - El costo crudo del material para este ítem.
 * @param {number} rawSubtotal - El subtotal de todos los costos crudos de materiales.
 * @param {number} grandTotal - El total final de la cotización (con todos los costos).
 * @returns {number} - El costo final y prorrateado del ítem.
 */
export function calculateProratedItemCost(rawItemCost, rawSubtotal, grandTotal) {
    if (rawSubtotal === 0) return 0;
    const scalingFactor = grandTotal / rawSubtotal;
    return rawItemCost * scalingFactor;
}
