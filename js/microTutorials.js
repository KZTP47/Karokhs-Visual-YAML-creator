const MicroTutorials = {
    shown: {},

    tutorials: {
        'first-job-selected': {
            title: 'You selected a job!',
            body: 'This sidebar shows all the settings for this job. You can change its name, what operating system it runs on, and what steps it performs. Scroll down to see all the options.',
            anchor: '#job-config',
            position: 'left'
        },
        'first-step-added': {
            title: 'You added a step!',
            body: 'Steps run from top to bottom inside the job. Each step does one thing: download code, install packages, run tests, etc. The command field is where you type what the step should do.',
            anchor: '#steps-list',
            position: 'left'
        },
        'first-validation-viewed': {
            title: 'This is the Validation tab',
            body: 'Validation checks your pipeline for mistakes. Green items are good. Yellow items are suggestions. Red items are problems that will prevent your pipeline from working. Look for "Apply Fix" buttons to fix problems automatically.',
            anchor: '#tab-validation',
            position: 'left'
        },
        'first-yaml-viewed': {
            title: 'This is your YAML output',
            body: 'This is the configuration file that your pipeline tool (GitHub Actions or GitLab CI) reads. You do not need to understand this code. Just click "Export YAML" when you are ready, and put the downloaded file in your code repository.',
            anchor: '#tab-yaml',
            position: 'left'
        },
        'first-template-used': {
            title: 'Template applied!',
            body: 'The wizard created a complete pipeline for you. Each box on the canvas is a job. Lines between jobs show the order they run in. Click any job to customize it, or check the Validation tab to see if anything needs fixing.',
            anchor: '#graph-container',
            position: 'center'
        },
        'first-connection-made': {
            title: 'You connected two jobs!',
            body: 'The arrow means the second job will wait for the first one to finish. This is how you control the order of your pipeline. For example, tests should wait for the build to finish.',
            anchor: null,
            position: 'center'
        }
    },

    init() {
        console.log("MicroTutorials initialized");
        const saved = localStorage.getItem('pipelinepro_tutorials_shown');
        if (saved) {
            try {
                this.shown = JSON.parse(saved);
            } catch (e) {
                this.shown = {};
            }
        }
        
        this.hookActions();
    },

    hookActions() {
        // Hook into selectJob
        if (window.JobManager && window.JobManager.selectJob) {
            const original = window.JobManager.selectJob;
            window.JobManager.selectJob = function() {
                original.apply(this, arguments);
                setTimeout(() => MicroTutorials.trigger('first-job-selected'), 500);
            };
        }

        // Hook into rendered steps (since addStep might be complex to hook)
        if (window.JobManager && window.JobManager.renderStepsList) {
            const original = window.JobManager.renderStepsList;
            window.JobManager.renderStepsList = function(job) {
                original.apply(this, arguments);
                if (job.steps.length > 0) {
                    setTimeout(() => MicroTutorials.trigger('first-step-added'), 500);
                }
            };
        }

        // Hook into tab switching
        const originalSwitchTab = window.switchTab || (window.UIManager && window.UIManager.switchTab);
        if (originalSwitchTab) {
            const wrapper = function(tabName) {
                originalSwitchTab.apply(this, arguments);
                if (tabName === 'validation') MicroTutorials.trigger('first-validation-viewed');
                if (tabName === 'yaml') MicroTutorials.trigger('first-yaml-viewed');
            };
            if (window.switchTab) window.switchTab = wrapper;
            else if (window.UIManager) window.UIManager.switchTab = wrapper;
        }

        // Hook into Wizard finish
        if (window.Wizard && window.Wizard.wizardFinish) {
            const original = window.Wizard.wizardFinish;
            window.Wizard.wizardFinish = function() {
                original.apply(this, arguments);
                setTimeout(() => MicroTutorials.trigger('first-template-used'), 1000);
            };
        }

        // Hook into connection
        if (window.ConnectionManager && window.ConnectionManager.finishConnect) {
            const original = window.ConnectionManager.finishConnect;
            window.ConnectionManager.finishConnect = function() {
                original.apply(this, arguments);
                MicroTutorials.trigger('first-connection-made');
            };
        }
    },

    trigger(id) {
        if (this.shown[id]) return;
        
        const exp = localStorage.getItem('pipelinepro_experience');
        if (exp === 'advanced') return;

        console.log("Triggering micro-tutorial:", id);
        this.shown[id] = true;
        this.saveShown();
        
        const tutorial = this.tutorials[id];
        if (tutorial) {
            this.showCard(tutorial);
        }
    },

    showCard(tutorial) {
        const card = document.createElement('div');
        card.className = 'micro-tutorial-card';
        
        card.innerHTML = `
            <div class="tutorial-dismiss" onclick="this.parentElement.remove()">&times;</div>
            <h4>${tutorial.title}</h4>
            <p>${tutorial.body}</p>
            <button class="onboarding-btn onboarding-btn-primary" style="width:100%; padding: 8px;" onclick="this.parentElement.remove()">
                Got it
            </button>
        `;
        
        document.body.appendChild(card);
        
        // Position relative to anchor
        if (tutorial.anchor) {
            const anchorEl = document.querySelector(tutorial.anchor);
            if (anchorEl && anchorEl.offsetParent !== null) { // Check visibility
                const rect = anchorEl.getBoundingClientRect();
                
                if (tutorial.position === 'left') {
                    card.style.right = (window.innerWidth - rect.left + 20) + 'px';
                    card.style.top = rect.top + 'px';
                } else {
                    card.style.left = '50%';
                    card.style.top = '50%';
                    card.style.transform = 'translate(-50%, -50%)';
                }
            } else {
                // Fallback to center if anchor not visible
                card.style.left = '50%';
                card.style.top = '50%';
                card.style.transform = 'translate(-50%, -50%)';
            }
        } else {
            card.style.left = '50%';
            card.style.top = '50%';
            card.style.transform = 'translate(-50%, -50%)';
        }

        // Auto-dismiss
        setTimeout(() => {
            if (card && card.parentNode) {
                card.style.opacity = '0';
                card.style.transform += ' translateY(20px)';
                card.style.transition = 'all 0.5s ease-out';
                setTimeout(() => card.remove(), 500);
            }
        }, 12000);
    },

    saveShown() {
        localStorage.setItem('pipelinepro_tutorials_shown', JSON.stringify(this.shown));
    },

    resetAll() {
        this.shown = {};
        this.saveShown();
        location.reload();
    }
};

window.MicroTutorials = MicroTutorials;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        MicroTutorials.init();
    }, 900);
});
