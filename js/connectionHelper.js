const ConnectionHelper = {
    connectMode: false,

    init() {
        console.log("ConnectionHelper initialized");
        this.injectButtons();
    },

    injectButtons() {
        const floatingActions = document.querySelector('.floating-actions');
        if (!floatingActions) return;

        // Check if buttons already exist
        if (floatingActions.querySelector('.connect-helper-btn')) return;

        const connectBtn = document.createElement('button');
        connectBtn.className = 'secondary connect-helper-btn';
        connectBtn.innerHTML = '<i class="fas fa-link"></i> Connect Mode';
        connectBtn.title = "See instructions for connecting jobs";
        connectBtn.onclick = () => this.toggleConnectMode();

        const autoConnectBtn = document.createElement('button');
        autoConnectBtn.className = 'secondary connect-helper-btn';
        autoConnectBtn.innerHTML = '<i class="fas fa-wand-sparkles"></i> Auto-Connect';
        autoConnectBtn.title = "Automatically connect jobs based on their stages";
        autoConnectBtn.onclick = () => this.autoConnectByStage();

        // Add to the container
        floatingActions.appendChild(connectBtn);
        floatingActions.appendChild(autoConnectBtn);
    },

    toggleConnectMode() {
        this.connectMode = !this.connectMode;
        const container = document.getElementById('graph-container');
        const btn = document.querySelector('.connect-helper-btn');

        if (this.connectMode) {
            container.classList.add('connect-mode');
            if (btn) btn.classList.add('active');
            
            // Add instruction banner
            const banner = document.createElement('div');
            banner.className = 'connect-mode-banner';
            banner.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span><strong>Connect Mode:</strong> Drag from the <strong>bottom</strong> of one job to the <strong>top</strong> of another to create a dependency.</span>
                <i class="fas fa-times" style="margin-left:15px; cursor:pointer;" onclick="ConnectionHelper.toggleConnectMode()"></i>
            `;
            container.appendChild(banner);
            
            // Show tutorial animation if first time
            if (!localStorage.getItem('pipelinepro_connection_tutorial_shown')) {
                this.showConnectionTutorial();
                localStorage.setItem('pipelinepro_connection_tutorial_shown', 'true');
            }
        } else {
            container.classList.remove('connect-mode');
            if (btn) btn.classList.remove('active');
            const banner = document.querySelector('.connect-mode-banner');
            if (banner) banner.remove();
        }
    },

    autoConnectByStage() {
        if (!window.AppState || !window.AppState.jobs || window.AppState.jobs.length < 2) {
            if (window.showNotification) window.showNotification("Add more jobs first!", "warning");
            return;
        }

        // Ask for confirmation if there are already connections
        if (window.AppState.connections.length > 0) {
            if (!confirm("This will replace your existing connections. Do you want to continue?")) {
                return;
            }
        }

        // Clear existing connections
        window.AppState.connections = [];

        // Group jobs by stage order
        const stageOrder = (window.AppState.pipeline && window.AppState.pipeline.stages) ? window.AppState.pipeline.stages : ['build', 'test', 'deploy'];
        const jobsByStage = {};
        
        stageOrder.forEach(stage => {
            jobsByStage[stage] = window.AppState.jobs.filter(j => j.stage === stage);
        });

        // Connect adjacent stages
        for (let i = 0; i < stageOrder.length - 1; i++) {
            const currentStage = stageOrder[i];
            const nextStage = stageOrder[i + 1];
            
            const fromJobs = jobsByStage[currentStage];
            const toJobs = jobsByStage[nextStage];
            
            if (fromJobs && toJobs && fromJobs.length > 0 && toJobs.length > 0) {
                fromJobs.forEach(fromJob => {
                    toJobs.forEach(toJob => {
                        window.AppState.connections.push({
                            from: fromJob.internalId,
                            to: toJob.internalId
                        });
                    });
                });
            }
        }

        // Redraw lines
        if (window.ConnectionManager && window.ConnectionManager.drawLines) {
            window.ConnectionManager.drawLines();
        }

        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            window.YamlGenerator.updateYaml();
        }

        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState();
        }

        if (window.showNotification) {
            window.showNotification("Jobs connected: Build -> Test -> Deploy", "success");
        }
    },

    showConnectionTutorial() {
        const overlay = document.createElement('div');
        overlay.className = 'connection-tutorial-overlay';
        overlay.innerHTML = `
            <div class="connection-tutorial-card">
                <h3>Connecting Jobs</h3>
                <div class="tutorial-animation">
                    <div class="tut-job-box tutor-from">
                        <div class="tut-port bottom"></div>
                    </div>
                    <div class="tut-arrow">
                        <i class="fas fa-long-arrow-alt-down"></i>
                    </div>
                    <div class="tut-job-box tutor-to">
                        <div class="tut-port top"></div>
                    </div>
                </div>
                <p>To make one job wait for another, simply drag your mouse from the <strong>bottom circle</strong> of the first job to the <strong>top circle</strong> of the second job.</p>
                <button class="onboarding-btn onboarding-btn-primary" onclick="this.closest('.connection-tutorial-overlay').remove()">Got it!</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Auto-close after 8 seconds
        setTimeout(() => {
            if (overlay && overlay.parentNode) overlay.remove();
        }, 8000);
    }
};

window.ConnectionHelper = ConnectionHelper;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        ConnectionHelper.init();
    }, 600);
});
