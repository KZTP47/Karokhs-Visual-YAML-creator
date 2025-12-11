/**
 * UI Manager Module
 * Handles general UI operations and state
 */

const UIManager = {
    /**
     * Handle clicks on the canvas (deselect job)
     */
    handleCanvasClick(event) {
        const container = document.getElementById('graph-container');
        if (event.target === container || event.target.tagName === 'svg') {
            if (AppState.selectedId) {
                NodeRenderer.selectNode(null);
            }
            AppState.setSelectedId(null);
            document.getElementById('job-config').style.display = 'none';
            document.getElementById('global-config').style.display = 'block';
        }
    },

    /**
     * Check if pipeline is empty and show/hide empty state message
     */
    checkEmptyState() {
        const isEmpty = AppState.getAllJobs().length === 0;
        document.getElementById('empty-state-msg').style.display = isEmpty ? 'block' : 'none';
    },

    /**
     * Switch between tabs (Config, Validation, YAML)
     */
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));

        if (tabName === 'config') {
            document.querySelectorAll('.tab')[0].classList.add('active');
            document.getElementById('tab-config').classList.add('active');
        } else if (tabName === 'validation') {
            document.querySelectorAll('.tab')[1].classList.add('active');
            document.getElementById('tab-validation').classList.add('active');
            Validation.updateValidation();
        } else if (tabName === 'yaml') {
            document.querySelectorAll('.tab')[2].classList.add('active');
            document.getElementById('tab-yaml').classList.add('active');
        }
    },

    /**
     * Toggle settings modal
     */
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    },

    /**
     * Set theme (light/dark)
     */
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    },

    /**
     * Set custom background image
     */
    setBackground(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.body.style.backgroundImage = `url(${e.target.result})`;
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    /**
     * Reset background to default
     */
    resetBackground() {
        document.body.style.backgroundImage = '';
    },

    /**
     * Toggle collapsible sections
     */
    toggleCollapsible(header) {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.fa-chevron-down');

        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            icon.style.transform = 'rotate(0deg)';
        } else {
            content.classList.add('expanded');
            icon.style.transform = 'rotate(180deg)';
        }
    },

    /**
     * Clear entire pipeline
     */
    clearAll() {
        AppState.reset();

        const container = document.getElementById('graph-container');
        container.innerHTML = `
            <svg id="svg-layer"></svg>
            <div id="empty-state-msg" style="display:block">
                <i class="fas fa-vial"></i>
                <h3>No Test Pipeline Yet</h3>
                <p>Use the Quick Start Wizard to begin.</p>
            </div>
            <div class="floating-actions">
                <button class="secondary" onclick="LayoutManager.autoLayout()" title="Auto Arrange Jobs">
                    <i class="fas fa-magic"></i> Auto Layout
                </button>
            </div>
        `;

        // Reinitialize components
        ConnectionManager.init('svg-layer', 'graph-container');

        YamlGenerator.updateYaml();
        Validation.validateNames();
        Validation.updateValidation();
    }
};

// Make it available globally
window.UIManager = UIManager;
