/**
 * Project Manager Module
 * Handles project save, load, and import operations
 */

const ProjectManager = {
    /**
     * Save project to JSON file
     */
    saveProject() {
        const data = AppState.exportState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pipeline-project-${Date.now()}.json`;
        a.click();
    },

    /**
     * Load project from JSON file
     */
    loadProject(input) {
        if (!input.files[0]) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.restoreProject(data);
                alert('Project loaded successfully!');
            } catch (err) {
                alert("Invalid Project File");
                console.error(err);
            }
        };
        reader.readAsText(input.files[0]);
        input.value = '';
    },

    /**
     * Restore project from data
     */
    restoreProject(data) {
        UIManager.clearAll();

        // Import state
        AppState.importState(data);

        // Update platform
        PlatformManager.setPlatform(AppState.platform);

        // Update UI controls
        document.getElementById('target-branch').value = AppState.pipeline.branch;
        document.getElementById('trig-push').checked = AppState.pipeline.triggers.push;
        document.getElementById('trig-pr').checked = AppState.pipeline.triggers.pr;

        // Render stages
        StageManager.renderStageList();

        // Render jobs
        AppState.getAllJobs().forEach(job => {
            NodeRenderer.renderNode(job);
        });

        // Draw connections
        ConnectionManager.drawLines();

        // Update UI
        UIManager.checkEmptyState();
        YamlGenerator.updateYaml();
        Validation.updateValidation();
    },

    /**
     * Import YAML file and convert to visual pipeline
     */
    importYamlFile(input) {
        if (!input.files[0]) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = jsyaml.load(e.target.result);
                this.convertYamlToProject(parsed);
                alert("Import successful!");
            } catch (err) {
                alert("Could not parse YAML. Ensure it is valid.");
                console.error(err);
            }
        };
        reader.readAsText(input.files[0]);
        input.value = '';
    },

    /**
     * Convert YAML configuration to visual project
     */
    convertYamlToProject(parsed) {
        UIManager.clearAll();

        // Detect platform
        if (parsed.stages || parsed.image || (parsed[Object.keys(parsed)[0]] && parsed[Object.keys(parsed)[0]].stage)) {
            PlatformManager.setPlatform('gitlab');
        } else {
            PlatformManager.setPlatform('github');
        }

        // Extract job keys
        const jobKeys = Object.keys(parsed.jobs || parsed).filter(k =>
            k !== 'stages' && k !== 'variables' && k !== 'on' && k !== 'name'
        );

        let yPos = 50;
        let xPos = 50;
        const yamlIdToInternalId = {};

        // Create jobs
        jobKeys.forEach((key, idx) => {
            const jData = (parsed.jobs && parsed.jobs[key]) || parsed[key];
            const internalId = 'node_' + Date.now() + idx;
            const isExternal = !!(jData.uses || (typeof jData === 'string'));

            let jobStage = jData.stage || AppState.pipeline.stages[0];

            const newJob = {
                internalId: internalId,
                yamlId: key,
                name: jData.name || key,
                os: jData['runs-on'] || jData.image || 'ubuntu-latest',
                stage: jobStage,
                category: 'none',
                isExternal: isExternal,
                externalPath: isExternal ? (jData.uses || jData) : '',
                x: xPos,
                y: yPos,
                steps: [],
                envVars: [],
                artifacts: [],
                matrix: null,
                retry: null
            };

            yamlIdToInternalId[key] = internalId;

            xPos += 260;
            if (xPos > 1000) {
                xPos = 50;
                yPos += 150;
            }

            // Extract steps for GitHub Actions
            if (jData.steps) {
                jData.steps.forEach(s => {
                    let type = 'run';
                    let val = s.run || '';

                    if (s.uses && s.uses.includes('checkout')) {
                        type = 'checkout';
                        val = '';
                    } else if (s.uses) {
                        type = 'action';
                        val = s.uses;
                    }

                    newJob.steps.push({
                        name: s.name || 'Step',
                        type,
                        val
                    });
                });
            }
            // Extract script for GitLab CI
            else if (jData.script) {
                (Array.isArray(jData.script) ? jData.script : [jData.script]).forEach(s => {
                    newJob.steps.push({
                        name: 'Script',
                        type: 'run',
                        val: s
                    });
                });
            }

            AppState.addJob(newJob);
            NodeRenderer.renderNode(newJob);
        });

        // Create connections based on dependencies
        jobKeys.forEach(key => {
            const jData = (parsed.jobs && parsed.jobs[key]) || parsed[key];
            const childId = yamlIdToInternalId[key];

            if (jData.needs) {
                const needs = Array.isArray(jData.needs) ? jData.needs : [jData.needs];
                needs.forEach(parentKey => {
                    const parentId = yamlIdToInternalId[parentKey];
                    if (parentId && childId) {
                        AppState.addConnection(parentId, childId);
                    }
                });
            }
        });

        // Import stages if available
        if (parsed.stages) {
            AppState.pipeline.stages = parsed.stages;
        }

        StageManager.renderStageList();
        ConnectionManager.drawLines();
        UIManager.checkEmptyState();
        YamlGenerator.updateYaml();
        Validation.updateValidation();
    }
};

// Make it available globally
window.ProjectManager = ProjectManager;
