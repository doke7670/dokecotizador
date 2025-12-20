# 📋 Documentación Completa - Sistema de Cotización Profesional

## 🏗️ Arquitectura del Sistema

### Estructura de Archivos
```
dokecotizador/
├── index.html                 # Interfaz principal de la aplicación
├── assets/
│   ├── css/
│   │   ├── style.css         # Estilos personalizados (si existe)
│   │   └── tom-select-dark.css # Estilos para componentes select
│   ├── images/
│   │   └── logo.svg          # Logo de la empresa
│   └── js/
│       ├── main.js           # Punto de entrada y orquestador principal
│       ├── state.js          # Gestión del estado centralizado
│       ├── ui.js             # Manipulación del DOM y renderizado
│       ├── calculations.js   # Lógica de cálculos matemáticos
│       ├── pdfGenerator.js   # Generación de PDFs
│       └── dataExport.js     # Exportación de datos JSON
└── data/
    ├── materials.json        # Catálogo de materiales
    └── categories.json       # Catálogo de categorías
```

## 🧩 Módulos del Sistema

### 1. **main.js** - Orquestador Principal
**Responsabilidad**: Punto de entrada, inicialización y gestión de eventos

**Funciones principales**:
- `initializeApp()`: Carga datos iniciales y configura la aplicación
- `setupEventListeners()`: Configura todos los event listeners
- `handleAddItemFormSubmit()`: Maneja el formulario de agregar/editar piezas
- `handleTableClick()`: Gestiona acciones en la tabla (ver, editar, eliminar)
- `handleAdditionalCostsChange()`: Actualiza costos adicionales en tiempo real

**Dependencias**:
- Importa funciones de todos los demás módulos
- Carga datos desde `data/materials.json` y `data/categories.json`

### 2. **state.js** - Gestión del Estado
**Responsabilidad**: Estado centralizado de la aplicación

**Estado global**:
```javascript
state = {
    materials: [],           // Catálogo completo de materiales
    categories: [],          // Catálogo de categorías
    quoteItems: [],         // Piezas en la cotización actual
    additionalCosts: {      // Costos adicionales
        waste: 0,           // Desperdicio (%)
        labor: 0,           // Mano de obra (S/.)
        margin: 0           // Margen de ganancia (%)
    },
    nextId: 1,              // ID único para nuevas piezas
    editingItemId: null,    // ID del ítem en edición
    editingMaterialCode: null, // Código del material en edición
    editingCategoryId: null    // ID de categoría en edición
}
```

**Funciones de mutación**:
- `setMaterials()`, `setCategories()`: Establecer datos iniciales
- `addQuoteItem()`, `removeQuoteItem()`, `updateQuoteItem()`: Gestión de piezas
- `updateAdditionalCosts()`: Actualizar costos adicionales
- `addMaterial()`, `updateMaterial()`: Gestión de materiales
- `addCategory()`, `updateCategory()`: Gestión de categorías

### 3. **ui.js** - Interfaz de Usuario
**Responsabilidad**: Manipulación del DOM y renderizado visual

**Funciones de renderizado**:
- `renderQuoteTable()`: Renderiza la tabla de cotización
- `renderSummary()`: Renderiza el panel de resumen de costos
- `renderCatalog()`: Renderiza el catálogo de materiales
- `renderPdfPreview()`: Genera vista previa del PDF

**Funciones de formularios**:
- `updateMaterialSelect()`: Actualiza selector de materiales con Choices.js
- `populateFormForEdit()`: Llena formulario para edición
- `resetAddItemForm()`: Limpia formulario de agregar pieza

**Gestión de modales**:
- `toggleModal()`: Muestra/oculta modales
- `renderItemDetailsModal()`: Modal de detalles de pieza
- `renderCategoryManagementModal()`: Modal de gestión de categorías

### 4. **calculations.js** - Cálculos Matemáticos
**Responsabilidad**: Lógica de cálculo pura (funciones sin efectos secundarios)

**Funciones principales**:
- `calculateItemCost(item, materials)`: Calcula costo de una pieza individual
- `calculateSummary(quoteItems, additionalCosts, materials)`: Calcula todos los totales
- `calculateProratedItemCost()`: Distribuye costos adicionales proporcionalmente

