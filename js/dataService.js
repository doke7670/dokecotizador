// js/dataService.js
// Lógica para cargar y buscar en materials.json
const dataService = (() => {
    let materials = [];

    async function loadMaterials() {
        try {
            const response = await fetch('data/materials.json');
            materials = await response.json();
            console.log('Materiales cargados:', materials);
            return materials;
        } catch (error) {
            console.error('Error al cargar los materiales:', error);
            return [];
        }
    }

    function searchMaterials(query) {
        if (!query) return [];
        const lowerCaseQuery = query.toLowerCase();
        return materials.filter(material => 
            material.codigo.toLowerCase().includes(lowerCaseQuery) ||
            material.marca.toLowerCase().includes(lowerCaseQuery) ||
            material.modelo.toLowerCase().includes(lowerCaseQuery)
        );
    }

    function getMaterialByCode(code) {
        return materials.find(material => material.codigo === code);
    }

    return {
        loadMaterials,
        searchMaterials,
        getMaterialByCode
    };
})();
