document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const activeProject = sessionStorage.getItem('activeProject');
    if (!activeProject) {
        window.location.href = 'index.html';
        return; 
    }

    let projectData = {};
    let environmentData = [];
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';

    function initialize() {
        loadDataAndRender();
        document.querySelector('.navbar-brand').innerHTML = `<i class="bi bi-clipboard2-data-fill"></i> ${activeProject}`;
        document.getElementById('project-title').textContent = `${activeProject} - Environment`;
    }

    function loadDataAndRender() {
        const rawData = localStorage.getItem(PROJECT_DATA_PREFIX + activeProject);
        if (!rawData) {
            alert('Error: Could not find data for the selected project.');
            window.location.href = 'index.html';
            return;
        }
        
        projectData = JSON.parse(rawData);
        environmentData = projectData.environmentchecklist || [];
        renderMatrix(environmentData);
    }

    function renderMatrix(data) {
        const tableHead = document.getElementById('env-table-head');
        const tableBody = document.getElementById('env-table-body');
        
        if (!tableHead || !tableBody) return;

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td>No environment checklist data found for this project.</td></tr>';
            return;
        }

        const headers = Object.keys(data[0]);
        const categoryHeader = headers[0];
        const envHeaders = headers.slice(1);

        let headerHtml = '<tr>';
        headerHtml += `<th>${categoryHeader}</th>`;
        envHeaders.forEach(h => {
            headerHtml += `<th>${h}</th>`;
        });
        headerHtml += '</tr>';
        tableHead.innerHTML = headerHtml;

        data.forEach(row => {
            let rowHtml = '<tr>';
            rowHtml += `<td><strong>${row[categoryHeader]}</strong></td>`;

            envHeaders.forEach(env => {
                const status = row[env] || '';
                let cellContent = status;
                if (status.toLowerCase().includes('ok') || status.toLowerCase().includes('install')) {
                    cellContent = `<span class="text-success">${status} <i class="bi bi-check-circle"></i></span>`;
                } else if (status.toLowerCase().includes('progress') || status.toLowerCase().includes('check')) {
                    cellContent = `<span class="text-warning">${status} <i class="bi bi-hourglass-split"></i></span>`;
                }
                 rowHtml += `<td>${cellContent}</td>`;
            });

            rowHtml += '</tr>';
            tableBody.innerHTML += rowHtml;
        });
    }

    initialize();
});