**Fórmulas de cálculo**:
```javascript
// Costo por cm²
unitCost = material.costo_crudo / (material.ancho_cm * material.alto_cm)

// Costo de pieza
itemCost = (item.width * item.height) * unitCost

// Desperdicio
wasteCost = subtotal * (waste / 100)

// Subtotal proyecto
projectSubtotal = subtotal + wasteCost + laborCost

// Margen
marginAmount = projectSubtotal * (margin / 100)

// Total final
grandTotal = projectSubtotal + marginAmount
```

### 5. **pdfGenerator.js** - Generación de PDFs
**Responsabilidad**: Crear documentos PDF de las cotizaciones

**Métodos de generación**:
- `generatePdfFromHtml()`: PDF desde HTML usando html2canvas (método principal)
- `generateSimplePdf()`: PDF simple usando solo texto (método alternativo)
- `loadLogoToPdf()`: Carga logo en el PDF

**Librerías utilizadas**:
- jsPDF: Generación de PDFs
- html2canvas: Conversión HTML a imagen

### 6. **dataExport.js** - Exportación de Datos
**Responsabilidad**: Exportar datos a archivos JSON

**Funciones**:
- `downloadMaterials()`: Descarga materials.json actualizado
- `downloadCategories()`: Descarga categories.json actualizado

## 📊 Estructura de Datos

### Material
```javascript
{
    "codigo": "VINIL-001",           // Código único del material
    "nombre": "Vinil Gloss",         // Nombre descriptivo
    "categoria_id": "CAT-01",        // ID de la categoría
    "ancho_cm": 100,                 // Ancho del rollo en cm
    "alto_cm": 60,                   // Alto del rollo en cm
    "costo_crudo": 5.00,            // Costo del rollo completo
    "ruta_imagen": "url_imagen",     // URL de la imagen
    "descripcion": "Descripción",    // Descripción del material
    "isActive": true                 // Estado activo/inactivo
}
```

### Categoría
```javascript
{
    "id": "CAT-01",                  // ID único de la categoría
    "nombre": "Vinil",               // Nombre de la categoría
    "isActive": true                 // Estado activo/inactivo
}
```

### Pieza de Cotización
```javascript
{
    "id": 1,                         // ID único de la pieza
    "materialCode": "VINIL-001",     // Código del material
    "width": 50,                     // Ancho en cm
    "height": 30                     // Alto en cm
}
```

## 🎨 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **Tailwind CSS**: Framework de estilos utility-first
- **Vanilla JavaScript (ES6+)**: Lógica de la aplicación
- **Choices.js**: Selector avanzado con búsqueda

### Librerías Externas
- **jsPDF**: Generación de documentos PDF
- **html2canvas**: Conversión de HTML a imagen
- **Choices.js**: Componente select con búsqueda avanzada

### Arquitectura
- **Modular**: Separación de responsabilidades en módulos
- **Estado centralizado**: Gestión unificada del estado
- **Funciones puras**: Cálculos sin efectos secundarios
- **Event-driven**: Arquitectura basada en eventos

## 🔄 Flujo de la Aplicación

### Inicialización
1. `main.js` se ejecuta al cargar la página
2. `initializeApp()` carga datos desde JSON
3. Se configuran todos los event listeners
4. Se renderiza la interfaz inicial

### Agregar Pieza
1. Usuario selecciona categoría → `handleCategoryChange()`
2. Se actualiza selector de materiales → `updateMaterialSelect()`
3. Usuario selecciona material y dimensiones
4. Submit del formulario → `handleAddItemFormSubmit()`
5. Se agrega al estado → `addQuoteItem()`
6. Se actualiza la UI → `updateUI()`

### Cálculos en Tiempo Real
1. Cambio en costos adicionales → `handleAdditionalCostsChange()`
2. Se actualiza el estado → `updateAdditionalCosts()`
3. Se recalculan totales → `calculateSummary()`
4. Se actualiza la UI → `renderSummary()`

### Generación de PDF
1. Usuario hace clic en generar PDF → `handleGeneratePdf()`
2. Se renderiza vista previa → `renderPdfPreview()`
3. Usuario descarga → `handleDownloadPdf()`
4. Se intenta método principal → `generatePdfFromHtml()`
5. Si falla, método alternativo → `generateSimplePdf()`

