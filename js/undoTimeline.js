const UndoTimeline = {
    history: [],
    maxHistory: 10,

    init() {
        console.log("UndoTimeline initialized");
        this.injectButton();
        this.hookSaveState();
    },

    injectButton() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Find the undo/redo buttons in the toolbar
        // The undo/redo buttons are standard icon-btn class
        // I'll look for buttons with specific titles if possible
        const undoBtn = Array.from(toolbar.querySelectorAll('button')).find(b => b.title === 'Undo (Ctrl+Z)');
        if (!undoBtn) return;

        const container = document.createElement('div');
        container.className = 'undo-history-container';
        container.style.position = 'relative';
        container.style.display = 'inline-block';

        const dropdownBtn = document.createElement('button');
        dropdownBtn.className = 'secondary icon-btn undo-history-btn';
        dropdownBtn.innerHTML = '<i class="fas fa-history"></i>';
        dropdownBtn.title = "View recent changes";
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        };

        undoBtn.parentNode.insertBefore(container, undoBtn.nextSibling);
        container.appendChild(dropdownBtn);
    },

    hookSaveState() {
        if (window.EnhancedUI && window.EnhancedUI.saveState) {
            const original = window.EnhancedUI.saveState;
            window.EnhancedUI.saveState = function(label) {
                original.apply(this, arguments);
                
                const guessedLabel = label || UndoTimeline.guessActionLabel();
                // Capture the actual history index AFTER saveState has pushed
                const currentIndex = window.EnhancedUI.historyIndex;
                UndoTimeline.recordAction(guessedLabel, currentIndex);
            };
        }
    },

    guessActionLabel() {
        // Logic to determine what changed since last state
        // This is tricky without access to previous state here, 
        // but we can look at what was likely changed.
        if (window.AppState) {
            if (window.AppState.selectedId) return "Modified Job Settings";
            return "Changed Pipeline Configuration";
        }
        return "Manual Change";
    },

    recordAction(label, stateIndex) {
        this.history.unshift({
            label: label,
            time: new Date(),
            stateIndex: (typeof stateIndex === 'number') ? stateIndex : (window.EnhancedUI ? window.EnhancedUI.historyIndex : 0)
        });

        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    },

    toggleDropdown() {
        let dropdown = document.getElementById('undo-history-dropdown');
        if (dropdown) {
            dropdown.remove();
            return;
        }

        dropdown = document.createElement('div');
        dropdown.id = 'undo-history-dropdown';
        dropdown.className = 'undo-timeline-dropdown';
        
        if (this.history.length === 0) {
            dropdown.innerHTML = '<div class="undo-empty">No recent changes recorded.</div>';
        } else {
            this.history.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'undo-row';
                
                const timeStr = this.formatTime(item.time);
                
                row.innerHTML = `
                    <div class="undo-content">
                        <div class="undo-label">${item.label}</div>
                        <div class="undo-time">${timeStr}</div>
                    </div>
                `;
                
                row.onclick = () => {
                    this.restoreTo(index);
                    dropdown.remove();
                };
                
                dropdown.appendChild(row);
            });
        }
        
        const btnContainer = document.querySelector('.undo-history-container');
        btnContainer.appendChild(dropdown);
        
        // Close on click outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    },

    formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds
        
        if (diff < 5) return "just now";
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    restoreTo(historyListIndex) {
        const item = this.history[historyListIndex];
        if (!item) return;
        
        console.log("Restoring to action:", item.label);
        
        if (window.EnhancedUI && window.EnhancedUI.history && typeof item.stateIndex === 'number') {
            // Directly set the history index and restore that state
            if (item.stateIndex >= 0 && item.stateIndex < window.EnhancedUI.history.length) {
                window.EnhancedUI.historyIndex = item.stateIndex;
                window.EnhancedUI.restoreState(window.EnhancedUI.history[item.stateIndex]);
                
                if (typeof EnhancedUI !== 'undefined') {
                    EnhancedUI.showNotification('Restored to: ' + item.label, 'info');
                }
            }
        }
    }
};

window.UndoTimeline = UndoTimeline;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        UndoTimeline.init();
    }, 1100);
});
