/**
 * Layout Manager Module
 * Handles automatic layout and arrangement of nodes
 */

const LayoutManager = {
    /**
     * Automatically arrange all nodes based on stages
     */
    autoLayout() {
        const jobs = AppState.getAllJobs();
        if (jobs.length === 0) return;

        // Group jobs by stage
        const stageGroups = {};
        AppState.pipeline.stages.forEach(stage => {
            stageGroups[stage] = [];
        });

        jobs.forEach(job => {
            if (!stageGroups[job.stage]) {
                stageGroups[job.stage] = [];
            }
            stageGroups[job.stage].push(job);
        });

        // Layout parameters
        let xPos = 100;
        const stageGap = 400;
        const jobGap = 180;
        const startY = 100;

        // Arrange jobs by stage
        AppState.pipeline.stages.forEach(stage => {
            const stageJobs = stageGroups[stage];
            if (stageJobs.length === 0) return;

            // Center jobs vertically within stage
            const totalHeight = (stageJobs.length - 1) * jobGap;
            const centerY = startY;

            stageJobs.forEach((job, idx) => {
                job.x = xPos;
                job.y = centerY + (idx * jobGap);

                NodeRenderer.updateNodePosition(job.internalId, job.x, job.y);
            });

            xPos += stageGap;
        });

        ConnectionManager.drawLines();
        YamlGenerator.updateYaml();
    },

    /**
     * Arrange nodes in a grid layout
     */
    gridLayout() {
        const jobs = AppState.getAllJobs();
        if (jobs.length === 0) return;

        const cols = Math.ceil(Math.sqrt(jobs.length));
        const xGap = 300;
        const yGap = 180;
        const startX = 100;
        const startY = 100;

        jobs.forEach((job, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);

            job.x = startX + (col * xGap);
            job.y = startY + (row * yGap);

            NodeRenderer.updateNodePosition(job.internalId, job.x, job.y);
        });

        ConnectionManager.drawLines();
        YamlGenerator.updateYaml();
    },

    /**
     * Arrange nodes in a circular layout
     */
    circularLayout() {
        const jobs = AppState.getAllJobs();
        if (jobs.length === 0) return;

        const centerX = 600;
        const centerY = 300;
        const radius = 250;

        jobs.forEach((job, idx) => {
            const angle = (2 * Math.PI * idx) / jobs.length;
            job.x = centerX + radius * Math.cos(angle) - 130;
            job.y = centerY + radius * Math.sin(angle) - 50;

            NodeRenderer.updateNodePosition(job.internalId, job.x, job.y);
        });

        ConnectionManager.drawLines();
        YamlGenerator.updateYaml();
    },

    /**
     * Arrange nodes hierarchically based on dependencies
     */
    hierarchicalLayout() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();
        
        if (jobs.length === 0) return;

        // Calculate levels using BFS
        const levels = {};
        const inDegree = {};
        const adj = {};

        jobs.forEach(j => {
            inDegree[j.internalId] = 0;
            adj[j.internalId] = [];
            levels[j.internalId] = 0;
        });

        connections.forEach(c => {
            adj[c.from].push(c.to);
            inDegree[c.to]++;
        });

        // Find root nodes (no dependencies)
        const queue = [];
        jobs.forEach(j => {
            if (inDegree[j.internalId] === 0) {
                queue.push(j.internalId);
            }
        });

        // BFS to assign levels
        while (queue.length > 0) {
            const nodeId = queue.shift();
            const currentLevel = levels[nodeId];

            adj[nodeId].forEach(childId => {
                levels[childId] = Math.max(levels[childId], currentLevel + 1);
                inDegree[childId]--;
                if (inDegree[childId] === 0) {
                    queue.push(childId);
                }
            });
        }

        // Group jobs by level
        const levelGroups = {};
        jobs.forEach(job => {
            const level = levels[job.internalId];
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(job);
        });

        // Layout
        const xGap = 400;
        const yGap = 180;
        const startX = 100;
        const startY = 100;

        Object.keys(levelGroups).sort((a, b) => a - b).forEach((level, levelIdx) => {
            const levelJobs = levelGroups[level];
            const x = startX + (levelIdx * xGap);

            levelJobs.forEach((job, idx) => {
                job.x = x;
                job.y = startY + (idx * yGap);
                NodeRenderer.updateNodePosition(job.internalId, job.x, job.y);
            });
        });

        ConnectionManager.drawLines();
        YamlGenerator.updateYaml();
    }
};

// Make it available globally
window.LayoutManager = LayoutManager;
