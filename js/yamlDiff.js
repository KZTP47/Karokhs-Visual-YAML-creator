const YamlDiff = {
    previousYaml: '',

    init() {
        console.log("YamlDiff initialized");
        this.hookUpdateYaml();
    },

    hookUpdateYaml() {
        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            const originalUpdate = window.YamlGenerator.updateYaml;
            window.YamlGenerator.updateYaml = function() {
                // Store previous before update
                const textArea = document.getElementById('yaml-output');
                if (textArea) YamlDiff.previousYaml = textArea.value;
                
                originalUpdate.apply(this, arguments);
                
                try {
                    // Compare after update
                    const newYaml = textArea ? textArea.value : '';
                    YamlDiff.compareAndHighlight(YamlDiff.previousYaml, newYaml);
                } catch (e) {
                    console.log('YamlDiff error:', e);
                }
            };
        }
    },

    compareAndHighlight(oldText, newText) {
        if (!oldText || oldText === newText) return;

        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        const changes = [];

        newLines.forEach((line, i) => {
            if (line !== oldLines[i]) {
                const type = oldLines.includes(line) ? 'changed' : 'added';
                changes.push({ index: i, type });
            }
        });

        if (changes.length > 0) {
            this.applyHighlights(changes);
            this.showBadge(changes.length);
        }
    },

    applyHighlights(changes) {
        const container = document.getElementById('annotated-yaml-view');
        if (!container || container.style.display === 'none') return;

        const wrappers = container.querySelectorAll('.yaml-line-wrapper');
        changes.forEach(change => {
            const el = wrappers[change.index];
            if (el) {
                const className = change.type === 'added' ? 'yaml-diff-added' : 'yaml-diff-changed';
                el.classList.add(className);
                setTimeout(() => el.classList.remove(className), 3000);
            }
        });
    },

    showBadge(count) {
        const yamlTab = document.getElementById('tab-yaml');
        if (!yamlTab) return;

        // Remove old badge
        yamlTab.querySelectorAll('.yaml-diff-badge').forEach(b => b.remove());

        const badge = document.createElement('div');
        badge.className = 'yaml-diff-badge';
        badge.textContent = `${count} line${count > 1 ? 's' : ''} updated`;
        
        yamlTab.appendChild(badge);

        setTimeout(() => {
            badge.classList.add('fading');
            setTimeout(() => badge.remove(), 1000);
        }, 2000);
    }
};

window.YamlDiff = YamlDiff;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => YamlDiff.init(), 1600);
});
