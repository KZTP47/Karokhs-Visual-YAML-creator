/**
 * Node Renderer Module
 * Handles rendering and visual updates of job nodes
 */

const NodeRenderer = {
    container: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
    },

    /**
     * Get shortened OS name for display
     */
    getOSShortName(os) {
        if (os.includes('ubuntu')) return 'Ubuntu';
        if (os.includes('windows')) return 'Windows';
        if (os.includes('macos')) return 'macOS';
        if (os.includes('node')) return 'Node.js';
        if (os.includes('python')) return 'Python';
        return os.split(':')[0];
    },

    /**
     * Render a job node on the canvas
     */
    renderNode(job) {
        const el = document.createElement('div');
        el.className = `node ${job.isExternal ? 'external' : ''} ${job.category ? 'test-' + job.category : ''}`;
        el.id = job.internalId;
        el.style.left = job.x + 'px';
        el.style.top = job.y + 'px';

        // Set up event handlers
        el.onmousedown = (e) => DragDrop.startDrag(e, job.internalId);
        el.onclick = (e) => {
            e.stopPropagation();
            JobManager.selectJob(job.internalId);
        };

        let content = '';
        if (job.isExternal) {
            content = `
                <div class="node-header">
                    <span class="lbl-name">${job.name}</span>
                    <i class="fas fa-link"></i>
                </div>
                <div class="node-body" style="font-size:11px; color:#666; font-style:italic;">
                    External pipeline import
                </div>`;
        } else {
            const categoryBadge = job.category && job.category !== 'none' ?
                `<div class="test-category-badge ${job.category}">
                    ${job.category === 'unit' ? 'Unit' : job.category === 'integration' ? 'Integration' : 'E2E'}
                </div>` : '';

            content = `
                <div class="node-header">
                    <span class="lbl-name">${job.name}</span>
                    <i class="lbl-icon fas fa-server"></i>
                </div>
                <div class="node-body">
                    ${categoryBadge}
                    <div class="stage-badge lbl-stage">${job.stage || 'Build'}</div>
                    <div style="display:flex; gap:5px; flex-wrap: wrap;">
                        <div class="chip"><i class="fas fa-server"></i> <span class="lbl-os">${this.getOSShortName(job.os)}</span></div>
                        <div class="chip"><i class="fas fa-list-ol"></i> <span class="lbl-steps">${job.steps.length}</span></div>
                        ${job.matrix ? '<div class="chip"><i class="fas fa-table"></i> Matrix</div>' : ''}
                        ${job.artifacts && job.artifacts.length > 0 ? '<div class="chip"><i class="fas fa-archive"></i> Artifacts</div>' : ''}
                    </div>
                </div>`;
        }

        el.innerHTML = `
            <div class="port input" onmouseup="ConnectionManager.finishConnect('${job.internalId}')"></div>
            ${content}
            <div class="port output" onmousedown="ConnectionManager.startConnect(event, '${job.internalId}')"></div>
        `;

        this.container.appendChild(el);
    },

    /**
     * Update node's visual appearance
     */
    updateNodeName(id, name) {
        const el = document.getElementById(id);
        if (el) {
            const nameLabel = el.querySelector('.lbl-name');
            if (nameLabel) nameLabel.innerText = name;
        }
    },

    updateNodeStage(id, stage) {
        const el = document.getElementById(id);
        if (el) {
            const stageLabel = el.querySelector('.lbl-stage');
            if (stageLabel) stageLabel.innerText = stage;
        }
    },

    updateNodeOS(id, os) {
        const el = document.getElementById(id);
        if (el) {
            const osLabel = el.querySelector('.lbl-os');
            if (osLabel) osLabel.innerText = this.getOSShortName(os);
        }
    },

    updateNodeSteps(id, stepsCount) {
        const el = document.getElementById(id);
        if (el) {
            const stepsLabel = el.querySelector('.lbl-steps');
            if (stepsLabel) stepsLabel.innerText = stepsCount;
        }
    },

    /**
     * Re-render a node (used when category changes)
     */
    rerenderNode(job) {
        const oldEl = document.getElementById(job.internalId);
        if (oldEl) {
            oldEl.remove();
        }
        this.renderNode(job);
        if (AppState.selectedId === job.internalId) {
            document.getElementById(job.internalId).classList.add('selected');
        }
    },

    /**
     * Remove a node from the canvas
     */
    removeNode(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    /**
     * Select a node visually
     */
    selectNode(id) {
        // Remove previous selection
        if (AppState.selectedId) {
            const prevEl = document.getElementById(AppState.selectedId);
            if (prevEl) prevEl.classList.remove('selected');
        }

        // Add new selection
        if (id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('selected');
        }
    },

    /**
     * Update node position
     */
    updateNodePosition(id, x, y) {
        const el = document.getElementById(id);
        if (el) {
            el.style.left = x + 'px';
            el.style.top = y + 'px';
        }
    },

    /**
     * Add error styling to nodes with duplicate names
     */
    markNodeAsError(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('error');
    },

    /**
     * Remove error styling from node
     */
    clearNodeError(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('error');
    },

    /**
     * Clear all error states
     */
    clearAllErrors() {
        document.querySelectorAll('.node').forEach(el => el.classList.remove('error'));
    },

    /**
     * Add running animation to node
     */
    markNodeAsRunning(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('running');
    },

    /**
     * Remove running animation from node
     */
    clearNodeRunning(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('running');
    },

    /**
     * Mark node as completed
     */
    markNodeAsDone(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('running');
            el.classList.add('done');
        }
    },

    /**
     * Clear all running/done states
     */
    clearAllStates() {
        document.querySelectorAll('.node').forEach(n => {
            n.classList.remove('running', 'done');
        });
    }
};

// Make it available globally
window.NodeRenderer = NodeRenderer;
