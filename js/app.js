// js/app.js
// Orquestador principal: inicializa y conecta todo
document.addEventListener('DOMContentLoaded', async () => {
    



    console.log('App inicializada.');

    // Estado central de la aplicación
    const appState = {
        materials: [],
        trabajos: [],
        editingJobIndex: null,
        selectedMaterial: null,
        isAddingMore: false,
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
        },
        clientData: {
            nombre: '',
            telefono: '',
            email: '',
            direccion: '',
            ruc: ''
        },
        notas: '',
        materialFilter: 'all'
    };

    // Debounce para localStorage (evitar escrituras excesivas)
    let saveToLocalStorageTimeout;
    function saveToLocalStorage() {
        clearTimeout(saveToLocalStorageTimeout);
        saveToLocalStorageTimeout = setTimeout(() => {
            try {
                localStorage.setItem('dokecotizador_state', JSON.stringify(appState));
            } catch (e) {
                console.error('Error guardando en localStorage:', e);
            }
        }, 300);
    }

    // Función para cargar estado de localStorage
    function loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('dokecotizador_state');
            if (saved) {
                const loaded = JSON.parse(saved);
                appState.trabajos = (loaded.trabajos || []).map(job => ({
                    ...job,
                    areaCalculada: job.areaCalculada || job.medidas.area
                }));
                appState.clientData = loaded.clientData || { nombre: '', telefono: '', email: '', direccion: '', ruc: '' };
                appState.notas = loaded.notas || '';
                return true;
            }
        } catch (e) {
            console.error('Error cargando de localStorage:', e);
        }
        return false;
    }

    // Función para limpiar todo
    function clearAllData() {
        if (confirm('¿Estás seguro de que deseas iniciar una nueva venta? Se borrarán todos los datos.')) {
            appState.trabajos = [];
            appState.clientData = { nombre: '', telefono: '', email: '', direccion: '', ruc: '' };
            appState.notas = '';
            appState.selectedMaterial = null;
            appState.editingJobIndex = null;
            appState.isAddingMore = false;
            appState.currentJobInputs = { height: 0, width: 0, description: '', tipoPrecio: 'cliente', incluirAdicional: false };
            
            // Limpiar UI
            uiController.DOMElements.searchInput.value = '';
            uiController.DOMElements.descriptionInput.value = '';
            uiController.DOMElements.heightInput.value = '';
            uiController.DOMElements.widthInput.value = '';
            uiController.DOMElements.clientNameInput.value = '';
            uiController.DOMElements.clientPhoneInput.value = '';
            uiController.DOMElements.clientEmailInput.value = '';
            uiController.DOMElements.clientAddressInput.value = '';
            uiController.DOMElements.clientRucInput.value = '';
            uiController.DOMElements.finalNotes.value = '';
            
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
            saveToLocalStorage();
            uiController.showToast('✓ Nueva venta iniciada', 'success');
        }
    }

    // Función para limpiar solo trabajos
    function clearJobs() {
        if (confirm('¿Deseas limpiar todos los trabajos agregados?')) {
            appState.trabajos = [];
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
            saveToLocalStorage();
            uiController.showToast('✓ Trabajos eliminados', 'success');
        }
    }

    // Función para limpiar solo datos del cliente
    function clearClientData() {
        if (confirm('¿Deseas limpiar los datos del cliente?')) {
            appState.clientData = { nombre: '', telefono: '', email: '', direccion: '', ruc: '' };
            uiController.DOMElements.clientNameInput.value = '';
            uiController.DOMElements.clientPhoneInput.value = '';
            uiController.DOMElements.clientEmailInput.value = '';
            uiController.DOMElements.clientAddressInput.value = '';
            uiController.DOMElements.clientRucInput.value = '';
            saveToLocalStorage();
            uiController.showToast('✓ Datos del cliente eliminados', 'success');
        }
    }

    // Función para limpiar solo parámetros de venta
    function clearVentaParams() {
        if (confirm('¿Deseas limpiar los parámetros de venta?')) {
            appState.ventaParams = {
                desperdicioActivo: false,
                desperdicioPct: 0,
                manoDeObraActiva: false,
                manoDeObraMonto: 0,
                gananciaActiva: false,
                gananciaTipo: 'percent',
                gananciaValor: 0
            };
            uiController.DOMElements.vpWasteActive.checked = false;
            uiController.DOMElements.vpWastePctInput.value = '';
            uiController.DOMElements.vpLaborActive.checked = false;
            uiController.DOMElements.vpLaborCostInput.value = '';
            uiController.DOMElements.vpProfitActive.checked = false;
            uiController.DOMElements.vpProfitType.value = 'percent';
            uiController.DOMElements.vpProfitValueInput.value = '';
            uiController.toggleVentaParamsInputs(appState.ventaParams);
            updateCalculations();
            saveToLocalStorage();
            uiController.showToast('✓ Parámetros de venta eliminados', 'success');
        }
    }

    // 1. Cargar materiales
    appState.materials = await dataService.loadMaterials();
    if (appState.materials.length === 0) {
        alert('Error: No se pudieron cargar los materiales. Por favor, revisa data/materials.json y asegúrate de usar un servidor local.');
        return;
    }

    // 2. Verificar si hay trabajos guardados
    const savedState = localStorage.getItem('dokecotizador_state');
    let hasJobs = false;
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            if (parsed.trabajos && parsed.trabajos.length > 0) {
                hasJobs = true;
                uiController.showSkeletons();
            }
        } catch (e) {
            console.error('Error al verificar localStorage:', e);
        }
    }

    // 3. Cargar datos guardados de localStorage
    if (loadFromLocalStorage()) {
        // Si hay trabajos, esperar un poco para mostrar skeletons antes de cargar datos
        if (hasJobs) {
            setTimeout(() => {
                uiController.updateJobsTable(appState.trabajos);
                uiController.hideSkeletons();
            }, 300);
        } else {
            uiController.updateJobsTable(appState.trabajos);
            uiController.hideSkeletons();
        }
        uiController.DOMElements.clientNameInput.value = appState.clientData.nombre;
        uiController.DOMElements.clientPhoneInput.value = appState.clientData.telefono;
        uiController.DOMElements.clientEmailInput.value = appState.clientData.email;
        uiController.DOMElements.clientAddressInput.value = appState.clientData.direccion;
        uiController.DOMElements.clientRucInput.value = appState.clientData.ruc;
        uiController.DOMElements.finalNotes.value = appState.notas;
    } else {
        uiController.hideSkeletons();
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
        saveToLocalStorage();
    };

    // Inicializar el estado de los checkboxes de ventaParams
    uiController.toggleVentaParamsInputs(appState.ventaParams);

    // 2. Manejo del input de búsqueda y selección
    uiController.DOMElements.searchInput.addEventListener('input', (event) => {
        const query = event.target.value;
        const results = dataService.searchMaterials(query, appState.materialFilter);
        uiController.displaySearchResults(results);
    });
    uiController.DOMElements.searchInput.addEventListener('blur', () => {
        // Solo cerrar el dropdown si no se está clickeando en él
        if (!uiController.DOMElements.searchResults.contains(event.relatedTarget)) {
            setTimeout(() => uiController.hideSearchResults(), 100);
        }
    });

    // Manejo de los botones de filtro por tipo
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const filter = event.target.dataset.filter;
            appState.materialFilter = filter;

            // Actualizar UI de los botones
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');

            // Ejecutar búsqueda con el nuevo filtro
            const query = uiController.DOMElements.searchInput.value;
            const results = dataService.searchMaterials(query, filter);
            uiController.displaySearchResults(results);
        });
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
        const { areaCalculada, costoMaterialUnitario, precioVentaUnitario } = calculator.calculateItemFullPrice(
            appState.selectedMaterial, area, appState.currentJobInputs.tipoPrecio, appState.currentJobInputs.incluirAdicional, appState.ventaParams
        );

        const cantidad = 1;
        const gananciaUnitaria = precioVentaUnitario - costoMaterialUnitario;

        const newJob = {
            descripcion: appState.currentJobInputs.description,
            material: appState.selectedMaterial,
            medidas: { alto: appState.currentJobInputs.height, ancho: appState.currentJobInputs.width, area: area },
            areaCalculada: areaCalculada,
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
        saveToLocalStorage();
        uiController.showToast('✓ Trabajo agregado correctamente', 'success');
    }

    function updateJob() {
        const jobIndex = appState.editingJobIndex;
        if (jobIndex === null) return;

        const originalJob = appState.trabajos[jobIndex];

        const area = calculator.calculateArea(appState.currentJobInputs.height, appState.currentJobInputs.width);
        const { areaCalculada, costoMaterialUnitario, precioVentaUnitario } = calculator.calculateItemFullPrice(
            appState.selectedMaterial, area, appState.currentJobInputs.tipoPrecio, appState.currentJobInputs.incluirAdicional, appState.ventaParams
        );

        const gananciaUnitaria = precioVentaUnitario - costoMaterialUnitario;

        const updatedJob = {
            ...originalJob,
            descripcion: appState.currentJobInputs.description,
            material: appState.selectedMaterial,
            medidas: { alto: appState.currentJobInputs.height, ancho: appState.currentJobInputs.width, area: area },
            areaCalculada: areaCalculada,
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
        saveToLocalStorage();
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
        
        setVentaParamsFormValues(job.paramsUsados);
        uiController.DOMElements.ventaParamsCard.style.display = 'block';
        uiController.setEditingMode(true);
        updateCalculations();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function startAddingMore(index) {
        const job = appState.trabajos[index];
        appState.isAddingMore = true;
        document.getElementById('editing-indicator').style.display = 'block';
        
        appState.selectedMaterial = job.material;
        appState.currentJobInputs = {
            height: job.medidas.alto,
            width: job.medidas.ancho,
            description: job.descripcion,
            tipoPrecio: job.paramsUsados.tipoPrecio,
            incluirAdicional: false,
        };
        appState.ventaParams = { ...job.paramsUsados };
        
        uiController.displaySelectedMaterial(job.material);
        uiController.DOMElements.descriptionInput.value = job.descripcion;
        uiController.DOMElements.heightInput.value = job.medidas.alto;
        uiController.DOMElements.widthInput.value = job.medidas.ancho;
        uiController.DOMElements.rbProveedor.checked = job.paramsUsados.tipoPrecio === 'proveedor';
        uiController.DOMElements.rbCliente.checked = job.paramsUsados.tipoPrecio === 'cliente';
        
        setVentaParamsFormValues(job.paramsUsados);
        uiController.DOMElements.ventaParamsCard.style.display = 'block';
        updateCalculations();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setVentaParamsFormValues(params) {
        uiController.DOMElements.vpWasteActive.checked = params.desperdicioActivo;
        uiController.DOMElements.vpWastePctInput.value = params.desperdicioPct || '';
        uiController.DOMElements.vpLaborActive.checked = params.manoDeObraActiva;
        uiController.DOMElements.vpLaborCostInput.value = params.manoDeObraMonto || '';
        uiController.DOMElements.vpProfitActive.checked = params.gananciaActiva;
        uiController.DOMElements.vpProfitType.value = params.gananciaTipo || 'percent';
        uiController.DOMElements.vpProfitValueInput.value = params.gananciaValor || '';
        uiController.toggleVentaParamsInputs(params);
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
        
        updateItemFormState();
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
    
    // Función reutilizable para manejar collapse de secciones
    function setupCollapseSection(buttonId, contentId, headerId, onToggleCallback) {
        const collapseBtn = document.getElementById(buttonId);
        const content = document.getElementById(contentId);
        const header = headerId ? document.getElementById(headerId) : null;
        
        if (collapseBtn && content) {
            const toggle = (e) => {
                e.stopPropagation();
                collapseBtn.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
                if (onToggleCallback) onToggleCallback();
            };
            
            collapseBtn.addEventListener('click', toggle);
            if (header) {
                header.addEventListener('click', toggle);
            }
        }
    }

    // Setup de todas las secciones collapsibles
    setupCollapseSection('collapse-venta-params', 'venta-params-content', 'venta-params-header-clickable');
    setupCollapseSection('collapse-client-data', 'client-data-content', 'client-data-header-clickable');
    setupCollapseSection('collapse-notes', 'notes-content', 'notes-header-clickable');

    // Funciones auxiliares para acciones en trabajos
    function updateJobQuantity(index, newQuantity) {
        const job = appState.trabajos[index];
        if (newQuantity < 1) newQuantity = 1;
        job.cantidad = newQuantity;
        job.costoMaterialTotal = job.costoMaterialUnitario * newQuantity;
        job.gananciaTotalItem = job.gananciaUnitaria * newQuantity;
        job.subtotal = job.precioVentaUnitario * newQuantity;
    }

    function updateJobGain(index, newGainTotal) {
        const job = appState.trabajos[index];
        job.gananciaTotalItem = newGainTotal;
        job.gananciaUnitaria = newGainTotal / job.cantidad;
        job.subtotal = job.costoMaterialTotal + newGainTotal;
        job.precioVentaUnitario = job.subtotal / job.cantidad;
    }

    function deleteJob(index) {
        if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
            appState.trabajos.splice(index, 1);
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
            uiController.showToast('✓ Trabajo eliminado', 'success');
        }
    }

    // Toggle collapse de Definir Trabajo (con lógica especial para deshabilitar)
    setupCollapseSection('collapse-item-form', 'item-form-content', 'item-form-header-clickable');
    
    const collapseItemFormBtn = document.getElementById('collapse-item-form');
    const itemFormHeader = document.getElementById('item-form-header-clickable');
    
    const updateItemFormState = () => {
        if (collapseItemFormBtn && itemFormHeader) {
            if (!appState.selectedMaterial) {
                collapseItemFormBtn.disabled = true;
                itemFormHeader.style.pointerEvents = 'none';
                itemFormHeader.style.opacity = '0.5';
                itemFormHeader.style.cursor = 'not-allowed';
            } else {
                collapseItemFormBtn.disabled = false;
                itemFormHeader.style.pointerEvents = 'auto';
                itemFormHeader.style.opacity = '1';
                itemFormHeader.style.cursor = 'pointer';
            }
        }
    };
    
    updateItemFormState();
    
    const originalDisplaySelectedMaterial = uiController.displaySelectedMaterial;
    uiController.displaySelectedMaterial = function(material) {
        originalDisplaySelectedMaterial.call(this, material);
        updateItemFormState();
    };

    // Funciones auxiliares para acciones en trabajos
    function updateJobQuantity(index, newQuantity) {
        const job = appState.trabajos[index];
        if (newQuantity < 1) newQuantity = 1;
        job.cantidad = newQuantity;
        job.costoMaterialTotal = job.costoMaterialUnitario * newQuantity;
        job.gananciaTotalItem = job.gananciaUnitaria * newQuantity;
        job.subtotal = job.precioVentaUnitario * newQuantity;
    }

    function updateJobGain(index, newGainTotal) {
        const job = appState.trabajos[index];
        job.gananciaTotalItem = newGainTotal;
        job.gananciaUnitaria = newGainTotal / job.cantidad;
        job.subtotal = job.costoMaterialTotal + newGainTotal;
        job.precioVentaUnitario = job.subtotal / job.cantidad;
    }

    function deleteJob(index) {
        if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
            appState.trabajos.splice(index, 1);
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
            uiController.showToast('✓ Trabajo eliminado', 'success');
        }
    }

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
            
            updateJobQuantity(index, newQuantity);
            uiController.updateRow(row, job);
            updateCalculations();

        } else if (target.classList.contains('ganancia-input')) {
            let newGananciaTotal = parseFloat(target.value) || 0;
            
            updateJobGain(index, newGananciaTotal);
            uiController.updateRow(row, job);
            updateCalculations();
        }
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
        const index = parseInt(event.target.dataset.index);
        if (isNaN(index)) return;
        const job = appState.trabajos[index];
        
        if (event.target.classList.contains('qty-plus-btn')) {
            updateJobQuantity(index, job.cantidad + 1);
            uiController.updateJobsTable(appState.trabajos);
            updateCalculations();
        } else if (event.target.classList.contains('qty-minus-btn')) {
            if (job.cantidad > 1) {
                updateJobQuantity(index, job.cantidad - 1);
                uiController.updateJobsTable(appState.trabajos);
                updateCalculations();
            }
        } else if (event.target.classList.contains('delete-button')) {
            deleteJob(index);
        } else if (event.target.classList.contains('edit-button')) {
            startEditing(index);
        } else if (event.target.classList.contains('add-more-button')) {
            startAddingMore(index);
        }
    });


    uiController.DOMElements.jobsTableBody.addEventListener('click', (event) => {
        const index = parseInt(event.target.dataset.index);
        if (isNaN(index)) return;
        const job = appState.trabajos[index];
        const row = event.target.closest('tr');
        
        if (event.target.classList.contains('qty-plus-btn')) {
            updateJobQuantity(index, job.cantidad + 1);
            uiController.updateRow(row, job);
            updateCalculations();
        } else if (event.target.classList.contains('qty-minus-btn')) {
            if (job.cantidad > 1) {
                updateJobQuantity(index, job.cantidad - 1);
                uiController.updateRow(row, job);
                updateCalculations();
            }
        } else if (event.target.classList.contains('delete-button')) {
            deleteJob(index);
        } else if (event.target.classList.contains('edit-button')) {
            startEditing(index);
        } else if (event.target.classList.contains('add-more-button')) {
            startAddingMore(index);
        }
    });

    // 7. Manejo de notas finales y generación de salidas
    uiController.DOMElements.finalNotes.addEventListener('input', (event) => {
        appState.notas = event.target.value;
        saveToLocalStorage();
    });

    // 8. Manejo de datos del cliente
    uiController.DOMElements.clientNameInput.addEventListener('input', (event) => {
        appState.clientData.nombre = event.target.value;
        saveToLocalStorage();
    });
    uiController.DOMElements.clientPhoneInput.addEventListener('input', (event) => {
        appState.clientData.telefono = event.target.value;
        saveToLocalStorage();
    });
    uiController.DOMElements.clientEmailInput.addEventListener('input', (event) => {
        appState.clientData.email = event.target.value;
        saveToLocalStorage();
    });
    uiController.DOMElements.clientAddressInput.addEventListener('input', (event) => {
        appState.clientData.direccion = event.target.value;
        saveToLocalStorage();
    });
    uiController.DOMElements.clientRucInput.addEventListener('input', (event) => {
        appState.clientData.ruc = event.target.value;
        saveToLocalStorage();
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

    // Event listeners para botones de limpiar
    const newSaleBtn = document.getElementById('new-sale-btn');
    if (newSaleBtn) {
        newSaleBtn.addEventListener('click', clearAllData);
    }

    const clearJobsBtn = document.getElementById('clear-jobs-btn');
    if (clearJobsBtn) {
        clearJobsBtn.addEventListener('click', clearJobs);
    }

    const clearClientBtn = document.getElementById('clear-client-btn');
    if (clearClientBtn) {
        clearClientBtn.addEventListener('click', clearClientData);
    }

    const clearVentaParamsBtn = document.getElementById('clear-venta-params-btn');
    if (clearVentaParamsBtn) {
        clearVentaParamsBtn.addEventListener('click', clearVentaParams);
    }

    // Inicializar cálculos y UI al cargar la app
    updateCalculations();
});
