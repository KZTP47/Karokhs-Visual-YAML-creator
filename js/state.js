/**
 * State Management Module
 * Manages all global state for the pipeline builder
 */

const AppState = {
    platform: 'github',
    pipeline: {
        branch: 'main',
        triggers: { push: true, pr: false },
        stages: ['build', 'test', 'deploy']
    },
    jobs: [],
    connections: [],
    nextId: 1,
    selectedId: null,
    draggingId: null,
    dragOffset: { x: 0, y: 0 },
    connectingId: null,
    mouse: { x: 0, y: 0 },
    wizardStep: 1,
    selectedTemplate: null,

    // Getters
    getJob(id) {
        return this.jobs.find(j => j.internalId === id);
    },

    getSelectedJob() {
        return this.selectedId ? this.getJob(this.selectedId) : null;
    },

    getAllJobs() {
        return this.jobs;
    },

    getConnections() {
        return this.connections;
    },

    // Setters
    setPlatform(platform) {
        this.platform = platform;
    },

    setSelectedId(id) {
        this.selectedId = id;
    },

    setDraggingId(id) {
        this.draggingId = id;
    },

    setConnectingId(id) {
        this.connectingId = id;
    },

    updateMouse(x, y) {
        this.mouse = { x, y };
    },

    updateDragOffset(x, y) {
        this.dragOffset = { x, y };
    },

    // Job operations
    addJob(job) {
        this.jobs.push(job);
    },

    removeJob(id) {
        this.jobs = this.jobs.filter(j => j.internalId !== id);
        this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
    },

    updateJobPosition(id, x, y) {
        const job = this.getJob(id);
        if (job) {
            job.x = x;
            job.y = y;
        }
    },

    // Connection operations
    addConnection(from, to) {
        if (!this.connections.some(c => c.from === from && c.to === to)) {
            this.connections.push({ from, to });
            return true;
        }
        return false;
    },

    removeConnection(from, to) {
        this.connections = this.connections.filter(c => !(c.from === from && c.to === to));
    },

    clearConnections() {
        this.connections = [];
    },

    // Stage operations
    addStage(stage) {
        if (!this.pipeline.stages.includes(stage)) {
            this.pipeline.stages.push(stage);
            return true;
        }
        return false;
    },

    removeStage(index) {
        if (this.pipeline.stages.length <= 1) return false;
        const removed = this.pipeline.stages[index];
        this.pipeline.stages.splice(index, 1);
        // Update jobs that used this stage
        this.jobs.forEach(j => {
            if (j.stage === removed) {
                j.stage = this.pipeline.stages[0];
            }
        });
        return true;
    },

    // Pipeline operations
    updatePipelineTriggers(push, pr) {
        this.pipeline.triggers.push = push;
        this.pipeline.triggers.pr = pr;
    },

    updatePipelineBranch(branch) {
        this.pipeline.branch = branch;
    },

    // Reset operations
    reset() {
        this.jobs = [];
        this.connections = [];
        this.selectedId = null;
        this.draggingId = null;
        this.connectingId = null;
    },

    // Export/Import state
    exportState() {
        return {
            version: "17.0",
            platform: this.platform,
            pipeline: JSON.parse(JSON.stringify(this.pipeline)),
            jobs: JSON.parse(JSON.stringify(this.jobs)),
            connections: JSON.parse(JSON.stringify(this.connections)),
            nextId: this.nextId
        };
    },

    importState(data) {
        this.platform = data.platform || 'github';
        this.pipeline = data.pipeline || this.pipeline;
        this.jobs = data.jobs || [];
        this.connections = data.connections || [];
        this.nextId = data.nextId || 100;
    },

    // Wizard operations
    setWizardStep(step) {
        this.wizardStep = step;
    },

    setSelectedTemplate(template) {
        this.selectedTemplate = template;
    }
};

// Make it available globally
window.AppState = AppState;
