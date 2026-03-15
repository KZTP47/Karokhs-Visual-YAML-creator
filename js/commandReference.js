const CommandReference = {
    categories: [
        {
            name: 'JavaScript / Node.js',
            icon: 'fab fa-node-js',
            commands: [
                { cmd: 'npm ci', desc: 'Install packages from lock file (fast, reliable)' },
                { cmd: 'npm install', desc: 'Install packages (allows version flexibility)' },
                { cmd: 'npm test', desc: 'Run test suite defined in package.json' },
                { cmd: 'npm run build', desc: 'Build your project for production' },
                { cmd: 'npm run lint', desc: 'Check code style and quality' },
                { cmd: 'npm audit', desc: 'Scan packages for security vulnerabilities' },
                { cmd: 'npm run start', desc: 'Start the application' },
                { cmd: 'npx cypress run', desc: 'Run Cypress browser tests' },
                { cmd: 'npx playwright test', desc: 'Run Playwright browser tests' }
            ]
        },
        {
            name: 'Python',
            icon: 'fab fa-python',
            commands: [
                { cmd: 'pip install -r requirements.txt', desc: 'Install Python packages' },
                { cmd: 'pytest', desc: 'Run Python tests' },
                { cmd: 'pytest --cov=.', desc: 'Run tests with coverage measurement' },
                { cmd: 'flake8 .', desc: 'Check Python code style' },
                { cmd: 'black --check .', desc: 'Check Python code formatting' },
                { cmd: 'mypy .', desc: 'Run Python type checking' },
                { cmd: 'python manage.py migrate', desc: 'Run Django database migrations' },
                { cmd: 'python manage.py test', desc: 'Run Django tests' }
            ]
        },
        {
            name: 'Java / Maven',
            icon: 'fab fa-java',
            commands: [
                { cmd: 'mvn clean install', desc: 'Build and install project' },
                { cmd: 'mvn test', desc: 'Run tests' },
                { cmd: 'mvn verify', desc: 'Run integration tests' },
                { cmd: 'mvn package', desc: 'Create deployable package (JAR/WAR)' }
            ]
        },
        {
            name: 'Docker',
            icon: 'fab fa-docker',
            commands: [
                { cmd: 'docker build -t myapp .', desc: 'Build container image' },
                { cmd: 'docker push myapp', desc: 'Push image to registry' },
                { cmd: 'docker-compose up -d', desc: 'Start services for testing' },
                { cmd: 'docker-compose down', desc: 'Stop test services' }
            ]
        },
        {
            name: 'General / Shell',
            icon: 'fas fa-terminal',
            commands: [
                { cmd: 'echo "Hello World"', desc: 'Print a message (placeholder step)' },
                { cmd: 'ls -la', desc: 'List files in current directory' },
                { cmd: 'cat package.json', desc: 'Display file contents' },
                { cmd: 'curl -s https://...', desc: 'Make an HTTP request' },
                { cmd: 'sleep 5', desc: 'Wait for 5 seconds' }
            ]
        }
    ],

    init() {
        console.log("CommandReference initialized");
        this.injectButton();
    },

    injectButton() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Insert before Export button
        const exportBtn = toolbar.querySelector('button[onclick="exportYaml()"]');
        
        const btn = document.createElement('button');
        btn.className = 'secondary icon-btn cmd-ref-btn';
        btn.title = 'Command Reference';
        btn.innerHTML = '<i class="fas fa-terminal"></i>';
        btn.onclick = () => this.togglePanel();

        if (exportBtn) {
            toolbar.insertBefore(btn, exportBtn);
        } else {
            toolbar.appendChild(btn);
        }
    },

    togglePanel() {
        const existing = document.getElementById('cmd-ref-panel');
        if (existing) {
            existing.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'cmd-ref-panel';
        panel.className = 'cmd-ref-panel';
        
        panel.innerHTML = `
            <div class="cmd-ref-header">
                <div style="font-weight:700; font-size:16px;">
                    <i class="fas fa-terminal"></i> Command Reference
                </div>
                <div style="cursor:pointer;" onclick="this.closest('.cmd-ref-panel').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="cmd-ref-search">
                <input type="text" placeholder="Search commands..." oninput="CommandReference.filter(this.value)">
            </div>
            <div class="cmd-ref-body" id="cmd-ref-list">
                ${this.renderCategories(this.categories)}
            </div>
        `;

        document.body.appendChild(panel);

        // Add event delegation for insert buttons
        panel.addEventListener('click', function(e) {
            const insertBtn = e.target.closest('.cmd-ref-insert-btn');
            if (insertBtn) {
                const cmd = insertBtn.getAttribute('data-cmd');
                if (cmd) CommandReference.insert(cmd);
            }
        });
    },

    renderCategories(categories) {
        return categories.map(cat => `
            <div class="cmd-ref-category">
                <div class="cmd-ref-category-header">
                    <i class="${cat.icon}"></i>
                    <span>${cat.name}</span>
                </div>
                <div class="cmd-ref-commands">
                    ${cat.commands.map(cmd => `
                        <div class="cmd-ref-item">
                            <div class="cmd-ref-item-info">
                                <div class="cmd-ref-cmd" title="${cmd.cmd}">${cmd.cmd}</div>
                                <div class="cmd-ref-desc">${cmd.desc}</div>
                            </div>
                            <button class="cmd-ref-insert-btn" data-cmd="${cmd.cmd.replace(/"/g, '&quot;')}">Insert</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    filter(query) {
        const list = document.getElementById('cmd-ref-list');
        if (!list) return;

        if (!query.trim()) {
            list.innerHTML = this.renderCategories(this.categories);
            return;
        }

        const q = query.toLowerCase();
        const filtered = [];

        this.categories.forEach(cat => {
            const matches = cat.commands.filter(c => 
                c.cmd.toLowerCase().includes(q) || 
                c.desc.toLowerCase().includes(q)
            );
            
            if (matches.length > 0) {
                filtered.push({ ...cat, commands: matches });
            }
        });

        list.innerHTML = this.renderCategories(filtered);
    },

    insert(cmd) {
        const jobId = window.AppState.selectedId;
        if (!jobId) {
            if (window.showNotification) window.showNotification("Please select a job first", "warning");
            else alert("Please select a job first");
            return;
        }

        const job = window.AppState.getJob(jobId);
        if (!job || job.isExternal) return;

        // Friendly name logic
        let name = 'Run command';
        if (window.StepExplainer && window.StepExplainer.commands[cmd]) {
            name = window.StepExplainer.commands[cmd].title;
        } else {
            // Primitive name extraction
            const parts = cmd.split(' ');
            if (parts[0] === 'npm' || parts[0] === 'mvn' || parts[0] === 'pip') {
                name = parts.slice(0, 2).join(' ');
            } else {
                name = parts[0];
            }
        }

        job.steps.push({
            type: 'run',
            name: name,
            val: cmd
        });

        window.JobManager.renderStepsList(job);
        window.YamlGenerator.updateYaml();
        
        if (window.EnhancedUI && window.EnhancedUI.saveState) window.EnhancedUI.saveState();
        if (window.showNotification) window.showNotification("Command inserted into " + job.name, "success");
    }
};

window.CommandReference = CommandReference;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => CommandReference.init(), 2200);
});
