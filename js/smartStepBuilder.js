const SmartStepBuilder = {
    intentMap: [
        {
            phrases: ['download code', 'get code', 'clone repo', 'checkout', 'pull code', 'get my code', 'download my project', 'fetch code'],
            step: { type: 'checkout', name: 'Checkout Code', val: '' },
            explanation: 'Downloads your code from the repository so this job can work with it.'
        },
        {
            phrases: ['install packages', 'install dependencies', 'npm install', 'install node', 'install modules', 'get packages', 'setup packages', 'install npm'],
            step: { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
            explanation: 'Installs all the packages your project needs (listed in package.json).'
        },
        {
            phrases: ['run tests', 'test', 'run my tests', 'execute tests', 'npm test', 'check my code', 'verify code', 'run unit tests'],
            step: { type: 'run', name: 'Run Tests', val: 'npm test' },
            explanation: 'Runs your test suite to verify your code works correctly.'
        },
        {
            phrases: ['run python tests', 'pytest', 'python test', 'test python'],
            step: { type: 'run', name: 'Run Python Tests', val: 'pytest' },
            explanation: 'Runs Python tests using the pytest framework.'
        },
        {
            phrases: ['build', 'compile', 'build project', 'build app', 'npm build', 'create build', 'make build'],
            step: { type: 'run', name: 'Build Project', val: 'npm run build' },
            explanation: 'Compiles your application into a deployable format.'
        },
        {
            phrases: ['lint', 'check style', 'code style', 'eslint', 'code quality', 'format check', 'check formatting'],
            step: { type: 'run', name: 'Lint Code', val: 'npm run lint' },
            explanation: 'Checks your code for style issues and common mistakes.'
        },
        {
            phrases: ['setup node', 'install node', 'use node', 'node version', 'configure node', 'nodejs setup'],
            step: { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
            explanation: 'Installs a specific version of Node.js on the runner.'
        },
        {
            phrases: ['setup python', 'install python', 'use python', 'python version', 'configure python'],
            step: { type: 'action', name: 'Setup Python', val: 'actions/setup-python@v4' },
            explanation: 'Installs a specific version of Python on the runner.'
        },
        {
            phrases: ['setup java', 'install java', 'install jdk', 'java version', 'configure java'],
            step: { type: 'action', name: 'Setup Java', val: 'actions/setup-java@v3' },
            explanation: 'Installs a Java Development Kit on the runner.'
        },
        {
            phrases: ['deploy', 'publish', 'release', 'ship', 'go live', 'push to production', 'upload to server'],
            step: { type: 'run', name: 'Deploy Application', val: 'echo "Add your deploy command here"' },
            explanation: 'Deploys your application to a server. You will need to customize this command.'
        },
        {
            phrases: ['docker build', 'build image', 'create container', 'containerize', 'build docker'],
            step: { type: 'run', name: 'Build Docker Image', val: 'docker build -t myapp .' },
            explanation: 'Packages your application into a Docker container image.'
        },
        {
            phrases: ['coverage', 'test coverage', 'code coverage', 'coverage report'],
            step: { type: 'run', name: 'Run Tests with Coverage', val: 'npm test -- --coverage' },
            explanation: 'Runs tests and measures how much of your code is covered by tests.'
        },
        {
            phrases: ['cypress', 'e2e', 'end to end', 'browser test', 'integration test browser', 'ui test', 'selenium', 'playwright'],
            step: { type: 'run', name: 'Run E2E Tests', val: 'npx cypress run' },
            explanation: 'Runs end-to-end tests that simulate a real user interacting with your app in a browser.'
        },
        {
            phrases: ['cache', 'speed up', 'faster install', 'cache dependencies', 'cache node modules', 'save cache'],
            step: { type: 'action', name: 'Cache Dependencies', val: 'actions/cache@v3' },
            explanation: 'Saves downloaded packages between pipeline runs to speed things up.'
        },
        {
            phrases: ['database', 'migrate', 'migration', 'db setup', 'create tables', 'update database', 'schema'],
            step: { type: 'run', name: 'Run Database Migrations', val: 'npm run migrate' },
            explanation: 'Updates your database structure to match your latest code.'
        },
        {
            phrases: ['security', 'scan', 'vulnerability', 'audit', 'npm audit', 'security check'],
            step: { type: 'run', name: 'Security Audit', val: 'npm audit' },
            explanation: 'Checks your dependencies for known security vulnerabilities.'
        },
        {
            phrases: ['notify', 'notification', 'slack', 'email', 'alert', 'tell team', 'send message'],
            step: { type: 'run', name: 'Send Notification', val: 'echo "Pipeline completed"' },
            explanation: 'Sends a notification about the pipeline result. Customize for Slack, email, etc.'
        }
    ],

    init() {
        console.log("SmartStepBuilder initialized");
        
        // Hook into selectJob to inject button when a job is selected
        if (window.JobManager && window.JobManager.selectJob) {
            const originalSelectJob = window.JobManager.selectJob;
            const self = this;
            window.JobManager.selectJob = function() {
                originalSelectJob.apply(this, arguments);
                // Small delay to ensure DOM is updated
                setTimeout(() => self.injectSmartButton(), 100);
            };
        }

        // Also try injecting now in case a job is already selected
        setTimeout(() => this.injectSmartButton(), 200);
    },

    search(query) {
        query = query.toLowerCase().trim();
        if (!query) return [];

        const results = this.intentMap.map(item => {
            let score = 0;
            for (const phrase of item.phrases) {
                if (phrase === query) score = Math.max(score, 100);
                else if (phrase.startsWith(query)) score = Math.max(score, 80);
                else if (phrase.includes(query)) score = Math.max(score, 60);
                else if (query.includes(phrase)) score = Math.max(score, 40);
            }
            return { ...item, score };
        }).filter(item => item.score > 0);

        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    },

    openSmartBuilder() {
        if (!window.AppState || !window.AppState.selectedId) {
            if (window.showNotification) showNotification("Please select a job first!", "error");
            else alert("Please select a job first!");
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'smart-builder-modal';
        overlay.className = 'onboarding-overlay'; // Re-use styles
        
        const container = document.createElement('div');
        container.className = 'smart-builder-container';
        
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                <h2 style="margin:0; font-size:20px;">What do you want this step to do?</h2>
                <span class="wizard-close" onclick="this.closest('#smart-builder-modal').remove()">&times;</span>
            </div>
            <input type="text" class="smart-builder-input" id="smart-search-input" 
                   placeholder="Type in plain English, e.g., 'run my tests'" autofocus>
            <div class="smart-builder-results" id="smart-results-list">
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    Type above to see suggestions...
                </div>
            </div>
        `;
        
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        const input = container.querySelector('#smart-search-input');
        input.addEventListener('input', (e) => this.renderResults(e.target.value));
        
        // Close on escape
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    },

    renderResults(query) {
        const resultsList = document.getElementById('smart-results-list');
        if (!resultsList) return;
        
        const matches = this.search(query);
        
        if (matches.length === 0) {
            if (query.trim().length > 0) {
                resultsList.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        No matches found. Try different words, or use the Step Library for a full list of available steps.
                    </div>
                `;
            } else {
                resultsList.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        Type above to see suggestions...
                    </div>
                `;
            }
            return;
        }
        
        resultsList.innerHTML = '';
        matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'smart-result-card';
            card.innerHTML = `
                <div class="smart-result-name">${match.step.name}</div>
                <div class="smart-result-command">${match.step.val || 'Standard Checkout'}</div>
                <div class="smart-result-explanation">${match.explanation}</div>
                <button class="onboarding-btn onboarding-btn-primary smart-result-add-btn">
                    Add This Step
                </button>
            `;
            
            card.querySelector('.smart-result-add-btn').onclick = () => this.addStep(match.step);
            resultsList.appendChild(card);
        });
    },

    addStep(stepData) {
        const jobId = window.AppState.selectedId;
        const job = window.AppState.jobs.find(j => j.internalId === jobId);
        
        if (job) {
            // Push a copy
            job.steps.push({ ...stepData });
            
            // UI Updates
            if (window.JobManager && window.JobManager.renderStepsList) {
                window.JobManager.renderStepsList(job);
            }
            
            if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
                window.YamlGenerator.updateYaml();
            }
            
            if (window.EnhancedUI && window.EnhancedUI.saveState) {
                window.EnhancedUI.saveState();
            }
            
            if (window.showNotification) {
                window.showNotification(`Added step: ${stepData.name}`, "success");
            }

            // Close modal
            document.getElementById('smart-builder-modal').remove();
        }
    },

    injectSmartButton() {
        // Find the button container in steps section
        const stepsSection = document.getElementById('steps-section');
        if (!stepsSection) return;
        
        const btnContainer = stepsSection.querySelector('div[style*="display:flex; gap:6px"]');
        if (!btnContainer || btnContainer.querySelector('.smart-builder-btn')) return;
        
        const smartBtn = document.createElement('button');
        smartBtn.className = 'secondary smart-builder-btn';
        smartBtn.style.padding = '4px 8px';
        smartBtn.style.fontSize = '12px';
        smartBtn.style.background = 'rgba(var(--accent-rgb, 59, 130, 246), 0.1)';
        smartBtn.style.border = '1px solid var(--accent-color)';
        smartBtn.innerHTML = '<i class="fas fa-comment-dots"></i> Describe';
        smartBtn.title = "Add step using natural language";
        
        smartBtn.onclick = (e) => {
            e.stopPropagation();
            this.openSmartBuilder();
        };
        
        // Insert before the Library button
        const libraryBtn = btnContainer.querySelector('button[onclick*="openStepLibrary"]');
        if (libraryBtn) {
            btnContainer.insertBefore(smartBtn, libraryBtn);
        } else {
            btnContainer.appendChild(smartBtn);
        }
    }
};

window.SmartStepBuilder = SmartStepBuilder;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        SmartStepBuilder.init();
    }, 400);
});
