/**
 * Step Library Module
 * Provides pre-built, categorized steps that non-technical users can easily add
 * Each step includes description, example, and common variations
 */

const StepLibrary = {
    categories: {
        'setup': {
            name: 'Setup & Installation',
            icon: 'fas fa-download',
            steps: [
                {
                    id: 'checkout',
                    name: 'Get Code from Repository',
                    description: 'Downloads your code so tests can run against it',
                    type: 'checkout',
                    value: '',
                    icon: 'fas fa-code-branch',
                    needsConfig: false
                },
                {
                    id: 'setup-node',
                    name: 'Setup Node.js',
                    description: 'Install Node.js for JavaScript/TypeScript projects',
                    type: 'action',
                    value: 'actions/setup-node@v3',
                    icon: 'fab fa-node-js',
                    needsConfig: false
                },
                {
                    id: 'setup-python',
                    name: 'Setup Python',
                    description: 'Install Python for Python projects',
                    type: 'action',
                    value: 'actions/setup-python@v4',
                    icon: 'fab fa-python',
                    needsConfig: false
                },
                {
                    id: 'setup-java',
                    name: 'Setup Java',
                    description: 'Install Java JDK for Java projects',
                    type: 'action',
                    value: 'actions/setup-java@v3',
                    icon: 'fab fa-java',
                    needsConfig: false
                },
                {
                    id: 'npm-install',
                    name: 'Install Node Dependencies',
                    description: 'Install packages listed in package.json',
                    type: 'run',
                    value: 'npm ci',
                    icon: 'fas fa-box',
                    alternatives: [
                        { name: 'npm install (slower)', value: 'npm install' },
                        { name: 'yarn install', value: 'yarn install' },
                        { name: 'pnpm install', value: 'pnpm install' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'pip-install',
                    name: 'Install Python Dependencies',
                    description: 'Install Python packages from requirements.txt',
                    type: 'run',
                    value: 'pip install -r requirements.txt',
                    icon: 'fas fa-cube',
                    alternatives: [
                        { name: 'With cache', value: 'pip install --cache-dir .pip-cache -r requirements.txt' },
                        { name: 'From Pipfile', value: 'pipenv install' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'bundle-install',
                    name: 'Install Ruby Gems',
                    description: 'Install Ruby dependencies from Gemfile',
                    type: 'run',
                    value: 'bundle install',
                    icon: 'fas fa-gem',
                    needsConfig: false
                },
                {
                    id: 'composer-install',
                    name: 'Install PHP Dependencies',
                    description: 'Install PHP packages via Composer',
                    type: 'run',
                    value: 'composer install',
                    icon: 'fab fa-php',
                    needsConfig: false
                }
            ]
        },
        'testing': {
            name: 'Testing & Quality',
            icon: 'fas fa-vial',
            steps: [
                {
                    id: 'npm-test',
                    name: 'Run JavaScript Tests',
                    description: 'Execute test suite with Jest/Mocha/etc',
                    type: 'run',
                    value: 'npm test',
                    icon: 'fas fa-check-circle',
                    alternatives: [
                        { name: 'With coverage', value: 'npm test -- --coverage' },
                        { name: 'Jest only', value: 'npx jest' },
                        { name: 'Mocha tests', value: 'npx mocha' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'pytest',
                    name: 'Run Python Tests',
                    description: 'Execute Python test suite with pytest',
                    type: 'run',
                    value: 'pytest',
                    icon: 'fas fa-check-circle',
                    alternatives: [
                        { name: 'With coverage', value: 'pytest --cov=. --cov-report=xml' },
                        { name: 'Verbose output', value: 'pytest -v' },
                        { name: 'Specific folder', value: 'pytest tests/' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'maven-test',
                    name: 'Run Java Tests (Maven)',
                    description: 'Execute JUnit tests via Maven',
                    type: 'run',
                    value: 'mvn test',
                    icon: 'fas fa-check-circle',
                    needsConfig: false
                },
                {
                    id: 'gradle-test',
                    name: 'Run Java Tests (Gradle)',
                    description: 'Execute JUnit tests via Gradle',
                    type: 'run',
                    value: './gradlew test',
                    icon: 'fas fa-check-circle',
                    needsConfig: false
                },
                {
                    id: 'dotnet-test',
                    name: 'Run .NET Tests',
                    description: 'Execute NUnit/xUnit tests',
                    type: 'run',
                    value: 'dotnet test',
                    icon: 'fas fa-check-circle',
                    needsConfig: false
                },
                {
                    id: 'rspec',
                    name: 'Run Ruby Tests',
                    description: 'Execute RSpec test suite',
                    type: 'run',
                    value: 'bundle exec rspec',
                    icon: 'fas fa-check-circle',
                    needsConfig: false
                },
                {
                    id: 'phpunit',
                    name: 'Run PHP Tests',
                    description: 'Execute PHPUnit test suite',
                    type: 'run',
                    value: 'vendor/bin/phpunit',
                    icon: 'fas fa-check-circle',
                    needsConfig: false
                },
                {
                    id: 'cypress',
                    name: 'Run Cypress E2E Tests',
                    description: 'Execute end-to-end browser tests',
                    type: 'run',
                    value: 'npx cypress run',
                    icon: 'fas fa-window-maximize',
                    alternatives: [
                        { name: 'Headless Chrome', value: 'npx cypress run --browser chrome' },
                        { name: 'With video', value: 'npx cypress run --record' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'playwright',
                    name: 'Run Playwright E2E Tests',
                    description: 'Execute cross-browser E2E tests',
                    type: 'run',
                    value: 'npx playwright test',
                    icon: 'fas fa-window-maximize',
                    needsConfig: false
                },
                {
                    id: 'lint',
                    name: 'Run Code Linter',
                    description: 'Check code style and quality',
                    type: 'run',
                    value: 'npm run lint',
                    icon: 'fas fa-code',
                    alternatives: [
                        { name: 'ESLint', value: 'npx eslint .' },
                        { name: 'Prettier check', value: 'npx prettier --check .' },
                        { name: 'Python flake8', value: 'flake8 .' },
                        { name: 'Python pylint', value: 'pylint src/' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'type-check',
                    name: 'Type Checking',
                    description: 'Verify TypeScript types',
                    type: 'run',
                    value: 'npm run type-check',
                    icon: 'fas fa-check',
                    alternatives: [
                        { name: 'TypeScript', value: 'npx tsc --noEmit' },
                        { name: 'Python mypy', value: 'mypy src/' }
                    ],
                    needsConfig: false
                }
            ]
        },
        'build': {
            name: 'Build & Compile',
            icon: 'fas fa-hammer',
            steps: [
                {
                    id: 'npm-build',
                    name: 'Build JavaScript App',
                    description: 'Compile and bundle your application',
                    type: 'run',
                    value: 'npm run build',
                    icon: 'fas fa-cog',
                    needsConfig: false
                },
                {
                    id: 'webpack',
                    name: 'Webpack Build',
                    description: 'Bundle with Webpack',
                    type: 'run',
                    value: 'npx webpack --mode production',
                    icon: 'fas fa-box-open',
                    needsConfig: false
                },
                {
                    id: 'maven-build',
                    name: 'Build Java Project (Maven)',
                    description: 'Compile Java code with Maven',
                    type: 'run',
                    value: 'mvn clean package',
                    icon: 'fas fa-cog',
                    needsConfig: false
                },
                {
                    id: 'gradle-build',
                    name: 'Build Java Project (Gradle)',
                    description: 'Compile Java code with Gradle',
                    type: 'run',
                    value: './gradlew build',
                    icon: 'fas fa-cog',
                    needsConfig: false
                },
                {
                    id: 'dotnet-build',
                    name: 'Build .NET Project',
                    description: 'Compile .NET application',
                    type: 'run',
                    value: 'dotnet build --configuration Release',
                    icon: 'fas fa-cog',
                    needsConfig: false
                },
                {
                    id: 'go-build',
                    name: 'Build Go Application',
                    description: 'Compile Go binary',
                    type: 'run',
                    value: 'go build -o app',
                    icon: 'fas fa-cog',
                    needsConfig: false
                }
            ]
        },
        'docker': {
            name: 'Docker Operations',
            icon: 'fab fa-docker',
            steps: [
                {
                    id: 'docker-login',
                    name: 'Login to Docker Registry',
                    description: 'Authenticate with Docker Hub or private registry',
                    type: 'run',
                    value: 'echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin',
                    icon: 'fas fa-sign-in-alt',
                    needsConfig: false,
                    securityNote: 'Make sure to add DOCKER_USERNAME and DOCKER_PASSWORD to your repository secrets'
                },
                {
                    id: 'docker-build',
                    name: 'Build Docker Image',
                    description: 'Create a Docker image from Dockerfile',
                    type: 'run',
                    value: 'docker build -t myapp:${{ github.sha }} .',
                    icon: 'fas fa-box',
                    needsConfig: true,
                    configHelp: 'Replace "myapp" with your image name'
                },
                {
                    id: 'docker-tag',
                    name: 'Tag Docker Image',
                    description: 'Add tags to Docker image',
                    type: 'run',
                    value: 'docker tag myapp:${{ github.sha }} myregistry.com/myapp:latest',
                    icon: 'fas fa-tag',
                    needsConfig: true,
                    configHelp: 'Update registry URL and image name'
                },
                {
                    id: 'docker-push',
                    name: 'Push Docker Image',
                    description: 'Upload image to Docker registry',
                    type: 'run',
                    value: 'docker push myregistry.com/myapp:${{ github.sha }}',
                    icon: 'fas fa-cloud-upload-alt',
                    needsConfig: true,
                    configHelp: 'Update registry URL and image name'
                },
                {
                    id: 'docker-pull',
                    name: 'Pull Docker Image',
                    description: 'Download image from Docker registry',
                    type: 'run',
                    value: 'docker pull myregistry.com/myapp:${{ github.sha }}',
                    icon: 'fas fa-cloud-download-alt',
                    needsConfig: true,
                    configHelp: 'Update registry URL and image name'
                },
                {
                    id: 'docker-scan',
                    name: 'Scan Docker Image for Vulnerabilities',
                    description: 'Security scan with Trivy',
                    type: 'action',
                    value: 'aquasecurity/trivy-action@master',
                    icon: 'fas fa-shield-alt',
                    needsConfig: false
                },
                {
                    id: 'docker-compose',
                    name: 'Start Docker Compose Services',
                    description: 'Start multi-container application',
                    type: 'run',
                    value: 'docker-compose up -d',
                    icon: 'fas fa-layer-group',
                    needsConfig: false
                }
            ]
        },
        'deploy': {
            name: 'Deployment',
            icon: 'fas fa-rocket',
            steps: [
                {
                    id: 'kubectl-deploy',
                    name: 'Deploy to Kubernetes',
                    description: 'Update Kubernetes deployment',
                    type: 'run',
                    value: 'kubectl set image deployment/myapp myapp=myregistry.com/myapp:${{ github.sha }}',
                    icon: 'fas fa-ship',
                    needsConfig: true,
                    configHelp: 'Update deployment name and image URL'
                },
                {
                    id: 'kubectl-status',
                    name: 'Check Kubernetes Deployment',
                    description: 'Verify deployment succeeded',
                    type: 'run',
                    value: 'kubectl rollout status deployment/myapp',
                    icon: 'fas fa-check-circle',
                    needsConfig: true,
                    configHelp: 'Update deployment name'
                },
                {
                    id: 'heroku-deploy',
                    name: 'Deploy to Heroku',
                    description: 'Push to Heroku platform',
                    type: 'run',
                    value: 'git push heroku main',
                    icon: 'fas fa-cloud',
                    needsConfig: false
                },
                {
                    id: 'aws-s3-deploy',
                    name: 'Deploy to AWS S3',
                    description: 'Upload static files to S3',
                    type: 'run',
                    value: 'aws s3 sync ./build s3://my-bucket --delete',
                    icon: 'fab fa-aws',
                    needsConfig: true,
                    configHelp: 'Update bucket name and build folder'
                },
                {
                    id: 'vercel-deploy',
                    name: 'Deploy to Vercel',
                    description: 'Deploy frontend to Vercel',
                    type: 'run',
                    value: 'vercel --prod',
                    icon: 'fas fa-globe',
                    needsConfig: false
                },
                {
                    id: 'netlify-deploy',
                    name: 'Deploy to Netlify',
                    description: 'Deploy frontend to Netlify',
                    type: 'run',
                    value: 'netlify deploy --prod --dir=build',
                    icon: 'fas fa-globe',
                    needsConfig: true,
                    configHelp: 'Update build directory'
                },
                {
                    id: 'gcloud-deploy',
                    name: 'Deploy to Google Cloud',
                    description: 'Deploy to GCP App Engine',
                    type: 'run',
                    value: 'gcloud app deploy',
                    icon: 'fab fa-google',
                    needsConfig: false
                }
            ]
        },
        'notification': {
            name: 'Notifications & Reporting',
            icon: 'fas fa-bell',
            steps: [
                {
                    id: 'slack-notify',
                    name: 'Send Slack Notification',
                    description: 'Send message to Slack channel',
                    type: 'action',
                    value: 'slackapi/slack-github-action@v1',
                    icon: 'fab fa-slack',
                    needsConfig: false
                },
                {
                    id: 'email-notify',
                    name: 'Send Email Notification',
                    description: 'Send email alert',
                    type: 'action',
                    value: 'dawidd6/action-send-mail@v3',
                    icon: 'fas fa-envelope',
                    needsConfig: false
                },
                {
                    id: 'upload-coverage',
                    name: 'Upload Coverage Report',
                    description: 'Send coverage to Codecov',
                    type: 'action',
                    value: 'codecov/codecov-action@v3',
                    icon: 'fas fa-chart-line',
                    needsConfig: false
                },
                {
                    id: 'github-comment',
                    name: 'Comment on Pull Request',
                    description: 'Add comment with test results',
                    type: 'action',
                    value: 'actions/github-script@v6',
                    icon: 'fas fa-comment',
                    needsConfig: false
                }
            ]
        },
        'database': {
            name: 'Database Operations',
            icon: 'fas fa-database',
            steps: [
                {
                    id: 'migrate-db',
                    name: 'Run Database Migrations',
                    description: 'Update database schema',
                    type: 'run',
                    value: 'npm run migrate',
                    icon: 'fas fa-exchange-alt',
                    alternatives: [
                        { name: 'Prisma migrate', value: 'npx prisma migrate deploy' },
                        { name: 'Sequelize migrate', value: 'npx sequelize-cli db:migrate' },
                        { name: 'Django migrate', value: 'python manage.py migrate' },
                        { name: 'Rails migrate', value: 'bundle exec rails db:migrate' }
                    ],
                    needsConfig: false
                },
                {
                    id: 'seed-db',
                    name: 'Seed Database',
                    description: 'Populate database with test data',
                    type: 'run',
                    value: 'npm run seed',
                    icon: 'fas fa-seedling',
                    needsConfig: false
                },
                {
                    id: 'backup-db',
                    name: 'Backup Database',
                    description: 'Create database backup',
                    type: 'run',
                    value: 'pg_dump $DATABASE_URL > backup.sql',
                    icon: 'fas fa-save',
                    needsConfig: true,
                    configHelp: 'Update for your database type (MySQL, PostgreSQL, etc)'
                }
            ]
        },
        'cache': {
            name: 'Caching & Optimization',
            icon: 'fas fa-bolt',
            steps: [
                {
                    id: 'cache-npm',
                    name: 'Cache Node Modules',
                    description: 'Speed up npm install',
                    type: 'action',
                    value: 'actions/cache@v3',
                    icon: 'fas fa-tachometer-alt',
                    needsConfig: false
                },
                {
                    id: 'cache-pip',
                    name: 'Cache Python Packages',
                    description: 'Speed up pip install',
                    type: 'action',
                    value: 'actions/cache@v3',
                    icon: 'fas fa-tachometer-alt',
                    needsConfig: false
                },
                {
                    id: 'cache-maven',
                    name: 'Cache Maven Dependencies',
                    description: 'Speed up Maven builds',
                    type: 'action',
                    value: 'actions/cache@v3',
                    icon: 'fas fa-tachometer-alt',
                    needsConfig: false
                }
            ]
        }
    },

    /**
     * Get all categories
     */
    getCategories() {
        return Object.keys(this.categories).map(key => ({
            id: key,
            ...this.categories[key]
        }));
    },

    /**
     * Get steps for a specific category
     */
    getStepsByCategory(categoryId) {
        return this.categories[categoryId]?.steps || [];
    },

    /**
     * Search steps by keyword
     */
    searchSteps(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        Object.keys(this.categories).forEach(catKey => {
            const category = this.categories[catKey];
            category.steps.forEach(step => {
                if (
                    step.name.toLowerCase().includes(lowerQuery) ||
                    step.description.toLowerCase().includes(lowerQuery) ||
                    step.id.toLowerCase().includes(lowerQuery)
                ) {
                    results.push({
                        ...step,
                        category: catKey,
                        categoryName: category.name
                    });
                }
            });
        });

        return results;
    },

    /**
     * Get step by ID
     */
    getStepById(stepId) {
        for (const catKey in this.categories) {
            const step = this.categories[catKey].steps.find(s => s.id === stepId);
            if (step) {
                return {
                    ...step,
                    category: catKey,
                    categoryName: this.categories[catKey].name
                };
            }
        }
        return null;
    },

    /**
     * Get recommended steps based on job context
     */
    getRecommendedSteps(job) {
        const recommendations = [];

        // If no steps yet, recommend checkout
        if (!job.steps || job.steps.length === 0) {
            recommendations.push(this.getStepById('checkout'));
            return recommendations;
        }

        const hasCheckout = job.steps.some(s => s.type === 'checkout');
        const hasInstall = job.steps.some(s => 
            s.value && (s.value.includes('npm ci') || s.value.includes('pip install') || s.value.includes('install'))
        );
        const hasTest = job.steps.some(s =>
            s.value && (s.value.includes('test') || s.value.includes('jest') || s.value.includes('pytest'))
        );

        // Recommend checkout if missing
        if (!hasCheckout) {
            recommendations.push(this.getStepById('checkout'));
        }

        // Recommend install based on OS
        if (hasCheckout && !hasInstall) {
            if (job.os && job.os.includes('node')) {
                recommendations.push(this.getStepById('npm-install'));
            } else if (job.os && job.os.includes('python')) {
                recommendations.push(this.getStepById('pip-install'));
            }
        }

        // Recommend tests if this is a test job
        if ((job.category && job.category !== 'none') && !hasTest) {
            if (job.os && (job.os.includes('node') || job.os.includes('ubuntu'))) {
                recommendations.push(this.getStepById('npm-test'));
            } else if (job.os && job.os.includes('python')) {
                recommendations.push(this.getStepById('pytest'));
            }
        }

        // Recommend build if in build stage
        if (job.stage === 'build' && hasInstall) {
            recommendations.push(this.getStepById('npm-build'));
        }

        // Recommend deployment if in deploy stage
        if (job.stage === 'deploy') {
            recommendations.push(this.getStepById('kubectl-deploy'));
            recommendations.push(this.getStepById('heroku-deploy'));
        }

        return recommendations.filter(Boolean);
    }
};

// Make it available globally
window.StepLibrary = StepLibrary;
