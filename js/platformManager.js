/**
 * Platform Manager Module
 * Handles platform switching between GitHub and GitLab
 */

const PlatformManager = {
    /**
     * Set the CI/CD platform
     */
    setPlatform(platform) {
        AppState.setPlatform(platform);

        // Update UI
        document.querySelectorAll('.platform-opt').forEach(el => el.classList.remove('active'));
        document.getElementById('btn-' + platform).classList.add('active');

        // Update body class for platform-specific styling
        if (platform === 'gitlab') {
            document.body.classList.add('gitlab-mode');
        } else {
            document.body.classList.remove('gitlab-mode');
        }

        // Regenerate YAML
        YamlGenerator.updateYaml();
    },

    /**
     * Get current platform
     */
    getCurrentPlatform() {
        return AppState.platform;
    }
};

// Make it available globally
window.PlatformManager = PlatformManager;
