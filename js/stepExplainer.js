const StepExplainer = {
    commands: {
        'npm ci': {
            title: 'Install Node.js Packages',
            explanation: 'This downloads and installs all the software packages your project depends on. It reads the package-lock.json file to install exact versions, which is safer than "npm install".',
            learnMore: 'Think of it like buying all the ingredients listed in a recipe before you start cooking.'
        },
        'npm install': {
            title: 'Install Node.js Packages',
            explanation: 'Downloads packages your project needs. "npm ci" is preferred in pipelines because it is faster and more reliable.',
            learnMore: 'If package-lock.json exists, prefer "npm ci" over "npm install" in pipelines.'
        },
        'npm test': {
            title: 'Run Your Test Suite',
            explanation: 'Executes the test command defined in your package.json file. This usually runs a test framework like Jest, Mocha, or Vitest to check that your code works correctly.',
            learnMore: 'Tests verify that your code does what you expect. If any test fails, the pipeline will stop and report the failure.'
        },
        'npm run build': {
            title: 'Build Your Application',
            explanation: 'Compiles your source code into a production-ready format. For example, it might bundle JavaScript files, compile TypeScript, or create an optimized version of your app.',
            learnMore: 'The build output is what actually gets deployed to your server or hosting platform.'
        },
        'npm run lint': {
            title: 'Check Code Style',
            explanation: 'Scans your code for style issues, potential bugs, and formatting problems. It enforces your team coding standards.',
            learnMore: 'Linting catches problems early -- like a spell-checker for code.'
        },
        'npm audit': {
            title: 'Security Vulnerability Check',
            explanation: 'Scans all your project dependencies for known security vulnerabilities. If any are found, it reports them with severity levels.',
            learnMore: 'Run this regularly. Vulnerabilities in dependencies can affect your entire application.'
        },
        'pytest': {
            title: 'Run Python Tests',
            explanation: 'Executes your Python test files using the pytest framework. It automatically finds files starting with "test_" and runs all test functions inside them.',
            learnMore: 'Pytest is the most popular Python testing framework. It provides clear, detailed output when tests fail.'
        },
        'pip install -r requirements.txt': {
            title: 'Install Python Packages',
            explanation: 'Reads your requirements.txt file and installs all the Python packages listed in it. This is how you ensure the pipeline has the same packages as your development machine.',
            learnMore: 'requirements.txt is the Python equivalent of package.json in Node.js.'
        },
        'mvn test': {
            title: 'Run Java Tests with Maven',
            explanation: 'Uses Apache Maven to compile your Java code and run all unit tests. Maven handles dependencies, compilation, and test execution automatically.',
            learnMore: 'Maven reads your pom.xml file for configuration.'
        },
        'docker build -t myapp .': {
            title: 'Build a Docker Container',
            explanation: 'Packages your application into a portable container image. The image includes your code, its dependencies, and the runtime environment.',
            learnMore: 'Containers ensure your app runs the same way everywhere -- development, testing, and production.'
        },
        'npx cypress run': {
            title: 'Run Browser Tests',
            explanation: 'Opens a virtual browser and tests your application by simulating real user interactions: clicking buttons, filling forms, and navigating pages.',
            learnMore: 'End-to-end tests verify your entire application works as users would experience it.'
        },
        'echo': {
            title: 'Print a Message',
            explanation: 'Displays text output in the pipeline log. Often used as a placeholder or to log progress messages.',
            learnMore: 'Replace this with an actual command when you are ready.'
        },
        'npm run migrate': {
            title: 'Update Database Structure',
            explanation: 'Runs database migration scripts that create or modify tables and columns in your database to match your latest code.',
            learnMore: 'Migrations keep your database schema in sync with your application code.'
        }
    },

    init() {
        console.log("StepExplainer initialized");
        this.hookRenderSteps();
    },

    hookRenderSteps() {
        if (window.JobManager && window.JobManager.renderStepsList) {
            const originalRender = window.JobManager.renderStepsList;
            window.JobManager.renderStepsList = function() {
                originalRender.apply(this, arguments);
                StepExplainer.injectHelpIcons();
            };
        }
    },

    injectHelpIcons() {
        const stepsList = document.getElementById('steps-list');
        if (!stepsList) return;

        const stepCards = stepsList.querySelectorAll('.step-card');
        stepCards.forEach(card => {
            // Find the command input
            const input = card.querySelector('input[type="text"]');
            if (!input) return;

            const commandVal = input.value.trim();
            const match = this.getExplanationForCommand(commandVal);

            if (match) {
                // Remove existing icon if any
                card.querySelectorAll('.step-help-icon').forEach(el => el.remove());

                const icon = document.createElement('i');
                icon.className = 'fas fa-question-circle step-help-icon';
                icon.title = 'Click to see what this command does';
                icon.onclick = (e) => this.showHelpCard(match.key, e);

                // Insert next to the input
                input.parentNode.insertBefore(icon, input.nextSibling);
            }
        });
    },

    getExplanationForCommand(commandVal) {
        if (!commandVal) return null;

        // Try exact match
        if (this.commands[commandVal]) return { key: commandVal, ...this.commands[commandVal] };

        // Try startsWith
        for (const key in this.commands) {
            if (commandVal.startsWith(key)) return { key, ...this.commands[key] };
        }

        // Try contains
        for (const key in this.commands) {
            if (commandVal.includes(key)) return { key, ...this.commands[key] };
        }

        return null;
    },

    showHelpCard(commandKey, event) {
        event.stopPropagation();
        
        // Remove existing help cards
        document.querySelectorAll('.step-help-card').forEach(el => el.remove());

        const info = this.commands[commandKey];
        if (!info) return;

        const card = document.createElement('div');
        card.className = 'step-help-card';
        card.innerHTML = `
            <div class="step-help-title">${info.title}</div>
            <div class="step-help-explanation">${info.explanation}</div>
            <div class="step-help-learn-more">
                <div class="step-help-learn-more-label">Good to know</div>
                ${info.learnMore}
            </div>
            <button class="onboarding-btn onboarding-btn-primary" style="width:100%; padding:8px;" onclick="this.parentElement.remove()">Got it</button>
        `;

        // Position card near the icon
        const rect = event.target.getBoundingClientRect();
        card.style.top = (rect.bottom + 10) + 'px';
        card.style.left = (rect.left - 150) + 'px'; // Center roughly

        document.body.appendChild(card);

        // Close on click outside
        const closeOnOutside = (e) => {
            if (!card.contains(e.target) && e.target !== event.target) {
                card.remove();
                document.removeEventListener('click', closeOnOutside);
            }
        };
        setTimeout(() => document.addEventListener('click', closeOnOutside), 10);
    }
};

window.StepExplainer = StepExplainer;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => StepExplainer.init(), 1400);
});
