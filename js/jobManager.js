/**
 * Job Manager Module
 * Handles all job-related operations (create, read, update, delete)
 */

const JobManager = {
    /**
     * Create a new job at specified coordinates
     */
    addJob(x, y) {
        const container = document.getElementById('graph-container');
        if (!x || !y) {
            const r = container.getBoundingClientRect();
            x = (r.width / 2) - 120;
            y = (r.height / 2) - 50;
        }

        const id = 'node_' + Date.now() + Math.random().toString(16).slice(2);
        const job = {
            internalId: id,
            yamlId: 'job_' + AppState.nextId++,
            name: 'New Test Job',
            os: 'ubuntu-latest',
            stage: AppState.pipeline.stages[0],
            category: 'none',
            x,
            y,
            steps: [
                { type: 'checkout', name: 'Checkout Code', val: '' }
            ],
            isExternal: false,
            envVars: [],
            artifacts: [],
            matrix: null,
            retry: null
        };

        AppState.addJob(job);
        NodeRenderer.renderNode(job);
        this.selectJob(id);
        UIManager.checkEmptyState();
        YamlGenerator.updateYaml();
        Validation.validateNames();
        Validation.updateValidation();
    },

    /**
     * Create an external job reference
     */
    addExternalJob() {
        const container = document.getElementById('graph-container');
        const rect = container.getBoundingClientRect();

        const job = {
            internalId: 'node_' + Date.now(),
            yamlId: 'ext_' + AppState.nextId++,
            name: 'External Pipeline',
            isExternal: true,
            externalPath: './templates/build-template.yml',
            x: (rect.width / 2) - 120,
            y: (rect.height / 2) - 50,
            stage: AppState.pipeline.stages[0],
            category: 'none',
            steps: [],
            envVars: [],
            artifacts: [],
            matrix: null,
            retry: null
        };

        AppState.addJob(job);
        NodeRenderer.renderNode(job);
        this.selectJob(job.internalId);
        YamlGenerator.updateYaml();
        Validation.updateValidation();
    },

    /**
     * Delete the currently selected job
     */
    deleteJob() {
        if (!AppState.selectedId) return;

        NodeRenderer.removeNode(AppState.selectedId);
        AppState.removeJob(AppState.selectedId);
        UIManager.handleCanvasClick({ target: document.getElementById('graph-container') });
        ConnectionManager.drawLines();
        UIManager.checkEmptyState();
        YamlGenerator.updateYaml();
        Validation.validateNames();
        Validation.updateValidation();
    },

    /**
     * Select a job and show its configuration
     */
    selectJob(id) {
        AppState.setSelectedId(id);
        NodeRenderer.selectNode(id);

        if (id) {
            document.getElementById('global-config').style.display = 'none';
            document.getElementById('job-config').style.display = 'block';

            const job = AppState.getJob(id);
            document.getElementById('job-name').value = job.name;

            if (job.isExternal) {
                document.getElementById('standard-job-fields').style.display = 'none';
                document.getElementById('steps-section').style.display = 'none';
                document.getElementById('external-job-fields').style.display = 'block';
                document.getElementById('job-external-path').value = job.externalPath;
            } else {
                document.getElementById('standard-job-fields').style.display = 'block';
                document.getElementById('steps-section').style.display = 'block';
                document.getElementById('external-job-fields').style.display = 'none';
                document.getElementById('job-os').value = job.os;
                document.getElementById('job-stage').value = job.stage;
                document.getElementById('job-category').value = job.category || 'none';

                this.renderStepsList(job);
                this.renderEnvVarsList(job);
                this.renderArtifactsList(job);
                this.renderMatrixConfig(job);
                this.renderRetryConfig(job);
            }
        }
    },

    /**
     * Update job name
     */
    updateJobName(value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.name = value;
        job.yamlId = job.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || job.internalId;

        NodeRenderer.updateNodeName(AppState.selectedId, value);
        YamlGenerator.updateYaml();
        Validation.validateNames();
    },

    /**
     * Update job OS/image
     */
    updateJobOS(value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.os = value;
        NodeRenderer.updateNodeOS(AppState.selectedId, value);
        YamlGenerator.updateYaml();
    },

    /**
     * Update job stage
     */
    updateJobStage(value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.stage = value;
        NodeRenderer.updateNodeStage(AppState.selectedId, value);
        YamlGenerator.updateYaml();
    },

    /**
     * Update job category (unit/integration/e2e)
     */
    updateJobCategory(value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.category = value;
        NodeRenderer.rerenderNode(job);
        YamlGenerator.updateYaml();
    },

    /**
     * Update external job path
     */
    updateJobExternalPath(value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.externalPath = value;
        YamlGenerator.updateYaml();
    },

    // ========== STEPS MANAGEMENT ==========

    renderStepsList(job) {
        const list = document.getElementById('steps-list');
        list.innerHTML = '';

        job.steps.forEach((step, i) => {
            const div = document.createElement('div');
            div.className = 'step-card';

            let hint = "";
            if (step.type === 'checkout') hint = "Downloads your code from the repository";
            if (step.type === 'run') hint = "Executes shell commands";
            if (step.type === 'action') hint = "Uses a pre-built GitHub Action or plugin";

            div.innerHTML = `
                <i class="fas fa-times step-remove" onclick="JobManager.removeStep(${i})"></i>
                <input type="text" value="${step.name}" oninput="JobManager.updateStepValue(${i},'name',this.value)"
                       style="font-weight:bold;border:none;background:transparent;padding:0;margin-bottom:5px;width:90%;">
                <div style="display:flex;gap:5px;">
                    <select onchange="JobManager.updateStepValue(${i},'type',this.value)" style="width:140px;">
                        <option value="checkout" ${step.type === 'checkout' ? 'selected' : ''}>Checkout Code</option>
                        <option value="run" ${step.type === 'run' ? 'selected' : ''}>Run Command</option>
                        <option value="action" ${step.type === 'action' ? 'selected' : ''}>Use Action/Plugin</option>
                    </select>
                    <input type="text" value="${step.val}" placeholder="e.g. npm test"
                           oninput="JobManager.updateStepValue(${i},'val',this.value)"
                           ${step.type === 'checkout' ? 'disabled' : ''}>
                </div>
                <div class="tooltip-text">${hint}</div>
            `;
            list.appendChild(div);
        });
    },

    addStep() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.steps.push({
            type: 'run',
            name: 'New Step',
            val: ''
        });

        this.renderStepsList(job);
        YamlGenerator.updateYaml();
    },

    removeStep(index) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.steps.splice(index, 1);
        this.renderStepsList(job);
        NodeRenderer.updateNodeSteps(AppState.selectedId, job.steps.length);
        YamlGenerator.updateYaml();
    },

    updateStepValue(index, field, value) {
        if (!AppState.selectedId) return;

        const job = AppState.getJob(AppState.selectedId);
        job.steps[index][field] = value;

        if (field === 'type') {
            if (value === 'checkout') job.steps[index].val = '';
            this.renderStepsList(job);
        }

        YamlGenerator.updateYaml();
    },

    // ========== ENVIRONMENT VARIABLES ==========

    renderEnvVarsList(job) {
        const list = document.getElementById('env-vars-list');
        list.innerHTML = '';

        if (!job.envVars) job.envVars = [];

        job.envVars.forEach((envVar, idx) => {
            const div = document.createElement('div');
            div.className = 'env-var-item';
            div.innerHTML = `
                <input type="text" placeholder="Key" value="${envVar.key}"
                       oninput="JobManager.updateEnvVar(${idx}, 'key', this.value)">
                <input type="text" placeholder="Value" value="${envVar.value}"
                       oninput="JobManager.updateEnvVar(${idx}, 'value', this.value)">
                <i class="fas fa-times env-var-remove" onclick="JobManager.removeEnvVar(${idx})"></i>
            `;
            list.appendChild(div);
        });
    },

    addEnvVar() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        if (!job.envVars) job.envVars = [];
        job.envVars.push({ key: '', value: '' });
        this.renderEnvVarsList(job);
    },

    updateEnvVar(index, field, value) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.envVars[index][field] = value;
        YamlGenerator.updateYaml();
    },

    removeEnvVar(index) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.envVars.splice(index, 1);
        this.renderEnvVarsList(job);
        YamlGenerator.updateYaml();
    },

    // ========== ARTIFACTS ==========

    renderArtifactsList(job) {
        const list = document.getElementById('artifacts-list');
        list.innerHTML = '';

        if (!job.artifacts) job.artifacts = [];

        job.artifacts.forEach((artifact, idx) => {
            const div = document.createElement('div');
            div.className = 'artifact-item';
            div.innerHTML = `
                <input type="text" placeholder="e.g. coverage/**, test-results/**"
                       value="${artifact}"
                       oninput="JobManager.updateArtifact(${idx}, this.value)"
                       style="border: none; background: transparent; flex: 1;">
                <i class="fas fa-times" onclick="JobManager.removeArtifact(${idx})"
                   style="cursor: pointer; color: var(--error-color);"></i>
            `;
            list.appendChild(div);
        });
    },

    addArtifact() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        if (!job.artifacts) job.artifacts = [];
        job.artifacts.push('test-results/**');
        this.renderArtifactsList(job);
        YamlGenerator.updateYaml();
    },

    updateArtifact(index, value) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.artifacts[index] = value;
        YamlGenerator.updateYaml();
    },

    removeArtifact(index) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        job.artifacts.splice(index, 1);
        this.renderArtifactsList(job);
        YamlGenerator.updateYaml();
    },

    // ========== MATRIX TESTING ==========

    renderMatrixConfig(job) {
        const enabled = document.getElementById('job-matrix-enabled');
        const config = document.getElementById('matrix-config');

        enabled.checked = !!job.matrix;
        config.style.display = job.matrix ? 'block' : 'none';

        if (job.matrix) {
            const list = document.getElementById('matrix-vars-list');
            list.innerHTML = '';

            Object.entries(job.matrix).forEach(([key, values]) => {
                const div = document.createElement('div');
                div.className = 'matrix-row';
                div.innerHTML = `
                    <input type="text" placeholder="Variable (e.g. node)"
                           value="${key}"
                           oninput="JobManager.updateMatrixKey(this, '${key}')">
                    <input type="text" placeholder="Values (comma-separated)"
                           value="${Array.isArray(values) ? values.join(', ') : values}"
                           oninput="JobManager.updateMatrixValues('${key}', this.value)">
                    <i class="fas fa-times" onclick="JobManager.removeMatrixVar('${key}')"
                       style="cursor: pointer; color: var(--error-color);"></i>
                `;
                list.appendChild(div);
            });
        }
    },

    updateJobMatrix() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        const enabled = document.getElementById('job-matrix-enabled').checked;

        if (enabled && !job.matrix) {
            job.matrix = { version: ['14', '16', '18'] };
        } else if (!enabled) {
            job.matrix = null;
        }

        this.renderMatrixConfig(job);
        YamlGenerator.updateYaml();
    },

    addMatrixVar() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        if (!job.matrix) job.matrix = {};

        const newKey = 'var' + Object.keys(job.matrix).length;
        job.matrix[newKey] = ['value1', 'value2'];

        this.renderMatrixConfig(job);
        YamlGenerator.updateYaml();
    },

    updateMatrixKey(input, oldKey) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        const newKey = input.value;

        if (newKey !== oldKey && job.matrix) {
            const value = job.matrix[oldKey];
            delete job.matrix[oldKey];
            job.matrix[newKey] = value;
            this.renderMatrixConfig(job);
            YamlGenerator.updateYaml();
        }
    },

    updateMatrixValues(key, value) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job || !job.matrix) return;

        job.matrix[key] = value.split(',').map(v => v.trim());
        YamlGenerator.updateYaml();
    },

    removeMatrixVar(key) {
        const job = AppState.getJob(AppState.selectedId);
        if (!job || !job.matrix) return;

        delete job.matrix[key];
        this.renderMatrixConfig(job);
        YamlGenerator.updateYaml();
    },

    // ========== RETRY CONFIGURATION ==========

    renderRetryConfig(job) {
        const enabled = document.getElementById('job-retry-enabled');
        const config = document.getElementById('retry-config');

        enabled.checked = !!job.retry;
        config.style.display = job.retry ? 'block' : 'none';

        if (job.retry) {
            document.getElementById('job-retry-attempts').value = job.retry.attempts || 2;
        }
    },

    updateJobRetry() {
        const job = AppState.getJob(AppState.selectedId);
        if (!job) return;

        const enabled = document.getElementById('job-retry-enabled').checked;

        if (enabled) {
            const attempts = parseInt(document.getElementById('job-retry-attempts').value) || 2;
            job.retry = { attempts };
        } else {
            job.retry = null;
        }

        this.renderRetryConfig(job);
        YamlGenerator.updateYaml();
    }
};

// Make it available globally
window.JobManager = JobManager;
