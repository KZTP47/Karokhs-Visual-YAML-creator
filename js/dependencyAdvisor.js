const DependencyAdvisor = {
    advisories: [],

    init() {
        console.log("DependencyAdvisor initialized");
        this.hookValidation();
    },

    hookValidation() {
        if (window.Validation && window.Validation.updateValidation) {
            const originalUpdate = window.Validation.updateValidation;
            window.Validation.updateValidation = function() {
                originalUpdate.apply(this, arguments);
                
                // Use a small timeout to ensure DOM is updated and other validators have run
                setTimeout(() => {
                    DependencyAdvisor.analyzeAndRender();
                }, 100);
            };
        }
    },

    analyzeAndRender() {
        // Skip if advanced user
        if (localStorage.getItem('pipelinepro_experience') === 'advanced') return;

        const resultsContainer = document.getElementById('validation-results');
        if (!resultsContainer) return;

        // Clear existing advisories
        document.querySelectorAll('.dependency-advisory').forEach(el => el.remove());

        this.advisories = [];
        this.runAnalysis();

        // Render each advisory
        this.advisories.forEach(adv => {
            const el = document.createElement('div');
            el.className = 'dependency-advisory';
            el.innerHTML = `
                <div class="dependency-advisory-header">
                    <i class="fas fa-lightbulb"></i> Advisor Tip: ${adv.title}
                </div>
                <div class="dependency-advisory-body">
                    ${adv.message}
                </div>
                <button class="dependency-advisory-fix-btn" onclick="DependencyAdvisor.applyFix('${adv.id}')">
                    <i class="fas fa-magic"></i> Fix This For Me
                </button>
            `;
            
            // Insert after the health dashboard if it exists, otherwise at the top
            const dashboard = document.getElementById('pipeline-health-dashboard');
            if (dashboard) {
                dashboard.after(el);
            } else {
                resultsContainer.insertBefore(el, resultsContainer.firstChild);
            }
        });
    },

    runAnalysis() {
        const jobs = window.AppState.getAllJobs();
        const connections = window.AppState.getConnections();
        
        if (jobs.length < 2) return;

        // 1. Missing dependencies (Deploy without Test)
        const deployJobs = jobs.filter(j => j.stage === 'deploy' || j.stage === 'production');
        const testJobs = jobs.filter(j => j.stage === 'test' || j.stage === 'qa');
        
        deployJobs.forEach(dj => {
            // Check if this job has any incoming connections from test jobs
            const hasTestDependency = connections.some(c => c.to === dj.internalId && 
                testJobs.some(tj => tj.internalId === c.from));
            
            if (!hasTestDependency && testJobs.length > 0) {
                this.advisories.push({
                    id: 'missing-test-dep-' + dj.internalId,
                    type: 'missing-dep',
                    title: 'Deploy starts before tests pass',
                    message: `Your deployment job <strong>${dj.name}</strong> will run even if your tests fail. It is better to connect it so it waits for <strong>${testJobs[0].name}</strong> to finish successfully first.`,
                    data: { from: testJobs[0].internalId, to: dj.internalId }
                });
            }
        });

        // 2. Isolated Jobs
        jobs.forEach(j => {
            const hasIncoming = connections.some(c => c.to === j.internalId);
            const hasOutgoing = connections.some(c => c.from === j.internalId);
            
            if (!hasIncoming && !hasOutgoing && jobs.length > 1) {
                this.advisories.push({
                    id: 'isolated-job-' + j.internalId,
                    type: 'isolated',
                    title: 'Job is all alone',
                    message: `The job <strong>${j.name}</strong> is not connected to anything. It will start instantly when you push code. If it should wait for another job, you should connect them.`,
                    data: { jobId: j.internalId }
                });
            }
        });

        // 3. Stage Order Violations
        const stageOrder = (window.AppState.pipeline.stages || ['build', 'test', 'deploy']);
        connections.forEach(c => {
            const fromJob = window.AppState.getJob(c.from);
            const toJob = window.AppState.getJob(c.to);
            if (fromJob && toJob) {
                const fromIdx = stageOrder.indexOf(fromJob.stage);
                const toIdx = stageOrder.indexOf(toJob.stage);
                
                if (fromIdx > toIdx && fromIdx !== -1 && toIdx !== -1) {
                    this.advisories.push({
                        id: 'backwards-dep-' + c.from + '-' + c.to,
                        type: 'backwards',
                        title: 'Connection goes backwards',
                        message: `The connection from <strong>${fromJob.name}</strong> (${fromJob.stage}) to <strong>${toJob.name}</strong> (${toJob.stage}) goes backwards through the stages. This is unusual and might cause confusion.`,
                        data: { from: c.from, to: c.to, reverse: true }
                    });
                }
            }
        });

        // 4. Redundant Dependencies (Simplified)
        // If A->B, B->C, and A->C, then A->C is redundant
        connections.forEach(c1 => {
            // Looking for A->C
            const A = c1.from;
            const C = c1.to;
            
            // Check if there is a path A->B->C
            connections.forEach(c2 => {
                if (c2.from === A) {
                    const B = c2.to;
                    if (connections.some(c3 => c3.from === B && c3.to === C)) {
                        this.advisories.push({
                            id: 'redundant-dep-' + A + '-' + C,
                            type: 'redundant',
                            title: 'Double connection',
                            message: `The direct connection between <strong>${window.AppState.getJob(A).name}</strong> and <strong>${window.AppState.getJob(C).name}</strong> is redundant because they are already connected through another job. You can safely remove it.`,
                            data: { from: A, to: C, remove: true }
                        });
                    }
                }
            });
        });
    },

    applyFix(advisoryId) {
        const adv = this.advisories.find(a => a.id === advisoryId);
        if (!adv) return;

        if (adv.type === 'missing-dep' || (adv.type === 'isolated' && adv.data.jobId)) {
            // Connect to something
            let fromId = adv.data.from;
            let toId = adv.data.to;
            
            if (adv.type === 'isolated') {
                // Find a logical parent (previous stage)
                const jobs = window.AppState.getAllJobs();
                const myJob = window.AppState.getJob(adv.data.jobId);
                const stageOrder = (window.AppState.pipeline.stages || ['build', 'test', 'deploy']);
                const myIdx = stageOrder.indexOf(myJob.stage);
                
                const possibleParent = jobs.find(j => stageOrder.indexOf(j.stage) < myIdx && j.internalId !== myJob.internalId);
                if (possibleParent) {
                    fromId = possibleParent.internalId;
                    toId = myJob.internalId;
                }
            }

            if (fromId && toId) {
                window.AppState.addConnection(fromId, toId);
                if (window.showNotification) window.showNotification("Added suggested connection!", "success");
            }
        } else if (adv.type === 'redundant' || adv.type === 'backwards') {
            // Remove connection
            window.AppState.removeConnection(adv.data.from, adv.data.to);
            if (window.showNotification) window.showNotification("Removed problematic connection!", "success");
        }

        // Refresh Everything
        if (window.ConnectionManager && window.ConnectionManager.drawLines) {
            window.ConnectionManager.drawLines();
        }
        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            window.YamlGenerator.updateYaml();
        }
        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState('Applied Advisor Fix');
        }
        
        // Final re-analysis
        this.analyzeAndRender();
    }
};

window.DependencyAdvisor = DependencyAdvisor;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => DependencyAdvisor.init(), 2800);
});
