document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initializeNavigation();
    initializeBackToTop();
    initializeModals();
    initializeForms();
    initializeAccessibility();
    initializeAnalytics();
});

// Navigation functionality
function initializeNavigation() {
    const pageContents = document.querySelectorAll('.page-content');
    const navLinks = document.querySelectorAll('.nav-link');

    function showPage(pageId) {
        // Hide all pages
        pageContents.forEach(page => {
            page.classList.remove('active');
        });
        
        // Remove active state from all nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show target page
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.classList.add('active');
        }

        // Add active state to corresponding nav link
        const activeLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Track page view
        trackEvent('page_view', { page: pageId });
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            showPage(hash);
        } else {
            showPage('home');
        }
    }

    // Add click handlers to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            window.location.hash = pageId;
        });
    });

    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Initial page load
    handleHashChange();
}

// Back to top functionality
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        // Smooth scroll to top
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            trackEvent('back_to_top_click');
        });

        // Show/hide button based on scroll position
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }, 100));
    }
}

// Modal functionality
function initializeModals() {
    const newsletterBtn = document.getElementById('newsletterBtn');
    const registerBtn = document.getElementById('registerBtn');
    const notifyMeBtn = document.getElementById('notifyMeBtn');
    const newsletterModal = document.getElementById('newsletterModal');
    const registrationModal = document.getElementById('registrationModal');
    const closeModal = document.getElementById('closeModal');
    const closeRegistrationModal = document.getElementById('closeRegistrationModal');

    // Newsletter modal
    if (newsletterBtn && newsletterModal) {
        newsletterBtn.addEventListener('click', () => {
            showModal(newsletterModal);
            trackEvent('newsletter_modal_open');
        });
    }

    // Registration button - navigate to RSVP page
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.hash = 'rsvp-page';
            trackEvent('register_button_click');
        });
    }

    // Notify me button (opens newsletter modal)
    if (notifyMeBtn && newsletterModal) {
        notifyMeBtn.addEventListener('click', () => {
            hideModal(registrationModal);
            setTimeout(() => showModal(newsletterModal), 300);
            trackEvent('notify_me_click');
        });
    }

    // Close modal buttons
    if (closeModal && newsletterModal) {
        closeModal.addEventListener('click', () => hideModal(newsletterModal));
    }

    if (closeRegistrationModal && registrationModal) {
        closeRegistrationModal.addEventListener('click', () => hideModal(registrationModal));
    }

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                hideModal(openModal);
            }
        }
    });
}

// Form handling
function initializeForms() {
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterForm);
    }

    // Add real-time validation
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Contact form handler
async function handleContactForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate form
    if (!validateContactForm(data)) {
        return;
    }

    showLoading();
    
    try {
        // Simulate API call
        await simulateAPICall(data, 'contact');
        
        showMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
        form.reset();
        trackEvent('contact_form_submit', { subject: data.subject });
        
    } catch (error) {
        showMessage('Sorry, there was an error sending your message. Please try again.', 'error');
        trackEvent('contact_form_error', { error: error.message });
    } finally {
        hideLoading();
    }
}

// Newsletter form handler
async function handleNewsletterForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Get selected interests
    const interests = Array.from(form.querySelectorAll('input[name="interests"]:checked'))
        .map(cb => cb.value);
    data.interests = interests;

    // Validate form
    if (!validateNewsletterForm(data)) {
        return;
    }

    showLoading();
    
    try {
        // Simulate API call
        await simulateAPICall(data, 'newsletter');
        
        showMessage('Successfully subscribed! You\'ll receive updates about the summit.', 'success');
        form.reset();
        
        // Close modal after success
        setTimeout(() => {
            const modal = document.getElementById('newsletterModal');
            hideModal(modal);
        }, 2000);
        
        trackEvent('newsletter_signup', { interests: interests });
        
    } catch (error) {
        showMessage('Sorry, there was an error with your subscription. Please try again.', 'error');
        trackEvent('newsletter_signup_error', { error: error.message });
    } finally {
        hideLoading();
    }
}

// Form validation functions
function validateContactForm(data) {
    let isValid = true;
    
    if (!data.name || data.name.trim().length < 2) {
        showFieldError('name', 'Please enter a valid name');
        isValid = false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!data.subject) {
        showFieldError('subject', 'Please select a subject');
        isValid = false;
    }
    
    if (!data.message || data.message.trim().length < 10) {
        showFieldError('message', 'Please enter a message (at least 10 characters)');
        isValid = false;
    }
    
    return isValid;
}

function validateNewsletterForm(data) {
    let isValid = true;
    
    if (!data.name || data.name.trim().length < 2) {
        showFieldError('newsletter-name', 'Please enter a valid name');
        isValid = false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError('newsletter-email', 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(e);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field.id, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field.id, 'Please enter a valid email address');
        return false;
    }
    
    if (field.name === 'name' && value && value.length < 2) {
        showFieldError(field.id, 'Name must be at least 2 characters');
        return false;
    }
    
    if (field.name === 'message' && value && value.length < 10) {
        showFieldError(field.id, 'Message must be at least 10 characters');
        return false;
    }
    
    field.classList.add('success');
    return true;
}

// Utility functions
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at the top of the active form or modal
    const activeModal = document.querySelector('.modal.show');
    const activeForm = activeModal ? activeModal.querySelector('form') : document.querySelector('form');
    
    if (activeForm) {
        activeForm.insertBefore(message, activeForm.firstChild);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.add('error');
    field.classList.remove('success');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error text-red-400 text-sm mt-1';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    
    const errorMsg = field.parentNode.querySelector('.field-error');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function simulateAPICall(data, type) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate occasional errors for testing
    if (Math.random() < 0.1) {
        throw new Error('Network error');
    }
    
    console.log(`${type} submission:`, data);
    return { success: true };
}

// Accessibility enhancements
function initializeAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main landmark
    const main = document.querySelector('main');
    if (main) {
        main.id = 'main';
    }
    
    // Enhance keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Tab trapping in modals
        const activeModal = document.querySelector('.modal.show');
        if (activeModal && e.key === 'Tab') {
            trapFocus(e, activeModal);
        }
    });
    
    // Announce page changes to screen readers
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('page-content') && target.classList.contains('active')) {
                    announceToScreenReader(`Navigated to ${target.id.replace('-page', '')} section`);
                }
            }
        });
    });
    
    document.querySelectorAll('.page-content').forEach(page => {
        observer.observe(page, { attributes: true });
    });
}

function trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Analytics and tracking
function initializeAnalytics() {
    // Track initial page load
    trackEvent('page_load', {
        page: window.location.hash.substring(1) || 'home',
        timestamp: new Date().toISOString()
    });
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', throttle(() => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                trackEvent('scroll_depth', { percent: maxScroll });
            }
        }
    }, 500));
    
    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackEvent('time_on_page', { seconds: timeOnPage });
    });
}

function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Console logging for development
    console.log('Event tracked:', eventName, parameters);
}

// Utility function for throttling
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance monitoring
function initializePerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                trackEvent('page_performance', {
                    load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    dom_content_loaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    first_paint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
                });
            }
        }, 0);
    });
}

// Initialize performance monitoring
initializePerformanceMonitoring();
