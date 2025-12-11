/**
 * Simulation Module
 * Simulates pipeline execution with visual feedback
 */

const Simulator = {
    isRunning: false,

    /**
     * Run pipeline simulation
     */
    async simulatePipeline() {
        const jobs = AppState.getAllJobs();
        if (jobs.length === 0 || this.isRunning) return;

        this.isRunning = true;

        // Clear previous simulation states
        NodeRenderer.clearAllStates();

        // Find root nodes (jobs with no dependencies)
        const connections = AppState.getConnections();
        const roots = jobs.filter(j =>
            !connections.some(c => c.to === j.internalId)
        );

        // Simulate execution
        try {
            await Promise.all(roots.map(r => this.runJob(r.internalId)));
            alert('Simulation completed successfully!');
        } catch (error) {
            alert('Simulation encountered an error');
        } finally {
            this.isRunning = false;
        }
    },

    /**
     * Simulate running a single job
     */
    async runJob(jobId) {
        // Mark as running
        NodeRenderer.markNodeAsRunning(jobId);

        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mark as done
        NodeRenderer.markNodeAsDone(jobId);

        // Run dependent jobs
        const connections = AppState.getConnections();
        const children = connections
            .filter(c => c.from === jobId)
            .map(c => c.to);

        if (children.length > 0) {
            await Promise.all(children.map(childId => this.runJob(childId)));
        }
    },

    /**
     * Stop simulation
     */
    stopSimulation() {
        this.isRunning = false;
        NodeRenderer.clearAllStates();
    }
};

// Make it available globally
window.Simulator = Simulator;
