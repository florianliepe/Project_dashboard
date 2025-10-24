document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    let projectData = {};
    let allBlockers = [];
    let blockerModal;
    let statusPieChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    
    const searchInput = document.getElementById('search-input');
    const responsibleFilter = document.getElementById('responsible-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    function initialize() {
        const modalElement = document.getElementById('blockerModal');
        if (modalElement) blockerModal = new bootstrap.Modal(modalElement);
        
        loadDataAndRender();
        addEventListeners();
        
        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Blockers`;
    }

    function loadDataAndRender() {
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) {
            alert('Error: Could not find data.');
            return;
        }
        projectData = JSON.parse(rawData);
        allBlockers = projectData.blockers || [];
        
        populateFilters();
        renderDashboard();
    }
    
    function saveDataAndReRender() {
        projectData.blockers = allBlockers;
        projectData.lastModified = new Date().toISOString();
        localStorage.setItem(PROJECT_DATA_PREFIX + activeProject, JSON.stringify(projectData));
        
        populateFilters();
        renderDashboard();
    }

    function renderDashboard() {
        renderSummary(allBlockers);
        renderPieChart(allBlockers);
        applyFilters();
    }

    function populateFilters() {
        const responsibles = ['All Responsible', ...new Set(allBlockers.map(item => item.Responsible).filter(Boolean).sort())];
        responsibleFilter.innerHTML = responsibles.map(r => `<option value="${r}">${r}</option>`).join('');
        
        const statuses = ['All Statuses', ...new Set(allBlockers.map(item => item['Solution Status']).filter(Boolean).sort())];
        statusFilter.innerHTML = statuses.map(s => `<option value="${s}" class="text-capitalize">${s}</option>`).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const responsible = responsibleFilter.value;
        const status = statusFilter.value;

        let filteredData = allBlockers.filter(item => {
            const matchesSearch = (item['Blocker Name'] || '').toLowerCase().includes(searchTerm);
            const matchesResponsible = (responsible === 'All Responsible' || item.Responsible === responsible);
            const matchesStatus = (status === 'All Statuses' || item['Solution Status'] === status);
            return matchesSearch && matchesResponsible && matchesStatus;
        });
        renderTable(filteredData);
    }
    
    function renderSummary(data) { /* ... unchanged ... */ }
    function renderPieChart(data) { /* ... unchanged ... */ }

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
        
        document.getElementById('add-blocker-btn')?.addEventListener('click', showModalForAdd);
        // CORRECTED: Added back the event listener for the save button
        document.getElementById('save-blocker-btn')?.addEventListener('click', handleFormSave);
        
        document.getElementById('blockers-table-body')?.addEventListener('click', function(e) {
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
