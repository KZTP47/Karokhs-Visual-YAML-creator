/**
 * Auto-Fixer Module
 * Automatically fixes validation issues with one click!
 */

const AutoFixer = {
    /**
     * Apply a fix based on validation issue
     */
    applyFix(issue) {
        if (!issue.jobId) {
            alert('This fix requires manual action. Please follow the instructions.');
            return;
        }

        const job = AppState.getJob(issue.jobId);
        if (!job) {
            alert('Job not found. Please try again.');
            return;
        }

        // Select the job first
        JobManager.selectJob(issue.jobId);

        // Apply fix based on fix type
        switch(issue.fixType) {
            case 'add-docker-pull':
                this.addDockerPullStep(job, issue);
                break;
            case 'add-docker-push':
                this.addDockerPushStep(job, issue);
                break;
            case 'add-docker-login':
                this.addDockerLoginStep(job, issue);
                break;
            case 'add-dependencies':
                this.addDependenciesStep(job, issue);
                break;
            case 'add-artifact-download':
                this.addArtifactDownloadStep(job, issue);
                break;
            case 'remove-matrix':
                this.removeMatrix(job);
                break;
            case 'reorder-steps':
                this.reorderSteps(job, issue);
                break;
            case 'add-connection':
                this.showConnectionHelp(job, issue);
                break;
            case 'fix-empty-checkout':
                this.fixEmptyCheckout(job, issue);
                break;
            case 'remove-empty-step':
                this.removeEmptyStep(job, issue);
                break;
            default:
                alert('This fix requires manual action. Please follow the instructions in the validation message.');
                return;
        }

        // Show success message
        this.showSuccessMessage(issue.title);

        // Re-run validation
        setTimeout(() => {
            Validation.updateValidation();
        }, 500);
    },

    /**
     * Fix empty checkout step by converting it to proper checkout type
     */
    fixEmptyCheckout(job, issue) {
        // Find the empty step
        const emptyStepIndex = job.steps.findIndex(s => 
            s.type === 'run' && !s.val.trim() && 
            (s.name.toLowerCase().includes('checkout') || 
             s.name.toLowerCase().includes('clone') ||
             s.name.toLowerCase().includes('pull code'))
        );

        if (emptyStepIndex !== -1) {
            // Convert to proper checkout step
            job.steps[emptyStepIndex] = {
                type: 'checkout',
                name: 'Checkout Code',
                val: ''
            };

            JobManager.renderStepsList(job);
            YamlGenerator.updateYaml();
        }
    },

    /**
     * Remove an empty step that serves no purpose
     */
    removeEmptyStep(job, issue) {
        // Find the first empty run step
        const emptyStepIndex = job.steps.findIndex(s => 
            s.type === 'run' && !s.val.trim()
        );

        if (emptyStepIndex !== -1) {
            job.steps.splice(emptyStepIndex, 1);
            JobManager.renderStepsList(job);
            NodeRenderer.updateNodeSteps(job.internalId, job.steps.length);
            YamlGenerator.updateYaml();
        }
    },

    /**
     * Add docker pull step
     */
    addDockerPullStep(job, issue) {
        const newStep = {
            type: 'run',
            name: 'Pull Docker Image',
            val: 'docker pull $' + '{{ secrets.DOCKER_USERNAME }}/myapp:$' + '{{ github.sha }}'
        };

        // Find the first docker scan/run step
        const targetIndex = job.steps.findIndex(s => 
            s.val && (s.val.includes('docker scan') || s.val.includes('docker run'))
        );

        if (targetIndex !== -1) {
            // Add before the target step
            job.steps.splice(targetIndex, 0, newStep);
        } else {
            // Add at the beginning if no target found
            job.steps.unshift(newStep);
        }

        JobManager.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Add docker push step
     */
    addDockerPushStep(job, issue) {
        const newStep = {
            type: 'run',
            name: 'Push Docker Image',
            val: 'docker push $' + '{{ secrets.DOCKER_USERNAME }}/myapp:$' + '{{ github.sha }}'
        };

        // Find the docker build step
        const buildIndex = job.steps.findIndex(s => 
            s.val && s.val.includes('docker build')
        );

        if (buildIndex !== -1) {
            // Add right after the build step
            job.steps.splice(buildIndex + 1, 0, newStep);
        } else {
            // Add at the end if no build found
            job.steps.push(newStep);
        }

        JobManager.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Add docker login step
     */
    addDockerLoginStep(job, issue) {
        const newStep = {
            type: 'run',
            name: 'Docker Login',
            val: 'echo "$' + '{{ secrets.DOCKER_PASSWORD }}" | docker login -u "$' + '{{ secrets.DOCKER_USERNAME }}" --password-stdin'
        };

        // Check if checkout is first
        const hasCheckout = job.steps.length > 0 && job.steps[0].type === 'checkout';

        if (hasCheckout) {
            // Add after checkout (as second step)
            job.steps.splice(1, 0, newStep);
        } else {
            // Add as first step
            job.steps.unshift(newStep);
        }

        JobManager.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Add dependencies installation step
     */
    addDependenciesStep(job, issue) {
        // Determine the correct install command based on project type
        let installCommand = 'npm ci';
        
        const hasNodeTest = job.steps.some(s => 
            s.val && (s.val.includes('npm test') || s.val.includes('jest'))
        );
        const hasPythonTest = job.steps.some(s => 
            s.val && (s.val.includes('pytest') || s.val.includes('python'))
        );

        if (hasPythonTest) {
            installCommand = 'pip install -r requirements.txt';
        }

        const newStep = {
            type: 'run',
            name: 'Install Dependencies',
            val: installCommand
        };

        // Find the test step
        const testIndex = job.steps.findIndex(s => 
            s.val && (
                s.val.includes('test') ||
                s.val.includes('jest') ||
                s.val.includes('pytest')
            )
        );

        if (testIndex !== -1) {
            // Add before the test step
            job.steps.splice(testIndex, 0, newStep);
        } else {
            // Add after checkout if no test found
            const checkoutIndex = job.steps.findIndex(s => s.type === 'checkout');
            if (checkoutIndex !== -1) {
                job.steps.splice(checkoutIndex + 1, 0, newStep);
            } else {
                job.steps.unshift(newStep);
            }
        }

        JobManager.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Add artifact download step
     */
    addArtifactDownloadStep(job, issue) {
        const newStep = {
            type: 'action',
            name: 'Download Artifacts',
            val: 'actions/download-artifact@v3'
        };

        // Add after checkout
        const checkoutIndex = job.steps.findIndex(s => s.type === 'checkout');

        if (checkoutIndex !== -1) {
            job.steps.splice(checkoutIndex + 1, 0, newStep);
        } else {
            job.steps.unshift(newStep);
        }

        JobManager.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Remove matrix configuration
     */
    removeMatrix(job) {
        job.matrix = null;
        
        // Update the UI
        const matrixCheckbox = document.getElementById('job-matrix-enabled');
        if (matrixCheckbox) {
            matrixCheckbox.checked = false;
        }

        JobManager.renderMatrixConfig(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Reorder steps
     */
    reorderSteps(job, issue) {
        // Find install and test steps
        const installIndex = job.steps.findIndex(s => 
            s.val && (s.val.includes('npm ci') || s.val.includes('pip install'))
        );
        const testIndex = job.steps.findIndex(s => 
            s.val && (s.val.includes('test') || s.val.includes('jest') || s.val.includes('pytest'))
        );

        if (installIndex > testIndex && testIndex !== -1 && installIndex !== -1) {
            // Move install step before test step
            const installStep = job.steps.splice(installIndex, 1)[0];
            job.steps.splice(testIndex, 0, installStep);

            JobManager.renderStepsList(job);
            YamlGenerator.updateYaml();
        } else {
            alert('Steps are already in the correct order or could not be reordered automatically.');
        }
    },

    /**
     * Show help for creating connections (can't auto-fix)
     */
    showConnectionHelp(job, issue) {
        alert('To create this connection:\n\n' +
              '1. Find a test job on the canvas\n' +
              '2. Click and drag from the BOTTOM circle of the test job\n' +
              '3. Drop on the TOP circle of "' + job.name + '"\n' +
              '4. This creates a dependency\n\n' +
              'This ensures tests run before deployment!');
    },

    /**
     * Show success message
     */
    showSuccessMessage(issueTitle) {
        // Create a temporary success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 20px;"></i>
            <span>Fix Applied! ${issueTitle.replace(/^[^\s]+\s*/, '').split(' - ')[0]}</span>
        `;

        document.body.appendChild(notification);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }
};

// Make it available globally
window.AutoFixer = AutoFixer;