## 🛠️ Funcionalidades Principales

### ✅ Gestión de Cotizaciones
- Agregar piezas con material, ancho y alto
- Editar piezas existentes
- Eliminar piezas
- Ver detalles de piezas
- Cálculo automático de costos

### ✅ Gestión de Materiales
- Catálogo completo de materiales
- Búsqueda avanzada con Choices.js
- Agregar nuevos materiales
- Editar materiales existentes
- Eliminar/restaurar materiales
- Subida de imágenes

### ✅ Gestión de Categorías
- Crear nuevas categorías
- Editar categorías existentes
- Eliminar/restaurar categorías
- Validación de uso antes de eliminar

### ✅ Cálculos Avanzados
- Costo por cm² de material
- Desperdicio configurable (%)
- Mano de obra configurable (S/.)
- Margen de ganancia configurable (%)
- Distribución proporcional de costos

### ✅ Generación de PDFs
- Vista previa antes de descargar
- Dos métodos de generación (principal y alternativo)
- Inclusión de logo empresarial
- Formato profesional

### ✅ Exportación de Datos
- Descarga de materials.json actualizado
- Descarga de categories.json actualizado
- Persistencia de cambios

## 🎯 Características Técnicas

### Responsive Design
- Diseño adaptable a móviles y desktop
- Grid system con Tailwind CSS
- Modales responsivos

### Dark Theme
- Tema oscuro profesional
- Colores personalizados para Choices.js
- Contraste optimizado

### Performance
- Carga asíncrona de datos
- Event delegation para mejor rendimiento
- Funciones puras para cálculos

### UX/UI
- Feedback visual inmediato
- Confirmaciones para acciones destructivas
- Placeholders informativos
- Estados de carga y error

## 🔧 Configuración y Mantenimiento

### Agregar Nuevos Materiales
1. Usar la interfaz web (recomendado)
2. O editar directamente `data/materials.json`

### Agregar Nuevas Categorías
1. Usar la interfaz web (recomendado)
2. O editar directamente `data/categories.json`

### Personalizar Cálculos
- Modificar funciones en `calculations.js`
- Mantener funciones puras para facilitar testing

### Personalizar Estilos
- Modificar clases de Tailwind en `index.html`
- Agregar estilos personalizados en la sección `<style>`

## 🐛 Solución de Problemas Comunes

### PDF no se genera
- **Causa**: Error en html2canvas o jsPDF
- **Solución**: Se usa automáticamente el método alternativo `generateSimplePdf()`

### Materiales no aparecen
- **Causa**: Error en `data/materials.json` o categoría inactiva
- **Solución**: Verificar formato JSON y estado `isActive`

### Cálculos incorrectos
- **Causa**: Datos faltantes o formato incorrecto
- **Solución**: Verificar que materiales tengan `ancho_cm`, `alto_cm` y `costo_crudo`

### Choices.js no funciona
- **Causa**: Librería no cargada o conflicto de versiones
- **Solución**: Verificar que el CDN esté disponible

## 📈 Posibles Mejoras Futuras

### Funcionalidades
- [ ] Persistencia local (LocalStorage)
- [ ] PWA (Progressive Web App)
- [ ] Múltiples cotizaciones simultáneas
- [ ] Historial de cotizaciones
- [ ] Plantillas de cotización
- [ ] Integración con APIs de precios

### Técnicas
- [ ] TypeScript para mejor tipado
- [ ] Testing automatizado
- [ ] Build process con Webpack/Vite
- [ ] Service Workers para offline
- [ ] Base de datos local (IndexedDB)

### UX/UI
- [ ] Drag & drop para reordenar piezas
- [ ] Calculadora visual de dimensiones
- [ ] Previsualización de materiales
- [ ] Temas personalizables
- [ ] Atajos de teclado

---

## 📞 Soporte Técnico

Para dar soporte al sistema, esta documentación proporciona:

1. **Arquitectura clara**: Entender cómo están organizados los módulos
2. **Flujos de datos**: Seguir el camino de la información
3. **Estructura de datos**: Conocer el formato esperado
4. **Funciones principales**: Identificar responsabilidades
5. **Solución de problemas**: Diagnóstico rápido de issues

**Recomendación**: Mantener esta documentación actualizada con cada cambio significativo en el código.