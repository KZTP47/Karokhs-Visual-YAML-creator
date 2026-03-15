const YamlAnnotator = {
    annotatedMode: false,
    container: null,
    textArea: null,

    init() {
        console.log("YamlAnnotator initialized");
        this.textArea = document.getElementById('yaml-output');
        if (!this.textArea) return;

        this.injectToggle();
        
        const experience = localStorage.getItem('pipelinepro_experience');
        if (experience === 'beginner' || experience === 'intermediate') {
            this.annotatedMode = true;
            setTimeout(() => this.renderAnnotated(), 500);
        }
    },

    injectToggle() {
        const yamlTab = document.getElementById('tab-yaml');
        if (!yamlTab) return;

        const headerRow = yamlTab.querySelector('div[style*="margin-bottom: 12px"]');
        if (!headerRow) return;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'annotator-toggle-group';
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '8px';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'secondary annotator-toggle-btn';
        toggleBtn.style.padding = '4px 8px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.innerHTML = '<i class="fas fa-magic"></i> Annotated View';
        toggleBtn.onclick = () => this.toggleView();

        // Find the copy button to insert next to it
        const copyBtn = headerRow.querySelector('button[onclick*="copyYaml"]');
        if (copyBtn) {
            headerRow.insertBefore(btnGroup, copyBtn);
            btnGroup.appendChild(toggleBtn);
        } else {
            headerRow.appendChild(toggleBtn);
        }
    },

    toggleView() {
        this.annotatedMode = !this.annotatedMode;
        const btn = document.querySelector('.annotator-toggle-btn');
        if (btn) {
            btn.innerHTML = this.annotatedMode ? 
                '<i class="fas fa-code"></i> Raw YAML' : 
                '<i class="fas fa-magic"></i> Annotated View';
        }

        if (this.annotatedMode) {
            this.renderAnnotated();
        } else {
            if (this.container) this.container.style.display = 'none';
            this.textArea.style.display = 'block';
        }
    },

    renderAnnotated() {
        if (!this.annotatedMode) return;

        const yaml = this.textArea.value;
        if (!yaml) return;

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'annotated-yaml-view';
            this.textArea.parentNode.insertBefore(this.container, this.textArea);
        }

        this.container.style.display = 'block';
        this.textArea.style.display = 'none';
        this.container.innerHTML = '';

        const lines = yaml.split('\n');
        let currentJob = null;

        lines.forEach(line => {
            const lineEl = document.createElement('div');
            lineEl.className = 'yaml-line-wrapper';
            
            if (currentJob) {
                lineEl.setAttribute('data-job-id', currentJob);
            }
            
            const content = document.createElement('div');
            content.className = 'yaml-line-content';
            content.textContent = line;
            
            const annotation = document.createElement('div');
            annotation.className = 'yaml-annotation';
            
            let annotationText = "";
            let highlightClass = "";

            const trimmed = line.trim();
            const indent = line.search(/\S/);

            if (trimmed.startsWith('name:')) {
                annotationText = "Pipeline Name: This is what you'll see in the list of runs.";
                highlightClass = 'hl-blue';
            } else if (trimmed.startsWith('on:')) {
                annotationText = "Trigger: This section defines WHEN the pipeline starts.";
                highlightClass = 'hl-green';
            } else if (trimmed.includes('push:')) {
                annotationText = "Runs whenever you push new code to the repository.";
                highlightClass = 'hl-green';
            } else if (trimmed.includes('pull_request:')) {
                annotationText = "Runs whenever someone opens a request to merge code.";
                highlightClass = 'hl-green';
            } else if (trimmed.startsWith('jobs:')) {
                annotationText = "Tasks: Everything below this is a task the pipeline performs.";
                highlightClass = 'hl-purple';
            } else if (indent === 2 && trimmed.endsWith(':') && !trimmed.startsWith('-')) {
                currentJob = trimmed.replace(':', '');
                lineEl.setAttribute('data-job-id', currentJob);
                annotationText = `Task: "${currentJob}". This is one independent task.`;
                highlightClass = 'hl-purple';
            } else if (trimmed.startsWith('runs-on:')) {
                annotationText = "Runner: The virtual computer operating system used.";
                highlightClass = 'hl-gray';
            } else if (trimmed.startsWith('needs:')) {
                annotationText = "Dependency: This task waits for another to finish first.";
                highlightClass = 'hl-orange';
            } else if (trimmed.startsWith('steps:')) {
                annotationText = "Actions: The list of things this task does, in order.";
            } else if (trimmed.includes('uses: actions/checkout')) {
                annotationText = "Code Download: Copies your latest code onto the virtual computer.";
            } else if (trimmed.startsWith('run:')) {
                annotationText = "Script command: This shell command will be executed.";
            } else if (trimmed.startsWith('env:')) {
                annotationText = "Variables: Named values available to your code while it runs.";
            } else if (trimmed.startsWith('with:')) {
                annotationText = "Settings: Configuration options for this specific action.";
            } else if (trimmed.startsWith('strategy:') || trimmed.startsWith('matrix:')) {
                annotationText = "Matrix: Runs this job multiple times with different configurations.";
                highlightClass = 'hl-orange';
            } else if (trimmed.includes('artifacts:') || trimmed.includes('upload-artifact')) {
                annotationText = "Artifacts: Files to save after the job finishes (test reports, builds, etc).";
                highlightClass = 'hl-blue';
            } else if (trimmed.includes('secrets.')) {
                annotationText = "Secret: This value is securely stored and hidden from logs.";
                highlightClass = 'hl-red';
            } else if (trimmed.startsWith('services:')) {
                annotationText = "Services: External services (like databases) this job needs running.";
                highlightClass = 'hl-purple';
            } else if (trimmed.startsWith('cache:') || trimmed.includes('actions/cache')) {
                annotationText = "Cache: Saves downloaded packages between runs to speed things up.";
                highlightClass = 'hl-green';
            } else if (trimmed.startsWith('timeout-minutes:') || trimmed.startsWith('timeout:')) {
                annotationText = "Timeout: How long this job can run before it is automatically stopped.";
                highlightClass = 'hl-gray';
            } else if (trimmed.startsWith('if:') || trimmed.startsWith('rules:')) {
                annotationText = "Condition: This job only runs when this condition is true.";
                highlightClass = 'hl-orange';
            } else if (trimmed.startsWith('branches:') || trimmed.startsWith('- main') || trimmed.startsWith('- master')) {
                annotationText = "Branch filter: This pipeline only triggers for these specific branches.";
                highlightClass = 'hl-green';
            } else if (trimmed.startsWith('workflow_dispatch:')) {
                annotationText = "Manual trigger: Lets you start this pipeline by hand from the GitHub UI.";
                highlightClass = 'hl-green';
            } else if (trimmed.startsWith('schedule:') || trimmed.includes('cron:')) {
                annotationText = "Schedule: Runs this pipeline automatically on a timer (like a daily alarm).";
                highlightClass = 'hl-green';
            } else if (trimmed.startsWith('continue-on-error:')) {
                annotationText = "Error handling: If this step fails, the pipeline continues instead of stopping.";
                highlightClass = 'hl-orange';
            } else if (trimmed.startsWith('working-directory:')) {
                annotationText = "Directory: Run commands inside this folder instead of the project root.";
                highlightClass = 'hl-gray';
            } else if (trimmed.startsWith('- name:')) {
                annotationText = "Step label: A human-readable name for this action. Shows in the pipeline log.";
            }

            lineEl.appendChild(content);

            if (annotationText) {
                annotation.textContent = annotationText;
                lineEl.classList.add(highlightClass);
                lineEl.appendChild(annotation);
            }
            
            this.container.appendChild(lineEl);
        });
    }
};

window.YamlAnnotator = YamlAnnotator;

// Integration
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        YamlAnnotator.init();
        
        // Wrap updateYaml to refresh annotated view
        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            const originalUpdate = window.YamlGenerator.updateYaml;
            window.YamlGenerator.updateYaml = function() {
                originalUpdate.apply(this, arguments);
                try {
                    if (YamlAnnotator.annotatedMode) {
                        YamlAnnotator.renderAnnotated();
                    }
                } catch (e) {
                    console.log('YamlAnnotator render error:', e);
                }
            };
        }
    }, 500);
});
