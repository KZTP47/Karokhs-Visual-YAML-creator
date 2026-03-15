const CommandPalette = {
    active: false,
    selectedIndex: 0,
    filteredCommands: [],
    commands: [
        { name: 'Add New Job', icon: 'fas fa-plus', cmd: () => { if (window.addJob) window.addJob(); else if (window.JobManager) window.JobManager.addJob(); }, shortcut: 'Alt+N' },
        { name: 'Open Quick Start Wizard', icon: 'fas fa-magic', cmd: () => { if (window.openWizard) window.openWizard(); }, shortcut: '' },
        { name: 'Simulate Pipeline', icon: 'fas fa-play', cmd: () => { if (window.Simulator) window.Simulator.simulatePipeline(); }, shortcut: '' },
        { name: 'Export YAML File', icon: 'fas fa-download', cmd: () => { if (window.exportYaml) window.exportYaml(); else if (window.YamlGenerator) window.YamlGenerator.exportYaml(); }, shortcut: '' },
        { name: 'Save Project', icon: 'fas fa-save', cmd: () => { if (window.ProjectManager) window.ProjectManager.saveProject(); }, shortcut: 'Ctrl+S' },
        { name: 'Auto Layout Canvas', icon: 'fas fa-project-diagram', cmd: () => { if (window.LayoutManager) window.LayoutManager.autoLayout(); }, shortcut: 'Alt+L' },
        { name: 'Toggle Dark Mode', icon: 'fas fa-moon', cmd: () => { if (window.UIManager) window.UIManager.setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'); }, shortcut: '' },
        { name: 'Switch to Validation Tab', icon: 'fas fa-check-circle', cmd: () => { if (window.switchTab) window.switchTab('validation'); }, shortcut: '' },
        { name: 'Switch to YAML Tab', icon: 'fas fa-file-code', cmd: () => { if (window.switchTab) window.switchTab('yaml'); }, shortcut: '' },
        { name: 'Explain This Pipeline', icon: 'fas fa-comment-alt', cmd: () => { if (window.PipelineExplainer) window.PipelineExplainer.showExplanation(); }, shortcut: '' },
        { name: 'Undo Last Action', icon: 'fas fa-undo', cmd: () => { if (window.EnhancedUI) window.EnhancedUI.undo(); }, shortcut: 'Ctrl+Z' },
        { name: 'Redo Last Action', icon: 'fas fa-redo', cmd: () => { if (window.EnhancedUI) window.EnhancedUI.redo(); }, shortcut: 'Ctrl+Y' },
        { name: 'Duplicate Selected Job', icon: 'fas fa-copy', cmd: () => { if (window.EnhancedUI) window.EnhancedUI.duplicateJob(); }, shortcut: 'Ctrl+D' },
        { name: 'Delete Selected Job', icon: 'fas fa-trash', cmd: () => { if (window.JobManager) window.JobManager.deleteJob(); }, shortcut: 'Delete' },
        { name: 'Clear All Jobs', icon: 'fas fa-broom', cmd: () => { if (window.UIManager) window.UIManager.clearAll(); }, shortcut: '' },
        { name: 'Browse Action Catalog', icon: 'fas fa-store', cmd: () => { if (window.ActionCatalog) window.ActionCatalog.open(); }, shortcut: '' },
        { name: 'Open Recipe Builder', icon: 'fas fa-hat-wizard', cmd: () => { if (window.RecipeBuilder) window.RecipeBuilder.openModal(); }, shortcut: '' }
    ],

    init() {
        console.log("CommandPalette initialized");
        this.setupKeyboardListeners();
        this.injectHint();
    },

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggle();
            }

            if (this.active) {
                if (e.key === 'Escape') {
                    this.close();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.moveSelection(1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.moveSelection(-1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSelected();
                }
            }
        });
    },

    injectHint() {
        const hint = document.createElement('div');
        hint.className = 'command-palette-hint';
        hint.innerHTML = 'Press <strong>Ctrl + K</strong> to search for any command';
        document.body.appendChild(hint);
    },

    toggle() {
        if (this.active) this.close();
        else this.open();
    },

    open() {
        this.active = true;
        this.selectedIndex = 0;
        this.filteredCommands = [...this.commands];

        const overlay = document.createElement('div');
        overlay.className = 'command-palette-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.close(); };

        const palette = document.createElement('div');
        palette.className = 'command-palette';
        palette.innerHTML = `
            <div class="command-palette-input-container">
                <input type="text" id="command-palette-input" class="command-palette-input" placeholder="What would you like to do?" autocomplete="off">
            </div>
            <div class="command-palette-results" id="command-palette-results"></div>
        `;

        overlay.appendChild(palette);
        document.body.appendChild(overlay);
        this.overlay = overlay;

        const input = document.getElementById('command-palette-input');
        input.focus();
        input.oninput = (e) => this.filter(e.target.value);

        this.renderResults();
    },

    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.active = false;
        }
    },

    filter(query) {
        const q = query.toLowerCase();
        this.filteredCommands = this.commands.filter(c => 
            c.name.toLowerCase().includes(q)
        );
        this.selectedIndex = 0;
        this.renderResults();
    },

    moveSelection(dir) {
        this.selectedIndex += dir;
        if (this.selectedIndex < 0) this.selectedIndex = this.filteredCommands.length - 1;
        if (this.selectedIndex >= this.filteredCommands.length) this.selectedIndex = 0;
        this.renderResults();
        
        // Ensure selected item is in view
        const selected = document.querySelector('.command-palette-item.selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
    },

    executeSelected() {
        const cmd = this.filteredCommands[this.selectedIndex];
        if (cmd) {
            this.close();
            setTimeout(() => cmd.cmd(), 50);
        }
    },

    renderResults() {
        const results = document.getElementById('command-palette-results');
        if (!results) return;

        if (this.filteredCommands.length === 0) {
            results.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-secondary);">No matching commands found.</div>';
            return;
        }

        results.innerHTML = this.filteredCommands.map((c, i) => `
            <div class="command-palette-item ${i === this.selectedIndex ? 'selected' : ''}" onclick="CommandPalette.selectedIndex=${i}; CommandPalette.executeSelected();">
                <div class="command-item-main">
                    <div class="command-item-icon"><i class="${c.icon}"></i></div>
                    <div class="command-item-name">${c.name}</div>
                </div>
                ${c.shortcut ? `<div class="command-palette-shortcut">${c.shortcut}</div>` : ''}
            </div>
        `).join('');
    }
};

window.CommandPalette = CommandPalette;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => CommandPalette.init(), 3300);
});
