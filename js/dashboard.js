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
