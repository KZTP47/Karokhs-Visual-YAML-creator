const SnapshotGallery = {
    snapshots: [],
    maxSnapshots: 10,

    init() {
        console.log("SnapshotGallery initialized");
        this.loadSnapshots();
        this.injectButtons();
    },

    loadSnapshots() {
        const data = localStorage.getItem('pipelinepro_snapshots');
        this.snapshots = data ? JSON.parse(data) : [];
    },

    saveSnapshots() {
        localStorage.setItem('pipelinepro_snapshots', JSON.stringify(this.snapshots));
    },

    injectButtons() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            // Save Snapshot Button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'secondary icon-btn';
            saveBtn.title = 'Save a snapshot of the current pipeline';
            saveBtn.innerHTML = '<i class="fas fa-camera"></i>';
            saveBtn.onclick = () => this.saveSnapshot();
            
            // Browse Snapshots Button
            const browseBtn = document.createElement('button');
            browseBtn.className = 'secondary icon-btn';
            browseBtn.title = 'Browse saved snapshots';
            browseBtn.innerHTML = '<i class="fas fa-images"></i>';
            browseBtn.onclick = () => this.openGallery();

            // Insert before the settings button
            const settingsBtn = toolbar.querySelector('button[onclick="toggleSettings()"]');
            if (settingsBtn) {
                settingsBtn.before(saveBtn);
                settingsBtn.before(browseBtn);
            } else {
                toolbar.appendChild(saveBtn);
                toolbar.appendChild(browseBtn);
            }
        }
    },

    saveSnapshot() {
        if (this.snapshots.length >= this.maxSnapshots) {
            if (!confirm(`You have reached the limit of ${this.maxSnapshots} snapshots. Would you like to overwrite the oldest one?`)) {
                return;
            }
            this.snapshots.pop();
        }

        const name = prompt("Enter a name for this snapshot:", `Snapshot ${this.snapshots.length + 1}`);
        if (!name) return;

        const snapshot = {
            id: 'snap_' + Date.now(),
            name: name,
            timestamp: new Date().toISOString(),
            jobCount: window.AppState.jobs.length,
            state: window.AppState.exportState()
        };

        this.snapshots.unshift(snapshot);
        this.saveSnapshots();
        
        if (window.showNotification) window.showNotification(`Snapshot "${name}" saved!`, "success");
    },

    openGallery() {
        const overlay = document.createElement('div');
        overlay.className = 'recipe-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.closeGallery(); };

        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        modal.style.maxWidth = '600px';
        modal.innerHTML = `
            <div class="recipe-modal-header">
                <h2>Snapshot Gallery</h2>
                <span class="recipe-modal-close" onclick="SnapshotGallery.closeGallery()" style="cursor:pointer; font-size:24px;">&times;</span>
            </div>
            <div class="snapshot-list" id="snapshot-list"></div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.modal = overlay;

        this.renderSnapshots();
    },

    renderSnapshots() {
        const container = document.getElementById('snapshot-list');
        if (!container) return;

        if (this.snapshots.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">No snapshots saved yet. Click the camera icon in the toolbar to save your first one!</div>';
            return;
        }

        container.innerHTML = '';
        this.snapshots.forEach(snap => {
            const card = document.createElement('div');
            card.className = 'snapshot-card';
            
            const date = new Date(snap.timestamp).toLocaleString();
            
            card.innerHTML = `
                <div class="snapshot-info">
                    <div class="snapshot-name">${snap.name}</div>
                    <div class="snapshot-meta">${date} &bull; ${snap.jobCount} Jobs</div>
                </div>
                <div class="snapshot-actions">
                    <button class="snapshot-btn snapshot-btn-restore" onclick="SnapshotGallery.restoreSnapshot('${snap.id}')">Restore</button>
                    <button class="snapshot-btn snapshot-btn-delete" onclick="SnapshotGallery.deleteSnapshot('${snap.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    closeGallery() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    },

    restoreSnapshot(id) {
        const snap = this.snapshots.find(s => s.id === id);
        if (!snap) return;

        if (!confirm(`Are you sure you want to restore "${snap.name}"? Your current pipeline will be replaced.`)) {
            return;
        }

        this.closeGallery();

        // 1. Clear Canvas
        if (window.UIManager && window.UIManager.clearAll) {
            window.UIManager.clearAll();
        }

        // 2. Import State
        if (window.ProjectManager && window.ProjectManager.restoreProject) {
            window.ProjectManager.restoreProject(snap.state);
        } else {
            // Fallback if ProjectManager is not available
            window.AppState.importState(snap.state);
            
            // Render all jobs
            window.AppState.jobs.forEach(function(job) {
                if (window.NodeRenderer) window.NodeRenderer.renderNode(job);
            });
        }

        // 3. Finalize restoration and ensure UI reflects new state
        setTimeout(() => {
            if (window.ConnectionManager && window.ConnectionManager.drawLines) {
                window.ConnectionManager.drawLines();
            }
            if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
                window.YamlGenerator.updateYaml();
            }
            if (window.PlatformManager && window.PlatformManager.updateUI) {
                window.PlatformManager.updateUI();
            }
            if (window.EnhancedUI && window.EnhancedUI.saveState) {
                window.EnhancedUI.saveState('Restored snapshot: ' + snap.name);
            }
            
            if (window.showNotification) {
                window.showNotification(`Restored: ${snap.name}`, "success");
            }
        }, 150);
    },

    deleteSnapshot(id) {
        if (!confirm("Delete this snapshot?")) return;
        
        this.snapshots = this.snapshots.filter(s => s.id !== id);
        this.saveSnapshots();
        this.renderSnapshots();
        
        if (window.showNotification) window.showNotification("Snapshot deleted.", "info");
    }
};

window.SnapshotGallery = SnapshotGallery;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => SnapshotGallery.init(), 3100);
});
