// Branchcode AI Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Platform detection and download tracking
    initPlatformDetection();
    initDownloadTracking();
    initContactForm();
    initScrollAnimations();
    initSmoothScrolling();
});

// Platform detection for automatic download suggestions
function initPlatformDetection() {
    const platform = detectPlatform();
    const downloadButtons = document.querySelectorAll('.btn-download');

    // Add platform-specific styling or highlighting
    downloadButtons.forEach(button => {
        const buttonPlatform = button.getAttribute('data-platform');
        if (buttonPlatform === platform) {
            button.classList.add('recommended');
            button.innerHTML += ' <span class="recommended-badge">Recommended</span>';
        }
    });
}

function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'mac';
    } else if (platform.includes('win') || userAgent.includes('windows')) {
        return 'windows';
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
        return 'linux';
    }

    return 'unknown';
}

// Download tracking and analytics
function initDownloadTracking() {
    const downloadButtons = document.querySelectorAll('.btn-download');

    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const platform = this.getAttribute('data-platform');
            const filename = this.getAttribute('href').split('/').pop();

            // Track download analytics
            trackDownload(platform, filename);

            // Show download started notification
            showDownloadNotification(platform);

            // Don't prevent default - let the download proceed
        });
    });
}

function trackDownload(platform, filename) {
    // Analytics tracking (replace with your analytics service)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'download', {
            'event_category': 'engagement',
            'event_label': platform,
            'value': filename
        });
    }

    // Custom analytics endpoint (optional)
    try {
        fetch('/api/track-download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                platform: platform,
                filename: filename,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            })
        }).catch(e => console.log('Analytics tracking failed:', e));
    } catch (e) {
        // Analytics failed, but don't break the download
        console.log('Analytics not available');
    }
}

function showDownloadNotification(platform) {
    // Create and show a notification
    const notification = document.createElement('div');
    notification.className = 'download-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">📥</div>
            <div class="notification-text">
                <strong>Download Started</strong>
                <p>Branchcode AI for ${platform} is downloading...</p>
            </div>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        padding: 1rem;
        z-index: 1001;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Contact form handling
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        // Simulate form submission (replace with your backend endpoint)
        setTimeout(() => {
            showFormSuccessMessage();
            form.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 2000);

        // In production, replace the setTimeout with actual form submission:
        /*
        fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            showFormSuccessMessage();
            form.reset();
        })
        .catch(error => {
            showFormErrorMessage();
        })
        .finally(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
        */
    });
}

function showFormSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'form-message success';
    message.innerHTML = `
        <div class="message-content">
            ✅ <strong>Message sent successfully!</strong>
            <p>Thank you for your interest. We'll get back to you soon.</p>
        </div>
    `;

    message.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        padding: 1rem;
        z-index: 1001;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(message);

    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 4000);
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.feature-card, .download-card, .pricing-card');
    animatedElements.forEach(el => observer.observe(el));
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-links a, .hero-buttons a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .download-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .notification-icon {
        font-size: 2rem;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
        margin-left: auto;
    }

    .notification-close:hover {
        color: #333;
    }

    .recommended-badge {
        background: #28a745;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-left: 8px;
    }

    .btn-download.recommended {
        position: relative;
        overflow: visible;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .form-message .message-content {
        line-height: 1.4;
    }

    .form-message p {
        margin: 0.5rem 0 0 0;
        font-size: 0.9rem;
    }
`;

document.head.appendChild(style);

// System requirements check (optional feature)
function checkSystemRequirements() {
    const requirements = {
        ram: 4, // GB
        storage: 2, // GB
        connection: true
    };

    // Check if browser supports required features
    const features = {
        webgl: !!window.WebGLRenderingContext,
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: !!window.indexedDB,
        fetch: !!window.fetch
    };

    // RAM estimation (not accurate, just for demo)
    const ramEstimate = navigator.deviceMemory || 4;

    // Storage estimation
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
            const availableGB = (estimate.quota || 0) / (1024 * 1024 * 1024);
            console.log(`Estimated available storage: ${availableGB.toFixed(1)} GB`);
        });
    }

    return {
        meetsRequirements: ramEstimate >= requirements.ram && navigator.onLine,
        details: {
            ram: ramEstimate,
            features: features,
            online: navigator.onLine
        }
    };
}

// Add version and build info
document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('.footer-bottom');
    if (footer) {
        const buildInfo = document.createElement('p');
        buildInfo.style.fontSize = '0.8rem';
        buildInfo.style.opacity = '0.7';
        buildInfo.style.marginTop = '0.5rem';
        buildInfo.textContent = `Built with Tauri + React • Last updated: ${new Date().toLocaleDateString()}`;
        footer.appendChild(buildInfo);
    }
});

// Export for potential use by other scripts
window.BranchcodeWebsite = {
    detectPlatform,
    trackDownload,
    checkSystemRequirements
};