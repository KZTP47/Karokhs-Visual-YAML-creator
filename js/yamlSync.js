const YamlSync = {
    init() {
        console.log("YamlSync initialized");
        this.hookSelectJob();
        this.setupAnnotatedHover();
    },

    hookSelectJob() {
        if (window.JobManager && window.JobManager.selectJob) {
            const originalSelectJob = window.JobManager.selectJob;
            window.JobManager.selectJob = function(id) {
                originalSelectJob.apply(this, arguments);
                
                // If a job was selected, find its yamlId and scroll to it
                const job = window.AppState.jobs.find(j => j.internalId === id);
                if (job && job.yamlId) {
                    YamlSync.scrollToJob(job.yamlId);
                }
            };
        }
    },

    scrollToJob(yamlId) {
        // 1. Handle raw textarea
        const textArea = document.getElementById('yaml-output');
        if (textArea) {
            const yaml = textArea.value;
            const lines = yaml.split('\n');
            const targetLine = `  ${yamlId}:`;
            const lineIndex = lines.findIndex(l => l.startsWith(targetLine));
            
            if (lineIndex !== -1) {
                const lineHeight = 18; // Approximate
                textArea.scrollTop = lineIndex * lineHeight;
            }
        }

        // 2. Handle annotated view
        const container = document.getElementById('annotated-yaml-view');
        if (container && container.style.display !== 'none') {
            const lineWrapper = container.querySelector(`.yaml-line-wrapper[data-job-id="${yamlId}"]`);
            if (lineWrapper) {
                // Remove previous sync highlights
                container.querySelectorAll('.yaml-sync-active').forEach(el => el.classList.remove('yaml-sync-active'));
                
                lineWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                lineWrapper.classList.add('yaml-sync-active');
                
                // Pulse the node on canvas too
                const job = window.AppState.jobs.find(j => j.yamlId === yamlId);
                if (job) {
                    this.highlightNode(job.internalId);
                }
            }
        }
    },

    setupAnnotatedHover() {
        // We use event delegation on the container
        document.addEventListener('mouseover', (e) => {
            const line = e.target.closest('.yaml-line-wrapper[data-job-id]');
            if (line) {
                const yamlId = line.getAttribute('data-job-id');
                const job = window.AppState.jobs.find(j => j.yamlId === yamlId);
                if (job) {
                    this.highlightNode(job.internalId);
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const line = e.target.closest('.yaml-line-wrapper[data-job-id]');
            if (line) {
                const yamlId = line.getAttribute('data-job-id');
                const job = window.AppState.jobs.find(j => j.yamlId === yamlId);
                if (job) {
                    const node = document.getElementById(job.internalId);
                    if (node) node.classList.remove('yaml-sync-highlight');
                }
            }
        });
    },

    highlightNode(internalId) {
        const node = document.getElementById(internalId);
        if (node) {
            node.classList.add('yaml-sync-highlight');
            // Remove after 2 seconds (animation plays twice)
            setTimeout(() => {
                node.classList.remove('yaml-sync-highlight');
            }, 2000);
        }
    }
};

window.YamlSync = YamlSync;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        YamlSync.init();
    }, 1300);
});
