const Glossary = {
    terms: {
        "Pipeline": "An automated sequence of tasks that runs every time you update your code. Think of it as an assembly line: your code goes in one end, and a tested, verified version comes out the other.",
        "Job": "A single task in your pipeline. For example, 'Run Unit Tests' is one job. Each job runs on its own virtual computer.",
        "Stage": "A group of jobs that run at the same time. Stages run in order: all jobs in Stage 1 must finish before Stage 2 begins. Common stages are Build, Test, and Deploy.",
        "Step": "One action inside a job. Steps run one after another, in order. For example: Step 1 might download your code, Step 2 might install packages, Step 3 might run tests.",
        "YAML": "A text file format used to configure pipelines. It uses indentation (spaces) to show structure. This tool generates YAML for you, so you never need to write it by hand.",
        "Branch": "A separate version of your code. The 'main' branch is usually the primary version. Pipelines often run when code is pushed to a specific branch.",
        "Trigger": "The event that causes your pipeline to start running. Common triggers: pushing code to a branch, or opening a pull request.",
        "Pull Request": "A request to merge your code changes into the main branch. Other developers can review your changes before they are merged. Also called a Merge Request in GitLab.",
        "Runner": "The virtual computer that executes your jobs. You choose the operating system (Ubuntu, macOS, Windows) that the runner uses.",
        "Artifact": "A file produced by your pipeline that you want to keep. Examples: test reports, code coverage data, compiled applications, screenshots from browser tests.",
        "Matrix": "A way to run the same job multiple times with different settings. For example, testing your code on Node.js versions 16, 18, and 20 simultaneously.",
        "Environment Variable": "A named value available to your job while it runs. Used for configuration like database URLs, API endpoints, or secret keys.",
        "Secret": "A sensitive value (like a password or API key) stored securely in your repository settings. Referenced as ${{ secrets.NAME }} in your pipeline. Never hardcode secrets in your pipeline.",
        "Checkout": "Downloading your code from the repository onto the runner so your job can work with it. Almost every job starts with a checkout step.",
        "CI/CD": "Continuous Integration / Continuous Deployment. CI means automatically testing code when it changes. CD means automatically deploying code when tests pass.",
        "Docker": "A tool that packages your application and its dependencies into a container. Containers run the same way everywhere, making deployments predictable.",
        "Dependency": "A package or library your code needs to work. For example, if your JavaScript project uses React, React is a dependency. Dependencies must be installed before you can run tests.",
        "Coverage": "A measurement of how much of your code is tested. 80% coverage means 80% of your code lines are exercised by tests. Higher is better.",
        "Flaky Test": "A test that sometimes passes and sometimes fails without any code changes. Flaky tests are frustrating. The Retry feature helps by running failed tests again automatically.",
        "Deploy": "Making your application available to users. Deployment copies your tested code to a server where people can access it."
    },

    init() {
        // Read experience level from localStorage.
        const level = localStorage.getItem('pipelinepro_experience');
        
        // If 'advanced', return without doing anything.
        if (level === 'advanced') return;

        // Otherwise, call this.scanAndInject().
        this.scanAndInject();

        // Set up a MutationObserver on document.body to re-scan when DOM changes
        const observer = new MutationObserver(this.debounce(() => {
            this.scanAndInject();
        }, 500));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    scanAndInject() {
        // Query elements that might contain jargon
        const selectors = [
            'label', 
            '.section-label', 
            'h3', 
            'h4', 
            '.template-name', 
            '.wizard-step h3',
            '.collapsible-header span'
        ];
        
        const elements = document.querySelectorAll(selectors.join(','));
        
        elements.forEach(el => {
            // Skip elements that already have a glossary icon or are inside one
            if (el.querySelector('.glossary-icon') || el.classList.contains('glossary-icon')) return;
            
            const text = el.textContent;
            
            // Check for matches in our dictionary
            for (const term in this.terms) {
                // Use a regex for word boundary matching, case-insensitive
                const regex = new RegExp(`\\b${term}\\b`, 'i');
                
                if (regex.test(text)) {
                    this.injectIcon(el, term);
                    break; // Only one icon per element to avoid clutter
                }
            }
        });
    },

    injectIcon(el, termKey) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-info-circle glossary-icon';
        icon.title = 'Click for definition';
        
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDefinition(termKey, e);
        });
        
        el.appendChild(icon);
    },

    showDefinition(termKey, event) {
        // Remove any existing glossary popup
        this.closePopups();

        const popup = document.createElement('div');
        popup.className = 'glossary-popup';
        
        const title = document.createElement('strong');
        title.textContent = termKey;
        
        const body = document.createElement('p');
        body.textContent = this.terms[termKey];
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'glossary-close';
        closeBtn.innerHTML = 'Got it';
        closeBtn.onclick = () => this.closePopups();
        
        popup.appendChild(title);
        popup.appendChild(body);
        popup.appendChild(closeBtn);
        
        document.body.appendChild(popup);
        
        // Position the popup
        const rect = event.target.getBoundingClientRect();
        let top = rect.bottom + window.scrollY + 10;
        let left = rect.left + window.scrollX;
        
        // Ensure it doesn't go off screen
        const popupRect = popup.getBoundingClientRect();
        if (left + 320 > window.innerWidth) {
            left = window.innerWidth - 330;
        }
        
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        
        // Add click-outside-to-close behavior
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!popup.contains(e.target)) {
                    this.closePopups();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    },

    showDefinitionByKey(termKey) {
        // Center-screen version
        this.closePopups();
        
        if (!this.terms[termKey]) return;

        const popup = document.createElement('div');
        popup.className = 'glossary-popup centered-popup';
        
        const title = document.createElement('strong');
        title.textContent = termKey;
        
        const body = document.createElement('p');
        body.textContent = this.terms[termKey];
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'glossary-close';
        closeBtn.innerHTML = 'Got it';
        closeBtn.onclick = () => this.closePopups();
        
        popup.appendChild(title);
        popup.appendChild(body);
        popup.appendChild(closeBtn);
        
        document.body.appendChild(popup);
        
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    },

    closePopups() {
        const popups = document.querySelectorAll('.glossary-popup');
        popups.forEach(p => p.remove());
    }
};

window.Glossary = Glossary;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        Glossary.init();
    }, 300);
});
