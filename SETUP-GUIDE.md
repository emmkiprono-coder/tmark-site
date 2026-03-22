# TMarK Website - Backend Integration Setup Guide

## Architecture Overview

```
tmark-website/
  index.html          - Main site with AI chat widget + weather bar
  staff.html           - Staff portal
  vercel.json          - Deployment config
  api/
    chat.js            - AI Booking Concierge (Anthropic Claude)
    weather.js         - Live NOAA marine weather (FREE, no key)
    payment.js         - Stripe deposits + payments
    sms.js             - Twilio SMS notifications
    email.js           - Resend email confirmations
    calendar.js        - Google Calendar availability
  images/              - Optimized photos (6.9MB total)
  css/                 - Stylesheets
  js/                  - Scripts
```

## Step 1: Deploy to Vercel

1. Upload all files to GitHub repo `tmark-website`
2. Import on Vercel (vercel.com/new)
3. Framework: Other (NOT Vite)
4. Build Command: leave empty
5. Deploy

## Step 2: Weather (WORKS IMMEDIATELY - No setup needed)

The NOAA weather API is free and requires no API key.
After deploying, visit your site and you'll see a live weather bar
between the hero and about sections showing:
- Current temperature
- Wind speed and direction  
- Charter recommendation based on conditions

The AI concierge also gets weather context automatically.

## Step 3: AI Booking Agent (Anthropic)

1. Go to console.anthropic.com
2. Create an API key
3. In Vercel: Settings > Environment Variables > Add:
   - Key: ANTHROPIC_API_KEY
   - Value: sk-ant-... (your key)
4. Redeploy

Cost: ~$0.003 per conversation (very cheap, Sonnet model)

## Step 4: Stripe Payments

### Which Stripe option is right for TMarK?

**Stripe Standard** (Recommended for launch)
- 2.9% + $0.30 per transaction
- No monthly fee
- Handles deposits, full payments, refunds
- Instant setup

**How to set up:**
1. Go to stripe.com and create an account
2. Complete identity verification (takes 1-2 days)
3. Get your API keys from Dashboard > Developers > API keys
4. In Vercel: Settings > Environment Variables > Add:
   - Key: STRIPE_SECRET_KEY
   - Value: sk_live_... (or sk_test_... for testing first)
5. Redeploy

**How payments work:**
- Guest completes booking through AI chat or form
- Site creates a Stripe Checkout session (50% deposit)
- Guest pays on Stripe's secure hosted page
- Guest returns to site with confirmation
- Balance collected day-of (cash, card, or second Stripe charge)

**Test mode:** Use sk_test_... key first. Stripe provides test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## Step 5: Twilio SMS

1. Go to twilio.com and sign up (free trial includes $15 credit)
2. Get a phone number (Twilio assigns one)
3. Find your credentials: Console > Account Info
4. In Vercel: Settings > Environment Variables > Add:
   - TWILIO_ACCOUNT_SID = AC...
   - TWILIO_AUTH_TOKEN = your auth token
   - TWILIO_PHONE_NUMBER = +1234567890 (your Twilio number)
5. Redeploy

**SMS templates built in:**
- booking_confirmation: Sent when booking is confirmed
- booking_reminder: Sent 24hrs before charter
- weather_alert: Sent if weather changes
- review_request: Sent 24hrs after charter
- passport_update: Sent when new stamp/tier earned

Cost: ~$1/month for number + $0.0079 per SMS

## Step 6: Resend Email

1. Go to resend.com and sign up (free tier: 3,000 emails/month)
2. Add your domain (tmarkcharters.com) or use their test domain
3. Get API key from Dashboard
4. In Vercel: Settings > Environment Variables > Add:
   - RESEND_API_KEY = re_...
   - FROM_EMAIL = TMarK Charters <bookings@tmarkcharters.com>
5. Redeploy

**Email templates built in (TMarK branded):**
- booking_confirmation: Full booking details, what to bring, meeting point
- booking_reminder: Day-before reminder with weather and dock info
- review_request: Post-charter review request with link
- passport_milestone: Tier upgrade celebration with reward details

## Step 7: Google Calendar

1. Go to console.cloud.google.com
2. Create a project (or use existing)
3. Enable "Google Calendar API"
4. Create an API key (Credentials > Create Credentials > API Key)
5. Create 4 Google Calendars (one per vessel):
   - TMarK RIB
   - Ndinda
   - Emily Faye
   - Rita
6. Make each calendar public (Settings > Access permissions > Make available to public)
7. Copy each calendar ID (Settings > Integrate calendar > Calendar ID)
8. In Vercel: Settings > Environment Variables > Add:
   - GOOGLE_CALENDAR_API_KEY = your API key
   - GCAL_TMARK = calendar-id@group.calendar.google.com
   - GCAL_NDINDA = calendar-id@group.calendar.google.com
   - GCAL_EMILY_FAYE = calendar-id@group.calendar.google.com
   - GCAL_RITA = calendar-id@group.calendar.google.com
9. Redeploy

## All Environment Variables Summary

| Variable | Service | Required For |
|----------|---------|-------------|
| ANTHROPIC_API_KEY | Anthropic | AI Chat Agent |
| STRIPE_SECRET_KEY | Stripe | Payments |
| TWILIO_ACCOUNT_SID | Twilio | SMS |
| TWILIO_AUTH_TOKEN | Twilio | SMS |
| TWILIO_PHONE_NUMBER | Twilio | SMS |
| RESEND_API_KEY | Resend | Email |
| FROM_EMAIL | Resend | Email |
| GOOGLE_CALENDAR_API_KEY | Google | Calendar |
| GCAL_TMARK | Google | Calendar |
| GCAL_NDINDA | Google | Calendar |
| GCAL_EMILY_FAYE | Google | Calendar |
| GCAL_RITA | Google | Calendar |

## Monthly Cost Estimate (at 20 bookings/month)

| Service | Cost |
|---------|------|
| Vercel hosting | Free |
| NOAA Weather | Free |
| Anthropic (AI chat) | ~$2-5 |
| Stripe | 2.9% + $0.30 per txn (no base fee) |
| Twilio | ~$2-5 |
| Resend | Free (under 3K emails) |
| Google Calendar | Free |
| **Total fixed** | **~$5-10/month** |

## What's Working Now (no setup needed)

- Full website with all 28 feedback changes
- Image optimization (32MB > 6.9MB)
- Lazy loading on all images
- Weather bar (NOAA, free)
- Chat widget UI (shows fallback if no API key)
- All API endpoints ready to go

## Next Phase: Admin Dashboard + Smart Pricing

Once the core integrations are live, the next build includes:
- Admin dashboard at /staff.html showing all bookings, revenue, weather
- Smart pricing engine that adjusts rates based on demand/weather/season
- Passport tracker with customer login
- Automated review collection pipeline
