// js/app.js
// Orquestador principal: inicializa y conecta todo
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- LÓGICA DEL TEMA OSCURO ---
    const themeToggleButton = uiController.DOMElements.themeToggleBtn;

    const setCurrentTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
    };

    // CORRECCIÓN: Se arregló el error de sintaxis en esta función
    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
    };

    themeToggleButton.addEventListener('click', toggleTheme);

    // Aplicar tema guardado al cargar la página
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setCurrentTheme(savedTheme);
    }
    // --- FIN LÓGICA TEMA ---


    console.log('App inicializada.');

    // Estado central de la aplicación
    const appState = {
        materials: [],
        trabajos: [], // Array de objetos { ..., gananciaUnitaria, gananciaTotalItem, ... }
        selectedMaterial: null,
        currentJobInputs: {
            height: 0,
            width: 0,
            description: '',
            tipoPrecio: 'proveedor'
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
                appState.ventaParams
            );
            uiController.updatePreviewPrecioVenta(precioVentaUnitario);
        } else {
            uiController.updatePreviewPrecioVenta(0);
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
        setTimeout(() => uiController.hideSearchResults(), 200);
    });
    uiController.DOMElements.searchResults.addEventListener('click', (event) => {
        const codigo = event.target.dataset.codigo;
        if (codigo) {
            appState.selectedMaterial = dataService.getMaterialByCode(codigo);
            uiController.displaySelectedMaterial(appState.selectedMaterial);
            uiController.DOMElements.ventaParamsCard.style.display = 'block';
            
            appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'proveedor' };
            uiController.DOMElements.descriptionInput.value = '';
            uiController.DOMElements.heightInput.value = '';
            uiController.DOMElements.widthInput.value = '';
            uiController.DOMElements.rbProveedor.checked = true;
            
            updateCalculations();
            uiController.hideSearchResults();
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

    // 5. Añadir ítem a la tabla
    uiController.DOMElements.addItemBtn.addEventListener('click', () => {
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
            appState.selectedMaterial, area, appState.currentJobInputs.tipoPrecio, appState.ventaParams
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
            paramsUsados: { ...appState.ventaParams, tipoPrecio: appState.currentJobInputs.tipoPrecio }
        };

        appState.trabajos.push(newJob);
        uiController.updateJobsTable(appState.trabajos);
        uiController.resetItemForm();
        uiController.DOMElements.ventaParamsCard.style.display = 'none';
        appState.selectedMaterial = null;
        appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'proveedor' };
        
        updateCalculations();
    });

    // 6. Delegación de eventos para la tabla (Eliminar, Cantidad, Ganancia)
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

    uiController.DOMElements.jobsTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-button')) {
            const index = parseInt(event.target.dataset.index);
            if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
                appState.trabajos.splice(index, 1);
                uiController.updateJobsTable(appState.trabajos); 
                updateCalculations();
            }
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