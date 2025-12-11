/**
 * Enhanced UI Module
 * Integrates step library, adds undo/redo, improves overall UX
 */

const EnhancedUI = {
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    stepLibraryModal: null,
    notificationQueue: [],

    /**
     * Initialize enhanced UI features
     */
    init() {
        this.setupKeyboardShortcuts();
        this.injectStepLibraryModal();
        this.enhanceStepEditor();
        this.addQuickActionButtons();
        this.setupNotificationSystem();
        this.improveEmptyStates();
        this.saveInitialState();
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
            if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }

            // Ctrl/Cmd + S = Save project
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                ProjectManager.saveProject();
                this.showNotification('Project saved!', 'success');
            }

            // Delete key = Delete selected job
            if (e.key === 'Delete' && AppState.selectedId && !e.target.matches('input, textarea')) {
                e.preventDefault();
                JobManager.deleteJob();
            }

            // Escape = Deselect
            if (e.key === 'Escape') {
                UIManager.handleCanvasClick({ target: document.getElementById('graph-container') });
            }

            // Ctrl/Cmd + D = Duplicate selected job
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && AppState.selectedId) {
                e.preventDefault();
                this.duplicateJob();
            }
        });
    },

    /**
     * Save current state to history
     */
    saveState() {
        const state = AppState.exportState();

        // Remove future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(JSON.stringify(state));

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }

        this.updateUndoRedoButtons();
    },

    /**
     * Save initial state
     */
    saveInitialState() {
        const state = AppState.exportState();
        this.history = [JSON.stringify(state)];
        this.historyIndex = 0;
        this.updateUndoRedoButtons();
    },

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.showNotification('Undo', 'info');
        }
    },

    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.showNotification('Redo', 'info');
        }
    },

    /**
     * Restore state from history
     */
    restoreState(stateJson) {
        const state = JSON.parse(stateJson);
        UIManager.clearAll();
        ProjectManager.restoreProject(state);
        this.updateUndoRedoButtons();
    },

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
        }

        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    },

    /**
     * Add undo/redo buttons to toolbar
     */
    addQuickActionButtons() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Find the divider after platform switch
        const divider = toolbar.querySelector('div[style*="height: 24px"]');
        if (!divider) return;

        // Create undo/redo buttons
        const undoRedoContainer = document.createElement('div');
        undoRedoContainer.style.display = 'flex';
        undoRedoContainer.style.gap = '5px';
        undoRedoContainer.innerHTML = `
            <button class="secondary icon-btn" id="undo-btn" onclick="EnhancedUI.undo()" title="Undo (Ctrl+Z)" disabled>
                <i class="fas fa-undo"></i>
            </button>
            <button class="secondary icon-btn" id="redo-btn" onclick="EnhancedUI.redo()" title="Redo (Ctrl+Shift+Z)" disabled>
                <i class="fas fa-redo"></i>
            </button>
        `;

        // Insert after divider
        divider.after(undoRedoContainer);

        // Add help button
        const helpBtn = document.createElement('button');
        helpBtn.className = 'secondary icon-btn';
        helpBtn.title = 'Help & Tutorial';
        helpBtn.innerHTML = '<i class="fas fa-question-circle"></i>';
        helpBtn.onclick = () => HelpSystem.showHelp();

        // Find the settings button and insert before it
        const settingsBtn = toolbar.querySelector('button[onclick="toggleSettings()"]');
        if (settingsBtn) {
            settingsBtn.before(helpBtn);
        }
    },

    /**
     * Inject step library modal HTML
     */
    injectStepLibraryModal() {
        const modal = document.createElement('div');
        modal.id = 'step-library-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="step-library-container">
                <div class="step-library-header">
                    <h2>Step Library</h2>
                    <input type="text" id="step-search" placeholder="Search steps..." 
                           oninput="EnhancedUI.searchSteps(this.value)">
                    <span class="modal-close" onclick="EnhancedUI.closeStepLibrary()">×</span>
                </div>
                <div class="step-library-body">
                    <div class="step-categories" id="step-categories"></div>
                    <div class="step-list" id="step-list-content"></div>
                </div>
                <div class="step-library-footer">
                    <div id="recommended-steps"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.stepLibraryModal = modal;
    },

    /**
     * Open step library
     */
    openStepLibrary() {
        if (!this.stepLibraryModal) return;
        
        // Check if StepLibrary is available
        if (typeof StepLibrary === 'undefined') {
            console.error('StepLibrary not loaded!');
            this.showNotification('Step Library unavailable. Please refresh the page.', 'error');
            return;
        }

        this.stepLibraryModal.style.display = 'flex';
        this.renderStepCategories();
        this.showRecommendedSteps();

        // Show first category by default
        const categories = StepLibrary.getCategories();
        if (categories.length > 0) {
            this.showCategorySteps(categories[0].id);
        }
    },

    /**
     * Close step library
     */
    closeStepLibrary() {
        if (this.stepLibraryModal) {
            this.stepLibraryModal.style.display = 'none';
        }
    },

    /**
     * Render step categories
     */
    renderStepCategories() {
        const container = document.getElementById('step-categories');
        if (!container) return;

        const categories = StepLibrary.getCategories();
        container.innerHTML = categories.map(cat => `
            <div class="category-item" onclick="EnhancedUI.showCategorySteps('${cat.id}')">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
            </div>
        `).join('');
    },

    /**
     * Show steps for a category
     */
    showCategorySteps(categoryId) {
        const container = document.getElementById('step-list-content');
        if (!container) return;

        // Highlight selected category
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        event?.target?.closest('.category-item')?.classList.add('active');

        const steps = StepLibrary.getStepsByCategory(categoryId);
        this.renderSteps(steps);
    },

    /**
     * Render steps list
     */
    renderSteps(steps) {
        const container = document.getElementById('step-list-content');
        if (!container) return;

        if (steps.length === 0) {
            container.innerHTML = '<div class="no-results">No steps found</div>';
            return;
        }

        container.innerHTML = steps.map(step => `
            <div class="step-library-item" onclick="EnhancedUI.addStepFromLibrary('${step.id}')">
                <div class="step-icon">
                    <i class="${step.icon}"></i>
                </div>
                <div class="step-info">
                    <div class="step-name">${step.name}</div>
                    <div class="step-description">${step.description}</div>
                    ${step.needsConfig ? '<div class="step-needs-config"><i class="fas fa-exclamation-circle"></i> Requires configuration</div>' : ''}
                    ${step.securityNote ? `<div class="step-security-note"><i class="fas fa-shield-alt"></i> ${step.securityNote}</div>` : ''}
                    ${step.alternatives ? `<div class="step-alternatives"><strong>Alternatives:</strong> ${step.alternatives.length}</div>` : ''}
                </div>
                <div class="step-add-btn">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        `).join('');
    },

    /**
     * Search steps
     */
    searchSteps(query) {
        if (!query.trim()) {
            // Show first category if search is cleared
            const categories = StepLibrary.getCategories();
            if (categories.length > 0) {
                this.showCategorySteps(categories[0].id);
            }
            return;
        }

        const results = StepLibrary.searchSteps(query);
        this.renderSteps(results);
    },

    /**
     * Show recommended steps for current job
     */
    showRecommendedSteps() {
        const container = document.getElementById('recommended-steps');
        if (!container) return;

        if (!AppState.selectedId) {
            container.innerHTML = '';
            return;
        }

        const job = AppState.getJob(AppState.selectedId);
        const recommended = StepLibrary.getRecommendedSteps(job);

        if (recommended.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="recommended-header">
                <i class="fas fa-lightbulb"></i> Recommended for this job:
            </div>
            <div class="recommended-list">
                ${recommended.map(step => `
                    <button class="recommended-step" onclick="EnhancedUI.addStepFromLibrary('${step.id}')">
                        <i class="${step.icon}"></i>
                        ${step.name}
                    </button>
                `).join('')}
            </div>
        `;
    },

    /**
     * Add step from library to current job
     */
    addStepFromLibrary(stepId) {
        if (!AppState.selectedId) {
            this.showNotification('Please select a job first', 'warning');
            return;
        }

        const step = StepLibrary.getStepById(stepId);
        if (!step) return;

        const job = AppState.getJob(AppState.selectedId);

        // Check if step needs configuration
        if (step.needsConfig) {
            // Show configuration modal
            this.showStepConfigModal(step, (configuredValue) => {
                job.steps.push({
                    type: step.type,
                    name: step.name,
                    val: configuredValue
                });

                JobManager.renderStepsList(job);
                YamlGenerator.updateYaml();
                this.saveState();
                this.showNotification(`Added: ${step.name}`, 'success');
            });
        } else {
            // Add step directly
            job.steps.push({
                type: step.type,
                name: step.name,
                val: step.value
            });

            JobManager.renderStepsList(job);
            NodeRenderer.updateNodeSteps(AppState.selectedId, job.steps.length);
            YamlGenerator.updateYaml();
            this.saveState();
            this.showNotification(`Added: ${step.name}`, 'success');
        }

        // Show alternatives if available
        if (step.alternatives && step.alternatives.length > 0) {
            this.showAlternativesNotification(step);
        }

        this.closeStepLibrary();
    },

    /**
     * Show step configuration modal
     */
    showStepConfigModal(step, callback) {
        const modal = document.createElement('div');
        modal.className = 'step-config-modal';
        modal.innerHTML = `
            <div class="step-config-content">
                <h3>Configure: ${step.name}</h3>
                <p>${step.description}</p>
                ${step.configHelp ? `<div class="config-help"><i class="fas fa-info-circle"></i> ${step.configHelp}</div>` : ''}
                <label>Command or Action:</label>
                <textarea id="step-config-value" rows="3">${step.value}</textarea>
                <div class="step-config-actions">
                    <button class="secondary" onclick="this.closest('.step-config-modal').remove()">Cancel</button>
                    <button onclick="EnhancedUI.finishStepConfig(this)">Add Step</button>
                </div>
            </div>
        `;

        modal.dataset.callback = callback.toString();
        document.body.appendChild(modal);
    },

    /**
     * Finish step configuration
     */
    finishStepConfig(button) {
        const modal = button.closest('.step-config-modal');
        const value = document.getElementById('step-config-value').value;
        const callbackStr = modal.dataset.callback;

        // Execute callback
        try {
            const callback = eval(`(${callbackStr})`);
            callback(value);
        } catch (e) {
            console.error('Error executing callback:', e);
        }

        modal.remove();
    },

    /**
     * Show alternatives notification
     */
    showAlternativesNotification(step) {
        const notification = document.createElement('div');
        notification.className = 'alternatives-notification';
        notification.innerHTML = `
            <div class="alternatives-content">
                <strong>Alternative commands available:</strong>
                ${step.alternatives.map(alt => `
                    <button class="alternative-btn" onclick="EnhancedUI.replaceLastStep('${alt.value.replace(/'/g, "\\'")}')">
                        ${alt.name}
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    },

    /**
     * Replace last added step with alternative
     */
    replaceLastStep(newValue) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        if (job.steps.length > 0) {
            job.steps[job.steps.length - 1].val = newValue;
            JobManager.renderStepsList(job);
            YamlGenerator.updateYaml();
            this.saveState();
            this.showNotification('Step updated with alternative', 'success');
        }
    },

    /**
     * Enhance step editor in sidebar
     */
    enhanceStepEditor() {
        // Find the steps section
        const stepsSection = document.getElementById('steps-section');
        if (!stepsSection) return;

        // Replace the "+ Add" button with an enhanced version
        const addButton = stepsSection.querySelector('button.secondary');
        if (addButton) {
            addButton.innerHTML = '<i class="fas fa-book-open"></i> Browse Step Library';
            addButton.onclick = () => this.openStepLibrary();
        }
    },

    /**
     * Duplicate selected job
     */
    duplicateJob() {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        const newJob = JSON.parse(JSON.stringify(job));
        newJob.internalId = 'node_' + Date.now();
        newJob.yamlId = newJob.yamlId + '_copy';
        newJob.name = newJob.name + ' (Copy)';
        newJob.x = job.x + 50;
        newJob.y = job.y + 50;

        AppState.addJob(newJob);
        NodeRenderer.renderNode(newJob);
        JobManager.selectJob(newJob.internalId);
        YamlGenerator.updateYaml();
        this.saveState();
        this.showNotification('Job duplicated', 'success');
    },

    /**
     * Setup notification system
     */
    setupNotificationSystem() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    /**
     * Improve empty states
     */
    improveEmptyStates() {
        // Enhance empty state message
        const emptyState = document.getElementById('empty-state-msg');
        if (emptyState) {
            emptyState.innerHTML = `
                <i class="fas fa-vial" style="font-size: 64px; opacity: 0.3; margin-bottom: 20px;"></i>
                <h2>Let's Build Your First Pipeline</h2>
                <p style="max-width: 400px; margin: 0 auto 30px; color: var(--text-secondary);">
                    Automate your testing and deployment with a visual pipeline builder designed for everyone.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="success" onclick="openWizard()" style="padding: 12px 24px;">
                        <i class="fas fa-magic"></i> Quick Start Wizard
                    </button>
                    <button class="secondary" onclick="HelpSystem.startTutorial('first-pipeline')" style="padding: 12px 24px;">
                        <i class="fas fa-graduation-cap"></i> Take Tutorial
                    </button>
                    <button class="secondary" onclick="addJob()" style="padding: 12px 24px;">
                        <i class="fas fa-plus"></i> Start from Scratch
                    </button>
                </div>
            `;
        }
    }
};

// Hook into existing functions to save state
// Check if JobManager exists first
if (typeof JobManager !== 'undefined') {
    const originalAddJob = JobManager.addJob;
    JobManager.addJob = function(...args) {
        originalAddJob.apply(this, args);
        EnhancedUI.saveState();
    };

    const originalDeleteJob = JobManager.deleteJob;
    JobManager.deleteJob = function(...args) {
        originalDeleteJob.apply(this, args);
        EnhancedUI.saveState();
    };

    const originalUpdateJobName = JobManager.updateJobName;
    JobManager.updateJobName = function(...args) {
        originalUpdateJobName.apply(this, args);
        EnhancedUI.saveState();
    };
} else {
    console.error('EnhancedUI: JobManager not found. Make sure enhancedUI.js loads after jobManager.js');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof EnhancedUI !== 'undefined') {
            EnhancedUI.init();
        }
    }, 100);
});

// Make it available globally
window.EnhancedUI = EnhancedUI;
