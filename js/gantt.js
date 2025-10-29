document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) { window.location.href = 'index.html'; return; }

    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    const navbarBrand = document.querySelector('.navbar-brand');
    const projectTitle = document.getElementById('project-title');
    if (navbarBrand) { navbarBrand.innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`; }
    if (projectTitle) { projectTitle.textContent = `${activeProject} - Gantt View`; }

    function parseDate(dateInput) { /* ... unchanged ... */ }
    function formatDateForGantt(date) { /* ... unchanged ... */ }

    const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
    const ganttContainer = document.getElementById('gantt-chart-container');
    if (!rawData) { if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger">Project data not found.</div>'; return; }
    
    let projectData;
    try { projectData = JSON.parse(rawData); } catch (e) { if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger">Error: Could not read project data.</div>'; return; }

    const overviewData = projectData.overview || [];

    const tasks = overviewData.map((item, index) => {
        const targetDate = parseDate(item['Target Date']);
        if (!targetDate) { return null; }

        const startDate = targetDate;
        const endDate = new Date(targetDate);
        endDate.setDate(targetDate.getDate() + 1);

        const progress = String(item.Status || '').toLowerCase().includes('deployed') || String(item.Status || '').toLowerCase().includes('completed') ? 100 : 0;

        return {
            id: 'task_' + index, // This ID must match what we save in the Dependencies field
            name: item.Activity || 'Unnamed Task',
            start: formatDateForGantt(startDate),
            end: formatDateForGantt(endDate),
            progress: progress,
            dependencies: item.Dependencies || null // --- NEW: Pass dependency data to the library
        };
    }).filter(task => task && task.start && task.end);

    if (tasks.length === 0) { if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-warning">No tasks with valid dates found.</div>'; return; }
    
    setTimeout(() => {
        try {
            new Gantt("#gantt-chart", tasks, {
                header_height: 50,
                bar_height: 20,
                step: 24,
                view_modes: ['Day', 'Week', 'Month'],
                view_mode: 'Week',
                date_format: 'YYYY-MM-DD',
                custom_popup_html: function(task) { /* ... unchanged ... */ }
            });
        } catch (e) {
            console.error("Gantt chart rendering failed:", e);
            if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger">A critical error occurred while rendering the Gantt chart.</div>';
        }
    }, 0);
});
