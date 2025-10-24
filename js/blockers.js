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

    function renderTable(data) {
        const tableBody = document.getElementById('blockers-table-body');
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No blockers match the current filters.</td></tr>';
            return;
        }

        data.forEach(item => {
            const originalIndex = allBlockers.findIndex(originalItem => originalItem === item);
            const status = String(item['Solution Status'] || 'open').toLowerCase();
            const priority = String(item.Priority || 'low').toLowerCase();
            
            const row = `
                <tr>
                    <td>${item['Blocker Name'] || ''}</td>
                    <td>${item.Description || ''}</td>
                    <td>${item.Responsible || ''}</td>
                    <td>${item['Start Date'] || ''}</td>
                    <td><span class="badge text-capitalize bg-${priority === 'high' ? 'danger' : (priority === 'medium' ? 'warning text-dark' : 'primary')}">${priority}</span></td>
                    <td><span class="badge text-capitalize bg-${status === 'open' ? 'danger' : (status === 'in progress' ? 'warning text-dark' : 'success')}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-index="${originalIndex}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-index="${originalIndex}"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    }

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
        // document.getElementById('save-blocker-btn')?.addEventListener('click', handleFormSave);
        
        document.getElementById('blockers-table-body')?.addEventListener('click', function(e) {
            const target = e.target.closest('button');
            if (!target) return;
            const index = target.dataset.index;
            if (target.classList.contains('edit-btn')) showModalForEdit(index);
            if (target.classList.contains('delete-btn')) handleDelete(index);
        });
    }
    
    // All CRUD functions remain the same
    
    initialize();
});
