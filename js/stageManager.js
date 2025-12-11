/**
 * Stage Manager Module
 * Handles pipeline stage configuration
 */

const StageManager = {
    /**
     * Render the stage list in the UI
     */
    renderStageList() {
        const list = document.getElementById('stage-list-container');
        list.innerHTML = '';

        AppState.pipeline.stages.forEach((stage, i) => {
            const div = document.createElement('div');
            div.className = 'stage-item';
            div.innerHTML = `
                <span>${i + 1}. ${stage}</span>
                <i class="fas fa-times" onclick="StageManager.removeStage(${i})" style="cursor: pointer;"></i>
            `;
            list.appendChild(div);
        });

        // Update job stage dropdown
        const dropdown = document.getElementById('job-stage');
        const currentValue = dropdown.value;
        dropdown.innerHTML = '';

        AppState.pipeline.stages.forEach(stage => {
            const option = document.createElement('option');
            option.value = stage;
            option.innerText = stage.toUpperCase();
            dropdown.appendChild(option);
        });

        if (currentValue && AppState.pipeline.stages.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    },

    /**
     * Add a new stage
     */
    addNewStage() {
        const input = document.getElementById('new-stage-input');
        const value = input.value.trim().toLowerCase();

        if (value && !AppState.pipeline.stages.includes(value)) {
            AppState.pipeline.stages.push(value);
            input.value = '';
            this.renderStageList();
            YamlGenerator.updateYaml();
        }
    },

    /**
     * Remove a stage
     */
    removeStage(index) {
        if (AppState.pipeline.stages.length <= 1) {
            alert("Pipeline must have at least one stage");
            return;
        }

        const removed = AppState.pipeline.stages[index];
        AppState.pipeline.stages.splice(index, 1);

        // Update jobs that used this stage
        AppState.getAllJobs().forEach(job => {
            if (job.stage === removed) {
                job.stage = AppState.pipeline.stages[0];
            }
        });

        this.renderStageList();
        YamlGenerator.updateYaml();
    },

    /**
     * Update pipeline settings
     */
    updatePipelineSettings() {
        AppState.pipeline.triggers.push = document.getElementById('trig-push').checked;
        AppState.pipeline.triggers.pr = document.getElementById('trig-pr').checked;
        AppState.pipeline.branch = document.getElementById('target-branch').value || 'main';
        YamlGenerator.updateYaml();
    }
};

// Make it available globally
window.StageManager = StageManager;
