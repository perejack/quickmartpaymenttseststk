# Survey Ads Implementation - QuickMart STK

## 📊 Overview
Survey ads have been successfully integrated into the QuickMart STK payment flow to monetize user interactions after payment completion or cancellation.

## 🎯 Ad Placement Strategy

### 1. **Successful Payment**
When a user completes payment successfully:
- ✅ **Inline Ad** appears below the success message (Survey Image 1)
- ✅ **Popup Ad** appears after 3 seconds (Survey Image 2)

### 2. **Payment Cancellation**
When a user clicks "Not Now" to cancel:
- ✅ **Inline Ad** appears immediately (Survey Image 3)
- ✅ **Popup Ad** appears after 2 seconds (Survey Image 4)
- ✅ Redirect delayed by 10 seconds to allow ad viewing

### 3. **Failed Payment**
When payment fails:
- ✅ **Inline Ad** appears after 1 second (Survey Image 4)
- ✅ **Popup Ad** appears after 3 seconds (Survey Image 3)

## 📁 Files Added

### 1. **survey-ads.css**
- Styles for inline and popup ads
- Responsive design for mobile and desktop
- Smooth animations and transitions

### 2. **survey-ads.js**
- `SurveyAdManager` class for managing ads
- Ad configuration with 4 survey images
- Click tracking with Google Analytics
- Popup and inline ad creation

### 3. **Images**
- `images/survay1.jpeg` - Survey ad 1
- `images/survay2.jpeg` - Survey ad 2
- `images/survay3.jpeg` - Survey ad 3
- `images/survay4.jpeg` - Survey ad 4

## 🎨 Features

### Ad Components
- **Sponsored Badge** - Clearly labeled as sponsored content
- **Close Button** - Users can dismiss ads
- **CTA Button** - Purple gradient "Start Earning" button
- **Click Tracking** - All clicks tracked via Google Analytics

### Popup Ads
- **Auto-dismiss** - Closes after 8 seconds
- **Progress Bar** - Visual indicator of time remaining
- **Backdrop** - Semi-transparent overlay
- **Smooth Animations** - Slide-down entrance effect

### Inline Ads
- **Responsive** - Adapts to screen size
- **Hover Effects** - Scales up on hover
- **Click to Action** - Opens survey platform in new tab

## 📈 Analytics Tracking

All ad interactions are tracked with Google Analytics:

### Events Tracked:
1. **survey_ad_impression** - When ad is shown
2. **survey_ad_click** - When user clicks ad
3. **survey_popup_impression** - When popup appears
4. **survey_popup_click** - When popup is clicked

### Event Data:
```javascript
{
  ad_id: 'survey-1',
  ad_url: 'https://www.earntasking.online/?ref=quickmart',
  timestamp: '2025-01-06T09:00:00.000Z'
}
```

## 🔗 Survey Platform

**URL:** `https://www.earntasking.online/?ref=quickmart`

All ads link to this survey platform with a referral parameter to track conversions.

## 🎯 Usage

The ads are automatically shown based on user actions:

```javascript
// Show inline ad in a container
surveyAdManager.showInlineAd('container-id', adIndex);

// Show popup ad with delay
surveyAdManager.showPopupAd(delayMs, adIndex);

// Handle ad click (opens in new tab)
surveyAdManager.handleAdClick(adId, url);
```

## 📱 Responsive Design

Ads are fully responsive and work on:
- ✅ Desktop (600px max width)
- ✅ Tablet (90% width)
- ✅ Mobile (95% width)

## 🎨 Customization

### Change Survey Platform URL
Edit `survey-ads.js`:
```javascript
const SURVEY_PLATFORM_URL = 'https://your-platform.com/?ref=yourref';
```

### Modify Ad Timing
Edit `script.js`:
```javascript
// Change popup delay
surveyAdManager.showPopupAd(5000, 1); // 5 seconds

// Change redirect delay on cancel
setTimeout(() => {
    window.location.href = returnUrl;
}, 15000); // 15 seconds
```

### Update Ad Images
Replace images in the `images/` folder:
- `survay1.jpeg`
- `survay2.jpeg`
- `survay3.jpeg`
- `survay4.jpeg`

## ✅ Implementation Checklist

- [x] Survey images copied to `images/` folder
- [x] `survey-ads.css` created and linked
- [x] `survey-ads.js` created and loaded
- [x] Ads integrated into success flow
- [x] Ads integrated into cancel flow
- [x] Ads integrated into failed payment flow
- [x] Google Analytics tracking configured
- [x] Responsive design tested
- [x] Click-through functionality working

## 🚀 Next Steps

1. **Test the implementation** - Complete a payment and verify ads appear
2. **Monitor analytics** - Check Google Analytics for ad performance
3. **Optimize timing** - Adjust delays based on user behavior
4. **A/B test** - Try different ad images and CTAs

## 📊 Expected Results

- **Increased Revenue** - Monetize both successful and unsuccessful payment flows
- **High Visibility** - Ads shown at key decision points
- **User Engagement** - Multiple touchpoints with survey platform
- **Conversion Tracking** - Full analytics on ad performance

---

**Implementation Date:** January 6, 2025  
**Survey Platform:** EarnTasking  
**Tracking:** Google Analytics (AW-17499615938)
