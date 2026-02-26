# Culture Connect 2026 - PRD

## Original Problem Statement
Build a bilingual (French/English) accreditation platform and landing website for "Culture Connect 2026", a professional cultural market event dedicated to Afro-descendant creative industries, taking place in Fort-de-France, Martinique from May 20-23, 2026.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with Motor async MongoDB
- **Database**: MongoDB
- **Payments**: Stripe Checkout
- **Images**: Cloudinary
- **Emails**: Resend
- **Hosting**: Kubernetes container

### Design Theme: "High-End Institutional"
- **Background**: #F4F1EA (paper white)
- **Text**: #1A1A1A (charcoal)
- **Accent Primary**: #A65D47 (terracotta)
- **Accent Secondary**: #4A5D4E (sage green)
- **Borders**: #E5E0D8 (light border)
- **Fonts**: Lora (serif titles), Syne (sans-serif body), Playfair Display (headings)

### Routes
- `/` - Landing page
- `/pricing` - Accreditation pricing (50€, 150€, 300€)
- `/register` or `/inscription` - Multi-step registration form
- `/confirmation` - Payment success confirmation
- `/partenaires` - Partnership packages (2500€, 5000€, 10000€)
- `/partenaire/confirmation` - Partnership payment success
- `/catalog` - Public participant directory
- `/admin` - Admin dashboard (password: CC2026admin)

### API Endpoints
#### Stripe Payment
- `POST /api/create-checkout-session` - Create Stripe checkout (accreditation or partnership)
- `GET /api/checkout/status/{session_id}` - Check payment status
- `POST /api/webhook/stripe` - Handle Stripe webhooks (signature verified)
- `GET /api/stripe-public-key` - Get Stripe public key

#### API v1 - Statistics & Intelligence (NEW)
- `GET /api/v1/stats` - Aggregated statistics for BI tools (Tableau, PowerBI compatible)
  - Response: summary, by_profile_type, by_country, by_tier, conversion_rates, partners
- `GET /api/v1/stats/territories` - Detailed territorial analysis
  - Response: territories with profile/tier breakdown, top_5 countries
- `GET /api/v1/search/match` - Smart Connect matching API
  - Params: profile_type, sector, country, limit
  - Response: filtered results with relevance scoring
- `GET /api/v1/search/suggestions` - Partner suggestions for a participant
  - Params: participant_id
  - Response: complementary profiles based on sector

#### Registrations
- `POST /api/registrations` - Create registration (direct, without payment)
- `POST /api/registrations/manual` - Admin manual creation
- `GET /api/registrations` - List registrations (with filters)
- `DELETE /api/registrations/{id}` - Delete registration
- `PATCH /api/registrations/{id}/status` - Update status
- `PATCH /api/registrations/{id}/catalog` - Toggle catalog visibility
- `GET /api/registrations/export` - CSV export

#### Other
- `GET /api/catalog` - Get catalog-visible participants
- `GET /api/partners` - Get partners for landing page
- `POST /api/admin/verify` - Admin authentication
- `GET /api/countries` - Get distinct countries

## What's Been Implemented (Feb 26, 2026)

### Data Integrity - FULL STACK ✅
- [x] **Image Upload Anticipé**: Upload vers Cloudinary AVANT redirection Stripe
- [x] **Nouveaux champs capturés**: `profile_image_url`, `siret_number`, `website_url`
- [x] **Label contextuel**: "Photo de presse" pour artistes, "Logo institutionnel" pour entreprises
- [x] **Metadata Stripe étendu**: Tous les champs transmis via checkout session
- [x] **Webhook sécurisé**: Extraction complète des metadata vers MongoDB

### Stripe Integration ✅
- [x] **Accreditation Payment Flow**
  - Emerging: 50€
  - Professional: 150€
  - Institutional: 300€
  - Redirects to Stripe Checkout
  - Creates registration with "pending" status after payment
  - Sends confirmation email

- [x] **Partnership Payment Flow**
  - Bronze: 2,500€ (2 VIP accreditations)
  - Silver: 5,000€ (5 VIP accreditations)
  - Gold: 10,000€ (10 VIP accreditations)
  - Creates partner record + VIP accreditations automatically
  - Sends partner welcome email

### Cloudinary Integration ✅
- [x] Logo/photo upload stored in Cloudinary
- [x] Returns secure URL stored in MongoDB
- [x] Images displayed in catalog and badges

### Resend Email Integration ✅
- [x] **Confirmation Email**: Sent after registration/payment
- [x] **Approval Email**: Sent when admin approves (with event details)
- [x] **Rejection Email**: Sent when admin rejects (courteous message)
- [x] **Partner Welcome Email**: Sent after partnership payment
- [x] Design: White background, terracotta accents, professional layout

### Admin Dashboard ✅
- [x] Full CRUD: Add, Delete, Update status, Toggle catalog visibility
- [x] Filtering and search
- [x] CSV export
- [x] Statistics cards

### Frontend Pages ✅
- [x] Landing page with partner logos section
- [x] Pricing page with 3 accreditation tiers
- [x] Registration form (3 steps) → Stripe payment
- [x] Partnership page with 3 tiers → Stripe payment
- [x] Confirmation pages for both flows
- [x] Public participant catalog
- [x] Badge generator with QR code placeholder

### MongoDB Collections
- `registrations` - All accredited participants
- `partners` - Partnership records
- `payment_transactions` - Stripe session tracking

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
CLOUDINARY_CLOUD_NAME=dnabomyak
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
RESEND_API_KEY=***
SENDER_EMAIL=Culture Connect <onboarding@resend.dev>
STRIPE_API_KEY=sk_live_***
STRIPE_PUBLIC_KEY=pk_live_***
BASE_URL=https://kiltikonet.fr
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://...
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_***
```

## Test Results
- ✅ Stripe Checkout session creation works
- ✅ Accreditation flow: Form → Stripe → Confirmation
- ✅ Partnership flow: Select tier → Form → Stripe → Confirmation
- ✅ Email templates render correctly
- ✅ Cloudinary upload functional

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- All payment flows implemented
- Email notifications working
- Image storage via Cloudinary

### P1 (High Priority)
- Webhook signature verification (STRIPE_WEBHOOK_SECRET)
- Resend domain verification for custom sender email
- Partner logos display on landing page

### P2 (Medium Priority)
- PDF badge generation with real QR code
- Admin partner management section
- Bulk email sending

### P3 (Low Priority)
- Analytics dashboard
- Multi-language admin interface
- Batch actions in admin

## Files Reference

### Backend
- `/app/backend/server.py` - All API endpoints with Stripe, Cloudinary, Resend

### Frontend
- `/app/frontend/src/components/RegistrationForm.jsx` - Stripe checkout integration
- `/app/frontend/src/components/ConfirmationScreen.jsx` - Payment verification
- `/app/frontend/src/components/PartnershipPage.jsx` - Partnership tiers + payment
- `/app/frontend/src/components/PartnerConfirmation.jsx` - Partnership success
- `/app/frontend/src/components/AdminDashboard.jsx` - Full CRUD admin
- `/app/frontend/src/App.js` - Routes configuration

## Security Notes
- Stripe webhook signature should be verified with STRIPE_WEBHOOK_SECRET
- Admin password: CC2026admin (should be changed for production)
- All sensitive keys stored in environment variables
