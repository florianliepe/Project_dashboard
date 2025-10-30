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
            // --- THE DEFINITIVE FIX ---
            // This line was missing the assignment, causing dependencies not to show.
            dependencies: item.Dependencies || null 
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
});```

#### **Step 2: Fix the CSS File (`css/style.css`)**

**File to Edit: `css/style.css`**
*(**Action:** Replace the entire content of this file with the complete, corrected code below.)*

```css
/* Global Styles */
body { background-color: #f8f9fa; padding-top: 56px; }
.container { max-width: 1400px; }
.card { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: none; }
.navbar-brand { font-weight: 500; }
.navbar-brand i { position: relative; top: -1px; }
h1 { display: flex; align-items: center; gap: 0.75rem; }

/* Project Selection Page (index.html) */
.project-card { transition: transform 0.2s, box-shadow 0.2s; }
.project-card:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1); }
.project-card .card-title { font-size: 1.25rem; font-weight: 500; color: var(--bs-primary); }
.project-card .card-footer { background-color: #f8f9fa; }
.form-text { font-size: 0.8rem; }
.rag-status-indicator { height: 15px; width: 15px; border-radius: 50%; display: inline-block; border: 1px solid rgba(0,0,0,0.1); }
.rag-green { background-color: #198754; }
.rag-amber { background-color: #ffc107; }
.rag-red { background-color: #dc3545; }
.btn-rag { width: 35px; font-weight: bold; color: #6c757d; background-color: #e9ecef; border: 1px solid #dee2e6; }
.btn-rag.active { color: #fff; }
.btn-rag[data-status="G"].active { background-color: #198754; border-color: #198754; }
.btn-rag[data-status="A"].active { background-color: #ffc107; border-color: #ffc107; }
.btn-rag[data-status="R"].active { background-color: #dc3545; border-color: #dc3545; }
#modal-status-message .alert { padding: 0.5rem 1rem; margin-bottom: 0; }

/* Environment Checklist Page */
.environment-table th:first-child, .environment-table td:first-child { position: sticky; left: 0; background-color: #f8f9fa; z-index: 2; }
.environment-table thead th { z-index: 3; background-color: #e9ecef; }

/* Progress Bar & Status Text */
.progress-bar { color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); font-weight: 500; }
.progress-bar.bg-warning { color: #212529 !important; text-shadow: none; }
.status-completed { color: #198754; font-weight: 500; }
.status-in-progress { color: #0d6efd; font-weight: 500; }
.status-blocked, .status-overdue { color: #dc3545; font-weight: 500; }
.status-default { color: #6c757d; font-weight: 500; }
.table th { font-weight: 600; }

/* Executive Summary Styles */
.summary-textarea { border: none; background-color: transparent; resize: none; padding: 0; color: #212529; }
.summary-textarea:focus { box-shadow: none; background-color: transparent; }
.summary-textarea.editable { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: .375rem .75rem; }

/* Gantt Chart Dependency Arrow Styles */
.gantt .arrow { stroke: #6c757d; stroke-width: 1.5; }
.gantt .arrow-head { fill: #6c757d; }

/* Dependency Dropdown Text Fix */
#modal-dependencies option { color: #000 !important; }

/* --- NEW: FIX FOR MODAL LAYOUT --- */
/* This ensures Bootstrap's grid system is not overridden by the Gantt CSS. */
.modal-body .row {
    display: flex;
    flex-wrap: wrap;
}
.modal-body .col-md-6 {
    width: 50%;
}
