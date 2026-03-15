const StepReorder = {
    draggedIndex: null,

    init() {
        console.log("StepReorder initialized");
        this.hookRenderSteps();
    },

    hookRenderSteps() {
        if (window.JobManager && window.JobManager.renderStepsList) {
            const originalRender = window.JobManager.renderStepsList;
            window.JobManager.renderStepsList = function() {
                originalRender.apply(this, arguments);
                StepReorder.makeSortable();
            };
        }
    },

    makeSortable() {
        const list = document.getElementById('steps-list');
        if (!list) return;

        const cards = list.querySelectorAll('.step-card');
        cards.forEach((card, index) => {
            // Add drag handle if not already there
            if (!card.querySelector('.step-drag-handle')) {
                const handle = document.createElement('div');
                handle.className = 'step-drag-handle';
                handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
                card.insertBefore(handle, card.firstChild);
            }

            card.setAttribute('draggable', 'true');
            card.setAttribute('data-index', index);

            card.ondragstart = (e) => {
                this.draggedIndex = index;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            };

            card.ondragend = () => {
                card.classList.remove('dragging');
                this.removeIndicator();
            };

            card.ondragover = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.showIndicator(card, e.clientY);
            };

            card.ondrop = (e) => {
                e.preventDefault();
                const targetIndex = this.getTargetIndex(card, e.clientY);
                if (this.draggedIndex !== targetIndex) {
                    this.moveStep(this.draggedIndex, targetIndex);
                }
            };
        });
    },

    showIndicator(card, mouseY) {
        this.removeIndicator();
        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        const indicator = document.createElement('div');
        indicator.className = 'step-drop-indicator';
        
        if (mouseY < midpoint) {
            card.parentNode.insertBefore(indicator, card);
        } else {
            card.parentNode.insertBefore(indicator, card.nextSibling);
        }
    },

    removeIndicator() {
        document.querySelectorAll('.step-drop-indicator').forEach(el => el.remove());
    },

    getTargetIndex(card, mouseY) {
        let index = parseInt(card.getAttribute('data-index'));
        const rect = card.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (mouseY > midpoint) {
            index++;
        }
        
        // If we are moving forward, the target index shifts down after removal
        if (this.draggedIndex < index) {
            index--;
        }
        
        return index;
    },

    moveStep(fromIndex, toIndex) {
        const job = window.AppState.getJob(window.AppState.selectedId);
        if (!job) return;

        const step = job.steps.splice(fromIndex, 1)[0];
        job.steps.splice(toIndex, 0, step);

        // Refresh UI
        window.JobManager.renderStepsList(job);
        window.YamlGenerator.updateYaml();
        
        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            window.EnhancedUI.saveState();
        }

        if (window.showNotification) {
            window.showNotification("Step reordered", "info");
        }
    }
};

window.StepReorder = StepReorder;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => StepReorder.init(), 1500);
});
