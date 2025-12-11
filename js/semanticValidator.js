/**
 * ENHANCED Semantic Validator Module  
 * Now includes fixType for one-click auto-fixing!
 */

const SemanticValidator = {
    /**
     * Main validation function
     */
    validatePipeline() {
        const issues = [];
        
        issues.push(...this.validateDockerWorkflow());
        issues.push(...this.validateArtifactSharing());
        issues.push(...this.validateMatrixConfiguration());
        issues.push(...this.validateTestCommands());
        issues.push(...this.validateDeploymentLogic());
        issues.push(...this.validateSecrets());
        
        return issues;
    },

    /**
     * Validate Docker workflows
     */
    validateDockerWorkflow() {
        const jobs = AppState.getAllJobs();
        const issues = [];
        
        const dockerBuildJobs = jobs.filter(j => 
            j.steps.some(s => s.val && s.val.includes('docker build'))
        );
        
        dockerBuildJobs.forEach(buildJob => {
            const buildStepIndex = buildJob.steps.findIndex(s => s.val && s.val.includes('docker build'));
            const pushStepIndex = buildJob.steps.findIndex(s => s.val && s.val.includes('docker push'));
            const loginStepIndex = buildJob.steps.findIndex(s => s.val && s.val.includes('docker login'));
            
            if (pushStepIndex === -1) {
                issues.push({
                    type: 'error',
                    title: '[DOCKER] Image not pushed - "' + buildJob.name + '"',
                    desc: 'You build a Docker image but don\'t push it to a registry. Other jobs won\'t be able to access it!',
                    fix: 'Add AFTER "docker build" step:\n   docker push $' + '{{ secrets.DOCKER_USERNAME }}/myapp:$' + '{{ github.sha }}',
                    jobId: buildJob.internalId,
                    fixType: 'add-docker-push',
                    autoFixable: true
                });
            }
            
            if (pushStepIndex !== -1 && loginStepIndex === -1) {
                issues.push({
                    type: 'error',
                    title: '[SECURITY] Missing Docker login - "' + buildJob.name + '"',
                    desc: 'You\'re trying to push a Docker image without logging in first.',
                    fix: 'Add as FIRST step (before everything else):\n   echo "$' + '{{ secrets.DOCKER_PASSWORD }}" | docker login -u "$' + '{{ secrets.DOCKER_USERNAME }}" --password-stdin',
                    jobId: buildJob.internalId,
                    fixType: 'add-docker-login',
                    autoFixable: true
                });
            } else if (pushStepIndex !== -1 && loginStepIndex > pushStepIndex) {
                issues.push({
                    type: 'error',
                    title: '[SECURITY] Docker login in wrong order - "' + buildJob.name + '"',
                    desc: 'You need to login BEFORE pushing the image.',
                    fix: 'Move "docker login" step to be BEFORE "docker push" step',
                    jobId: buildJob.internalId,
                    fixType: 'reorder-steps',
                    autoFixable: true
                });
            }
        });
        
        const dockerUseJobs = jobs.filter(j => 
            j.steps.some(s => s.val && (
                s.val.includes('docker scan') || 
                s.val.includes('docker run') ||
                (s.val.includes('docker') && !s.val.includes('docker build') && !s.val.includes('docker login'))
            ))
        );
        
        dockerUseJobs.forEach(useJob => {
            const pullStepIndex = useJob.steps.findIndex(s => s.val && s.val.includes('docker pull'));
            const loginStepIndex = useJob.steps.findIndex(s => s.val && s.val.includes('docker login'));
            const firstDockerUseIndex = useJob.steps.findIndex(s => 
                s.val && (s.val.includes('docker scan') || s.val.includes('docker run'))
            );
            
            if (pullStepIndex === -1 && firstDockerUseIndex !== -1) {
                const firstDockerStep = useJob.steps[firstDockerUseIndex];
                issues.push({
                    type: 'error',
                    title: '[DOCKER] Image not pulled - "' + useJob.name + '"',
                    desc: 'You\'re trying to use a Docker image without pulling it first. The image doesn\'t exist on this runner!',
                    fix: 'Add BEFORE "' + firstDockerStep.name + '" step:\n   docker pull $' + '{{ secrets.DOCKER_USERNAME }}/myapp:$' + '{{ github.sha }}',
                    jobId: useJob.internalId,
                    fixType: 'add-docker-pull',
                    autoFixable: true
                });
            }
            
            if (loginStepIndex === -1 && pullStepIndex !== -1) {
                issues.push({
                    type: 'warning',
                    title: '[SECURITY] May need Docker login - "' + useJob.name + '"',
                    desc: 'If your Docker image is in a private registry, you need to login first.',
                    fix: 'Add as FIRST step:\n   echo "$' + '{{ secrets.DOCKER_PASSWORD }}" | docker login -u "$' + '{{ secrets.DOCKER_USERNAME }}" --password-stdin',
                    jobId: useJob.internalId,
                    fixType: 'add-docker-login',
                    autoFixable: true
                });
            }
        });
        
        return issues;
    },

    /**
     * Validate artifact sharing
     */
    validateArtifactSharing() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();
        const issues = [];
        
        const jobsWithArtifacts = jobs.filter(j => j.artifacts && j.artifacts.length > 0);
        
        jobsWithArtifacts.forEach(job => {
            const dependentJobs = connections
                .filter(c => c.from === job.internalId)
                .map(c => AppState.getJob(c.to));
            
            if (dependentJobs.length > 0) {
                dependentJobs.forEach(depJob => {
                    const hasDownload = depJob.steps.some(s => 
                        s.type === 'action' && (
                            s.val.includes('download-artifact') ||
                            s.val.includes('actions/download-artifact')
                        )
                    );
                    
                    if (!hasDownload && !depJob.isExternal) {
                        issues.push({
                            type: 'warning',
                            title: '[ARTIFACTS] Not downloaded - "' + depJob.name + '"',
                            desc: 'Job "' + job.name + '" creates artifacts, but "' + depJob.name + '" doesn\'t download them.',
                            fix: 'Add as step #2 (after checkout):\n   - name: Download artifacts\n     uses: actions/download-artifact@v3',
                            jobId: depJob.internalId,
                            fixType: 'add-artifact-download',
                            autoFixable: true
                        });
                    }
                });
            }
        });
        
        return issues;
    },

    /**
     * Validate matrix configuration
     */
    validateMatrixConfiguration() {
        const jobs = AppState.getAllJobs();
        const issues = [];
        
        jobs.forEach(job => {
            if (!job.matrix) return;
            
            const matrixKeys = Object.keys(job.matrix);
            const matrixIsUsed = job.steps.some(s => 
                matrixKeys.some(key => s.val && s.val.includes('$' + '{{ matrix.' + key + ' }}'))
            );
            
            if (!matrixIsUsed) {
                issues.push({
                    type: 'warning',
                    title: '[MATRIX] Unused configuration - "' + job.name + '"',
                    desc: 'You have a matrix configuration (' + matrixKeys.join(', ') + ') but don\'t use it in any commands. This will run the same job multiple times with no variation!',
                    fix: 'Option 1: Use $' + '{{ matrix.' + matrixKeys[0] + ' }} in your commands\nOption 2: Remove the matrix configuration (uncheck "Enable Matrix")',
                    jobId: job.internalId,
                    fixType: 'remove-matrix',
                    autoFixable: true
                });
            }
            
            const hasDockerScan = job.steps.some(s => 
                s.val && s.val.includes('docker scan')
            );
            
            if (hasDockerScan && job.matrix && !matrixIsUsed) {
                issues.push({
                    type: 'error',
                    title: '[MATRIX] Pointless on Docker scan - "' + job.name + '"',
                    desc: 'You\'re scanning the same Docker image ' + Object.values(job.matrix)[0].length + ' times! The matrix doesn\'t affect the scan.',
                    fix: 'Remove the matrix:\n   1. Click this job\n   2. Uncheck "Enable Matrix Testing"\n   3. Matrix should only be on jobs that run actual tests',
                    jobId: job.internalId,
                    fixType: 'remove-matrix',
                    autoFixable: true
                });
            }
        });
        
        return issues;
    },

    /**
     * Validate test commands
     */
    validateTestCommands() {
        const jobs = AppState.getAllJobs();
        const issues = [];
        
        jobs.forEach(job => {
            if (job.category === 'none' || job.isExternal) return;
            
            const hasTestCommand = job.steps.some(s => 
                s.val && (
                    s.val.includes('npm test') ||
                    s.val.includes('npm run test') ||
                    s.val.includes('jest') ||
                    s.val.includes('pytest') ||
                    s.val.includes('mvn test') ||
                    s.val.includes('gradle test') ||
                    s.val.includes('go test') ||
                    s.val.includes('dotnet test') ||
                    s.val.includes('php artisan test') ||
                    s.val.includes('rspec')
                )
            );
            
            if (!hasTestCommand) {
                issues.push({
                    type: 'warning',
                    title: '[TEST] No test command - "' + job.name + '"',
                    desc: 'This job is marked as "' + job.category + '" test but doesn\'t have a test command.',
                    fix: 'Add a test step:\n   1. Click "+ Add" button in Steps section\n   2. Choose "Run Command"\n   3. Enter: npm test (or pytest, etc.)',
                    jobId: job.internalId,
                    fixType: 'manual',
                    autoFixable: false
                });
            }
            
            const testStepIndex = job.steps.findIndex(s => 
                s.val && (
                    s.val.includes('npm test') ||
                    s.val.includes('pytest') ||
                    s.val.includes('jest')
                )
            );
            
            const installStepIndex = job.steps.findIndex(s => 
                s.val && (
                    s.val.includes('npm ci') ||
                    s.val.includes('npm install') ||
                    s.val.includes('pip install') ||
                    s.val.includes('yarn install') ||
                    s.val.includes('bundle install')
                )
            );
            
            if (hasTestCommand && installStepIndex === -1) {
                const testStep = job.steps[testStepIndex];
                issues.push({
                    type: 'error',
                    title: '[DEPENDENCIES] Not installed - "' + job.name + '"',
                    desc: 'You\'re running tests without installing dependencies first. Tests will fail!',
                    fix: 'Add BEFORE "' + testStep.name + '" step:\n   npm ci\n   (or "pip install -r requirements.txt" for Python)',
                    jobId: job.internalId,
                    fixType: 'add-dependencies',
                    autoFixable: true
                });
            } else if (hasTestCommand && installStepIndex > testStepIndex) {
                issues.push({
                    type: 'error',
                    title: '[DEPENDENCIES] Installed too late - "' + job.name + '"',
                    desc: 'You install dependencies AFTER running tests. This is backwards!',
                    fix: 'Move the install step to be BEFORE the test step\n   (Dependencies must be installed before tests run)',
                    jobId: job.internalId,
                    fixType: 'reorder-steps',
                    autoFixable: true
                });
            }
        });
        
        return issues;
    },

    /**
     * Validate deployment logic
     */
    validateDeploymentLogic() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();
        const issues = [];
        
        const deployJobs = jobs.filter(j => 
            j.stage === 'deploy' || 
            j.steps.some(s => s.val && (
                s.val.includes('deploy') ||
                s.val.includes('kubectl') ||
                s.val.includes('heroku') ||
                s.val.includes('aws ') ||
                s.val.includes('gcloud ')
            ))
        );
        
        deployJobs.forEach(deployJob => {
            const hasTestDependency = connections.some(c => {
                if (c.to === deployJob.internalId) {
                    const parentJob = AppState.getJob(c.from);
                    return parentJob && (
                        parentJob.category === 'unit' ||
                        parentJob.category === 'integration' ||
                        parentJob.category === 'e2e' ||
                        parentJob.stage === 'test'
                    );
                }
                return false;
            });
            
            if (!hasTestDependency) {
                issues.push({
                    type: 'error',
                    title: '[DEPLOY] No tests before deployment - "' + deployJob.name + '"',
                    desc: 'This deployment job doesn\'t run after any tests. You might deploy broken code!',
                    fix: 'Connect test jobs to deployment:\n   1. Drag from the bottom of a test job\n   2. Drop on the top of "' + deployJob.name + '"\n   3. This ensures tests pass before deploying',
                    jobId: deployJob.internalId,
                    fixType: 'add-connection',
                    autoFixable: false
                });
            }
            
            const hasKubectl = deployJob.steps.some(s => 
                s.val && s.val.includes('kubectl')
            );
            
            if (hasKubectl) {
                const kubectlStepIndex = deployJob.steps.findIndex(s => 
                    s.val && s.val.includes('kubectl')
                );
                
                const hasImageRef = deployJob.steps.some(s => 
                    s.val && (
                        s.val.includes('$' + '{{ github.sha }}') ||
                        s.val.includes('$' + '{{ github.run_number }}') ||
                        s.val.includes(':latest')
                    )
                );
                
                if (!hasImageRef) {
                    const kubectlStep = deployJob.steps[kubectlStepIndex];
                    issues.push({
                        type: 'warning',
                        title: '[KUBERNETES] Deploy without version - "' + deployJob.name + '"',
                        desc: 'Your kubectl command doesn\'t specify which image version to deploy.',
                        fix: 'Update "' + kubectlStep.name + '" step:\n   kubectl set image deployment/myapp myapp=myregistry.com/myapp:$' + '{{ github.sha }}',
                        jobId: deployJob.internalId,
                        fixType: 'manual',
                        autoFixable: false
                    });
                }
            }
        });
        
        return issues;
    },

    /**
     * Validate secrets usage
     */
    validateSecrets() {
        const jobs = AppState.getAllJobs();
        const issues = [];
        
        jobs.forEach(job => {
            job.steps.forEach((step, idx) => {
                if (step.val) {
                    const lowerVal = step.val.toLowerCase();
                    
                    if (lowerVal.includes('password') && !lowerVal.includes('secrets.')) {
                        if (lowerVal.match(/password\s*[:=]\s*['"]/i)) {
                            issues.push({
                                type: 'error',
                                title: '[SECURITY] Hardcoded password detected - "' + job.name + '"',
                                desc: 'Step "' + step.name + '" contains what looks like a hardcoded password. Never commit credentials!',
                                fix: 'Edit step #' + (idx + 1) + ' "' + step.name + '":\n   Replace the password with: $' + '{{ secrets.PASSWORD }}',
                                jobId: job.internalId,
                                fixType: 'manual',
                                autoFixable: false
                            });
                        }
                    }
                    
                    if ((lowerVal.includes('api_key') || lowerVal.includes('apikey')) && !lowerVal.includes('secrets.')) {
                        if (lowerVal.match(/(api_?key)\s*[:=]\s*['"]/i)) {
                            issues.push({
                                type: 'error',
                                title: '[SECURITY] Hardcoded API key detected - "' + job.name + '"',
                                desc: 'Step "' + step.name + '" contains what looks like a hardcoded API key.',
                                fix: 'Edit step #' + (idx + 1) + ' "' + step.name + '":\n   Replace the API key with: $' + '{{ secrets.API_KEY }}',
                                jobId: job.internalId,
                                fixType: 'manual',
                                autoFixable: false
                            });
                        }
                    }
                }
            });
        });
        
        return issues;
    }
};

window.SemanticValidator = SemanticValidator;
