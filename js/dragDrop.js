/**
 * Drag and Drop Module
 * Handles dragging nodes around the canvas
 */

const DragDrop = {
    container: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.setupEventListeners();
    },

    /**
     * Start dragging a node
     */
    startDrag(event, id) {
        // Don't drag if clicking on a port
        if (event.target.classList.contains('port')) return;

        AppState.setDraggingId(id);
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();

        AppState.updateDragOffset(
            event.clientX - r.left,
            event.clientY - r.top
        );
    },

    /**
     * Handle mouse move for dragging and connection preview
     */
    handleMouseMove(event) {
        const r = this.container.getBoundingClientRect();
        const mouseX = event.clientX - r.left;
        const mouseY = event.clientY - r.top;

        AppState.updateMouse(mouseX, mouseY);

        // Handle node dragging
        if (AppState.draggingId) {
            const job = AppState.getJob(AppState.draggingId);
            if (job) {
                const newX = mouseX - AppState.dragOffset.x;
                const newY = mouseY - AppState.dragOffset.y;

                AppState.updateJobPosition(AppState.draggingId, newX, newY);
                NodeRenderer.updateNodePosition(AppState.draggingId, newX, newY);
                ConnectionManager.drawLines();
            }
        }

        // Handle connection preview
        if (AppState.connectingId) {
            ConnectionManager.drawLines();
        }
    },

    /**
     * Handle mouse up to stop dragging
     */
    handleMouseUp() {
        AppState.setDraggingId(null);
        AppState.setConnectingId(null);
        ConnectionManager.drawLines();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }
};

// Make it available globally
window.DragDrop = DragDrop;
