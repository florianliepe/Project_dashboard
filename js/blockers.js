document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // ... (All variables from previous step remain the same) ...
    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }
    let projectData = {}; let allBlockers = []; let blockerModal; let statusPieChartInstance = null;
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
        const modalElement = document.getElementById('blockerModal'); if (modalElement) blockerModal = new bootstrap.Modal(modalElement);
        loadDataAndRender();
        addEventListeners();
        makeTableSortable('blockers-table-body'); // Activate sorting

        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Blockers`;
    }

    function loadDataAndRender() { /* ... unchanged ... */ }
    function saveDataAndReRender() { /* ... unchanged ... */ }
    function renderDashboard() { /* ... unchanged ... */ }
    function populateFilters() { /* ... unchanged ... */ }

    function applyFilters() {
        // ... (filtering logic is the same) ...
        let filteredData = allBlockers.filter(item => { /* ... */ });

        // --- NEW: Sorting Logic ---
        if (currentSortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[currentSortColumn] || '';
                let valB = b[currentSortColumn] || '';
                if (currentSortColumn === 'Start Date') { valA = parseDate(valA); valB = parseDate(valB); }
                if (valA < valB) return isAscending ? -1 : 1;
                if (valA > valB) return isAscending ? 1 : -1;
                return 0;
            });
        }
        renderTable(filteredData);
    }
    
    function renderSummary(data) { /* ... unchanged ... */ }
    function renderPieChart(data) { /* ... unchanged ... */ }
    function renderTable(data) { /* ... unchanged ... */ }
    function addEventListeners() { /* ... unchanged ... */ }
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleFormSave() { /* ... unchanged ... */ }
    function handleDelete(index) { /* ... unchanged ... */ }
    
    initialize();
});
