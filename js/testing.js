document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    // ... (All variables from previous step remain the same) ...
    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }
    let projectData = {}; let testingData = []; let testModal; let statusPieChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    const searchInput = document.getElementById('search-input'); const responsibleFilter = document.getElementById('responsible-filter'); const statusFilter = document.getElementById('status-filter'); const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // --- NEW: Sorting State Variables ---
    let currentSortColumn = null;
    let isAscending = true;
    
    function parseDate(dateInput) { /* ... unchanged ... */ }

    // --- NEW: Reusable Sorting Utility ---
    function makeTableSortable(tableId) { /* ... same as in dashboard.js ... */ }

    function initialize() {
        // ... (rest of initialize function is the same) ...
        const modalElement = document.getElementById('testModal'); if (modalElement) testModal = new bootstrap.Modal(modalElement);
        loadDataAndRender();
        addEventListeners();
        makeTableSortable('testing-table-body'); // Activate sorting

        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-box-seam"></i> ${activeProject}`;
        document.getElementById('project-title-main').textContent = `${activeProject} - Testing`;
    }

    function loadDataAndRender() { /* ... unchanged ... */ }
    function saveDataAndReRender() { /* ... unchanged ... */ }
    function renderDashboard() { /* ... unchanged ... */ }
    function populateFilters() { /* ... unchanged ... */ }
    
    function applyFilters() {
        // ... (filtering logic is the same) ...
        let filteredData = testingData.filter(item => { /* ... */ });

        // --- NEW: Sorting Logic ---
        if (currentSortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[currentSortColumn] || '';
                let valB = b[currentSortColumn] || '';
                if (currentSortColumn === 'Due Date') { valA = parseDate(valA); valB = parseDate(valB); }
                if (currentSortColumn === 'Progress') { valA = Number(valA); valB = Number(valB); }
                if (valA < valB) return isAscending ? -1 : 1;
                if (valA > valB) return isAscending ? 1 : -1;
                return 0;
            });
        }
        renderTable(filteredData);
    }
    
    function renderSummaryCards(data) { /* ... unchanged ... */ }
    function renderStatusPieChart(data) { /* ... unchanged ... */ }
    function renderTable(data) { /* ... unchanged ... */ }
    function addEventListeners() { /* ... unchanged ... */ }
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleFormSave() { /* ... unchanged ... */ }
    function handleDelete(index) { /* ... unchanged ... */ }
    
    initialize();
});
