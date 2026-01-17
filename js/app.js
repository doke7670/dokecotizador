// js/app.js
// Orquestador principal: inicializa y conecta todo
document.addEventListener('DOMContentLoaded', async () => {
    



    console.log('App inicializada.');

    // Estado central de la aplicación
    const appState = {
        materials: [],
        trabajos: [], // Array de objetos { ..., gananciaUnitaria, gananciaTotalItem, ... }
        editingJobIndex: null, // Índice del trabajo que se está editando
        selectedMaterial: null,
        isAddingMore: false, // Nuevo: indica si estamos en modo "Agregar más"
        currentJobInputs: {
            height: 0,
            width: 0,
            description: '',
            tipoPrecio: 'cliente',
            incluirAdicional: false
        },
        ventaParams: {
            desperdicioActivo: uiController.DOMElements.vpWasteActive.checked,
            desperdicioPct: parseFloat(uiController.DOMElements.vpWastePctInput.value) || 0,
            manoDeObraActiva: uiController.DOMElements.vpLaborActive.checked,
            manoDeObraMonto: parseFloat(uiController.DOMElements.vpLaborCostInput.value) || 0,
            gananciaActiva: uiController.DOMElements.vpProfitActive.checked,
            gananciaTipo: uiController.DOMElements.vpProfitType.value,
            gananciaValor: parseFloat(uiController.DOMElements.vpProfitValueInput.value) || 0
        },
        summary: {
            totalFinal: 0
        }
    };

    // 1. Cargar materiales
    appState.materials = await dataService.loadMaterials();
    if (appState.materials.length === 0) {
        alert('Error: No se pudieron cargar los materiales. Por favor, revisa data/materials.json y asegúrate de usar un servidor local.');
        return;
    }

    // Funciones de actualización
    const updateCalculations = () => {
        const area = calculator.calculateArea(
            appState.currentJobInputs.height,
            appState.currentJobInputs.width
        );
        uiController.updateAreaDisplay(area);

        if (appState.selectedMaterial && area > 0) {
            const { costoMaterialUnitario, precioVentaUnitario } = calculator.calculateItemFullPrice(
                appState.selectedMaterial,
                area,
                appState.currentJobInputs.tipoPrecio,
                appState.currentJobInputs.incluirAdicional,
                appState.ventaParams
            );
            uiController.updatePreviewPrecioVenta(precioVentaUnitario);
            // Costo base sin parámetros de venta
            const costoBase = appState.currentJobInputs.tipoPrecio === 'proveedor' 
                ? appState.selectedMaterial.costo_base_proveedor_m2 * area
                : appState.selectedMaterial.costo_cliente_m2 * area;
            uiController.updateCostDisplay(costoBase);
        } else {
            uiController.updatePreviewPrecioVenta(0);
            uiController.updateCostDisplay(0);
        }

        appState.summary = calculator.calculateSummaryTotal(appState.trabajos);
        uiController.updateSummary(appState.summary);
    };

    // Inicializar el estado de los checkboxes de ventaParams
    uiController.toggleVentaParamsInputs(appState.ventaParams);

    // 2. Manejo del input de búsqueda y selección
    uiController.DOMElements.searchInput.addEventListener('input', (event) => {
        const query = event.target.value;
        const results = dataService.searchMaterials(query);
        uiController.displaySearchResults(results);
    });
    uiController.DOMElements.searchInput.addEventListener('blur', () => {
        // Solo cerrar el dropdown si no se está clickeando en él
        if (!uiController.DOMElements.searchResults.contains(event.relatedTarget)) {
            setTimeout(() => uiController.hideSearchResults(), 100);
        }
    });
    uiController.DOMElements.searchResults.addEventListener('mousedown', (event) => {
        // Usar mousedown en lugar de click para que se ejecute antes del blur
        const codigo = event.target.dataset.codigo;
        if (codigo) {
            appState.selectedMaterial = dataService.getMaterialByCode(codigo);
            uiController.displaySelectedMaterial(appState.selectedMaterial);
            uiController.DOMElements.ventaParamsCard.style.display = 'block';
            
            appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'cliente' };
            uiController.DOMElements.descriptionInput.value = '';
            uiController.DOMElements.heightInput.value = '';
            uiController.DOMElements.widthInput.value = '';
            uiController.DOMElements.rbProveedor.checked = false;
            uiController.DOMElements.rbCliente.checked = true;
            
            updateCalculations();
            uiController.hideSearchResults();
            uiController.DOMElements.searchInput.blur();
        }
    });

    // 3. Manejo de inputs del formulario de ítem
    ['heightInput', 'widthInput', 'descriptionInput'].forEach(key => {
        uiController.DOMElements[key].addEventListener('input', (event) => {
            let value;
            if (key === 'descriptionInput') {
                value = event.target.value; // La descripción es una cadena, no se parsea como número
            } else {
                value = parseFloat(event.target.value) || 0; // Alto y ancho son números
            }
            appState.currentJobInputs[key.replace('Input', '')] = value;
            updateCalculations();
        });
    });
    ['rbProveedor', 'rbCliente'].forEach(key => {
        uiController.DOMElements[key].addEventListener('change', () => {
            appState.currentJobInputs.tipoPrecio = key.replace('rb', '').toLowerCase();
            updateCalculations();
        });
    });

    // 4. Manejo de Parámetros de Venta
    const ventaParamsChangeHandler = () => {
        appState.ventaParams.desperdicioActivo = uiController.DOMElements.vpWasteActive.checked;
        appState.ventaParams.desperdicioPct = parseFloat(uiController.DOMElements.vpWastePctInput.value) || 0;
        appState.ventaParams.manoDeObraActiva = uiController.DOMElements.vpLaborActive.checked;
        appState.ventaParams.manoDeObraMonto = parseFloat(uiController.DOMElements.vpLaborCostInput.value) || 0;
        appState.ventaParams.gananciaActiva = uiController.DOMElements.vpProfitActive.checked;
        appState.ventaParams.gananciaTipo = uiController.DOMElements.vpProfitType.value;
        appState.ventaParams.gananciaValor = parseFloat(uiController.DOMElements.vpProfitValueInput.value) || 0;
        uiController.toggleVentaParamsInputs(appState.ventaParams);
        updateCalculations();
    };
    [
        'vpWasteActive', 'vpWastePctInput', 'vpLaborActive', 'vpLaborCostInput', 
        'vpProfitActive', 'vpProfitType', 'vpProfitValueInput'
    ].forEach(key => {
        const element = uiController.DOMElements[key];
        const eventType = element.type === 'checkbox' || element.type === 'select-one' ? 'change' : 'input';
        element.addEventListener(eventType, ventaParamsChangeHandler);
    });


    function addJob() {
        if (!appState.selectedMaterial) {
            alert('Por favor, selecciona un material primero.');
            return;
        }
        if (appState.currentJobInputs.height <= 0 || appState.currentJobInputs.width <= 0) {
            alert('Por favor, ingresa alto y ancho válidos.');
            return;
        }

        const area = calculator.calculateArea(appState.currentJobInputs.height, appState.currentJobInputs.width);
        const { costoMaterialUnitario, precioVentaUnitario } = calculator.calculateItemFullPrice(
            appState.selectedMaterial, area, appState.currentJobInputs.tipoPrecio, appState.currentJobInputs.incluirAdicional, appState.ventaParams
        );

        const cantidad = 1;
        const gananciaUnitaria = precioVentaUnitario - costoMaterialUnitario;

        const newJob = {
            descripcion: appState.currentJobInputs.description,
            material: appState.selectedMaterial,
            medidas: { alto: appState.currentJobInputs.height, ancho: appState.currentJobInputs.width, area: area },
            cantidad: cantidad,
            costoMaterialUnitario: costoMaterialUnitario,
            costoMaterialTotal: costoMaterialUnitario * cantidad,
            gananciaUnitaria: gananciaUnitaria,
            gananciaTotalItem: gananciaUnitaria * cantidad,
            precioVentaUnitario: precioVentaUnitario,
            subtotal: precioVentaUnitario * cantidad,
            paramsUsados: { ...appState.ventaParams, tipoPrecio: appState.currentJobInputs.tipoPrecio, incluirAdicional: appState.currentJobInputs.incluirAdicional }
        };

        appState.trabajos.push(newJob);
        uiController.updateJobsTable(appState.trabajos);
        uiController.resetItemForm();
        uiController.DOMElements.ventaParamsCard.style.display = 'none';
        document.getElementById('editing-indicator').style.display = 'none';
        appState.selectedMaterial = null;
        appState.isAddingMore = false;
        appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'cliente', incluirAdicional: false };
        
        updateCalculations();
        uiController.showToast('✓ Trabajo agregado correctamente', 'success');
    }

    function updateJob() {
        const jobIndex = appState.editingJobIndex;
        if (jobIndex === null) return;

        const originalJob = appState.trabajos[jobIndex];

        const area = calculator.calculateArea(appState.currentJobInputs.height, appState.currentJobInputs.width);
        const { costoMaterialUnitario, precioVentaUnitario } = calculator.calculateItemFullPrice(
            appState.selectedMaterial, area, appState.currentJobInputs.tipoPrecio, appState.currentJobInputs.incluirAdicional, appState.ventaParams
        );

        const gananciaUnitaria = precioVentaUnitario - costoMaterialUnitario;

        const updatedJob = {
            ...originalJob,
            descripcion: appState.currentJobInputs.description,
            material: appState.selectedMaterial,
            medidas: { alto: appState.currentJobInputs.height, ancho: appState.currentJobInputs.width, area: area },
            costoMaterialUnitario: costoMaterialUnitario,
            precioVentaUnitario: precioVentaUnitario,
            gananciaUnitaria: gananciaUnitaria,
            paramsUsados: { ...appState.ventaParams, tipoPrecio: appState.currentJobInputs.tipoPrecio, incluirAdicional: appState.currentJobInputs.incluirAdicional }
        };

        updatedJob.costoMaterialTotal = updatedJob.costoMaterialUnitario * updatedJob.cantidad;
        updatedJob.gananciaTotalItem = updatedJob.gananciaUnitaria * updatedJob.cantidad;
        updatedJob.subtotal = updatedJob.precioVentaUnitario * updatedJob.cantidad;

        appState.trabajos[jobIndex] = updatedJob;
        
        cancelEditing();
        uiController.updateJobsTable(appState.trabajos);
        updateCalculations();
        uiController.showToast('✓ Trabajo actualizado correctamente', 'success');
    }

    function startEditing(index) {
        appState.editingJobIndex = index;
        const job = appState.trabajos[index];

        appState.selectedMaterial = job.material;
        appState.currentJobInputs = {
            height: job.medidas.alto,
            width: job.medidas.ancho,
            description: job.descripcion,
            tipoPrecio: job.paramsUsados.tipoPrecio,
            incluirAdicional: job.paramsUsados.incluirAdicional === undefined ? true : job.paramsUsados.incluirAdicional,
        };
        appState.ventaParams = { ...job.paramsUsados };

        uiController.displaySelectedMaterial(job.material);
        uiController.DOMElements.descriptionInput.value = job.descripcion;
        uiController.DOMElements.heightInput.value = job.medidas.alto;
        uiController.DOMElements.widthInput.value = job.medidas.ancho;
        uiController.DOMElements.rbProveedor.checked = job.paramsUsados.tipoPrecio === 'proveedor';
        uiController.DOMElements.rbCliente.checked = job.paramsUsados.tipoPrecio === 'cliente';
        
        uiController.DOMElements.vpWasteActive.checked = job.paramsUsados.desperdicioActivo;
        uiController.DOMElements.vpWastePctInput.value = job.paramsUsados.desperdicioPct || '';
        uiController.DOMElements.vpLaborActive.checked = job.paramsUsados.manoDeObraActiva;
        uiController.DOMElements.vpLaborCostInput.value = job.paramsUsados.manoDeObraMonto || '';
        uiController.DOMElements.vpProfitActive.checked = job.paramsUsados.gananciaActiva;
        uiController.DOMElements.vpProfitType.value = job.paramsUsados.gananciaTipo || 'percent';
        uiController.DOMElements.vpProfitValueInput.value = job.paramsUsados.gananciaValor || '';
        
        uiController.toggleVentaParamsInputs(job.paramsUsados);
        uiController.DOMElements.ventaParamsCard.style.display = 'block';
        uiController.setEditingMode(true);
        updateCalculations();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEditing() {
        appState.editingJobIndex = null;
        appState.isAddingMore = false;
        uiController.setEditingMode(false);
        uiController.resetItemForm();
        uiController.DOMElements.ventaParamsCard.style.display = 'none';
        document.getElementById('editing-indicator').style.display = 'none';
        appState.selectedMaterial = null;
        appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'cliente', incluirAdicional: false };
        updateCalculations();
    }

    // 5. Añadir o Actualizar ítem
    uiController.DOMElements.addItemBtn.addEventListener('click', () => {
        if (appState.editingJobIndex !== null) {
            updateJob();
        } else {
            addJob();
        }
    });

    uiController.DOMElements.cancelEditBtn.addEventListener('click', cancelEditing);
    
    // Toggle collapse de Parámetros de Venta
    const collapseBtn = document.getElementById('collapse-venta-params');
    const ventaParamsContent = document.getElementById('venta-params-content');
    
    if (collapseBtn && ventaParamsContent) {
        // Cerrado por defecto
        collapseBtn.classList.add('collapsed');
        ventaParamsContent.classList.add('collapsed');
        
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            collapseBtn.classList.toggle('collapsed');
            ventaParamsContent.classList.toggle('collapsed');
        });
    }

    // Delegación de eventos para tabla
    // Delegación de eventos para tabla
    uiController.DOMElements.jobsTableBody.addEventListener('input', (event) => {
        const target = event.target;
        const index = parseInt(target.dataset.index);
        const job = appState.trabajos[index];
        const row = target.closest('tr');

        if (target.classList.contains('quantity-input')) {
            let newQuantity = parseInt(target.value) || 1;
            if (newQuantity < 1) newQuantity = 1;
            target.value = newQuantity;

            job.cantidad = newQuantity;
            job.costoMaterialTotal = job.costoMaterialUnitario * newQuantity;
            job.gananciaTotalItem = job.gananciaUnitaria * newQuantity;
            job.subtotal = job.precioVentaUnitario * newQuantity;

            uiController.updateRow(row, job);

        } else if (target.classList.contains('ganancia-input')) {
            let newGananciaTotal = parseFloat(target.value) || 0;

            job.gananciaTotalItem = newGananciaTotal;
            job.gananciaUnitaria = newGananciaTotal / job.cantidad;
            job.subtotal = job.costoMaterialTotal + newGananciaTotal;
            job.precioVentaUnitario = job.subtotal / job.cantidad;
            
            uiController.updateRow(row, job);
        }
        
        updateCalculations(); // Recalcular total final de la cotización
    });

    // Delegación de eventos para botones de tarjetas (móvil)
    uiController.DOMElements.jobsCardsContainer.addEventListener('input', (event) => {
        const target = event.target;
        const index = parseInt(target.dataset.index);
        const job = appState.trabajos[index];

        if (target.classList.contains('quantity-input')) {
            let newQuantity = parseInt(target.value) || 1;
            if (newQuantity < 1) newQuantity = 1;
            target.value = newQuantity;

            job.cantidad = newQuantity;
            job.costoMaterialTotal = job.costoMaterialUnitario * newQuantity;
            job.gananciaTotalItem = job.gananciaUnitaria * newQuantity;
            job.subtotal = job.precioVentaUnitario * newQuantity;

        } else if (target.classList.contains('ganancia-input')) {
            let newGananciaTotal = parseFloat(target.value) || 0;

            job.gananciaTotalItem = newGananciaTotal;
            job.gananciaUnitaria = newGananciaTotal / job.cantidad;
            job.subtotal = job.costoMaterialTotal + newGananciaTotal;
            job.precioVentaUnitario = job.subtotal / job.cantidad;
        }
        
        updateCalculations();
        uiController.updateJobsTable(appState.trabajos);
    });

    // Delegación de eventos para botones de tarjetas (móvil)
    uiController.DOMElements.jobsCardsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('qty-plus-btn')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            job.cantidad += 1;
            job.costoMaterialTotal = job.costoMaterialUnitario * job.cantidad;
            job.gananciaTotalItem = job.gananciaUnitaria * job.cantidad;
            job.subtotal = job.precioVentaUnitario * job.cantidad;
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
        } else if (event.target.classList.contains('qty-minus-btn')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            if (job.cantidad > 1) {
                job.cantidad -= 1;
                job.costoMaterialTotal = job.costoMaterialUnitario * job.cantidad;
                job.gananciaTotalItem = job.gananciaUnitaria * job.cantidad;
                job.subtotal = job.precioVentaUnitario * job.cantidad;
                uiController.updateJobsTable(appState.trabajos);
                updateCalculations();
            }
        } else if (event.target.classList.contains('delete-button')) {
            const index = parseInt(event.target.dataset.index);
            if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
                appState.trabajos.splice(index, 1);
                uiController.updateJobsTable(appState.trabajos); 
                updateCalculations();
                uiController.showToast('✓ Trabajo eliminado', 'success');
            }
        } else if (event.target.classList.contains('edit-button')) {
            const index = parseInt(event.target.dataset.index);
            startEditing(index);
        } else if (event.target.classList.contains('add-more-button')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            
            appState.isAddingMore = true;
            document.getElementById('editing-indicator').style.display = 'block';
            
            // Cargar el material y los parámetros del trabajo existente
            appState.selectedMaterial = job.material;
            appState.currentJobInputs = {
                height: job.medidas.alto,
                width: job.medidas.ancho,
                description: job.descripcion,
                tipoPrecio: job.paramsUsados.tipoPrecio,
                incluirAdicional: false,
            };
            appState.ventaParams = { ...job.paramsUsados };

            // Actualizar UI con los datos del trabajo
            uiController.displaySelectedMaterial(job.material);
            uiController.DOMElements.descriptionInput.value = job.descripcion;
            uiController.DOMElements.heightInput.value = job.medidas.alto;
            uiController.DOMElements.widthInput.value = job.medidas.ancho;
            uiController.DOMElements.rbProveedor.checked = job.paramsUsados.tipoPrecio === 'proveedor';
            uiController.DOMElements.rbCliente.checked = job.paramsUsados.tipoPrecio === 'cliente';
            
            uiController.DOMElements.vpWasteActive.checked = job.paramsUsados.desperdicioActivo;
            uiController.DOMElements.vpWastePctInput.value = job.paramsUsados.desperdicioPct || '';
            uiController.DOMElements.vpLaborActive.checked = job.paramsUsados.manoDeObraActiva;
            uiController.DOMElements.vpLaborCostInput.value = job.paramsUsados.manoDeObraMonto || '';
            uiController.DOMElements.vpProfitActive.checked = job.paramsUsados.gananciaActiva;
            uiController.DOMElements.vpProfitType.value = job.paramsUsados.gananciaTipo || 'percent';
            uiController.DOMElements.vpProfitValueInput.value = job.paramsUsados.gananciaValor || '';
            
            uiController.toggleVentaParamsInputs(job.paramsUsados);
            uiController.DOMElements.ventaParamsCard.style.display = 'block';
            updateCalculations();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    uiController.DOMElements.jobsTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('qty-plus-btn')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            job.cantidad += 1;
            job.costoMaterialTotal = job.costoMaterialUnitario * job.cantidad;
            job.gananciaTotalItem = job.gananciaUnitaria * job.cantidad;
            job.subtotal = job.precioVentaUnitario * job.cantidad;
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
        } else if (event.target.classList.contains('qty-minus-btn')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            if (job.cantidad > 1) {
                job.cantidad -= 1;
                job.costoMaterialTotal = job.costoMaterialUnitario * job.cantidad;
                job.gananciaTotalItem = job.gananciaUnitaria * job.cantidad;
                job.subtotal = job.precioVentaUnitario * job.cantidad;
                uiController.updateJobsTable(appState.trabajos);
                updateCalculations();
            }
        } else if (event.target.classList.contains('delete-button')) {
            const index = parseInt(event.target.dataset.index);
            if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
                appState.trabajos.splice(index, 1);
                uiController.updateJobsTable(appState.trabajos); 
                updateCalculations();
                uiController.showToast('✓ Trabajo eliminado', 'success');
            }
        } else if (event.target.classList.contains('edit-button')) {
            const index = parseInt(event.target.dataset.index);
            startEditing(index);
        } else if (event.target.classList.contains('add-more-button')) {
            const index = parseInt(event.target.dataset.index);
            const job = appState.trabajos[index];
            
            appState.isAddingMore = true;
            document.getElementById('editing-indicator').style.display = 'block';
            
            // Cargar el material y los parámetros del trabajo existente
            appState.selectedMaterial = job.material;
            appState.currentJobInputs = {
                height: job.medidas.alto,
                width: job.medidas.ancho,
                description: job.descripcion,
                tipoPrecio: job.paramsUsados.tipoPrecio,
                incluirAdicional: false,
            };
            appState.ventaParams = { ...job.paramsUsados };

            // Actualizar UI con los datos del trabajo
            uiController.displaySelectedMaterial(job.material);
            uiController.DOMElements.descriptionInput.value = job.descripcion;
            uiController.DOMElements.heightInput.value = job.medidas.alto;
            uiController.DOMElements.widthInput.value = job.medidas.ancho;
            uiController.DOMElements.rbProveedor.checked = job.paramsUsados.tipoPrecio === 'proveedor';
            uiController.DOMElements.rbCliente.checked = job.paramsUsados.tipoPrecio === 'cliente';
            
            uiController.DOMElements.vpWasteActive.checked = job.paramsUsados.desperdicioActivo;
            uiController.DOMElements.vpWastePctInput.value = job.paramsUsados.desperdicioPct || '';
            uiController.DOMElements.vpLaborActive.checked = job.paramsUsados.manoDeObraActiva;
            uiController.DOMElements.vpLaborCostInput.value = job.paramsUsados.manoDeObraMonto || '';
            uiController.DOMElements.vpProfitActive.checked = job.paramsUsados.gananciaActiva;
            uiController.DOMElements.vpProfitType.value = job.paramsUsados.gananciaTipo || 'percent';
            uiController.DOMElements.vpProfitValueInput.value = job.paramsUsados.gananciaValor || '';
            
            uiController.toggleVentaParamsInputs(job.paramsUsados);
            uiController.DOMElements.ventaParamsCard.style.display = 'block';
            updateCalculations();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // 7. Manejo de notas finales y generación de salidas
    uiController.DOMElements.finalNotes.addEventListener('input', (event) => {
        appState.notas = event.target.value;
    });
    uiController.DOMElements.generatePdfBtn.addEventListener('click', () => {
        if (appState.trabajos.length === 0) {
            alert('Agrega al menos un trabajo para generar la cotización.');
            return;
        }
        outputGenerator.generatePdf(appState);
    });
    uiController.DOMElements.printThermalBtn.addEventListener('click', () => {
        if (appState.trabajos.length === 0) {
            alert('Agrega al menos un trabajo para imprimir la cotización.');
            return;
        }
        outputGenerator.printThermal(appState);
    });
    uiController.DOMElements.printGenericBtn.addEventListener('click', () => {
        if (appState.trabajos.length === 0) {
            alert('Agrega al menos un trabajo para imprimir la cotización.');
            return;
        }
        outputGenerator.printGeneric(appState);
    });

    // Inicializar cálculos y UI al cargar la app
    updateCalculations();
});
