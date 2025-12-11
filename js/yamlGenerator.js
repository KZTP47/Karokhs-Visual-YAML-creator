/**
 * YAML Generator Module
 * Converts the visual pipeline into YAML configuration
 */

const YamlGenerator = {
    /**
     * Get jobs sorted by dependency order (topological sort)
     */
    getSortedJobs() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();

        let inDegree = {};
        let adj = {};

        jobs.forEach(j => {
            inDegree[j.internalId] = 0;
            adj[j.internalId] = [];
        });

        connections.forEach(c => {
            adj[c.from].push(c.to);
            inDegree[c.to]++;
        });

        let queue = [];
        jobs.forEach(j => {
            if (inDegree[j.internalId] === 0) queue.push(j.internalId);
        });

        // Sort queue by y position for consistent ordering
        queue.sort((a, b) => {
            const jobA = jobs.find(j => j.internalId === a);
            const jobB = jobs.find(j => j.internalId === b);
            return jobA.y - jobB.y;
        });

        let sortedIds = [];
        while (queue.length > 0) {
            let u = queue.shift();
            sortedIds.push(u);

            if (adj[u]) {
                adj[u].forEach(v => {
                    inDegree[v]--;
                    if (inDegree[v] === 0) queue.push(v);
                });
            }
        }

        // If there's a cycle, return original order
        if (sortedIds.length !== jobs.length) return jobs;

        return sortedIds.map(id => jobs.find(j => j.internalId === id));
    },

    /**
     * Generate GitHub Actions YAML
     */
    generateGitHubYaml() {
        const sortedJobs = this.getSortedJobs();
        const branch = AppState.pipeline.branch || 'main';
        const connections = AppState.getConnections();

        const output = {
            name: "Test Pipeline",
            on: {},
            jobs: {}
        };

        // Configure triggers
        if (AppState.pipeline.triggers.push) {
            output.on.push = { branches: [branch] };
        }
        if (AppState.pipeline.triggers.pr) {
            output.on.pull_request = { branches: [branch] };
        }

        // Generate job definitions
        sortedJobs.forEach(job => {
            if (job.isExternal) {
                output.jobs[job.yamlId] = {
                    uses: job.externalPath
                };
            } else {
                const jobDef = {
                    name: job.name,
                    "runs-on": job.os
                };

                // Add matrix strategy if configured
                if (job.matrix) {
                    jobDef.strategy = {
                        matrix: job.matrix
                    };
                }

                // Add environment variables
                if (job.envVars && job.envVars.length > 0) {
                    jobDef.env = {};
                    job.envVars.forEach(ev => {
                        if (ev.key) jobDef.env[ev.key] = ev.value;
                    });
                }

                // Add steps
                jobDef.steps = job.steps.map(s => {
                    if (s.type === 'checkout') {
                        return { name: s.name, uses: 'actions/checkout@v3' };
                    }
                    if (s.type === 'action') {
                        return { name: s.name, uses: s.val };
                    }
                    return { name: s.name, run: s.val };
                });

                // Add artifact upload step
                if (job.artifacts && job.artifacts.length > 0) {
                    jobDef.steps.push({
                        name: 'Upload Artifacts',
                        uses: 'actions/upload-artifact@v3',
                        with: {
                            name: job.yamlId + '-artifacts',
                            path: job.artifacts.join('\n')
                        }
                    });
                }

                // Add dependencies
                const parents = connections
                    .filter(c => c.to === job.internalId)
                    .map(c => AppState.getJob(c.from)?.yamlId)
                    .filter(Boolean);

                if (parents.length) jobDef.needs = parents;

                // Add retry configuration
                if (job.retry) {
                    jobDef['continue-on-error'] = true;
                    jobDef.steps.unshift({
                        name: 'Set retry count',
                        run: `echo "RETRY_COUNT=${job.retry.attempts}" >> $GITHUB_ENV`
                    });
                }

                output.jobs[job.yamlId] = jobDef;
            }
        });

        return output;
    },

    /**
     * Generate GitLab CI YAML
     */
    generateGitLabYaml() {
        const sortedJobs = this.getSortedJobs();
        const branch = AppState.pipeline.branch || 'main';
        const connections = AppState.getConnections();

        const output = {
            stages: AppState.pipeline.stages
        };

        // Generate job definitions
        sortedJobs.forEach(job => {
            if (job.isExternal) {
                output[job.yamlId] = {
                    stage: job.stage,
                    trigger: {
                        include: job.externalPath
                    }
                };
            } else {
                const jobDef = {
                    stage: job.stage,
                    image: job.os === 'ubuntu-latest' ? 'ubuntu:latest' :
                           (job.os.includes(':') ? job.os : 'node:latest')
                };

                // Add matrix/parallel configuration
                if (job.matrix) {
                    jobDef.parallel = {
                        matrix: Object.entries(job.matrix).map(([key, values]) => ({
                            [key]: values
                        }))
                    };
                }

                // Add environment variables
                if (job.envVars && job.envVars.length > 0) {
                    jobDef.variables = {};
                    job.envVars.forEach(ev => {
                        if (ev.key) jobDef.variables[ev.key] = ev.value;
                    });
                }

                // Add script
                jobDef.script = [];
                job.steps.forEach(s => {
                    if (s.type !== 'checkout') {
                        jobDef.script.push(
                            s.type === 'action' ? `# Plugin: ${s.val}` : s.val
                        );
                    }
                });

                if (jobDef.script.length === 0) {
                    jobDef.script.push("echo 'Done'");
                }

                // Add artifacts
                if (job.artifacts && job.artifacts.length > 0) {
                    jobDef.artifacts = {
                        paths: job.artifacts
                    };
                }

                // Add dependencies
                const parents = connections
                    .filter(c => c.to === job.internalId)
                    .map(c => AppState.getJob(c.from)?.yamlId)
                    .filter(Boolean);

                if (parents.length) jobDef.needs = parents;

                // Add retry configuration
                if (job.retry) {
                    jobDef.retry = job.retry.attempts;
                }

                // Add rules for branch filtering
                if (AppState.pipeline.triggers.push && !AppState.pipeline.triggers.pr) {
                    jobDef.rules = [{
                        if: `$CI_COMMIT_BRANCH == "${branch}"`
                    }];
                }

                output[job.yamlId] = jobDef;
            }
        });

        return output;
    },

    /**
     * Update the YAML output display
     */
    updateYaml() {
        const jobs = AppState.getAllJobs();

        if (jobs.length === 0) {
            document.getElementById('yaml-output').value = '';
            return;
        }

        let output;
        if (AppState.platform === 'github') {
            output = this.generateGitHubYaml();
        } else {
            output = this.generateGitLabYaml();
        }

        document.getElementById('yaml-output').value = jsyaml.dump(output);
        Validation.updateValidation();
    },

    /**
     * Export YAML to file
     */
    exportYaml() {
        const yamlContent = document.getElementById('yaml-output').value;
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = AppState.platform + '-pipeline.yml';
        a.click();
    },

    /**
     * Copy YAML to clipboard
     */
    copyYaml() {
        const yamlOutput = document.getElementById('yaml-output');
        yamlOutput.select();
        document.execCommand('copy');

        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }
};

// Make it available globally
window.YamlGenerator = YamlGenerator;
