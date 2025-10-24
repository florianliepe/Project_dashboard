document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    let projectData = {};
    let overviewData = [];
    let taskModal;
    let statusChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';

    const searchInput = document.getElementById('search-input');
    const responsibleFilter = document.getElementById('responsible-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    function parseDate(dateInput) {
        if (!dateInput) return null;
        if (typeof dateInput === 'number' && dateInput > 1) {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + dateInput * 24 * 60 * 60 * 1000);
        }
        if (typeof dateInput !== 'string') return null;
        if (dateInput.includes('.')) {
            const parts = dateInput.split('.');
            if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        const date = new Date(dateInput);
        if (!isNaN(date)) return date;
        return null;
    }

    function initialize() {
        const modalElement = document.getElementById('taskModal');
        if (modalElement) taskModal = new bootstrap.Modal(modalElement);
        
        loadDataAndRender();
        addEventListeners();

        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Overview`;
    }

    function loadDataAndRender() {
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) {
            alert('Error: Could not find data for the selected project.');
            return;
        }
        
        projectData = JSON.parse(rawData);
        overviewData = projectData.overview || [];
        
        populateFilters();
        renderDashboard();
    }

    function saveDataAndReRender() {
        projectData.overview = overviewData;
        projectData.lastModified = new Date().toISOString();
        localStorage.setItem(PROJECT_DATA_PREFIX + activeProject, JSON.stringify(projectData));
        
        populateFilters();
        renderDashboard();
    }

    function renderDashboard() {
        populateSummaryCards(overviewData);
        renderStatusChart(overviewData);
        applyFilters();
    }

    function populateFilters() {
        const responsibles = ['All Responsible', ...new Set(overviewData.map(item => item.Responsible).filter(Boolean).sort())];
        responsibleFilter.innerHTML = responsibles.map(r => `<option value="${r}">${r}</option>`).join('');

        const statuses = ['All Statuses', ...new Set(overviewData.map(item => item.Status).filter(Boolean).sort())];
        statusFilter.innerHTML = statuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const responsible = responsibleFilter.value;
        const status = statusFilter.value;

        let filteredData = overviewData.filter(item => {
            const matchesSearch = (item.Activity || '').toLowerCase().includes(searchTerm);
            const matchesResponsible = (responsible === 'All Responsible' || item.Responsible === responsible);
            const matchesStatus = (status === 'All Statuses' || item.Status === status);
            return matchesSearch && matchesResponsible && matchesStatus;
        });

        populateTable(filteredData);
    }

    function populateSummaryCards(data) {
        document.getElementById('total-tasks').textContent = data.length;
        document.getElementById('completed-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('deployed')).length;
        document.getElementById('inprogress-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('progress')).length;
        document.getElementById('blocked-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('risc')).length;
    }

    function renderStatusChart(data) {
        const ctx = document.getElementById('status-chart')?.getContext('2d');
        if (!ctx) return;

        const statusCounts = data.reduce((acc, item) => {
            const status = String(item.Status || 'N/A');
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        const chartConfig = {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545', '#6c757d', '#17a2b8'], borderWidth: 1 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        };

        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(ctx, chartConfig);
    }

    function populateTable(data) {
        const tableBody = document.getElementById('overview-table-body');
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No tasks match the current filters.</td></tr>';
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        data.forEach(item => {
            const originalIndex = overviewData.findIndex(originalItem => originalItem === item);
            let overdueClass = '';
            const status = String(item.Status || '').toLowerCase();
            const dueDate = parseDate(item['Target Date']);

            if (status !== 'deployed' && status !== 'completed' && dueDate && dueDate < today) {
                overdueClass = 'table-danger';
            }
            
            const row = `
                <tr class="${overdueClass}">
                    <td>${item.Phase || ''}</td>
                    <td>${item.Topics || ''}</td>
                    <td>${item.Activity || ''}</td>
                    <td>${item.Details || ''}</td>
                    <td>${item.Responsible || ''}</td>
                    <td>${item.Environment || ''}</td>
                    <td>${item['Target Date'] || ''}</td>
                    <td><span class="badge bg-secondary">${item.Status || 'N/A'}</span></td>
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

        document.getElementById('add-task-btn')?.addEventListener('click', showModalForAdd);
        // CORRECTED: Added back the event listener for the save button
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

    function handleExportToExcel() { /* ... unchanged ... */ }
    
    function showModalForAdd() { /* ... unchanged ... */ }

    function showModalForEdit(index) { /* ... unchanged ... */ }

    function handleFormSave() { /* ... unchanged ... */ }

    function handleDelete(index) { /* ... unchanged ... */ }

    initialize();
});
