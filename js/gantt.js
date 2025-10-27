document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
    document.getElementById('project-title').textContent = `${activeProject} - Gantt View`;

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
    if (!rawData) {
        document.getElementById('gantt-chart-container').innerHTML = '<div class="alert alert-danger">Project data not found.</div>';
        return;
    }
    
    const projectData = JSON.parse(rawData);
    const overviewData = projectData.overview || [];

    const tasks = overviewData.map((item, index) => {
        const endDate = parseDate(item['Target Date']);
        if (!endDate) {
            return null; // Skip tasks without a valid end date
        }

        // Create a start date 1 day before the end date to make the bar visible
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);

        const progress = String(item.Status || '').toLowerCase().includes('deployed') ? 100 : 0;

        return {
            id: 'task_' + index,
            name: item.Activity || 'Unnamed Task',
            start: formatDateForGantt(startDate),
            end: formatDateForGantt(endDate),
            progress: progress,
            custom_class: 'bar-milestone' // Optional: for styling
        };
    }).filter(task => task !== null); // Filter out the skipped tasks

    if (tasks.length === 0) {
        document.getElementById('gantt-chart-container').innerHTML = '<div class="alert alert-warning">No tasks with valid dates found in the Overview data to display in the Gantt chart.</div>';
        return;
    }
    
    try {
        const gantt = new Gantt("#gantt-chart", tasks, {
            header_height: 50,
            bar_height: 20,
            step: 24,
            view_modes: ['Day', 'Week', 'Month'],
            view_mode: 'Week',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: function(task) {
                const taskData = overviewData.find(item => item.Activity === task.name);
                return `
                    <div class="gantt-popup-content p-2">
                        <strong>${task.name}</strong><br>
                        <small>Target Date: ${taskData['Target Date'] || 'N/A'}</small><br>
                        <small>Responsible: ${taskData.Responsible || 'N/A'}</small>
                    </div>`;
            }
        });
    } catch (e) {
        console.error("Gantt chart rendering failed:", e);
        document.getElementById('gantt-chart-container').innerHTML = '<div class="alert alert-danger">An error occurred while rendering the Gantt chart.</div>';
    }
});
