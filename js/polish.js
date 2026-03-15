const Polish = {
    init() {
        console.log("Polish & Accessibility initialized");
        this.addAriaLabels();
        this.addSettingsOptions();
        this.improveEmptyState();
        this.addKeyboardShortcutsHelp();
    },

    addAriaLabels() {
        // Find icon-only buttons
        const iconButtons = document.querySelectorAll('.icon-btn, .toolbar button, .floating-actions button');
        iconButtons.forEach(btn => {
            if (btn.title && !btn.getAttribute('aria-label')) {
                btn.setAttribute('aria-label', btn.title);
            }
        });
    },

    addSettingsOptions() {
        // The settings modal is #settings-modal and is toggled via UIManager.toggleSettings.
        // We inject our extra buttons directly into it on init, and they will show/hide with it.
        const settingsModal = document.getElementById('settings-modal');
        if (!settingsModal) return;
        
        // Check if already injected
        if (settingsModal.querySelector('.polish-settings-group')) return;

        const group = document.createElement('div');
        group.className = 'polish-settings-group';
        group.style.marginTop = '24px';
        group.style.paddingTop = '16px';
        group.style.borderTop = '1px solid var(--border-color)';
        
        group.innerHTML = `
            <div class="section-label" style="margin-bottom:12px;">Beginner Helper Options</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="secondary" style="flex:1; font-size:12px;" id="polish-restart-onboarding">
                    <i class="fas fa-redo"></i> Restart Onboarding
                </button>
                <button class="secondary" style="flex:1; font-size:12px;" id="polish-reenable-guided">
                    <i class="fas fa-map"></i> Re-enable Guided Mode
                </button>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top: 10px;">
                <button class="secondary" style="flex:1; font-size:12px;" id="polish-reset-tutorials">
                    <i class="fas fa-graduation-cap"></i> Reset All Tutorials
                </button>
            </div>
        `;
        
        settingsModal.appendChild(group);

        // Attach click handlers safely
        document.getElementById('polish-restart-onboarding').addEventListener('click', function() {
            if (typeof Onboarding !== 'undefined') {
                Onboarding.resetOnboarding();
            }
        });
        document.getElementById('polish-reenable-guided').addEventListener('click', function() {
            if (typeof GuidedMode !== 'undefined') {
                GuidedMode.enable();
                if (typeof EnhancedUI !== 'undefined') EnhancedUI.showNotification('Guided Mode enabled!', 'success');
            }
        });
        document.getElementById('polish-reset-tutorials').addEventListener('click', function() {
            if (typeof MicroTutorials !== 'undefined') {
                MicroTutorials.resetAll();
            }
        });
    },

    improveEmptyState() {
        const workspace = document.getElementById('graph-container');
        if (!workspace) return;

        const observer = new MutationObserver(() => {
            // :contains() is not a valid CSS selector. Use manual checking instead.
            let emptyMsg = workspace.querySelector('.empty-state-message');
            if (!emptyMsg) {
                const headings = workspace.querySelectorAll('h2');
                headings.forEach(h => {
                    if (h.textContent.includes('Get Started')) {
                        emptyMsg = h;
                    }
                });
            }
            if (emptyMsg && !workspace.querySelector('.beginner-empty-extra')) {
                const extra = document.createElement('div');
                extra.className = 'beginner-empty-extra';
                extra.style.marginTop = '20px';
                extra.style.maxWidth = '400px';
                extra.style.margin = '20px auto';
                extra.style.border = '1px solid var(--accent-color)';
                extra.style.borderRadius = '12px';
                extra.style.padding = '16px';
                extra.style.background = 'rgba(var(--accent-rgb, 59, 130, 246), 0.05)';
                
                extra.innerHTML = `
                    <p style="font-size:14px; margin-bottom:10px;"><strong>New to Pipelines?</strong></p>
                    <p style="font-size:13px; line-height:1.5; color:var(--text-secondary);">A pipeline is a sequence of automated steps that build, test, and deploy your code every time you make a change.</p>
                    <button class="onboarding-btn onboarding-btn-primary" style="padding:4px 12px; font-size:12px; margin-top:10px;" onclick="Onboarding.showOverlay()">
                        Let's walkthrough
                    </button>
                `;
                
                emptyMsg.parentNode.appendChild(extra);
            }
        });

        observer.observe(workspace, { childList: true });
    },

    addKeyboardShortcutsHelp() {
        if (window.HelpSystem && window.HelpSystem.showHelp) {
            const original = window.HelpSystem.showHelp;
            window.HelpSystem.showHelp = function() {
                original.apply(this, arguments);
                setTimeout(() => {
                    const helpModal = document.querySelector('#help-modal .modal-body');
                    if (helpModal && !helpModal.querySelector('.shortcuts-ref')) {
                        const shortcuts = document.createElement('div');
                        shortcuts.className = 'shortcuts-ref';
                        shortcuts.style.marginTop = '20px';
                        shortcuts.innerHTML = `
                            <h4>Keyboard Shortcuts</h4>
                            <ul style="font-size:13px; color:var(--text-secondary); line-height:1.8;">
                                <li><strong>Ctrl + Z:</strong> Undo</li>
                                <li><strong>Ctrl + Shift + Z:</strong> Redo</li>
                                <li><strong>Ctrl + S:</strong> Save Project</li>
                                <li><strong>Ctrl + D:</strong> Duplicate Job</li>
                                <li><strong>Delete:</strong> Remove Selected Job</li>
                                <li><strong>Esc:</strong> Deselect Everything</li>
                            </ul>
                        `;
                        helpModal.appendChild(shortcuts);
                    }
                }, 100);
            };
        }
    }
};

window.Polish = Polish;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        Polish.init();
    }, 1200);
});
