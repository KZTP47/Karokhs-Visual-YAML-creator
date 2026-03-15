const PolishV3 = {
    init() {
        console.log("PolishV3 initialized");
        this.addAriaLabels();
        this.setupEscapeHandler();
        this.setupClickOutsideAll();
        this.replaceAlerts();
        this.enhanceEmptyState();
        this.setupAccessibilityFocus();
    },

    /**
     * Ensure every interactive element has an ARIA label for screen readers
     */
    addAriaLabels() {
        // Run once now and then on a timer to catch dynamic elements
        const apply = () => {
            const elements = document.querySelectorAll('button, input, select, textarea');
            elements.forEach(el => {
                if (!el.getAttribute('aria-label')) {
                    const label = el.title || el.placeholder || el.innerText || el.className;
                    if (label && typeof label === 'string' && label.length > 2) {
                        el.setAttribute('aria-label', label.trim());
                    }
                }
            });
        };
        
        apply();
        setInterval(apply, 5000);
    },

    /**
     * Topmost Escape handler to close panels in the correct order
     */
    setupEscapeHandler() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Check in order of priority (z-index)
                const priorities = [
                    () => { if (window.CommandPalette && window.CommandPalette.active) { window.CommandPalette.close(); return true; } },
                    () => { var eg = document.getElementById('export-guide-modal'); if (eg) { eg.remove(); return true; } },
                    () => { var ex = document.getElementById('explainer-modal'); if (ex) { ex.remove(); return true; } },
                    () => { if (document.querySelector('.recipe-modal-overlay')) { document.querySelector('.recipe-modal-overlay').remove(); return true; } },
                    () => { if (window.ActionCatalog && window.ActionCatalog.panel) { window.ActionCatalog.close(); return true; } },
                    () => { if (document.getElementById('preflight-overlay')) { document.getElementById('preflight-overlay').remove(); return true; } },
                    () => { if (document.getElementById('cmd-ref-panel')) { document.getElementById('cmd-ref-panel').remove(); return true; } },
                    () => { if (window.YamlLearner && window.YamlLearner.active) { window.YamlLearner.toggle(); return true; } },
                    () => { if (window.YamlPlayground && window.YamlPlayground.editMode) { window.YamlPlayground.toggleEditMode(); return true; } },
                    () => { if (window.SimNarrator && window.SimNarrator.panel) { window.SimNarrator.hidePanel(); return true; } }
                ];

                for (const check of priorities) {
                    if (check()) {
                        e.stopPropagation();
                        break;
                    }
                }
            }
        });
    },

    /**
     * Global click-outside listener for all modals/overlays
     */
    setupClickOutsideAll() {
        document.addEventListener('mousedown', (e) => {
            // This is a generic handler for things that don't have their own internal backdrop click
            // Most new panels in v3 already have their own, but this catches stragglers
            
            const cmdRef = document.getElementById('cmd-ref-panel');
            if (cmdRef && !cmdRef.contains(e.target) && !e.target.closest('.cmd-ref-btn')) {
                cmdRef.remove();
            }
        });
    },

    /**
     * Redirect alert() calls to the nicer Notification system
     */
    replaceAlerts() {
        window.alert = function(msg) {
            if (window.showNotification) {
                window.showNotification(msg, msg.toLowerCase().includes('error') ? 'error' : 'info');
            } else {
                console.log("Alert (fallback):", msg);
            }
        };
    },

    /**
     * Make the empty state even more helpful for absolute beginners
     */
    enhanceEmptyState() {
        const emptyState = document.getElementById('empty-state-msg');
        if (!emptyState) return;

        // Skip enhancement if the user has completed onboarding AND the content is already enhanced
        if (localStorage.getItem('pipelinepro_onboarded') && emptyState.querySelector('.recipe-card')) return;

        emptyState.innerHTML = `
            <div style="animation: fadeIn 1s ease-out;">
                <i class="fas fa-magic" style="font-size: 80px; color: var(--accent-color); opacity: 0.2; margin-bottom: 25px;"></i>
                <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 15px;">Welcome to PipelinePro</h2>
                <p style="max-width: 500px; margin: 0 auto 35px; color: var(--text-secondary); font-size: 16px; line-height: 1.6;">
                    Building a CI/CD pipeline doesn't have to be hard. We've prepared three ways for you to start, depending on your experience.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; max-width: 700px; margin: 0 auto;">
                    <div class="recipe-card" style="cursor:pointer; text-align:left;" onclick="if(window.YamlLearner)YamlLearner.toggle(); else if(window.showNotification)showNotification('Still loading, please try again in a moment.','info');">
                        <div class="recipe-card-title"><i class="fas fa-graduation-cap"></i> I want to learn</div>
                        <div class="recipe-card-desc">Take a visual tour of what "YAML" is and how it works.</div>
                    </div>
                    <div class="recipe-card" style="cursor:pointer; text-align:left;" onclick="if(window.RecipeBuilder)RecipeBuilder.openModal(); else if(window.showNotification)showNotification('Still loading, please try again in a moment.','info');">
                        <div class="recipe-card-title"><i class="fas fa-hat-wizard"></i> Build for me</div>
                        <div class="recipe-card-desc">Choose a common goal and we will build the pipeline for you.</div>
                    </div>
                    <div class="recipe-card" style="cursor:pointer; text-align:left;" onclick="openWizard();">
                        <div class="recipe-card-title"><i class="fas fa-bolt"></i> Fast Wizard</div>
                        <div class="recipe-card-desc">Answer 3 questions to generate a custom template.</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Accessibility focus trap logic helper
     */
    setupAccessibilityFocus() {
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Tab') return;
            
            const overlay = document.querySelector('.recipe-modal-overlay, .action-catalog-panel, .command-palette-overlay');
            if (!overlay) return;

            const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        });
    }
};

window.PolishV3 = PolishV3;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PolishV3.init();
    }, 3500);
});
