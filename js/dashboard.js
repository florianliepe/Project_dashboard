document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ... (All variables from previous step remain the same) ...
    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }
    let projectData = {}; let overviewData = []; let taskModal; let statusChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    const searchInput = document.getElementById('search-input'); const responsibleFilter = document.getElementById('responsible-filter'); const statusFilter = document.getElementById('status-filter'); const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // --- NEW: Sorting State Variables ---
    let currentSortColumn = null;
    let isAscending = true;

    function parseDate(dateInput) { /* ... unchanged ... */ }
    
    // --- NEW: Reusable Sorting Utility ---
    function makeTableSortable(tableId) {
        const table = document.querySelector(`#${tableId} thead`);
        if (!table) return;

        table.addEventListener('click', (e) => {
            const header = e.target.closest('th');
            if (!header) return;

            const columnKey = header.dataset.columnKey;
            if (!columnKey) return;

            if (currentSortColumn === columnKey) {
                isAscending = !isAscending;
            } else {
                currentSortColumn = columnKey;
                isAscending = true;
            }
            applyFilters(); // Re-filter and re-sort the data
        });
    }

    function initialize() {
        // ... (rest of initialize function is the same) ...
        const modalElement = document.getElementById('taskModal'); if (modalElement) taskModal = new bootstrap.Modal(modalElement);
        loadDataAndRender();
        addEventListeners();
        makeTableSortable('overview-table-body'); // Activate sorting for this page's table

        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Overview`;
    }

    function loadDataAndRender() { /* ... unchanged ... */ }
    function saveDataAndReRender() { /* ... unchanged ... */ }
    function renderDashboard() { /* ... unchanged ... */ }
    function populateFilters() { /* ... unchanged ... */ }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const responsible = responsibleFilter.value;
        const status = statusFilter.value;

        let filteredData = overviewData.filter(item => { /* ... filtering logic unchanged ... */ });

        // --- NEW: Sorting Logic ---
        if (currentSortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[currentSortColumn] || '';
                let valB = b[currentSortColumn] || '';

                if (currentSortColumn === 'Target Date') {
                    valA = parseDate(valA);
                    valB = parseDate(valB);
                }

                if (valA < valB) return isAscending ? -1 : 1;
                if (valA > valB) return isAscending ? 1 : -1;
                return 0;
            });
        }

        populateTable(filteredData);
    }

    function populateSummaryCards(data) { /* ... unchanged ... */ }
    function renderStatusChart(data) { /* ... unchanged ... */ }

    function populateTable(data) {
        const tableBody = document.getElementById('overview-table-body');
        // ... (rest of function is the same, no changes needed here) ...
    }

    function addEventListeners() { /* ... unchanged ... */ }
    function handleExportToExcel() { /* ... unchanged ... */ }
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleFormSave() { /* ... unchanged ... */ }
    function handleDelete(index) { /* ... unchanged ... */ }

    initialize();
});
