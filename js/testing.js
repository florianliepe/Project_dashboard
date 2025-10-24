document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    let projectData = {};
    let testingData = [];
    let testModal;
    let statusPieChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    
    const searchInput = document.getElementById('search-input');
    const responsibleFilter = document.getElementById('responsible-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    function parseDate(dateInput) { /* ... unchanged ... */ }

    function initialize() {
        const modalElement = document.getElementById('testModal');
        if (modalElement) testModal = new bootstrap.Modal(modalElement);
        
        loadDataAndRender();
        addEventListeners();
        
        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-box-seam"></i> ${activeProject}`;
        document.getElementById('project-title-main').textContent = `${activeProject} - Testing`;
    }

    function loadDataAndRender() {
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) {
            alert('Error: Could not find data for the selected project.');
            return;
        }
        projectData = JSON.parse(rawData);
        testingData = projectData.testing || [];
        
        populateFilters();
        renderDashboard();
    }
    
    function saveDataAndReRender() {
        projectData.testing = testingData;
        projectData.lastModified = new Date().toISOString();
        localStorage.setItem(PROJECT_DATA_PREFIX + activeProject, JSON.stringify(projectData));
        
        populateFilters();
        renderDashboard();
    }

    function renderDashboard() {
        renderSummaryCards(testingData);
        renderStatusPieChart(testingData);
        applyFilters();
    }

    function populateFilters() {
        const responsibles = ['All Responsible', ...new Set(testingData.map(item => item.Responsible).filter(Boolean).sort())];
        responsibleFilter.innerHTML = responsibles.map(r => `<option value="${r}">${r}</option>`).join('');
        
        const statuses = ['All Statuses', ...new Set(testingData.map(item => item.Status).filter(Boolean).sort())];
        statusFilter.innerHTML = statuses.map(s => `<option value="${s}" class="text-capitalize">${s}</option>`).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const responsible = responsibleFilter.value;
        const status = statusFilter.value;

        let filteredData = testingData.filter(item => {
            const matchesSearch = (item['Activity Title'] || '').toLowerCase().includes(searchTerm);
            const matchesResponsible = (responsible === 'All Responsible' || item.Responsible === responsible);
            const matchesStatus = (status === 'All Statuses' || item.Status === status);
            return matchesSearch && matchesResponsible && matchesStatus;
        });
        renderTable(filteredData);
    }
    
    function renderSummaryCards(data) { /* ... unchanged ... */ }
    function renderStatusPieChart(data) { /* ... unchanged ... */ }
    
    function renderTable(data) { /* ... unchanged ... */ }

    function addEventListeners() {
        searchInput.addEventListener('input', applyFilters);
        responsibleFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            responsibleFilter.value = 'All Responsible';
            statusFilter.value = 'All Statuses';
            applyFilters();
        });
        
        document.getElementById('add-test-btn')?.addEventListener('click', showModalForAdd);
        // CORRECTED: Added back the event listener for the save button
        document.getElementById('save-test-btn')?.addEventListener('click', handleFormSave);
        
        document.getElementById('testing-table-body')?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const index = target.dataset.index;
            if (target.classList.contains('edit-btn')) showModalForEdit(index);
            if (target.classList.contains('delete-btn')) handleDelete(index);
        });
    }
    
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleFormSave() { /* ... unchanged ... */ }
    function handleDelete(index) { /* ... unchanged ... */ }
    
    initialize();
});
