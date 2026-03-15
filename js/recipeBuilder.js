const RecipeBuilder = {
    recipes: [
        {
            id: 'js-test',
            title: 'Test JavaScript Project',
            icon: 'fab fa-js',
            description: 'The standard way to test a modern web app. Installs dependencies and runs your test suite every time you push code.',
            tags: ['Popular', 'Beginner'],
            jobs: [
                {
                    name: 'Install and Test',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                        { type: 'run', name: 'Run Tests', val: 'npm test' }
                    ]
                }
            ]
        },
        {
            id: 'python-test',
            title: 'Python Test Pipeline',
            icon: 'fab fa-python',
            description: 'Sets up a Python environment, installs requirements, and runs pytest to ensure your code works.',
            tags: ['Data Science', 'Backend'],
            jobs: [
                {
                    name: 'Python Tests',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Setup Python', val: 'python -m pip install --upgrade pip' },
                        { type: 'run', name: 'Install Deps', val: 'pip install -r requirements.txt' },
                        { type: 'run', name: 'Run Pytest', val: 'pytest' }
                    ]
                }
            ]
        },
        {
            id: 'node-matrix',
            title: 'Matrix Test (JS)',
            icon: 'fas fa-th',
            description: 'Runs your tests on multiple Node.js versions (18, 20, 22) at the same time to ensure compatibility.',
            tags: ['Advanced', 'Matrix'],
            jobs: [
                {
                    name: 'Matrix Tests',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Install', val: 'npm ci' },
                        { type: 'run', name: 'Test', val: 'npm test' }
                    ]
                    // Matrix configuration would be added here if the core supported it visually
                }
            ]
        },
        {
            id: 'docker-build',
            title: 'Docker Build & Push',
            icon: 'fab fa-docker',
            description: 'Builds your application into a Docker container and pushes it to a registry for deployment.',
            tags: ['DevOps', 'Cloud'],
            jobs: [
                {
                    name: 'Build Image',
                    stage: 'build',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Log in to Registry', val: 'docker login -u ${{ secrets.USER }} -p ${{ secrets.PASS }}' },
                        { type: 'run', name: 'Build and Push', val: 'docker build -t my-app . && docker push my-app:latest' }
                    ]
                }
            ]
        },
        {
            id: 'test-deploy',
            title: 'Test then Deploy',
            icon: 'fas fa-rocket',
            description: 'A two-stage pipeline. First it runs tests, and only if they pass, it starts the deployment job.',
            tags: ['Delivery', 'Workflow'],
            jobs: [
                {
                    id: 'j1',
                    name: 'Run Tests',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Test', val: 'npm test' }
                    ]
                },
                {
                    id: 'j2',
                    name: 'Deploy to Cloud',
                    stage: 'deploy',
                    os: 'ubuntu-latest',
                    needs: ['j1'],
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Deploy', val: 'echo "Deploying to production..."' }
                    ]
                }
            ]
        },
        {
            id: 'full-cycle',
            title: 'Lint, Test, Build, Deploy',
            icon: 'fas fa-check-double',
            description: 'The complete enterprise workflow. Checks code style, runs tests, builds artifacts, and deploys.',
            tags: ['Enterprise', 'Complete'],
            jobs: [
                {
                    id: 'lint',
                    name: 'Lint Code',
                    stage: 'build',
                    os: 'ubuntu-latest',
                    steps: [{ type: 'run', name: 'Lint', val: 'npm run lint' }]
                },
                {
                    id: 'test',
                    name: 'Unit Tests',
                    stage: 'test',
                    needs: ['lint'],
                    os: 'ubuntu-latest',
                    steps: [{ type: 'run', name: 'Test', val: 'npm test' }]
                },
                {
                    id: 'build',
                    name: 'Build Artifact',
                    stage: 'build',
                    needs: ['test'],
                    os: 'ubuntu-latest',
                    steps: [{ type: 'run', name: 'Build', val: 'npm run build' }]
                },
                {
                    id: 'deploy',
                    name: 'Production Deploy',
                    stage: 'deploy',
                    needs: ['build'],
                    os: 'ubuntu-latest',
                    steps: [{ type: 'run', name: 'Deploy', val: 'echo "Ship it!"' }]
                }
            ]
        },
        {
            id: 'cypress-e2e',
            title: 'Cypress Browser Tests',
            icon: 'fas fa-eye',
            description: 'Runs end-to-end tests using real browsers. Perfect for ensuring your UI works from a user perspective.',
            tags: ['Testing', 'E2E'],
            jobs: [
                {
                    name: 'Cypress Tests',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'action', name: 'Cypress Action', val: 'cypress-io/github-action@v5' }
                    ]
                }
            ]
        },
        {
            id: 'security-scan',
            title: 'Dependency Security Scan',
            icon: 'fas fa-shield-alt',
            description: 'Checks your third-party libraries for known security vulnerabilities before they reach production.',
            tags: ['Security', 'Compliance'],
            jobs: [
                {
                    name: 'Security Audit',
                    stage: 'test',
                    os: 'ubuntu-latest',
                    steps: [
                        { type: 'checkout', name: 'Checkout Code', val: '' },
                        { type: 'run', name: 'Audit', val: 'npm audit' },
                        { type: 'action', name: 'Snyk Scan', val: 'snyk/actions/node@master' }
                    ]
                }
            ]
        }
    ],

    init() {
        console.log("RecipeBuilder initialized");
        this.injectButton();
    },

    injectButton() {
        // Add to toolbar
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            const btn = document.createElement('button');
            btn.className = 'success';
            btn.innerHTML = '<i class="fas fa-magic"></i> Help Me Build';
            btn.style.marginLeft = '10px';
            btn.onclick = () => this.openModal();
            toolbar.appendChild(btn);
        }

        // Add to empty state if current
        const emptyState = document.getElementById('empty-state-msg');
        if (emptyState) {
            const btn = document.createElement('button');
            btn.className = 'success';
            btn.style.padding = '12px 24px';
            btn.innerHTML = '<i class="fas fa-magic"></i> Build from Recipe';
            btn.onclick = () => this.openModal();
            
            // Insert before the "Start from Scratch" button
            const scratchBtn = Array.from(emptyState.querySelectorAll('button')).find(b => b.textContent.includes('Scratch'));
            if (scratchBtn) {
                scratchBtn.parentNode.insertBefore(btn, scratchBtn);
            }
        }
    },

    openModal() {
        if (this.modal) return;

        const overlay = document.createElement('div');
        overlay.className = 'recipe-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };

        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        modal.innerHTML = `
            <div class="recipe-modal-header">
                <h2>Choose a Goal-Based Recipe</h2>
                <span class="recipe-modal-close" onclick="RecipeBuilder.closeModal()" style="cursor:pointer; font-size:24px;">&times;</span>
            </div>
            <div class="recipe-grid" id="recipe-grid"></div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.modal = overlay;

        const grid = document.getElementById('recipe-grid');
        this.recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="recipe-card-title">
                    <i class="${recipe.icon}"></i> ${recipe.title}
                </div>
                <div class="recipe-card-desc">${recipe.description}</div>
                <div class="recipe-card-tags">
                    ${recipe.tags.map(t => `<span class="recipe-tag">${t}</span>`).join('')}
                </div>
            `;
            card.onclick = () => this.applyRecipe(recipe);
            grid.appendChild(card);
        });
    },

    closeModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    },

    applyRecipe(recipe) {
        if (window.AppState && window.AppState.jobs.length > 0) {
            if (!confirm("This will clear your current pipeline and replace it with the chosen recipe. Are you sure?")) {
                return;
            }
        }

        this.closeModal();

        // 1. Clear State
        if (window.UIManager && window.UIManager.clearAll) {
            window.UIManager.clearAll();
        } else {
            window.AppState.jobs = [];
            window.AppState.connections = [];
            // Remove stale DOM nodes from canvas
            var graphContainer = document.getElementById('graph-container');
            if (graphContainer) {
                var existingNodes = graphContainer.querySelectorAll('.node');
                existingNodes.forEach(function(node) { node.remove(); });
            }
            // Clear SVG connection lines
            var svgLayer = document.getElementById('svg-layer');
            if (svgLayer) {
                svgLayer.innerHTML = '';
            }
        }

        // 2. Add Jobs
        const idMap = {}; // old temp id -> new internal id
        recipe.jobs.forEach(jobDef => {
            const newJob = {
                internalId: 'node_' + Date.now() + Math.floor(Math.random() * 1000),
                yamlId: jobDef.name.toLowerCase().replace(/\s+/g, '_'),
                name: jobDef.name,
                stage: jobDef.stage || 'build',
                os: jobDef.os || 'ubuntu-latest',
                steps: JSON.parse(JSON.stringify(jobDef.steps)),
                x: 0,
                y: 0
            };
            
            if (jobDef.id) idMap[jobDef.id] = newJob.internalId;
            
            window.AppState.addJob(newJob);
            if (window.NodeRenderer) window.NodeRenderer.renderNode(newJob);
        });

        // 3. Add Connections
        recipe.jobs.forEach(jobDef => {
            if (jobDef.needs && Array.isArray(jobDef.needs)) {
                jobDef.needs.forEach(parentTempId => {
                    const fromId = idMap[parentTempId];
                    const toId = idMap[jobDef.id];
                    if (fromId && toId) {
                        window.AppState.addConnection(fromId, toId);
                    }
                });
            }
        });

        // 4. Polish and Finalize
        setTimeout(() => {
            if (window.LayoutManager && window.LayoutManager.autoLayout) {
                window.LayoutManager.autoLayout();
            }
            if (window.ConnectionManager && window.ConnectionManager.drawLines) {
                window.ConnectionManager.drawLines();
            }
            if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
                window.YamlGenerator.updateYaml();
            }
            if (window.EnhancedUI && window.EnhancedUI.saveState) {
                window.EnhancedUI.saveState('Applied ' + recipe.title + ' recipe');
            }
            
            if (window.showNotification) {
                window.showNotification(`Successfully built: ${recipe.title}!`, 'success');
            }
        }, 100);
    }
};

window.RecipeBuilder = RecipeBuilder;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => RecipeBuilder.init(), 2700);
});
