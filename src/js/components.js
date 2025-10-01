// Component loader system
class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
    }

    // Register component paths
    registerComponents() {
        this.components.set('navigation', './src/components/navigation.html');
        this.components.set('header', './src/components/header.html');
        this.components.set('home-page', './src/components/home-page.html');
        this.components.set('program-page', './src/components/program-page.html');
        this.components.set('speakers-page', './src/components/speakers-page.html');
        this.components.set('rsvp-page', './src/components/rsvp-page.html');
        this.components.set('partners-page', './src/components/partners-page.html');
        this.components.set('contact-page', './src/components/contact-page.html');
        this.components.set('footer', './src/components/footer.html');
        this.components.set('modals', './src/components/modals.html');
    }

    // Load a single component
    async loadComponent(name) {
        if (this.loadedComponents.has(name)) {
            return; // Already loaded
        }

        const path = this.components.get(name);
        if (!path) {
            console.warn(`Component '${name}' not found`);
            return;
        }

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${response.status}`);
            }
            
            const html = await response.text();
            this.loadedComponents.add(name);
            return html;
        } catch (error) {
            console.error(`Error loading component '${name}':`, error);
            return null;
        }
    }

    // Load multiple components
    async loadComponents(names) {
        const promises = names.map(name => this.loadComponent(name));
        const results = await Promise.all(promises);
        
        return names.reduce((acc, name, index) => {
            acc[name] = results[index];
            return acc;
        }, {});
    }

    // Insert component into DOM
    insertComponent(targetSelector, html) {
        const target = document.querySelector(targetSelector);
        if (target && html) {
            target.innerHTML = html;
        }
    }

    // Load and insert component in one step
    async loadAndInsert(componentName, targetSelector) {
        const html = await this.loadComponent(componentName);
        if (html) {
            this.insertComponent(targetSelector, html);
        }
    }

    // Initialize all components for the page
    async initializePage() {
        try {
            // Load essential components first
            const essentialComponents = ['navigation', 'header', 'footer', 'modals'];
            const essentialHtml = await this.loadComponents(essentialComponents);

            // Insert essential components
            if (essentialHtml.navigation) {
                this.insertComponent('#navigation-container', essentialHtml.navigation);
            }
            if (essentialHtml.header) {
                this.insertComponent('#header-container', essentialHtml.header);
            }
            if (essentialHtml.footer) {
                this.insertComponent('#footer-container', essentialHtml.footer);
            }
            if (essentialHtml.modals) {
                this.insertComponent('#modals-container', essentialHtml.modals);
            }

            // Load all page components
            const pageComponents = ['home-page', 'program-page', 'speakers-page', 'rsvp-page', 'partners-page', 'contact-page'];
            const pageHtml = await this.loadComponents(pageComponents);

            // Insert page components
            let mainContent = '';
            pageComponents.forEach(component => {
                if (pageHtml[component]) {
                    mainContent += pageHtml[component];
                }
            });

            if (mainContent) {
                this.insertComponent('#main-content', mainContent);
            }

            console.log('All components loaded successfully');
            return true;
        } catch (error) {
            console.error('Error initializing page components:', error);
            return false;
        }
    }
}

// Export for use in main.js
window.ComponentLoader = ComponentLoader;
