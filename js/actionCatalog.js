const ActionCatalog = {
    panel: null,
    currentCategory: 'all',
    searchQuery: '',
    actions: [
        // Setup
        { id: 'checkout', category: 'setup', name: 'Checkout Code', version: 'v4', desc: 'Downloads your source code from GitHub so the pipeline can use it.', detail: 'This should almost always be the first step in any job.', github: 'actions/checkout@v4', gitlab: 'checkout' },
        { id: 'setup-node', category: 'setup', name: 'Setup Node.js', version: 'v4', desc: 'Installs a specific version of Node.js for your JavaScript project.', detail: 'Use this if you need npm, yarn, or pnpm.', github: 'actions/setup-node@v4', gitlab: 'image: node:latest' },
        { id: 'setup-python', category: 'setup', name: 'Setup Python', version: 'v5', desc: 'Installs Python and sets up pip for your backend or data project.', detail: 'Supports multiple Python versions like 3.10, 3.11, etc.', github: 'actions/setup-python@v5', gitlab: 'image: python:latest' },
        { id: 'setup-java', category: 'setup', name: 'Setup Java (JDK)', version: 'v4', desc: 'Installs the Java Development Kit for Android or Spring Boot apps.', detail: 'Supports Temurin, Zulu, and other distributions.', github: 'actions/setup-java@v4', gitlab: 'image: openjdk:latest' },
        { id: 'setup-go', category: 'setup', name: 'Setup Go', version: 'v5', desc: 'Sets up the Go environment for building high-performance services.', detail: 'Handles go.mod caching automatically.', github: 'actions/setup-go@v5', gitlab: 'image: golang:latest' },
        
        // Testing
        { id: 'npm-test', category: 'testing', name: 'Run npm test', version: '', desc: 'Executes the "test" script defined in your package.json file.', detail: 'The standard way to run Jest, Mocha, or Vitest.', github: 'run: npm test', gitlab: 'npm test' },
        { id: 'pytest', category: 'testing', name: 'Run Pytest', version: '', desc: 'The most popular testing framework for Python projects.', detail: 'Automatically finds and runs files named test_*.py.', github: 'run: pytest', gitlab: 'pytest' },
        { id: 'cypress', category: 'testing', name: 'Cypress E2E', version: 'v6', desc: 'Runs end-to-end browser tests to make sure your website really works.', detail: 'Checks clicking, typing, and navigation.', github: 'cypress-io/github-action@v6', gitlab: 'image: cypress/included:latest' },
        { id: 'jest', category: 'testing', name: 'Jest Tests', version: '', desc: 'Fast, modern testing for React and Node.js projects.', detail: 'Supports code coverage out of the box.', github: 'run: npm run test:unit', gitlab: 'npm run test:unit' },
        
        // Deployment
        { id: 'pages', category: 'deployment', name: 'GitHub Pages', version: 'v4', desc: 'Deploys your static website directly to GitHub Pages for free.', detail: 'Great for documentation, portfolios, and blogs.', github: 'actions/deploy-pages@v4', gitlab: 'pages: {}' },
        { id: 'aws-s3', category: 'deployment', name: 'AWS S3 Sync', version: 'v1', desc: 'Uploads your build files to an Amazon S3 bucket for web hosting.', detail: 'Standard for static sites on AWS.', github: 'jakejarvis/s3-sync-action@master', gitlab: 'aws s3 sync' },
        { id: 'netlify', category: 'deployment', name: 'Netlify Deploy', version: 'v2', desc: 'Automatically deploys your site to Netlify with a preview URL.', detail: 'Provides "deploy previews" for pull requests.', github: 'netlify/actions/cli@master', gitlab: 'netlify deploy' },
        { id: 'vercel', category: 'deployment', name: 'Vercel Deploy', version: 'v1', desc: 'The best way to deploy Next.js and other frontend frameworks.', detail: 'Handles routing and serverless functions.', github: 'amondnet/vercel-action@v20', gitlab: 'vercel deploy' },
        
        // Security
        { id: 'codeql', category: 'security', name: 'CodeQL Analysis', version: 'v3', desc: 'Looks for security vulnerabilities in your code (SQLi, XSS, etc.).', detail: 'GitHub\'s built-in advanced security scanner.', github: 'github/codeql-action/analyze@v3', gitlab: 'sast: {}' },
        { id: 'snyk', category: 'security', name: 'Snyk Security Scan', version: 'v1', desc: 'Checks your dependencies (npm/pip) for known vulnerabilities.', detail: 'Warns you if a library you use has a security bug.', github: 'snyk/actions/node@master', gitlab: 'snyk test' },
        { id: 'audit', category: 'security', name: 'npm audit', version: '', desc: 'Quickly check your JavaScript packages for security issues.', detail: 'Built into npm, very fast.', github: 'run: npm audit', gitlab: 'npm audit' },
        
        // Notifications
        { id: 'slack', category: 'notifications', name: 'Slack Notification', version: 'v1', desc: 'Sends a message to your team when a pipeline fails or succeeds.', detail: 'Keeps everyone informed in real-time.', github: 'slackapi/slack-github-action@v1.25.0', gitlab: 'slack: {}' },
        { id: 'discord', category: 'notifications', name: 'Discord Webhook', version: 'v1', desc: 'Post pipeline status updates to your Discord server.', detail: 'Uses simple webhooks.', github: 'rtCamp/action-discord-notifier@master', gitlab: 'curl discord' },
        
        // Utilities
        { id: 'artifact-up', category: 'utilities', name: 'Upload Artifact', version: 'v4', desc: 'Saves files (like a build folder) so you can download them later.', detail: 'Necessary for passing files between jobs.', github: 'actions/upload-artifact@v4', gitlab: 'artifacts: {}' },
        { id: 'artifact-down', category: 'utilities', name: 'Download Artifact', version: 'v4', desc: 'Retrieves files saved by a previous job.', detail: 'Opposite of Upload Artifact.', github: 'actions/download-artifact@v4', gitlab: 'dependencies: []' },
        { id: 'cache', category: 'utilities', name: 'Cache Deps', version: 'v4', desc: 'Speeds up your pipeline by remembering previously downloaded files.', detail: 'Can reduce build time by 50% or more.', github: 'actions/cache@v4', gitlab: 'cache: {}' }
    ],

    init() {
        console.log("ActionCatalog initialized");
        this.injectButton();
    },

    injectButton() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            const btn = document.createElement('button');
            btn.className = 'secondary icon-btn action-catalog-btn';
            btn.title = 'Browse the Catalog of Action & Commands';
            btn.innerHTML = '<i class="fas fa-store"></i>';
            btn.onclick = () => this.toggle();
            
            const settingsBtn = toolbar.querySelector('button[onclick="toggleSettings()"]');
            if (settingsBtn) settingsBtn.before(btn);
            else toolbar.appendChild(btn);
        }
    },

    toggle() {
        if (this.panel) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        this.panel = document.createElement('div');
        this.panel.className = 'action-catalog-panel';
        this.panel.innerHTML = `
            <div class="action-catalog-header">
                <h3><i class="fas fa-store"></i> Action Catalog</h3>
                <div class="action-catalog-search-container">
                    <i class="fas fa-search action-catalog-search-icon"></i>
                    <input type="text" class="action-catalog-search-input" placeholder="Search for actions, categories, or keywords..." oninput="ActionCatalog.search(this.value)">
                </div>
                <span onclick="ActionCatalog.close()" style="cursor:pointer; font-size:24px;">&times;</span>
            </div>
            <div class="action-catalog-body">
                <div class="action-catalog-sidebar">
                    <div class="action-catalog-nav-item active" data-cat="all" onclick="ActionCatalog.filter('all')"><i class="fas fa-th"></i> All Actions</div>
                    <div class="action-catalog-nav-item" data-cat="setup" onclick="ActionCatalog.filter('setup')"><i class="fas fa-cog"></i> Setup</div>
                    <div class="action-catalog-nav-item" data-cat="testing" onclick="ActionCatalog.filter('testing')"><i class="fas fa-check-circle"></i> Testing</div>
                    <div class="action-catalog-nav-item" data-cat="building" onclick="ActionCatalog.filter('building')"><i class="fas fa-hammer"></i> Building</div>
                    <div class="action-catalog-nav-item" data-cat="deployment" onclick="ActionCatalog.filter('deployment')"><i class="fas fa-rocket"></i> Deployment</div>
                    <div class="action-catalog-nav-item" data-cat="security" onclick="ActionCatalog.filter('security')"><i class="fas fa-shield-alt"></i> Security</div>
                    <div class="action-catalog-nav-item" data-cat="notifications" onclick="ActionCatalog.filter('notifications')"><i class="fas fa-bell"></i> Notifications</div>
                    <div class="action-catalog-nav-item" data-cat="utilities" onclick="ActionCatalog.filter('utilities')"><i class="fas fa-wrench"></i> Utilities</div>
                </div>
                <div class="action-catalog-grid" id="action-catalog-grid"></div>
            </div>
        `;

        // Create backdrop overlay
        var catalogBackdrop = document.createElement('div');
        catalogBackdrop.className = 'action-catalog-backdrop';
        catalogBackdrop.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:55999;backdrop-filter:blur(2px);';
        catalogBackdrop.onclick = function() { ActionCatalog.close(); };
        document.body.appendChild(catalogBackdrop);
        this.catalogBackdrop = catalogBackdrop;

        document.body.appendChild(this.panel);
        this.renderGrid();
    },

    close() {
        if (this.catalogBackdrop) {
            this.catalogBackdrop.remove();
            this.catalogBackdrop = null;
        }
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
    },

    filter(cat) {
        this.currentCategory = cat;
        document.querySelectorAll('.action-catalog-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.cat === cat);
        });
        this.renderGrid();
    },

    search(query) {
        this.searchQuery = query.toLowerCase();
        this.renderGrid();
    },

    renderGrid() {
        const grid = document.getElementById('action-catalog-grid');
        if (!grid) return;

        const filtered = this.actions.filter(a => {
            const matchesCat = this.currentCategory === 'all' || a.category === this.currentCategory;
            const matchesSearch = a.name.toLowerCase().includes(this.searchQuery) || 
                                 a.desc.toLowerCase().includes(this.searchQuery) ||
                                 a.category.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        grid.innerHTML = filtered.map(a => `
            <div class="action-catalog-entry">
                <div class="action-entry-title">
                    ${a.name}
                    ${a.version ? `<span class="action-entry-version">${a.version}</span>` : ''}
                </div>
                <div class="action-entry-desc">${a.desc}</div>
                <div style="font-size:11px; color:var(--text-secondary); line-height:1.2;">${a.detail}</div>
                <div class="action-entry-footer">
                    <div class="recipe-tag">${a.category}</div>
                    <button class="onboarding-btn-primary" style="padding:4px 10px; font-size:11px;" onclick="ActionCatalog.addToJob('${a.id}')">Add to Job</button>
                </div>
            </div>
        `).join('');

        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; padding:100px; text-align:center; color:var(--text-secondary);">No actions found matching your criteria. Try different keywords!</div>';
        }
    },

    addToJob(actionId) {
        if (!window.AppState.selectedId) {
            if (window.showNotification) window.showNotification("Please select a job on the canvas first!", "warning");
            return;
        }

        const action = this.actions.find(a => a.id === actionId);
        if (!action) return;

        const job = window.AppState.getJob(window.AppState.selectedId);
        const platform = window.AppState.platform || 'github';
        
        let stepName = action.name;
        let stepType = 'run';
        let stepVal = platform === 'github' ? action.github : action.gitlab;

        if (stepVal.includes('@') || stepVal.startsWith('actions/')) {
            stepType = 'action';
        } else if (stepVal.startsWith('run:')) {
            stepType = 'run';
            stepVal = stepVal.replace('run: ', '');
        }

        job.steps.push({
            type: stepType,
            name: stepName,
            val: stepVal
        });

        // Refresh UI
        if (window.JobManager && window.JobManager.renderStepsList) {
            window.JobManager.renderStepsList(job);
        }
        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            window.YamlGenerator.updateYaml();
        }
        if (window.NodeRenderer && window.NodeRenderer.updateNodeSteps) {
            window.NodeRenderer.updateNodeSteps(job.internalId, job.steps.length);
        }
        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState('Added action: ' + action.name);
        }

        if (window.showNotification) window.showNotification(`Added ${action.name} to ${job.name}`, "success");
        this.close();
    }
};

window.ActionCatalog = ActionCatalog;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => ActionCatalog.init(), 3200);
});
