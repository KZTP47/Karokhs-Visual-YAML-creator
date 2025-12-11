/**
 * Connection Manager Module
 * Handles drawing and managing connections between nodes
 */

const ConnectionManager = {
    svgLayer: null,
    container: null,

    init(svgLayerId, containerId) {
        this.svgLayer = document.getElementById(svgLayerId);
        this.container = document.getElementById(containerId);
    },

    /**
     * Start creating a connection from a node
     */
    startConnect(event, id) {
        event.stopPropagation();
        AppState.setConnectingId(id);
    },

    /**
     * Finish creating a connection to a node
     */
    finishConnect(targetId) {
        const sourceId = AppState.connectingId;
        if (sourceId && sourceId !== targetId) {
            if (AppState.addConnection(sourceId, targetId)) {
                this.drawLines();
                YamlGenerator.updateYaml();
                Validation.updateValidation();
            }
        }
        AppState.setConnectingId(null);
    },

    /**
     * Get port position for drawing lines
     */
    getPortPos(id, type) {
        const el = document.getElementById(id);
        if (!el) return null;

        const r = el.getBoundingClientRect();
        const c = this.container.getBoundingClientRect();

        return {
            x: (r.left - c.left) + r.width / 2,
            y: (r.top - c.top) + (type === 'output' ? r.height : 0)
        };
    },

    /**
     * Draw a bezier curve between two points
     */
    drawBezier(start, end, color, dashed = false) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cp1 = { x: start.x, y: start.y + 60 };
        const cp2 = { x: end.x, y: end.y - 60 };

        path.setAttribute('d', `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        if (dashed) path.setAttribute('stroke-dasharray', '5,5');

        this.svgLayer.appendChild(path);
    },

    /**
     * Draw all connections
     */
    drawLines() {
        if (!this.svgLayer) return;

        // Clear existing lines
        this.svgLayer.innerHTML = '';

        const color = AppState.platform === 'gitlab' ? '#fc6d26' : '#6b7280';

        // Draw established connections
        AppState.connections.forEach(c => {
            const start = this.getPortPos(c.from, 'output');
            const end = this.getPortPos(c.to, 'input');
            if (start && end) {
                this.drawBezier(start, end, color);
            }
        });

        // Draw temporary connection being created
        if (AppState.connectingId) {
            const start = this.getPortPos(AppState.connectingId, 'output');
            if (start) {
                this.drawBezier(start, AppState.mouse, color, true);
            }
        }
    },

    /**
     * Remove a specific connection
     */
    removeConnection(from, to) {
        AppState.removeConnection(from, to);
        this.drawLines();
    },

    /**
     * Clear all connections
     */
    clearAllConnections() {
        AppState.clearConnections();
        this.drawLines();
    }
};

// Make it available globally
window.ConnectionManager = ConnectionManager;
