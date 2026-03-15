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
            if (window.showNotification) {
                window.showNotification('This fix requires manual action. Please follow the instructions.', 'info');
            }
            return;
        }

        const job = AppState.getJob(issue.jobId);
        if (!job) {
            if (window.showNotification) {
                window.showNotification('Job not found. It may have been deleted.', 'warning');
            }
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
                if (window.showNotification) {
                    window.showNotification('This fix requires manual action. Please follow the instructions in the validation message.', 'info');
                }
                return;
        }

        // Save state for undo support
        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState();
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
            s.type === 'run' && !(s.val || '').trim() && 
            ((s.name || '').toLowerCase().includes('checkout') || 
             (s.name || '').toLowerCase().includes('clone') ||
             (s.name || '').toLowerCase().includes('pull code'))
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
            s.type === 'run' && !(s.val || '').trim()
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
        let fixed = false;

        // Case 1: Install step is after test step
        const installIndex = job.steps.findIndex(function(s) {
            return s.val && (
                s.val.includes('npm ci') ||
                s.val.includes('npm install') ||
                s.val.includes('pip install') ||
                s.val.includes('yarn install') ||
                s.val.includes('bundle install')
            );
        });
        const testIndex = job.steps.findIndex(function(s) {
            return s.val && (
                s.val.includes('npm test') ||
                s.val.includes('pytest') ||
                s.val.includes('jest') ||
                s.val.includes('mvn test') ||
                s.val.includes('go test')
            );
        });

        if (installIndex !== -1 && testIndex !== -1 && installIndex > testIndex) {
            var movedStep = job.steps.splice(installIndex, 1)[0];
            job.steps.splice(testIndex, 0, movedStep);
            fixed = true;
        }

        // Case 2: Docker login is after docker push
        var loginIndex = job.steps.findIndex(function(s) {
            return s.val && s.val.includes('docker login');
        });
        var pushIndex = job.steps.findIndex(function(s) {
            return s.val && s.val.includes('docker push');
        });

        if (loginIndex !== -1 && pushIndex !== -1 && loginIndex > pushIndex) {
            var movedLoginStep = job.steps.splice(loginIndex, 1)[0];
            job.steps.splice(pushIndex, 0, movedLoginStep);
            fixed = true;
        }

        if (fixed) {
            JobManager.renderStepsList(job);
            YamlGenerator.updateYaml();
        } else {
            if (window.showNotification) {
                window.showNotification('Steps appear to already be in the correct order.', 'info');
            }
        }
    },

    /**
     * Show help for creating connections (can't auto-fix)
     */
    showConnectionHelp(job, issue) {
        if (window.showNotification) {
            window.showNotification('To connect: drag from the bottom circle of a test job to the top circle of "' + job.name + '".', 'info');
        }
    },

    /**
     * Show success message
     */
    showSuccessMessage(issueTitle) {
        // Use the app's built-in notification system instead of custom DOM elements
        var cleanTitle = issueTitle.replace(/^\[[^\]]+\]\s*/, '').split(' - ')[0];
        if (window.showNotification) {
            window.showNotification('Fix applied: ' + cleanTitle, 'success');
        }
    },

    /**
     * Fix all auto-fixable issues at once
     */
    fixAll() {
        const fixButtons = document.querySelectorAll('.auto-fix-btn');
        let fixCount = 0;

        fixButtons.forEach(button => {
            try {
                const issueDataStr = button.dataset.issueData;
                if (issueDataStr) {
                    const issueData = JSON.parse(issueDataStr);
                    if (issueData.autoFixable) {
                        this.applyFixSilent(issueData);
                        fixCount++;
                    }
                }
            } catch (error) {
                console.log('Could not apply fix:', error);
            }
        });

        if (fixCount > 0 && window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState();
        }

        if (fixCount > 0) {
            if (window.showNotification) {
                window.showNotification('Applied ' + fixCount + ' automatic fix' + (fixCount > 1 ? 'es' : '') + '!', 'success');
            }
            // Re-run validation after all fixes
            setTimeout(function() {
                Validation.updateValidation();
            }, 500);
        } else {
            if (window.showNotification) {
                window.showNotification('No automatic fixes available. Please follow the manual instructions.', 'info');
            }
        }
    },

    /**
     * Apply a fix without showing per-fix success notifications
     * Used by fixAll to avoid spamming notifications
     */
    applyFixSilent(issue) {
        if (!issue.jobId) return;

        const job = AppState.getJob(issue.jobId);
        if (!job) return;

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
            case 'fix-empty-checkout':
                this.fixEmptyCheckout(job, issue);
                break;
            case 'remove-empty-step':
                this.removeEmptyStep(job, issue);
                break;
            default:
                break;
        }
    }
};

// Make it available globally
window.AutoFixer = AutoFixer;
