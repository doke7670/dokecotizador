// js/calculator.js
// Lógica de negocio: todos los cálculos
const calculator = (() => {

    // Calcula el costo del proveedor final por m2 (ya incluye el ajuste del proveedor)
    function calcularCostoProveedorFinal(material) {
        const base = material.costo_base_proveedor_m2;
        const ajuste = material.ajuste_proveedor_pct;
        return base + (base * ajuste / 100);
    }

    // Determina el costo base por m2 según el tipo de precio seleccionado
    function getItemBasePricePerM2(material, tipoPrecio) {
        if (tipoPrecio === 'proveedor') {
            return calcularCostoProveedorFinal(material);
        } else { // 'cliente'
            return material.costo_cliente_m2;
        }
    }

    // Calcula el área en m2 a partir de cm
    function calculateArea(heightCm, widthCm) {
        if (!heightCm || !widthCm || heightCm <= 0 || widthCm <= 0) return 0;
        return (heightCm / 100) * (widthCm / 100); // Convertir cm a metros
    }

    /**
     * Calcula el costo interno y el precio de venta unitario para un único ítem,
     * aplicando los parámetros de venta opcionales.
     * @param {object} material - El objeto material seleccionado.
     * @param {number} area - El área calculada del ítem en m².
     * @param {string} tipoPrecio - 'proveedor' o 'cliente'.
     * @param {object} ventaParams - Los parámetros de venta activos (desperdicio, mano de obra, ganancia).
     * @returns {object} { costoMaterial, precioVentaUnitario }
     */
    function calculateItemFullPrice(material, area, tipoPrecio, ventaParams) {
        // 1. Costo Base del Material (por pieza)
        const basePricePerM2 = getItemBasePricePerM2(material, tipoPrecio);
        let costoMaterialBase = area * basePricePerM2; // Costo sin desperdicio

        // 2. Aplicar Desperdicio (opcional)
        let costoConDesperdicio = costoMaterialBase;
        if (ventaParams.desperdicioActivo && ventaParams.desperdicioPct > 0) {
            costoConDesperdicio *= (1 + (ventaParams.desperdicioPct / 100));
        }

        // Este es el COSTO INTERNO final que se mostrará en la tabla
        const costoMaterialUnitario = costoConDesperdicio;

        // 3. Aplicar Mano de Obra (opcional)
        let costoInternoTotal = costoMaterialUnitario; // Ahora incluye el desperdicio
        if (ventaParams.manoDeObraActiva && ventaParams.manoDeObraMonto > 0) {
            costoInternoTotal += ventaParams.manoDeObraMonto;
        }

        // 4. Aplicar Ganancia (opcional)
        let precioVentaUnitario = costoInternoTotal; // Base para la ganancia
        if (ventaParams.gananciaActiva && ventaParams.gananciaValor > 0) {
            if (ventaParams.gananciaTipo === 'percent') {
                precioVentaUnitario *= (1 + (ventaParams.gananciaValor / 100));
            } else { // 'fixed'
                precioVentaUnitario += ventaParams.gananciaValor;
            }
        }
        
        return {
            costoMaterialUnitario: costoMaterialUnitario, // Este es el "costo interno" unitario incluyendo desperdicio
            precioVentaUnitario: precioVentaUnitario // Este es el "precio de venta" unitario final
        };
    }

    /**
     * Calcula el resumen total de la cotización, sumando los subtotales de los trabajos.
     * @param {array} jobs - Array de objetos de trabajo, cada uno con un subtotal.
     * @returns {object} { totalFinal }
     */
    function calculateSummaryTotal(jobs) {
        const totalFinal = jobs.reduce((sum, job) => sum + job.subtotal, 0);
        return {
            totalFinal: totalFinal
        };
    }

    return {
        calcularCostoProveedorFinal, // Se mantiene por si se necesita directamente
        getItemBasePricePerM2,
        calculateArea,
        calculateItemFullPrice,
        calculateSummaryTotal
    };
})();
