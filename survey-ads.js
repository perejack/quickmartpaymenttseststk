// Survey Ads Configuration and Management

const SURVEY_PLATFORM_URL = 'https://www.earntasking.online/?ref=quickmart';

const surveyAds = [
    {
        id: 'survey-1',
        imageUrl: 'images/survay1.jpeg',
        ctaText: 'Start Earning Now',
        badge: '🔥 50,000+ USERS'
    },
    {
        id: 'survey-2',
        imageUrl: 'images/survay2.jpeg',
        ctaText: 'Claim KES 200 Now',
        badge: '⚡ LIMITED TIME'
    },
    {
        id: 'survey-3',
        imageUrl: 'images/survay3.jpeg',
        ctaText: 'Start Making Money',
        badge: '💰 HIGH PAYING'
    },
    {
        id: 'survey-4',
        imageUrl: 'images/survay4.jpeg',
        ctaText: 'Get Cash Now',
        badge: '⚡ INSTANT PAY'
    }
];

// Survey Ad Manager
class SurveyAdManager {
    constructor() {
        this.currentAdIndex = 0;
        this.popupShown = false;
    }

    // Create inline ad HTML
    createInlineAd(adIndex = 0) {
        const ad = surveyAds[adIndex % surveyAds.length];
        
        return `
            <div class="survey-ad-container">
                <div class="survey-ad" onclick="surveyAdManager.handleAdClick('${ad.id}', '${SURVEY_PLATFORM_URL}')">
                    <span class="survey-ad-badge">Sponsored</span>
                    <button class="survey-ad-close" onclick="event.stopPropagation(); surveyAdManager.closeInlineAd(this)">×</button>
                    <img src="${ad.imageUrl}" alt="Survey Ad">
                    <button class="survey-ad-cta">
                        ${ad.ctaText}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Create popup ad HTML
    createPopupAd(adIndex = 0) {
        const ad = surveyAds[adIndex % surveyAds.length];
        
        return `
            <div class="popup-ad-overlay" onclick="surveyAdManager.closePopup()"></div>
            <div class="popup-ad">
                <div class="survey-ad" onclick="surveyAdManager.handleAdClick('${ad.id}', '${SURVEY_PLATFORM_URL}')">
                    <div class="popup-ad-progress"></div>
                    <span class="survey-ad-badge">Sponsored</span>
                    <button class="survey-ad-close" onclick="event.stopPropagation(); surveyAdManager.closePopup()">×</button>
                    <img src="${ad.imageUrl}" alt="Survey Ad">
                    <button class="survey-ad-cta">
                        ${ad.ctaText}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Show inline ad in a container
    showInlineAd(containerId, adIndex = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const index = adIndex !== null ? adIndex : this.currentAdIndex;
        container.innerHTML = this.createInlineAd(index);
        
        // Track impression
        this.trackEvent('survey_ad_impression', surveyAds[index % surveyAds.length].id);
        
        this.currentAdIndex = (this.currentAdIndex + 1) % surveyAds.length;
    }

    // Show popup ad
    showPopupAd(delay = 2000, adIndex = null) {
        if (this.popupShown) return;
        
        setTimeout(() => {
            const index = adIndex !== null ? adIndex : this.currentAdIndex;
            const popupContainer = document.createElement('div');
            popupContainer.id = 'survey-popup-container';
            popupContainer.innerHTML = this.createPopupAd(index);
            document.body.appendChild(popupContainer);
            
            // Track impression
            this.trackEvent('survey_popup_impression', surveyAds[index % surveyAds.length].id);
            
            this.popupShown = true;
            this.currentAdIndex = (this.currentAdIndex + 1) % surveyAds.length;
            
            // Auto-close after 8 seconds
            setTimeout(() => {
                this.closePopup();
            }, 8000);
        }, delay);
    }

    // Close inline ad
    closeInlineAd(button) {
        const container = button.closest('.survey-ad-container');
        if (container) {
            container.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                container.remove();
            }, 300);
        }
    }

    // Close popup ad
    closePopup() {
        const popupContainer = document.getElementById('survey-popup-container');
        if (popupContainer) {
            popupContainer.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                popupContainer.remove();
                this.popupShown = false;
            }, 300);
        }
    }

    // Handle ad click
    handleAdClick(adId, url) {
        // Track click
        this.trackEvent('survey_ad_click', adId, url);
        
        // Open URL in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Track events (Google Analytics removed)
    trackEvent(eventName, adId, url = null) {
        // Tracking disabled
    }
}

// Initialize the ad manager
const surveyAdManager = new SurveyAdManager();
