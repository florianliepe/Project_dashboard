document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }

    let projectData = {};
    let overviewData = [];
    let taskModal;
    let statusChartInstance = null;
    let completionsChartInstance = null; // <-- NEW
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';

    // ... (DOM references for filters and executive summary are the same) ...

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
        // ... (loading logic is the same) ...
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) { alert('Error: Could not find data for the selected project.'); return; }
        projectData = JSON.parse(rawData);
        overviewData = projectData.overview || [];
        populateFilters();
        populateExecutiveSummary();
        renderDashboard();
    }
    
    function saveProjectData() { /* ... same as before ... */ }

    function renderDashboard() {
        populateSummaryCards(overviewData);
        renderStatusChart(overviewData);
        renderCompletionsChart(overviewData); // <-- NEW CALL
        applyFilters();
    }

    // --- NEW: Completions Chart Function ---
    function renderCompletionsChart(data) {
        const ctx = document.getElementById('completions-chart')?.getContext('2d');
        if (!ctx) return;

        const completedTasks = data.filter(item => {
            const status = String(item.Status || '').toLowerCase();
            return (status.includes('deployed') || status.includes('completed')) && parseDate(item['Target Date']);
        });

        // Group tasks by week
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
            data: {
                labels: sortedLabels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: chartData,
                    backgroundColor: 'rgba(25, 135, 84, 0.7)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false } }
            }
        };

        if (completionsChartInstance) completionsChartInstance.destroy();
        completionsChartInstance = new Chart(ctx, chartConfig);
    }

    // --- All other functions remain the same ---
    function populateExecutiveSummary() { /* ... unchanged ... */ }
    function toggleSummaryEditMode(isEditing) { /* ... unchanged ... */ }
    function handleSaveSummary() { /* ... unchanged ... */ }
    function addEventListeners() { /* ... unchanged ... */ }
    function populateFilters() { /* ... unchanged ... */ }
    function applyFilters() { /* ... unchanged ... */ }
    function populateSummaryCards(data) { /* ... unchanged ... */ }
    function renderStatusChart(data) { /* ... unchanged ... */ }
    function populateTable(data) { /* ... unchanged ... */ }
    function handleExportToExcel() { /* ... unchanged ... */ }
    function showModalForAdd() { /* ... unchanged ... */ }
    function showModalForEdit(index) { /* ... unchanged ... */ }
    function handleFormSave() { /* ... unchanged ... */ }
    function handleDelete(index) { /* ... unchanged ... */ }
    
    initialize();
});
