const ContextPanels = {
    panels: {
        'steps': {
            question: 'Why do I need steps?',
            answer: 'Steps are the individual actions your job performs, like a to-do list. They run from top to bottom. For example: Step 1 downloads your code, Step 2 installs packages, Step 3 runs your tests. Without steps, your job does nothing.',
            example: 'A typical test job has 3 steps: Checkout Code, Install Dependencies, Run Tests.'
        },
        'env-vars': {
            question: 'Why do I need environment variables?',
            answer: 'Environment variables let you pass configuration values to your job without hardcoding them. For example, you might set NODE_ENV=test so your code knows it is running in a test environment.',
            example: 'DATABASE_URL="postgres://..." tells your app where the test database is.'
        },
        'artifacts': {
            question: 'Why do I need artifacts?',
            answer: 'Artifacts are files your job produces that you want to keep after the job finishes. For example, test coverage reports, screenshots from browser tests, or compiled build files.',
            example: 'Saving "coverage/**" lets you see exactly which code lines your tests cover.'
        },
        'matrix': {
            question: 'Why would I use matrix testing?',
            answer: 'Matrix testing runs the same job multiple times with different settings. For example, you can test your code on Node.js 16, 18, and 20 simultaneously to make sure it works on all versions your users might have.',
            example: 'A matrix with node: [16, 18, 20] creates 3 parallel test runs.'
        },
        'retry': {
            question: 'Why would I enable retry?',
            answer: 'Some tests are "flaky" -- they occasionally fail for reasons unrelated to your code (network timeouts, race conditions). Retry automatically re-runs failed tests, reducing false alarms.',
            example: 'Setting max retries to 2 means: if the test fails, try again up to 2 more times before declaring it a real failure.'
        }
    },

    init() {
        console.log("ContextPanels initialized");
        this.setupObserver();
        this.injectPanels();
    },

    setupObserver() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        let panelTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(panelTimeout);
            panelTimeout = setTimeout(() => {
                this.injectPanels();
            }, 300);
        });

        observer.observe(sidebar, { childList: true, subtree: true });
    },

    injectPanels() {
        if (localStorage.getItem('pipelinepro_experience') === 'advanced') return;

        // Steps section
        const stepsHeader = document.querySelector('#steps-section .section-label');
        if (stepsHeader) this.injectOne('steps', stepsHeader);

        // Find collapsible headers by text
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            const text = header.textContent.toLowerCase();
            if (text.includes('environment variables')) this.injectOne('env-vars', header);
            else if (text.includes('artifacts')) this.injectOne('artifacts', header);
            else if (text.includes('matrix')) this.injectOne('matrix', header);
            else if (text.includes('retry')) this.injectOne('retry', header);
        });
    },

    injectOne(id, header) {
        if (header.classList.contains('context-panel-injected')) return;
        header.classList.add('context-panel-injected');

        const info = this.panels[id];
        if (!info) return;

        const link = document.createElement('div');
        link.className = 'context-panel-link';
        link.innerHTML = `<i class="fas fa-question-circle"></i> ${info.question}`;
        
        const content = document.createElement('div');
        content.className = 'context-panel-content';
        content.id = `context-panel-${id}`;
        content.innerHTML = `
            <div>${info.answer}</div>
            <div class="context-example">
                <div class="context-example-label">Example</div>
                ${info.example}
            </div>
        `;

        link.onclick = (e) => {
            e.stopPropagation();
            content.classList.toggle('visible');
        };

        // Insert after header
        header.insertAdjacentElement('afterend', link);
        link.insertAdjacentElement('afterend', content);
    }
};

window.ContextPanels = ContextPanels;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => ContextPanels.init(), 1900);
});
