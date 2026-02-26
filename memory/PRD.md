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

#### API v1 - Statistics & Intelligence
- `GET /api/v1/stats` - Aggregated statistics for BI tools
  - Response: summary, by_profile_type, by_country, by_tier, **by_expertise**, **top_5_interests**, conversion_rates, partners
- `GET /api/v1/stats/territories` - Detailed territorial analysis
- `GET /api/v1/search/match` - Smart Connect matching API
  - Params: profile_type, sector, country, **expertise** (comma-separated), limit
  - Response: filtered results with relevance scoring and **shared_interests** count
- `GET /api/v1/search/suggestions` - Partner suggestions for a participant
  - Params: participant_id
  - Response: complementary profiles with **shared expertise tags**

#### Registrations
- `POST /api/registrations` - Create registration (direct, without payment)
- `POST /api/registrations/manual` - Admin manual creation (supports **expertise_tags**)
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

### Networking & Business Intelligence - FULL STACK ✅ (NEW)
- [x] **Expertise Tags System**: 12 tags based on flyer categories
  - Primary: Artistes, Labels, Institutions, Presse, Marché Culturel
  - Secondary: Musique, Arts Visuels, Digital, Production, Export, Spectacle Vivant, Financement
- [x] **Registration Form**: Step 3 "Objectifs & Réseautage" with multi-select tags (max 5)
- [x] **Admin Dashboard Insights**: "Top 5 des Intérêts / Expertises" bar chart with colored bars
- [x] **Marché Culturel Indicator**: Special highlight for 40+ stands segmentation
- [x] **Catalog Filters**: Multi-select expertise tags with toggle selection
- [x] **Colored Pills**: Expertise tags displayed as pills on participant cards
- [x] **Similarity Score**: "X intérêt(s) commun(s)" badge when filtering
- [x] **Smart Match API**: `/api/v1/search/match` with expertise parameter and shared_interests
- [x] **Smart Suggestions**: Partner recommendations based on expertise overlap

### Data Integrity - FULL STACK ✅
- [x] **Image Upload Anticipé**: Upload vers Cloudinary AVANT redirection Stripe
- [x] **Nouveaux champs capturés**: `profile_image_url`, `siret_number`, `website_url`, `expertise_tags`
- [x] **Label contextuel**: "Photo de presse" pour artistes, "Logo institutionnel" pour entreprises
- [x] **Metadata Stripe étendu**: Tous les champs transmis via checkout session
- [x] **Webhook sécurisé**: Extraction complète des metadata vers MongoDB

### Stripe Integration ✅
- [x] **Accreditation Payment Flow** (50€, 150€, 300€)
- [x] **Partnership Payment Flow** (2,500€, 5,000€, 10,000€)

### Cloudinary Integration ✅
- [x] Logo/photo upload stored in Cloudinary

### Resend Email Integration ✅
- [x] Confirmation, Approval, Rejection, and Partner Welcome emails

### Admin Dashboard ✅
- [x] Full CRUD: Add, Delete, Update status, Toggle catalog visibility
- [x] Filtering, search, CSV export
- [x] **Insights Management** with conversion rates, profile/territory distribution
- [x] **Top 5 Expertise Chart** with bar visualization

## MongoDB Collections
- `registrations` - All accredited participants (includes expertise_tags array)
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

## Test Results (Feb 26, 2026)
- ✅ API /api/v1/stats returns by_expertise and top_5_interests (100% backend tests)
- ✅ API /api/v1/search/match with expertise filter (100% backend tests)
- ✅ Admin Dashboard Insights with Top 5 chart (100% frontend verified)
- ✅ Catalog expertise filters with pills and similarity (100% frontend verified)
- ✅ Registration Form Step 3 expertise tags (100% frontend verified)

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- All payment flows implemented
- Email notifications working
- Image storage via Cloudinary
- **Networking & Intelligence features**

### P1 (High Priority) - DONE ✅
- Webhook signature verification
- Admin CRUD operations
- Catalog live data

### P2 (Medium Priority)
- PDF badge generation with real QR code
- Admin partner management section
- Bulk email sending

### P3 (Low Priority)
- Analytics dashboard enhancements
- Multi-language admin interface
- Batch actions in admin

## Files Reference

### Backend
- `/app/backend/server.py` - All API endpoints

### Frontend
- `/app/frontend/src/components/RegistrationForm.jsx` - Multi-step form with expertise tags
- `/app/frontend/src/components/AdminDashboard.jsx` - Full admin with Insights
- `/app/frontend/src/components/CatalogPage.jsx` - Catalog with expertise filters
- `/app/frontend/src/lib/translations.js` - expertiseTags array

## Security Notes
- Stripe webhook signature verified with STRIPE_WEBHOOK_SECRET
- Admin password: CC2026admin (should be changed for production)
- All sensitive keys stored in environment variables
