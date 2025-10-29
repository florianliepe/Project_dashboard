document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    // ... (All variables and helper functions from previous step remain the same) ...
    function initialize() { /* ... unchanged ... */ }
    function loadDataAndRender() { /* ... unchanged ... */ }
    function saveProjectData() { /* ... unchanged ... */ }
    function renderDashboard() { /* ... unchanged ... */ }
    function populateExecutiveSummary() { /* ... unchanged ... */ }
    function toggleSummaryEditMode(isEditing) { /* ... unchanged ... */ }
    function handleSaveSummary() { /* ... unchanged ... */ }
    function addEventListeners() { /* ... unchanged ... */ }
    function populateFilters() { /* ... unchanged ... */ }
    function applyFilters() { /* ... unchanged ... */ }
    function populateSummaryCards(data) { /* ... unchanged ... */ }
    function renderCompletionsChart(data) { /* ... unchanged ... */ }
    function renderStatusChart(data) { /* ... unchanged ... */ }
    function populateTable(data) { /* ... unchanged ... */ }
    function handleExportToExcel() { /* ... unchanged ... */ }

    // --- MODIFIED: showModalForAdd & showModalForEdit ---
    function populateDependenciesDropdown(selectedIndex = -1) {
        const dependenciesSelect = document.getElementById('modal-dependencies');
        dependenciesSelect.innerHTML = '<option value="">None</option>'; // Default option
        overviewData.forEach((task, index) => {
            if (index === selectedIndex) return; // A task cannot depend on itself
            const option = document.createElement('option');
            option.value = `task_${index}`; // This is the ID used by the Gantt chart
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

        // ... (rest of the fields are populated as before) ...
        document.getElementById('modal-phase').value = item.Phase || '';
        document.getElementById('modal-topics').value = item.Topics || '';
        document.getElementById('modal-activity').value = item.Activity || '';
        document.getElementById('modal-details').value = item.Details || '';
        document.getElementById('modal-responsible').value = item.Responsible || '';
        document.getElementById('modal-environment').value = item.Environment || '';
        document.getElementById('modal-target-date').value = item['Target Date'] || '';
        document.getElementById('modal-status').value = item.Status || '';
        document.getElementById('modal-dependencies').value = item.Dependencies || ''; // Set the selected dependency

        taskModal.show();
    }

    // --- MODIFIED: handleFormSave ---
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
            'Dependencies': document.getElementById('modal-dependencies').value // Save the dependency
        };
        if (index === '') {
            overviewData.push(taskData);
        } else {
            overviewData[parseInt(index)] = taskData;
        }
        saveProjectData();
        renderDashboard();
        taskModal.hide();
    }

    function handleDelete(index) { /* ... unchanged ... */ }
    
    initialize();
});
