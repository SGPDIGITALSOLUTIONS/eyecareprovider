/**
 * Cookie Consent Banner
 * I Care Services Providers Ltd
 */

class CookieConsent {
    constructor() {
        this.cookieName = 'eyecare_cookie_consent';
        this.cookieExpiry = 365; // days
        this.init();
    }

    init() {
        // Check if consent has already been given
        if (!this.hasConsent()) {
            this.showBanner();
        }
        
        // Add event listeners
        this.addEventListeners();
    }

    hasConsent() {
        return this.getCookie(this.cookieName) !== null;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    showBanner() {
        // Create banner if it doesn't exist
        if (!document.getElementById('cookie-banner')) {
            this.createBanner();
        }
        
        // Show banner with animation
        setTimeout(() => {
            const banner = document.getElementById('cookie-banner');
            if (banner) {
                banner.classList.add('show');
            }
        }, 1000); // Delay to ensure page is loaded
    }

    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'cookie-banner';
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <h3>🍪 We use cookies</h3>
                    <p>We use cookies to enhance your experience, analyze site traffic, and provide personalized content. By continuing to browse our site, you consent to our use of cookies. <a href="cookie-policy.html" target="_blank">Learn more</a></p>
                </div>
                <div class="cookie-banner-actions">
                    <button class="cookie-btn cookie-btn-accept" onclick="cookieConsent.acceptAll()">Accept All</button>
                    <button class="cookie-btn cookie-btn-reject" onclick="cookieConsent.rejectAll()">Reject All</button>
                    <button class="cookie-btn cookie-btn-settings" onclick="cookieConsent.showPreferences()">Cookie Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'cookie-modal';
        modal.className = 'cookie-modal';
        
        modal.innerHTML = `
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h2>Cookie Preferences</h2>
                    <button class="cookie-modal-close" onclick="cookieConsent.hidePreferences()">&times;</button>
                </div>
                <div class="cookie-modal-body">
                    <p>We use different types of cookies to optimize your experience on our website. You can choose which categories you'd like to allow:</p>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Essential Cookies</h3>
                            <label class="cookie-toggle disabled">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-description">These cookies are necessary for the website to function properly. They enable basic features like page navigation, form submission, and security. These cannot be disabled.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Analytics Cookies</h3>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analytics-cookies">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-description">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website performance.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Functionality Cookies</h3>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="functionality-cookies">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-description">These cookies allow the website to remember choices you make and provide enhanced, more personal features. They may be set by us or by third party providers.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <h3>Marketing Cookies</h3>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="marketing-cookies">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-description">These cookies are used to deliver advertisements that are relevant to you and your interests. They may also be used to limit the number of times you see an advertisement.</p>
                    </div>
                </div>
                <div class="cookie-modal-actions">
                    <button class="cookie-btn cookie-btn-reject" onclick="cookieConsent.rejectAll()">Reject All</button>
                    <button class="cookie-btn cookie-btn-accept" onclick="cookieConsent.savePreferences()">Save Preferences</button>
                    <button class="cookie-btn cookie-btn-accept" onclick="cookieConsent.acceptAll()">Accept All</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    acceptAll() {
        const preferences = {
            essential: true,
            analytics: true,
            functionality: true,
            marketing: true,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(preferences), this.cookieExpiry);
        this.hideBanner();
        this.hidePreferences();
        this.loadCookies(preferences);
        
        console.log('All cookies accepted');
    }

    rejectAll() {
        const preferences = {
            essential: true,
            analytics: false,
            functionality: false,
            marketing: false,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(preferences), this.cookieExpiry);
        this.hideBanner();
        this.hidePreferences();
        this.loadCookies(preferences);
        
        console.log('Non-essential cookies rejected');
    }

    showPreferences() {
        if (!document.getElementById('cookie-modal')) {
            this.createModal();
        }
        
        // Load current preferences
        this.loadCurrentPreferences();
        
        const modal = document.getElementById('cookie-modal');
        modal.classList.add('show');
    }

    hidePreferences() {
        const modal = document.getElementById('cookie-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    loadCurrentPreferences() {
        const consent = this.getCookie(this.cookieName);
        if (consent) {
            try {
                const preferences = JSON.parse(consent);
                document.getElementById('analytics-cookies').checked = preferences.analytics || false;
                document.getElementById('functionality-cookies').checked = preferences.functionality || false;
                document.getElementById('marketing-cookies').checked = preferences.marketing || false;
            } catch (e) {
                console.error('Error loading cookie preferences:', e);
            }
        }
    }

    savePreferences() {
        const preferences = {
            essential: true,
            analytics: document.getElementById('analytics-cookies').checked,
            functionality: document.getElementById('functionality-cookies').checked,
            marketing: document.getElementById('marketing-cookies').checked,
            timestamp: new Date().toISOString()
        };
        
        this.setCookie(this.cookieName, JSON.stringify(preferences), this.cookieExpiry);
        this.hideBanner();
        this.hidePreferences();
        this.loadCookies(preferences);
        
        console.log('Cookie preferences saved:', preferences);
    }

    loadCookies(preferences) {
        // Load Google Analytics if analytics cookies are accepted
        if (preferences.analytics && typeof gtag !== 'undefined') {
            this.loadGoogleAnalytics();
        }

        // Load other third-party services based on preferences
        if (preferences.functionality) {
            this.loadFunctionalityCookies();
        }

        if (preferences.marketing) {
            this.loadMarketingCookies();
        }

        // Fire custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
            detail: preferences
        }));
    }

    loadGoogleAnalytics() {
        // Example Google Analytics loading
        // Replace with your actual GA tracking ID
        if (!document.querySelector('script[src*="googletagmanager"]')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID';
            document.head.appendChild(script);

            script.onload = () => {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'GA_TRACKING_ID');
            };
        }
    }

    loadFunctionalityCookies() {
        // Load functionality-related third-party services
        console.log('Loading functionality cookies');
    }

    loadMarketingCookies() {
        // Load marketing-related third-party services
        console.log('Loading marketing cookies');
    }

    addEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('cookie-modal');
            if (modal && e.target === modal) {
                this.hidePreferences();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePreferences();
            }
        });
    }

    // Method to check current consent status (for other scripts)
    getConsentStatus() {
        const consent = this.getCookie(this.cookieName);
        if (consent) {
            try {
                return JSON.parse(consent);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Method to revoke consent (for settings page)
    revokeConsent() {
        document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        location.reload();
    }
}

// Initialize cookie consent when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});

// Global function for cookie policy page
function openCookiePreferences() {
    if (window.cookieConsent) {
        window.cookieConsent.showPreferences();
    } else {
        alert('Cookie consent system is loading. Please try again in a moment.');
    }
}
