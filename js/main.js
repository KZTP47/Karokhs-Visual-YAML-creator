/**
 * Main Initialization Module
 * Initializes all components and sets up the application
 */

// Global function aliases for HTML onclick handlers
function addJob() { JobManager.addJob(); }
function addExternalJob() { JobManager.addExternalJob(); }
function deleteJob() { JobManager.deleteJob(); }
function addStep() { JobManager.addStep(); }
function removeStep(i) { JobManager.removeStep(i); }
function updateStepValue(i, f, v) { JobManager.updateStepValue(i, f, v); }
function addEnvVar() { JobManager.addEnvVar(); }
function updateEnvVar(i, f, v) { JobManager.updateEnvVar(i, f, v); }
function removeEnvVar(i) { JobManager.removeEnvVar(i); }
function addArtifact() { JobManager.addArtifact(); }
function updateArtifact(i, v) { JobManager.updateArtifact(i, v); }
function removeArtifact(i) { JobManager.removeArtifact(i); }
function addMatrixVar() { JobManager.addMatrixVar(); }
function updateMatrixKey(input, oldKey) { JobManager.updateMatrixKey(input, oldKey); }
function updateMatrixValues(key, value) { JobManager.updateMatrixValues(key, value); }
function removeMatrixVar(key) { JobManager.removeMatrixVar(key); }
function updateJobMatrix() { JobManager.updateJobMatrix(); }
function updateJobRetry() { JobManager.updateJobRetry(); }
function updateJobName(v) { JobManager.updateJobName(v); }
function updateJobOS(v) { JobManager.updateJobOS(v); }
function updateJobStage(v) { JobManager.updateJobStage(v); }
function updateJobCategory(v) { JobManager.updateJobCategory(v); }
function updateJobExternalPath(v) { JobManager.updateJobExternalPath(v); }

function addNewStage() { StageManager.addNewStage(); }
function removeStage(i) { StageManager.removeStage(i); }
function updateGlobal() { StageManager.updatePipelineSettings(); }

function openWizard() { Wizard.openWizard(); }
function closeWizard() { Wizard.closeWizard(); }
function wizardNext() { Wizard.wizardNext(); }
function wizardBack() { Wizard.wizardBack(); }
function wizardFinish() { Wizard.wizardFinish(); }

function toggleSuggestions() { Suggestions.toggleSuggestions(); }

function saveProject() { ProjectManager.saveProject(); }
function loadProject(input) { ProjectManager.loadProject(input); }
function importYamlFile(input) { ProjectManager.importYamlFile(input); }

function autoLayout() { LayoutManager.autoLayout(); }

function handleCanvasClick(e) { UIManager.handleCanvasClick(e); }
function switchTab(t) { UIManager.switchTab(t); }
function toggleSettings() { UIManager.toggleSettings(); }
function setTheme(t) { UIManager.setTheme(t); }
function setBackground(input) { UIManager.setBackground(input); }
function resetBackground() { UIManager.resetBackground(); }
function toggleCollapsible(header) { UIManager.toggleCollapsible(header); }
function clearAll() { UIManager.clearAll(); }

function setPlatform(p) { PlatformManager.setPlatform(p); }

function simulatePipeline() { Simulator.simulatePipeline(); }

function exportYaml() { YamlGenerator.exportYaml(); }
function copyYaml() { YamlGenerator.copyYaml(); }

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] PipelinePro initializing...');

    // Initialize all modules
    NodeRenderer.init('graph-container');
    ConnectionManager.init('svg-layer', 'graph-container');
    DragDrop.init('graph-container');

    // Initial UI setup
    StageManager.renderStageList();
    UIManager.checkEmptyState();
    YamlGenerator.updateYaml();
    Validation.updateValidation();

    console.log('[INIT] PipelinePro initialized successfully!');
});
