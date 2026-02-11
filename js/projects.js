document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const PROJECT_LIST_KEY = 'migrationDashboard_projects';
    const PROJECT_DATA_PREFIX = 'migrationDashboard_';
    const projectListContainer = document.getElementById('project-list-container');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const addProjectForm = document.getElementById('add-project-form');
    const updateFileInput = document.getElementById('update-file-input');
    const globalStatusMessage = document.getElementById('global-status-message');
    const addProjectModal = new bootstrap.Modal(document.getElementById('addProjectModal'));
    let projectToUpdate = null;

    function getProjectList() { return JSON.parse(localStorage.getItem(PROJECT_LIST_KEY)) || []; }
    function saveProjectList(projects) { localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projects)); }

    function renderProjects() {
        const projects = getProjectList();
        projectListContainer.innerHTML = '';
        if (projects.length === 0) {
            projectListContainer.innerHTML = `<div class="col-12"><div class="alert alert-info text-center"><h4>No projects found.</h4><p>Click the "Add New Project" button to get started.</p></div></div>`;
            return;
        }
        projects.forEach(projectName => {
            const projectData = JSON.parse(localStorage.getItem(PROJECT_DATA_PREFIX + projectName));
            const lastModified = projectData ? new Date(projectData.lastModified).toLocaleString('de-DE') : 'N/A';
            const ragStatus = projectData?.ragStatus || 'G';
            let statusColorClass = ragStatus === 'A' ? 'rag-amber' : (ragStatus === 'R' ? 'rag-red' : 'rag-green');
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `<div class="card h-100 project-card"><div class="card-body d-flex flex-column"><div class="d-flex justify-content-between align-items-start"><h5 class="card-title">${projectName}</h5><span class="rag-status-indicator ${statusColorClass}" title="Project Status: ${statusColorClass.split('-')[1]}"></span></div><p class="card-text text-muted mb-4"><small>Last Modified: ${lastModified}</small></p><button class="btn btn-primary mt-auto select-project-btn" data-project-name="${projectName}"><i class="bi bi-box-arrow-in-right"></i> Open Dashboard</button></div><div class="card-footer d-flex justify-content-between align-items-center"><div class="btn-group"><button class="btn btn-sm btn-rag rag-status-btn ${ragStatus === 'G' ? 'active' : ''}" data-project-name="${projectName}" data-status="G">G</button><button class="btn btn-sm btn-rag rag-status-btn ${ragStatus === 'A' ? 'active' : ''}" data-project-name="${projectName}" data-status="A">A</button><button class="btn btn-sm btn-rag rag-status-btn ${ragStatus === 'R' ? 'active' : ''}" data-project-name="${projectName}" data-status="R">R</button></div><div><button class="btn btn-sm btn-outline-secondary update-project-btn" data-project-name="${projectName}" title="Update from Excel"><i class="bi bi-cloud-arrow-up"></i></button><button class="btn btn-sm btn-outline-danger delete-project-btn" data-project-name="${projectName}" title="Delete Project"><i class="bi bi-trash"></i></button></div></div></div>`;
            projectListContainer.appendChild(card);
        });
    }

    function showGlobalStatus(message, isError = false) {
        globalStatusMessage.innerHTML = `<div class="alert alert-${isError ? 'danger' : 'success'}" role="alert">${message}</div>`;
        setTimeout(() => { globalStatusMessage.innerHTML = ''; }, 4000);
    }

    function parseAndStoreProjectData(file, projectName, isNewProject) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    // --- MODIFIED SECTION ---
                    const requiredSheets = ['Home', 'Testing', 'Blockers'];
                    let projectData = {};
                    if (!isNewProject) {
                        const existingData = JSON.parse(localStorage.getItem(PROJECT_DATA_PREFIX + projectName));
                        projectData.ragStatus = existingData?.ragStatus || 'G';
                    } else {
                        projectData.ragStatus = 'G';
                    }
                    requiredSheets.forEach(sheetName => {
                        if (!workbook.Sheets[sheetName]) throw new Error(`Required sheet "${sheetName}" not found.`);
                        const key = sheetName.toLowerCase().replace(/\s+/g, '');
                        projectData[key] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    });
                    // --- END MODIFIED SECTION ---
                    projectData.lastModified = new Date().toISOString();
                    localStorage.setItem(PROJECT_DATA_PREFIX + projectName, JSON.stringify(projectData));
                    resolve();
                } catch (error) { reject(error); }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    function handleProjectSave() {
        const projectNameInput = document.getElementById('project-name');
        const fileInput = document.getElementById('project-file');
        const projectName = projectNameInput.value.trim();
        const file = fileInput.files[0];
        const statusDiv = document.getElementById('modal-status-message');
        if (!projectName || !file) { statusDiv.innerHTML = `<div class="alert alert-danger">Please provide a project name and select a file.</div>`; return; }
        if (getProjectList().includes(projectName)) { statusDiv.innerHTML = `<div class="alert alert-danger">A project with this name already exists.</div>`; return; }
        statusDiv.innerHTML = `<div class="alert alert-info">Processing file...</div>`;
        parseAndStoreProjectData(file, projectName, true)
            .then(() => {
                const currentProjects = getProjectList();
                currentProjects.push(projectName);
                saveProjectList(currentProjects);
                addProjectForm.reset();
                statusDiv.innerHTML = '';
                addProjectModal.hide();
                renderProjects();
                showGlobalStatus(`Project "${projectName}" created successfully!`);
            })
            .catch(error => { statusDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`; });
    }
    
    function handleProjectUpdate(file) {
        if (!file || !projectToUpdate) return;
        if (!confirm(`Are you sure you want to replace all data for project "${projectToUpdate}" with the contents of this new file?\n\nThis action cannot be undone.`)) { projectToUpdate = null; return; }
        parseAndStoreProjectData(file, projectToUpdate, false)
            .then(() => { renderProjects(); showGlobalStatus(`Project "${projectToUpdate}" was updated successfully!`); })
            .catch(error => { showGlobalStatus(`Error updating project: ${error.message}`, true); })
            .finally(() => { projectToUpdate = null; });
    }

    function handleProjectDelete(projectName) { if (confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) { localStorage.removeItem(PROJECT_DATA_PREFIX + projectName); saveProjectList(getProjectList().filter(p => p !== projectName)); renderProjects(); showGlobalStatus(`Project "${projectName}" was deleted.`); } }
    function handleProjectSelect(projectName) { sessionStorage.setItem('activeProject', projectName); window.location.href = 'dashboard.html'; }
    function handleStatusUpdate(projectName, newStatus) { const projectData = JSON.parse(localStorage.getItem(PROJECT_DATA_PREFIX + projectName)); if (projectData) { projectData.ragStatus = newStatus; projectData.lastModified = new Date().toISOString(); localStorage.setItem(PROJECT_DATA_PREFIX + projectName, JSON.stringify(projectData)); renderProjects(); } }

    saveProjectBtn.addEventListener('click', handleProjectSave);
    projectListContainer.addEventListener('click', (e) => { const target = e.target.closest('button'); if (!target) return; const projectName = target.dataset.projectName; if (target.classList.contains('select-project-btn')) { handleProjectSelect(projectName); } else if (target.classList.contains('delete-project-btn')) { handleProjectDelete(projectName); } else if (target.classList.contains('update-project-btn')) { projectToUpdate = projectName; updateFileInput.click(); } else if (target.classList.contains('rag-status-btn')) { const newStatus = target.dataset.status; handleStatusUpdate(projectName, newStatus); } });
    updateFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) { handleProjectUpdate(file); } e.target.value = ''; });

    renderProjects();
});
