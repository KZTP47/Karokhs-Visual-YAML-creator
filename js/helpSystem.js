/**
 * Help System Module
 * Provides contextual help, tutorials, and guidance for non-technical users
 */

const HelpSystem = {
    tutorialMode: false,
    currentStep: 0,
    helpVisible: false,

    tutorials: {
        'first-pipeline': {
            name: 'Create Your First Pipeline',
            steps: [
                {
                    title: 'Welcome to PipelinePro!',
                    message: 'Let\'s build your first automated test pipeline together. Click "Next" to begin.',
                    target: null,
                    action: null
                },
                {
                    title: 'Quick Start Wizard',
                    message: 'The easiest way to start is with the Quick Start Wizard. Click this green button to open it.',
                    target: 'button.success',
                    highlightSelector: 'button.success',
                    action: () => {
                        // Wizard will open automatically when user clicks
                    }
                },
                {
                    title: 'Choose a Template',
                    message: 'Templates give you a working pipeline instantly. Select one that matches your project type.',
                    target: '#template-grid',
                    highlightSelector: '.template-card:first-child',
                    waitFor: '#wizard-modal',
                    action: null
                },
                {
                    title: 'Pipeline Created!',
                    message: 'Great! You now have a working pipeline. Let\'s explore what you can do with it.',
                    target: '#graph-container',
                    action: null
                },
                {
                    title: 'Understanding Jobs',
                    message: 'Each box is a "job" - a task your pipeline performs. Click any job to see its configuration.',
                    target: '.node',
                    highlightSelector: '.node:first-child',
                    action: null
                },
                {
                    title: 'Job Configuration',
                    message: 'Here you can customize what this job does. Change its name, add steps, or modify settings.',
                    target: '#job-config',
                    waitFor: '#job-config[style*="block"]',
                    action: null
                },
                {
                    title: 'Adding Steps',
                    message: 'Steps are actions the job performs (like "run tests" or "deploy"). Click "+ Add" to add a step.',
                    target: '#steps-section button.secondary',
                    highlightSelector: '#steps-section button.secondary',
                    action: null
                },
                {
                    title: 'Check Validation',
                    message: 'The Validation tab checks if your pipeline will actually work. It catches errors before you run it!',
                    target: '.tab:nth-child(2)',
                    highlightSelector: '.tab:nth-child(2)',
                    action: () => UIManager.switchTab('validation')
                },
                {
                    title: 'Auto-Fix Magic',
                    message: 'Found issues? Many problems have an "Apply Fix" button that fixes them automatically!',
                    target: '#tab-validation',
                    action: null
                },
                {
                    title: 'Export Your Pipeline',
                    message: 'When ready, click "Export YAML" to download your pipeline configuration.',
                    target: 'button:has(.fa-file-download)',
                    highlightSelector: 'button:has(.fa-file-download)',
                    action: null
                },
                {
                    title: 'You\'re Ready!',
                    message: 'You\'ve learned the basics! Explore the other features, or start building your own pipeline.',
                    target: null,
                    action: null
                }
            ]
        }
    },

    contextualHelp: {
        'job-name': {
            title: 'Job Name',
            content: 'Give your job a descriptive name like "Run Unit Tests" or "Deploy to Production". This helps you understand what it does at a glance.',
            examples: ['Unit Tests', 'Build Application', 'Deploy to AWS', 'Security Scan'],
            tips: ['Use clear, action-oriented names', 'Avoid technical jargon', 'Be specific about what the job does']
        },
        'job-os': {
            title: 'Operating System',
            content: 'Choose which operating system your job runs on. Ubuntu (Linux) is the most common choice for most projects.',
            examples: ['Ubuntu for Node.js/Python projects', 'macOS for iOS development', 'Windows for .NET projects'],
            tips: ['Use Ubuntu unless you have a specific reason', 'Docker images are lightweight and fast', 'Match OS to your development environment']
        },
        'job-category': {
            title: 'Test Category',
            content: 'Categorize your test jobs to organize your pipeline better.',
            examples: ['Unit: Fast, isolated tests', 'Integration: Tests with database/APIs', 'E2E: Full application tests'],
            tips: ['Unit tests run first (fastest)', 'Integration tests verify connections work', 'E2E tests catch user-facing bugs']
        },
        'job-stage': {
            title: 'Pipeline Stage',
            content: 'Stages organize jobs into phases. Jobs in the same stage run in parallel. Jobs in later stages wait for earlier stages to complete.',
            examples: ['Build: Compile code', 'Test: Run tests', 'Deploy: Push to production'],
            tips: ['Build before testing', 'Test before deploying', 'Add custom stages for your workflow']
        },
        'matrix': {
            title: 'Matrix Testing',
            content: 'Run the same job multiple times with different configurations. Perfect for testing across multiple versions or environments.',
            examples: ['Test on Node 16, 18, and 20', 'Test on multiple Python versions', 'Test on different browsers'],
            tips: ['Use for version compatibility testing', 'Each combination creates a separate job', 'Can significantly increase pipeline time']
        },
        'artifacts': {
            title: 'Artifacts',
            content: 'Files you want to save after the job completes. Useful for test reports, coverage data, build outputs, or screenshots.',
            examples: ['coverage/** (coverage reports)', 'dist/** (built application)', 'test-results/** (test output)'],
            tips: ['Use glob patterns (** means all subdirectories)', 'Artifacts are available for download', 'Keep artifacts small to save storage']
        },
        'env-vars': {
            title: 'Environment Variables',
            content: 'Configuration values available to your job. Use secrets for sensitive data like API keys or passwords.',
            examples: ['NODE_ENV=production', 'API_URL=https://api.example.com', 'DATABASE_URL=${{ secrets.DB_URL }}'],
            tips: ['Use ${{ secrets.NAME }} for sensitive data', 'Add secrets in repository settings', 'Never hardcode passwords']
        },
        'retry': {
            title: 'Retry Configuration',
            content: 'Automatically retry failed jobs. Useful for flaky tests or unstable network conditions.',
            examples: ['E2E tests (browser tests can be flaky)', 'Integration tests with external APIs', 'Deployment steps'],
            tips: ['Don\'t retry broken code', 'Use for temporary failures only', '2-3 retries is usually enough']
        },
        'connections': {
            title: 'Job Dependencies',
            content: 'Connect jobs to control execution order. A job waits for all connected parent jobs to complete before running.',
            examples: ['Tests wait for build to complete', 'Deploy waits for all tests to pass', 'Integration tests wait for unit tests'],
            tips: ['Drag from bottom circle to top circle', 'Create logical flow: build → test → deploy', 'Parallel jobs run simultaneously']
        },
        'steps': {
            title: 'Job Steps',
            content: 'Steps are actions your job performs, executed in order from top to bottom.',
            examples: ['1. Checkout code', '2. Install dependencies', '3. Run tests', '4. Upload results'],
            tips: ['First step is usually "Checkout Code"', 'Install dependencies before using them', 'Steps run sequentially']
        }
    },

    errorMessages: {
        'circular-dependency': {
            userFriendly: 'Your jobs are connected in a circle',
            explanation: 'Job A waits for Job B, but Job B waits for Job A. This creates an impossible situation.',
            solution: 'Remove one of the connections to break the circle.',
            visual: 'Think of it like: "I can\'t start work until you finish, but you can\'t start until I finish"'
        },
        'duplicate-names': {
            userFriendly: 'Two jobs have the same name',
            explanation: 'Each job needs a unique name so the system can tell them apart.',
            solution: 'Rename one of the jobs to something different.',
            visual: 'Like having two people named "Bob" in a room - which Bob are you talking to?'
        },
        'empty-command': {
            userFriendly: 'A step has no command',
            explanation: 'You created a step but didn\'t tell it what to do.',
            solution: 'Click the help button to see common commands, or use the step library.',
            visual: 'Like telling someone "do a thing" but not saying what thing'
        },
        'missing-checkout': {
            userFriendly: 'Your job doesn\'t download the code',
            explanation: 'Most jobs need to work with your code. Add a "Checkout Code" step first.',
            solution: 'Add a "Checkout Code" step as the first step.',
            visual: 'Like trying to paint a house you don\'t have access to'
        },
        'no-tests-before-deploy': {
            userFriendly: 'You\'re deploying without testing',
            explanation: 'Deploying untested code can break your application. Always test before deploying.',
            solution: 'Connect your test jobs to your deploy job.',
            visual: 'Like shipping a product to customers without checking if it works'
        },
        'docker-no-login': {
            userFriendly: 'Trying to push Docker image without logging in',
            explanation: 'You need to login to Docker Hub (or your registry) before you can upload images.',
            solution: 'Add a "Docker Login" step before pushing.',
            visual: 'Like trying to upload a file to Dropbox without signing in'
        },
        'dependencies-after-tests': {
            userFriendly: 'Installing dependencies AFTER running tests',
            explanation: 'Tests need dependencies to be installed first, otherwise they\'ll fail.',
            solution: 'Move the install step before the test step.',
            visual: 'Like trying to bake a cake before buying the ingredients'
        }
    },

    /**
     * Start interactive tutorial
     */
    startTutorial(tutorialId) {
        const tutorial = this.tutorials[tutorialId];
        if (!tutorial) return;

        this.tutorialMode = true;
        this.currentStep = 0;
        this.currentTutorial = tutorial;
        this.showTutorialStep(0);
    },

    /**
     * Show a specific tutorial step
     */
    showTutorialStep(stepIndex) {
        const tutorial = this.currentTutorial;
        if (!tutorial || stepIndex >= tutorial.steps.length) {
            this.endTutorial();
            return;
        }

        const step = tutorial.steps[stepIndex];
        this.currentStep = stepIndex;

        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        // Create tutorial modal
        this.showTutorialModal(step, stepIndex, tutorial.steps.length);

        // Highlight target if specified
        if (step.highlightSelector) {
            setTimeout(() => {
                const target = document.querySelector(step.highlightSelector);
                if (target) {
                    target.classList.add('tutorial-highlight');
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        // Execute action if specified
        if (step.action) {
            step.action();
        }
    },

    /**
     * Show tutorial modal
     */
    showTutorialModal(step, currentStep, totalSteps) {
        // Remove existing modal
        const existing = document.getElementById('tutorial-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'tutorial-modal';
        modal.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <span class="tutorial-badge">Step ${currentStep + 1} of ${totalSteps}</span>
                    <span class="tutorial-close" onclick="HelpSystem.endTutorial()">×</span>
                </div>
                <h3>${step.title}</h3>
                <p>${step.message}</p>
                <div class="tutorial-actions">
                    ${currentStep > 0 ? '<button class="secondary" onclick="HelpSystem.previousStep()">Previous</button>' : ''}
                    <button class="success" onclick="HelpSystem.nextStep()">
                        ${currentStep < totalSteps - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Next tutorial step
     */
    nextStep() {
        if (this.currentTutorial && this.currentStep < this.currentTutorial.steps.length - 1) {
            this.showTutorialStep(this.currentStep + 1);
        } else {
            this.endTutorial();
        }
    },

    /**
     * Previous tutorial step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.showTutorialStep(this.currentStep - 1);
        }
    },

    /**
     * End tutorial
     */
    endTutorial() {
        this.tutorialMode = false;
        this.currentStep = 0;
        this.currentTutorial = null;

        const modal = document.getElementById('tutorial-modal');
        if (modal) modal.remove();

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    },

    /**
     * Show contextual help for a field
     */
    showContextualHelp(helpId) {
        const help = this.contextualHelp[helpId];
        if (!help) return;

        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h3>${help.title}</h3>
                    <span class="help-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</span>
                </div>
                <p>${help.content}</p>
                ${help.examples ? `
                    <div class="help-section">
                        <strong>Examples:</strong>
                        <ul>${help.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${help.tips ? `
                    <div class="help-section">
                        <strong>Tips:</strong>
                        <ul>${help.tips.map(tip => `<li>${tip}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                <button onclick="this.parentElement.parentElement.remove()">Got it!</button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Show user-friendly error explanation
     */
    explainError(errorType) {
        const error = this.errorMessages[errorType];
        if (!error) return null;

        return `
            <div class="error-explanation">
                <div class="error-title">${error.userFriendly}</div>
                <div class="error-detail">${error.explanation}</div>
                <div class="error-visual"><em>${error.visual}</em></div>
                <div class="error-solution"><strong>How to fix:</strong> ${error.solution}</div>
            </div>
        `;
    },

    /**
     * Show help panel
     */
    showHelp() {
        const panel = document.createElement('div');
        panel.id = 'help-panel';
        panel.innerHTML = `
            <div class="help-panel-content">
                <div class="help-panel-header">
                    <h3>Help & Resources</h3>
                    <span onclick="this.parentElement.parentElement.parentElement.remove()">×</span>
                </div>
                <div class="help-panel-body">
                    <div class="help-category">
                        <h4>Quick Actions</h4>
                        <button onclick="HelpSystem.startTutorial('first-pipeline')">
                            <i class="fas fa-play-circle"></i> Take the Tutorial
                        </button>
                        <button onclick="openWizard()">
                            <i class="fas fa-magic"></i> Start with a Template
                        </button>
                    </div>
                    <div class="help-category">
                        <h4>Common Tasks</h4>
                        <a href="#" onclick="HelpSystem.showContextualHelp('steps')">How do I add steps?</a>
                        <a href="#" onclick="HelpSystem.showContextualHelp('connections')">How do I connect jobs?</a>
                        <a href="#" onclick="HelpSystem.showContextualHelp('matrix')">What is matrix testing?</a>
                        <a href="#" onclick="HelpSystem.showContextualHelp('artifacts')">How do I save test results?</a>
                    </div>
                    <div class="help-category">
                        <h4>Concepts</h4>
                        <a href="#" onclick="HelpSystem.showConcept('pipeline')">What is a pipeline?</a>
                        <a href="#" onclick="HelpSystem.showConcept('job')">What is a job?</a>
                        <a href="#" onclick="HelpSystem.showConcept('stage')">What is a stage?</a>
                        <a href="#" onclick="HelpSystem.showConcept('ci-cd')">What is CI/CD?</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    },

    /**
     * Show concept explanation
     */
    showConcept(conceptId) {
        const concepts = {
            'pipeline': {
                title: 'What is a Pipeline?',
                content: 'A pipeline is like a factory assembly line for your code. Each station (job) performs a specific task, and the code moves through them automatically.',
                example: 'Think of it like: Code → Build → Test → Deploy. If tests fail, it stops before deploying broken code.',
                visual: '📥 Code → 🔨 Build → ✅ Test → 🚀 Deploy'
            },
            'job': {
                title: 'What is a Job?',
                content: 'A job is a single task in your pipeline. Each job runs independently and can do things like run tests, build your app, or deploy to a server.',
                example: 'Like asking someone to "run all the tests" - that\'s one job. Another person might "deploy the app" - that\'s a different job.',
                visual: '📦 Job = One complete task'
            },
            'stage': {
                title: 'What is a Stage?',
                content: 'Stages group jobs that happen at the same time. All jobs in a stage must complete before the next stage starts.',
                example: 'Build stage → Test stage → Deploy stage. All tests in the "Test" stage run at the same time.',
                visual: 'Stage 1 → Stage 2 → Stage 3'
            },
            'ci-cd': {
                title: 'What is CI/CD?',
                content: 'CI/CD automates testing and deployment. Continuous Integration (CI) = automatically test code. Continuous Deployment (CD) = automatically deploy if tests pass.',
                example: 'You push code → Tests run automatically → If tests pass, it deploys automatically. No manual work!',
                visual: '💻 Code Push → ⚙️ Auto Test → ✅ Auto Deploy'
            }
        };

        const concept = concepts[conceptId];
        if (!concept) return;

        const modal = document.createElement('div');
        modal.className = 'concept-modal';
        modal.innerHTML = `
            <div class="concept-content">
                <h2>${concept.title}</h2>
                <p>${concept.content}</p>
                <div class="concept-example">
                    <strong>Example:</strong>
                    <p>${concept.example}</p>
                </div>
                <div class="concept-visual">
                    <strong>Visual:</strong>
                    <p style="font-size: 18px; text-align: center; padding: 20px; background: rgba(79, 70, 229, 0.1); border-radius: 8px;">
                        ${concept.visual}
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Got it!</button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Get inline help text for inputs
     */
    getInlineHelp(fieldId) {
        const help = this.contextualHelp[fieldId];
        if (!help) return '';

        return `<div class="inline-help">
            <i class="fas fa-info-circle"></i>
            ${help.content}
        </div>`;
    }
};

// Make it available globally
window.HelpSystem = HelpSystem;
