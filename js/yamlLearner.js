const YamlLearner = {
    active: false,
    currentStep: 0,
    lessons: [
        {
            title: "Lesson 1: Indentation (Spaces Matter)",
            text: "In YAML, indentation (the empty space at the start of a line) is how we tell the computer which things belong together. You must use <strong>spaces</strong>, not tabs. Every 2 spaces usually creates a new 'level' of belonging.",
            highlight: "indent"
        },
        {
            title: "Lesson 2: Key-Value Pairs",
            text: "The basic building block of YAML is the <code>key: value</code> pattern. The <strong>key</strong> is the name of a setting, followed by a <strong>colon and a space</strong>, and then the <strong>value</strong>.",
            highlight: "key-value"
        },
        {
            title: "Lesson 3: Creating Lists",
            text: "When you want to list multiple things (like multiple steps in a job), you start each line with a <strong>dash and a space</strong> (<code>- </code>). This creates an ordered list.",
            highlight: "list"
        },
        {
            title: "Lesson 4: Nesting (Parents & Children)",
            text: "When you indent a list or a setting under another setting, you are 'nesting' it. The top item is the <strong>parent</strong>, and the indented items are its <strong>children</strong>.",
            highlight: "nesting"
        },
        {
            title: "Lesson 5: Putting it Together",
            text: "Congratulations! You now know the three main rules of YAML: indentation for structure, keys for settings, and dashes for lists. Most CI/CD pipelines use only these three simple patterns!",
            highlight: "all"
        }
    ],

    init() {
        console.log("YamlLearner initialized");
        this.injectToggle();
        this.loadProgress();
    },

    injectToggle() {
        const yamlTab = document.getElementById('tab-yaml');
        if (!yamlTab) return;

        const headerRow = yamlTab.querySelector('div[style*="margin-bottom: 12px"]');
        if (!headerRow) return;

        if (headerRow.querySelector('.yaml-learner-toggle-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'secondary yaml-learner-toggle-btn';
        btn.style.cssText = 'padding:4px 8px; font-size:12px; margin-left:4px;';
        btn.innerHTML = '<i class="fas fa-graduation-cap"></i> Learn YAML';
        btn.onclick = () => this.toggle();

        headerRow.appendChild(btn);
    },

    toggle() {
        this.active = !this.active;
        const yamlContainer = document.querySelector('.yaml-view-container') || document.getElementById('yaml-output')?.parentNode;
        if (!yamlContainer) return;

        if (this.active) {
            // Hide standard view
            const standardView = document.getElementById('yaml-output');
            const annotatedView = document.getElementById('annotated-yaml-view');
            if (standardView) standardView.style.display = 'none';
            if (annotatedView) annotatedView.style.display = 'none';

            // Show learner view
            this.render();
        } else {
            // Remove learner view
            const learnerView = document.querySelector('.yaml-learner-view');
            if (learnerView) learnerView.remove();

            // Restore standard view
            const standardView = document.getElementById('yaml-output');
            if (standardView && !window.YamlAnnotator.annotatedMode) standardView.style.display = 'block';
            
            const annotatedView = document.getElementById('annotated-yaml-view');
            if (annotatedView && window.YamlAnnotator.annotatedMode) annotatedView.style.display = 'block';
        }
    },

    render() {
        let learnerView = document.querySelector('.yaml-learner-view');
        if (!learnerView) {
            learnerView = document.createElement('div');
            learnerView.className = 'yaml-learner-view';
            const yamlContainer = document.querySelector('.yaml-view-container') || document.getElementById('yaml-output')?.parentNode;
            yamlContainer.appendChild(learnerView);
        }

        const lesson = this.lessons[this.currentStep];
        const progress = Math.round(((this.currentStep + 1) / this.lessons.length) * 100);

        learnerView.innerHTML = `
            <div class="yaml-learner-header">
                <span>YAML Learning Path (${progress}%)</span>
                <span class="recipe-modal-close" onclick="YamlLearner.toggle()" style="cursor:pointer;">&times;</span>
            </div>
            <div class="yaml-learner-lesson">
                <div class="yaml-learner-title">${lesson.title}</div>
                <div class="yaml-learner-text">${lesson.text}</div>
                <div class="yaml-learner-code-preview" id="learner-code-preview">${this.generateHighlightedCode(lesson.highlight)}</div>
            </div>
            <div class="yaml-learner-controls">
                <button class="secondary" onclick="YamlLearner.prev()" ${this.currentStep === 0 ? 'disabled' : ''}>Back</button>
                <button class="onboarding-btn-primary" onclick="YamlLearner.next()">${this.currentStep === this.lessons.length - 1 ? 'Finish' : 'Next Lesson'}</button>
            </div>
        `;
    },

    generateHighlightedCode(style) {
        const fullYaml = document.getElementById('yaml-output')?.value || '';
        if (!fullYaml) return "# Create a job to see it here!";

        const lines = fullYaml.split('\n').slice(0, 15); // Show first 15 lines for teaching
        
        return lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            
            const indent = line.match(/^\s*/)[0];
            const content = line.substring(indent.length);

            if (style === 'indent') {
                return `<span class="learner-highlight-indent">${indent.replace(/ /g, '&nbsp;')}</span>${content}`;
            }

            if (style === 'key-value' || style === 'all') {
                if (content.includes(':') && !content.startsWith('-')) {
                    const parts = content.split(':');
                    const key = parts[0];
                    const val = parts.slice(1).join(':');
                    return `${indent}<span class="learner-highlight-key">${key}:</span><span class="learner-highlight-value">${val}</span>`;
                }
            }

            if (style === 'list' || style === 'all') {
                if (content.startsWith('- ')) {
                    return `${indent}<span class="learner-highlight-dash">- </span>${content.substring(2)}`;
                }
            }

            if (style === 'nesting') {
                const color = indent.length === 0 ? '#569cd6' : (indent.length === 2 ? '#ce9178' : '#c586c0');
                if (indent.length > 0) {
                    return `<span style="border-left: 1px solid rgba(255,255,255,0.1); margin-left:${indent.length * 4}px; padding-left:4px;">${content}</span>`;
                }
            }

            return indent.replace(/ /g, '&nbsp;') + content;
        }).join('\n');
    },

    next() {
        if (this.currentStep < this.lessons.length - 1) {
            this.currentStep++;
            this.saveProgress();
            this.render();
        } else {
            this.toggle();
            if (window.showNotification) window.showNotification("Congratulations! You've completed the YAML basics.", "success");
        }
    },

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    },

    saveProgress() {
        localStorage.setItem('pipelinepro_learner_step', this.currentStep);
    },

    loadProgress() {
        const saved = localStorage.getItem('pipelinepro_learner_step');
        if (saved !== null) this.currentStep = parseInt(saved);
    }
};

window.YamlLearner = YamlLearner;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => YamlLearner.init(), 2900);
});
