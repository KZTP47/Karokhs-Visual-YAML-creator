const Onboarding = {
    currentScreen: 1,
    experienceLevel: null,
    overlay: null,

    init() {
        // Check localStorage. If 'pipelinepro_onboarded' is truthy, return immediately.
        if (localStorage.getItem('pipelinepro_onboarded')) {
            // Apply beginner mode if already set
            if (localStorage.getItem('pipelinepro_experience') === 'beginner') {
                if (typeof GuidedMode !== 'undefined') {
                    GuidedMode.enable();
                }
            }
            return;
        }
        
        // Short delay to ensure styles are applied
        setTimeout(() => this.showOverlay(), 100);
    },

    showOverlay() {
        // Create the overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        
        const card = document.createElement('div');
        card.className = 'onboarding-card';
        card.id = 'onboarding-card';
        
        this.overlay.appendChild(card);
        document.body.appendChild(this.overlay);
        
        this.renderScreen(1);
    },

    renderScreen(num) {
        this.currentScreen = num;
        const card = document.getElementById('onboarding-card');
        if (!card) return;
        
        card.innerHTML = '';
        
        if (num === 1) {
            card.innerHTML = `
                <h2 class="onboarding-title">Welcome to PipelinePro</h2>
                <div class="onboarding-body">
                    <p>This tool helps you create automated testing pipelines visually. Instead of writing complex configuration files by hand, you drag, drop, and click to build your pipeline.</p>
                    <p>The tool then generates the correct YAML file for you, which you can use in GitHub or GitLab to automate your testing.</p>
                </div>
                <div class="onboarding-actions">
                    <button class="onboarding-btn onboarding-btn-primary" onclick="Onboarding.renderScreen(2)">
                        Next
                    </button>
                </div>
            `;
        } else if (num === 2) {
            card.innerHTML = `
                <h2 class="onboarding-title">How much do you know about CI/CD?</h2>
                <div class="onboarding-body">
                    <p>Select the option that best describes your experience level so we can tailor the interface for you.</p>
                </div>
                <div class="experience-cards">
                    <div class="experience-card ${this.experienceLevel === 'beginner' ? 'selected' : ''}" onclick="Onboarding.selectExperience('beginner', this)">
                        <i class="fas fa-seedling"></i>
                        <h4>Total Beginner</h4>
                        <p>I have never created a pipeline before and I do not know what YAML is.</p>
                    </div>
                    <div class="experience-card ${this.experienceLevel === 'intermediate' ? 'selected' : ''}" onclick="Onboarding.selectExperience('intermediate', this)">
                        <i class="fas fa-user"></i>
                        <h4>Some Experience</h4>
                        <p>I understand the basics but want help with the details.</p>
                    </div>
                    <div class="experience-card ${this.experienceLevel === 'advanced' ? 'selected' : ''}" onclick="Onboarding.selectExperience('advanced', this)">
                        <i class="fas fa-user-graduate"></i>
                        <h4>Experienced</h4>
                        <p>I know CI/CD and just want a visual editor.</p>
                    </div>
                </div>
                <div class="onboarding-actions">
                    <button class="onboarding-btn onboarding-btn-secondary" onclick="Onboarding.renderScreen(1)">Back</button>
                    <button id="onboarding-next-btn" class="onboarding-btn onboarding-btn-primary" 
                            ${!this.experienceLevel ? 'disabled' : ''} 
                            onclick="Onboarding.renderScreen(3)">
                        Next
                    </button>
                </div>
            `;
        } else if (num === 3) {
            let title = "";
            let message = "";
            
            if (this.experienceLevel === 'beginner') {
                title = "Great! We will guide you.";
                message = "We've enabled <strong>Guided Mode</strong> to help you learn the ropes. You'll see progress indicators and helpful tips as you build your first pipeline.";
            } else if (this.experienceLevel === 'intermediate') {
                title = "Perfect! Helpful tips enabled.";
                message = "We will show helpful glossary definitions for technical terms. You can also turn on Guided Mode anytime from the settings.";
            } else {
                title = "You are all set!";
                message = "The full visual editor is ready for you. You can access help and documentation from the top bar if you ever need a refresher.";
            }
            
            card.innerHTML = `
                <h2 class="onboarding-title">${title}</h2>
                <div class="onboarding-body">
                    <p>${message}</p>
                </div>
                <div class="onboarding-actions">
                    <button class="onboarding-btn onboarding-btn-secondary" onclick="Onboarding.renderScreen(2)">Back</button>
                    <button class="onboarding-btn onboarding-btn-secondary" onclick="Onboarding.closeOverlay()">
                        Start from Scratch
                    </button>
                    <button class="onboarding-btn onboarding-btn-primary" onclick="Onboarding.startWithWizard()">
                        Open Quick Start Wizard
                    </button>
                </div>
            `;
        }
    },

    selectExperience(level, element) {
        this.experienceLevel = level;
        const cards = document.querySelectorAll('.experience-card');
        cards.forEach(card => card.classList.remove('selected'));
        
        let targetCard = element;
        if (!targetCard) {
            const labels = { 'beginner': 'Total Beginner', 'intermediate': 'Some Experience', 'advanced': 'Experienced' };
            targetCard = Array.from(cards).find(c => c.innerHTML.includes(labels[level]));
        }

        if (targetCard) {
            targetCard.classList.add('selected');
        }
        
        const nextBtn = document.getElementById('onboarding-next-btn');
        if (nextBtn) nextBtn.disabled = false;
    },

    startWithWizard() {
        this.closeOverlay();
        if (typeof Wizard !== 'undefined' && typeof Wizard.openWizard === 'function') {
            Wizard.openWizard();
        }
    },

    closeOverlay() {
        localStorage.setItem('pipelinepro_onboarded', 'true');
        localStorage.setItem('pipelinepro_experience', this.experienceLevel || 'intermediate');
        
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
            }, 300);
        }

        if (this.experienceLevel === 'beginner') {
            if (typeof GuidedMode !== 'undefined') {
                GuidedMode.enable();
            }
        }
    },

    resetOnboarding() {
        localStorage.removeItem('pipelinepro_onboarded');
        localStorage.removeItem('pipelinepro_experience');
        location.reload();
    }
};

window.Onboarding = Onboarding;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        Onboarding.init();
    }, 200);
});

// Keyboard accessibility for onboarding
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay || overlay.style.display === 'none') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const cards = document.querySelectorAll('.experience-card');
        if (cards.length > 0) {
            let index = Array.from(cards).findIndex(c => c.classList.contains('selected'));
            if (index === -1) index = 0;
            else {
                if (e.key === 'ArrowRight') index = (index + 1) % cards.length;
                else index = (index - 1 + cards.length) % cards.length;
            }
            const levels = ['beginner', 'intermediate', 'advanced'];
            Onboarding.selectExperience(levels[index]);
        }
    }

    if (e.key === 'Enter') {
        const primaryBtn = overlay.querySelector('.onboarding-btn-primary');
        if (primaryBtn) primaryBtn.click();
    }

    if (e.key === 'Escape') {
        Onboarding.closeOverlay();
    }
});
