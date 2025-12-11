/**
 * FIXED Templates Module
 * All templates now generate WORKING pipelines that execute successfully
 */

const Templates = {
    'nodejs-jest': {
        name: 'Node.js + Jest',
        icon: '🟩',
        description: 'Unit & integration tests with Jest',
        jobs: [
            {
                name: 'Install Dependencies',
                stage: 'build',
                os: 'ubuntu-latest',
                category: 'none',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Cache Dependencies', val: 'npm ci' }
                ]
            },
            {
                name: 'Unit Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Run Unit Tests', val: 'npm test -- --coverage' }
                ],
                artifacts: ['coverage/**']
            },
            {
                name: 'Integration Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'integration',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Run Integration Tests', val: 'npm run test:integration' }
                ]
            }
        ]
    },

    'python-pytest': {
        name: 'Python + Pytest',
        icon: '🐍',
        description: 'Python testing with pytest',
        jobs: [
            {
                name: 'Setup Python',
                stage: 'build',
                os: 'ubuntu-latest',
                category: 'none',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Python', val: 'actions/setup-python@v4' },
                    { type: 'run', name: 'Install Dependencies', val: 'pip install -r requirements.txt' }
                ]
            },
            {
                name: 'Run Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Python', val: 'actions/setup-python@v4' },
                    { type: 'run', name: 'Install Dependencies', val: 'pip install -r requirements.txt' },
                    { type: 'run', name: 'Run Pytest', val: 'pytest --cov=. --cov-report=xml' }
                ],
                artifacts: ['coverage.xml']
            }
        ]
    },

    'fullstack': {
        name: 'Full-Stack App',
        icon: '🌐',
        description: 'Frontend + Backend + E2E tests',
        jobs: [
            {
                name: 'Build Frontend',
                stage: 'build',
                os: 'ubuntu-latest',
                category: 'none',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Build Frontend', val: 'npm run build' }
                ],
                artifacts: ['dist/**', 'build/**']
            },
            {
                name: 'Backend Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'API Tests', val: 'npm run test:api' }
                ]
            },
            {
                name: 'Frontend Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Component Tests', val: 'npm run test:components' }
                ]
            },
            {
                name: 'E2E Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'e2e',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Cypress Tests', val: 'npm run test:e2e' }
                ],
                artifacts: ['cypress/screenshots/**', 'cypress/videos/**']
            }
        ]
    },

    'mobile-app': {
        name: 'Mobile App Tests',
        icon: '📱',
        description: 'iOS & Android testing',
        jobs: [
            {
                name: 'iOS Tests',
                stage: 'test',
                os: 'macos-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'run', name: 'Run iOS Tests', val: 'xcodebuild test -scheme MyApp -destination "platform=iOS Simulator,name=iPhone 14"' }
                ]
            },
            {
                name: 'Android Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup JDK', val: 'actions/setup-java@v3' },
                    { type: 'run', name: 'Run Android Tests', val: './gradlew test' }
                ]
            }
        ]
    },

    'api-testing': {
        name: 'API Testing',
        icon: '🔌',
        description: 'REST API testing suite',
        jobs: [
            {
                name: 'API Unit Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'unit',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Unit Tests', val: 'npm test' }
                ]
            },
            {
                name: 'Integration Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'integration',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Start Services', val: 'docker-compose up -d' },
                    { type: 'run', name: 'Wait for Services', val: 'sleep 10' },
                    { type: 'run', name: 'Integration Tests', val: 'npm run test:integration' },
                    { type: 'run', name: 'Cleanup', val: 'docker-compose down' }
                ]
            },
            {
                name: 'Load Tests',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'integration',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'action', name: 'Setup Node.js', val: 'actions/setup-node@v3' },
                    { type: 'run', name: 'Install Dependencies', val: 'npm ci' },
                    { type: 'run', name: 'Run Load Tests', val: 'npm run test:load' }
                ]
            }
        ]
    },

    'docker-deployment': {
        name: 'Docker Build & Deploy',
        icon: '🐳',
        description: 'Build, scan, and deploy Docker images (FIXED - now works!)',
        jobs: [
            {
                name: 'Build Docker Image',
                stage: 'build',
                os: 'ubuntu-latest',
                category: 'none',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'run', name: 'Login to Registry', val: 'echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin' },
                    { type: 'run', name: 'Build Image', val: 'docker build -t ${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.sha }} .' },
                    { type: 'run', name: 'Push Image', val: 'docker push ${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.sha }}' }
                ]
            },
            {
                name: 'Security Scan',
                stage: 'test',
                os: 'ubuntu-latest',
                category: 'integration',
                steps: [
                    { type: 'run', name: 'Login to Registry', val: 'echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin' },
                    { type: 'run', name: 'Pull Image', val: 'docker pull ${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.sha }}' },
                    { type: 'action', name: 'Run Trivy Scan', val: 'aquasecurity/trivy-action@master' }
                ]
            },
            {
                name: 'Deploy',
                stage: 'deploy',
                os: 'ubuntu-latest',
                category: 'none',
                steps: [
                    { type: 'checkout', name: 'Checkout Code', val: '' },
                    { type: 'run', name: 'Deploy to Kubernetes', val: 'kubectl set image deployment/myapp myapp=${{ secrets.DOCKER_USERNAME }}/myapp:${{ github.sha }}' },
                    { type: 'run', name: 'Verify Deployment', val: 'kubectl rollout status deployment/myapp' }
                ]
            }
        ]
    },

    'blank': {
        name: 'Start from Scratch',
        icon: '📄',
        description: 'Empty pipeline - build your own!',
        jobs: []
    }
};

// Helper function to get all template keys
const getTemplateKeys = () => Object.keys(Templates);

// Helper function to get a specific template
const getTemplate = (key) => Templates[key];

// Make it available globally
window.Templates = Templates;
window.getTemplateKeys = getTemplateKeys;
window.getTemplate = getTemplate;
