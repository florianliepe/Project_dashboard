document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    
    const navbarBrand = document.querySelector('.navbar-brand');
    const projectTitle = document.getElementById('project-title');
    if (navbarBrand) {
        navbarBrand.innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
    }
    if (projectTitle) {
        projectTitle.textContent = `${activeProject} - Gantt View`;
    }

    function parseDate(dateInput) {
        if (!dateInput) return null;
        let date;
        if (typeof dateInput === 'number' && dateInput > 1) {
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + dateInput * 24 * 60 * 60 * 1000);
        } else if (typeof dateInput === 'string') {
            if (dateInput.includes('.')) {
                const parts = dateInput.split('.');
                if (parts.length === 3) date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                date = new Date(dateInput);
            }
        }
        return !date || isNaN(date) ? null : date;
    }

    function formatDateForGantt(date) {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
    const ganttContainer = document.getElementById('gantt-chart-container');

    if (!rawData) {
        if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger">Project data not found.</div>';
        return;
    }
    
    let projectData;
    try {
        projectData = JSON.parse(rawData);
    } catch (e) {
        console.error("Failed to parse project data:", e);
        if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger"><strong>Error:</strong> Could not read project data. It may be corrupted. Please try clearing your site data or re-creating the project.</div>';
        return;
    }

    const overviewData = projectData.overview || [];

    const tasks = overviewData.map((item, index) => {
        const targetDate = parseDate(item['Target Date']);
        if (!targetDate) {
            return null;
        }

        const startDate = targetDate;
        const endDate = new Date(targetDate);
        endDate.setDate(targetDate.getDate() + 1);

        const progress = String(item.Status || '').toLowerCase().includes('deployed') || String(item.Status || '').toLowerCase().includes('completed') ? 100 : 0;

        return {
            id: 'task_' + index,
            name: item.Activity || 'Unnamed Task',
            start: formatDateForGantt(startDate),
            end: formatDateForGantt(endDate),
            progress: progress,
        };
    }).filter(task => {
        return task && task.start && task.end;
    });

    if (tasks.length === 0) {
        if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-warning">No tasks with valid dates found in the Overview data to display in the Gantt chart.</div>';
        return;
    }
    
    setTimeout(() => {
        try {
            new Gantt("#gantt-chart", tasks, {
                header_height: 50,
                bar_height: 20,
                step: 24,
                view_modes: ['Day', 'Week', 'Month'],
                view_mode: 'Week',
                date_format: 'YYYY-MM-DD',
                custom_popup_html: function(task) {
                    const taskData = overviewData.find(item => item.Activity === task.name);
                    if (taskData) {
                        return `
                            <div class="gantt-popup-content p-2" style="min-width: 200px;">
                                <strong>${task.name}</strong><br>
                                <small>Target Date: ${taskData['Target Date'] || 'N/A'}</small><br>
                                <small>Responsible: ${taskData.Responsible || 'N/A'}</small>
                            </div>`;
                    } else {
                        return `<div class="gantt-popup-content p-2"><strong>${task.name}</strong><br><small>No additional details found.</small></div>`;
                    }
                }
            });
        } catch (e) {
            console.error("Gantt chart rendering failed:", e);
            if (ganttContainer) ganttContainer.innerHTML = '<div class="alert alert-danger">A critical error occurred while rendering the Gantt chart. Check the console for details.</div>';
        }
    }, 0);
});
