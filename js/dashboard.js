document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }

    let projectData = {};
    let overviewData = [];
    let taskModal;
    let statusChartInstance = null;
    let completionsChartInstance = null;
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';

    const searchInput = document.getElementById('search-input');
    const responsibleFilter = document.getElementById('responsible-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    const editSummaryBtn = document.getElementById('edit-summary-btn');
    const saveSummaryBtn = document.getElementById('save-summary-btn');
    const cancelSummaryBtn = document.getElementById('cancel-summary-btn');
    const summaryAccomplishments = document.getElementById('summary-accomplishments');
    const summaryRisks = document.getElementById('summary-risks');
    const summaryNextSteps = document.getElementById('summary-next-steps');
    const summaryTextareas = document.querySelectorAll('.summary-textarea');

    let currentSortColumn = null;
    let isAscending = true;

    function parseDate(dateInput) {
        if (!dateInput) return null;
        if (typeof dateInput === 'number' && dateInput > 1) { const excelEpoch = new Date(1899, 11, 30); return new Date(excelEpoch.getTime() + dateInput * 24 * 60 * 60 * 1000); }
        if (typeof dateInput !== 'string') return null;
        if (dateInput.includes('.')) { const parts = dateInput.split('.'); if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]); }
        const date = new Date(dateInput);
        if (!isNaN(date)) return date;
        return null;
    }

    function makeTableSortable() {
        const table = document.querySelector('table thead');
        if (!table) return;
        table.addEventListener('click', (e) => {
            const header = e.target.closest('th');
            if (!header || !header.dataset.columnKey) return;
            const columnKey = header.dataset.columnKey;
            if (currentSortColumn === columnKey) { isAscending = !isAscending; } 
            else { currentSortColumn = columnKey; isAscending = true; }
            applyFilters();
        });
    }

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
        populateExecutiveSummary();
        renderDashboard();
    }
    
    function saveProjectData() {
        projectData.overview = overviewData;
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
        renderCompletionsChart(overviewData);
        applyFilters();
    }

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
        saveProjectData();
        toggleSummaryEditMode(false);
    }
    
    function addEventListeners() {
        editSummaryBtn.addEventListener('click', () => toggleSummaryEditMode(true));
        cancelSummaryBtn.addEventListener('click', () => { populateExecutiveSummary(); toggleSummaryEditMode(false); });
        saveSummaryBtn.addEventListener('click', handleSaveSummary);
        searchInput.addEventListener('input', applyFilters);
        responsibleFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
        resetFiltersBtn.addEventListener('click', () => { searchInput.value = ''; responsibleFilter.value = 'All Responsible'; statusFilter.value = 'All Statuses'; applyFilters(); });
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
        if (currentSortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[currentSortColumn] || '';
                let valB = b[currentSortColumn] || '';
                if (currentSortColumn === 'Target Date') { valA = parseDate(valA); valB = parseDate(valB); }
                if (valA < valB) return isAscending ? -1 : 1;
                if (valA > valB) return isAscending ? 1 : -1;
                return 0;
            });
        }
        populateTable(filteredData);
    }

    function populateSummaryCards(data) {
        document.getElementById('total-tasks').textContent = data.length;
        document.getElementById('completed-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('deployed')).length;
        document.getElementById('inprogress-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('progress')).length;
        document.getElementById('blocked-tasks').textContent = data.filter(item => String(item.Status || '').toLowerCase().includes('risc')).length;
    }

    function renderCompletionsChart(data) {
        const ctx = document.getElementById('completions-chart')?.getContext('2d');
        if (!ctx) return;
        const completedTasks = data.filter(item => {
            const status = String(item.Status || '').toLowerCase();
            return (status.includes('deployed') || status.includes('completed')) && parseDate(item['Target Date']);
        });
        const completionsByWeek = completedTasks.reduce((acc, task) => {
            const date = parseDate(task['Target Date']);
            const year = date.getFullYear();
            const week = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) + 1) / 7);
            const weekLabel = `W${week}, ${year}`;
            acc[weekLabel] = (acc[weekLabel] || 0) + 1;
            return acc;
        }, {});
        const sortedLabels = Object.keys(completionsByWeek).sort((a, b) => {
            const [weekA, yearA] = a.replace('W', '').split(', ');
            const [weekB, yearB] = b.replace('W', '').split(', ');
            if (yearA !== yearB) return yearA - yearB;
            return weekA - weekB;
        });
        const chartData = sortedLabels.map(label => completionsByWeek[label]);
        const chartConfig = {
            type: 'bar',
            data: { labels: sortedLabels, datasets: [{ label: 'Tasks Completed', data: chartData, backgroundColor: 'rgba(25, 135, 84, 0.7)', borderColor: 'rgba(25, 135, 84, 1)', borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        };
        if (completionsChartInstance) completionsChartInstance.destroy();
        completionsChartInstance = new Chart(ctx, chartConfig);
    }

    function renderStatusChart(data) {
        const ctx = document.getElementById('status-chart')?.getContext('2d');
        if (!ctx) return;
        const statusCounts = data.reduce((acc, item) => { const status = String(item.Status || 'N/A'); acc[status] = (acc[status] || 0) + 1; return acc; }, {});
        const chartConfig = { type: 'doughnut', data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545', '#6c757d', '#17a2b8'], borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } } };
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(ctx, chartConfig);
    }

    function populateTable(data) {
        const tableBody = document.getElementById('overview-table-body');
        tableBody.innerHTML = '';
        if (data.length === 0) { tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No tasks match the current filters.</td></tr>'; return; }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        data.forEach(item => {
            const originalIndex = overviewData.findIndex(originalItem => originalItem === item);
            let overdueClass = '';
            const status = String(item.Status || '').toLowerCase();
            const dueDate = parseDate(item['Target Date']);
            if (status !== 'deployed' && status !== 'completed' && dueDate && dueDate < today) { overdueClass = 'table-danger'; }
            const row = `<tr class="${overdueClass}"><td>${item.Phase || ''}</td><td>${item.Topics || ''}</td><td>${item.Activity || ''}</td><td>${item.Details || ''}</td><td>${item.Responsible || ''}</td><td>${item.Environment || ''}</td><td>${item['Target Date'] || ''}</td><td><span class="badge bg-secondary">${item.Status || 'N/A'}</span></td><td><button class="btn btn-sm btn-outline-primary edit-btn" data-index="${originalIndex}"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger delete-btn" data-index="${originalIndex}"><i class="bi bi-trash"></i></button></td></tr>`;
            tableBody.innerHTML += row;
        });
    }
    
    function handleExportToExcel() {
        if (!projectData) { alert("There is no data to export."); return; }
        const workbook = XLSX.utils.book_new();
        Object.keys(projectData).forEach(key => {
            if (key !== 'lastModified' && Array.isArray(projectData[key])) {
                let sheetName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                sheetName = sheetName.replace('checklist', ' Checklist').trim();
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(projectData[key]), sheetName);
            }
        });
        XLSX.writeFile(workbook, `${activeProject}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    function populateDependenciesDropdown(selectedIndex = -1) {
        const dependenciesSelect = document.getElementById('modal-dependencies');
        dependenciesSelect.innerHTML = '<option value="">None</option>';
        overviewData.forEach((task, index) => {
            if (index === selectedIndex) return;
            const option = document.createElement('option');
            option.value = `task_${index}`;
            option.textContent = task.Activity || `Task ${index + 1}`;
            dependenciesSelect.appendChild(option);
        });
    }

    function showModalForAdd() {
        document.getElementById('task-form').reset();
        document.getElementById('modal-task-index').value = '';
        document.getElementById('taskModalLabel').textContent = 'Add New Task';
        populateDependenciesDropdown();
        taskModal.show();
    }

    function showModalForEdit(index) {
        const item = overviewData[index];
        if (!item) return;
        document.getElementById('task-form').reset();
        document.getElementById('modal-task-index').value = index;
        document.getElementById('taskModalLabel').textContent = 'Edit Task';
        populateDependenciesDropdown(parseInt(index));
        document.getElementById('modal-phase').value = item.Phase || '';
        document.getElementById('modal-topics').value = item.Topics || '';
        document.getElementById('modal-activity').value = item.Activity || '';
        document.getElementById('modal-details').value = item.Details || '';
        document.getElementById('modal-responsible').value = item.Responsible || '';
        document.getElementById('modal-environment').value = item.Environment || '';
        document.getElementById('modal-target-date').value = item['Target Date'] || '';
        document.getElementById('modal-status').value = item.Status || '';
        document.getElementById('modal-dependencies').value = item.Dependencies || '';
        taskModal.show();
    }

    function handleFormSave() {
        const index = document.getElementById('modal-task-index').value;
        const taskData = {
            'Phase': document.getElementById('modal-phase').value,
            'Topics': document.getElementById('modal-topics').value,
            'Activity': document.getElementById('modal-activity').value,
            'Details': document.getElementById('modal-details').value,
            'Responsible': document.getElementById('modal-responsible').value,
            'Environment': document.getElementById('modal-environment').value,
            'Target Date': document.getElementById('modal-target-date').value,
            'Status': document.getElementById('modal-status').value,
            'Dependencie
