document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }

    let projectData = {};
    let overviewData = [];
    let taskModal;
    let statusChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';

    const searchInput = document.getElementById('search-input');
    const responsibleFilter = document.getElementById('responsible-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // --- NEW: Executive Summary DOM References ---
    const editSummaryBtn = document.getElementById('edit-summary-btn');
    const saveSummaryBtn = document.getElementById('save-summary-btn');
    const cancelSummaryBtn = document.getElementById('cancel-summary-btn');
    const summaryAccomplishments = document.getElementById('summary-accomplishments');
    const summaryRisks = document.getElementById('summary-risks');
    const summaryNextSteps = document.getElementById('summary-next-steps');
    const summaryTextareas = document.querySelectorAll('.summary-textarea');

    let currentSortColumn = null;
    let isAscending = true;

    function parseDate(dateInput) { /* ... same as before ... */ }
    function makeTableSortable() { /* ... same as before ... */ }

    function initialize() {
        const modalElement = document.getElementById('taskModal');
        if (modalElement) taskModal = new bootstrap.Modal(modalElement);
        
        loadDataAndRender();
        addEventListeners();
        makeTableSortable();
        
        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Overview`;
    }

    function loadDataAndRender() {
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) { alert('Error: Could not find data for the selected project.'); return; }
        
        projectData = JSON.parse(rawData);
        overviewData = projectData.overview || [];
        
        populateFilters();
        populateExecutiveSummary(); // <-- NEW CALL
        renderDashboard();
    }
    
    // RENAMED from saveDataAndReRender for clarity
    function saveProjectData() {
        projectData.overview = overviewData;
        // Also save summary data just in case, though it's handled separately
        projectData.executiveSummary = {
            accomplishments: summaryAccomplishments.value,
            risks: summaryRisks.value,
            nextSteps: summaryNextSteps.value
        };
        projectData.lastModified = new Date().toISOString();
        localStorage.setItem(PROJECT_DATA_PREFIX + activeProject, JSON.stringify(projectData));
    }

    function renderDashboard() {
        populateSummaryCards(overviewData);
        renderStatusChart(overviewData);
        applyFilters();
    }

    // --- NEW: Executive Summary Functions ---
    function populateExecutiveSummary() {
        const summary = projectData.executiveSummary || {};
        summaryAccomplishments.value = summary.accomplishments || '';
        summaryRisks.value = summary.risks || '';
        summaryNextSteps.value = summary.nextSteps || '';
    }

    function toggleSummaryEditMode(isEditing) {
        editSummaryBtn.classList.toggle('d-none', isEditing);
        saveSummaryBtn.classList.toggle('d-none', !isEditing);
        cancelSummaryBtn.classList.toggle('d-none', !isEditing);
        summaryTextareas.forEach(textarea => {
            textarea.readOnly = !isEditing;
            textarea.classList.toggle('editable', isEditing);
        });
    }

    function handleSaveSummary() {
        // The data is already in the projectData object via two-way binding with the textarea value
        saveProjectData();
        toggleSummaryEditMode(false);
    }
    
    // --- MODIFIED: addEventListeners ---
    function addEventListeners() {
        // Summary Listeners
        editSummaryBtn.addEventListener('click', () => toggleSummaryEditMode(true));
        cancelSummaryBtn.addEventListener('click', () => {
            populateExecutiveSummary(); // Revert changes
            toggleSummaryEditMode(false);
        });
        saveSummaryBtn.addEventListener('click', handleSaveSummary);

        // Filter listeners
        searchInput.addEventListener('input', applyFilters);
        responsibleFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        resetFiltersBtn.addEventListener('click', () => { searchInput.value = ''; responsibleFilter.value = 'All Responsible'; statusFilter.value = 'All Statuses'; applyFilters(); });
        
        // Modal and Table Listeners
        document.getElementById('add-task-btn')?.addEventListener('click', showModalForAdd);
        document.getElementById('save-task-btn')?.addEventListener('click', handleFormSave);
        document.getElementById('export-excel-btn')?.addEventListener('click', handleExportToExcel);
        document.getElementById('overview-table-body')?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const index = target.dataset.index;
            if (target.classList.contains('edit-btn')) showModalForEdit(index);
            if (target.classList.contains('delete-btn')) handleDelete(index);
        });
    }

    // All other functions (populateFilters, applyFilters, populateTable, CRUD functions, etc.) remain the same
    // but now call `saveProjectData()` instead of `saveDataAndReRender()`.
    function populateFilters() { /* ... unchanged ... */ }
    function applyFilters() { /* ... unchanged ... */ }
    function populateSummaryCards(data) { /* ... unchanged ... */ }
    function renderStatusChart(data) { /* ... unchanged ... */ }
    function populateTable(data) { /* ... unchanged ... */ }
    function handleExportToExcel() { /* ... unchanged ... */ }
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleDelete(index) { overviewData.splice(index, 1); saveProjectData(); renderDashboard(); }
    function handleFormSave() { const index = document.getElementById('modal-task-index').value; const taskData = { /* ... */ }; if (index === '') { overviewData.push(taskData); } else { overviewData[parseInt(index)] = taskData; } saveProjectData(); renderDashboard(); taskModal.hide(); }

    initialize();
});
