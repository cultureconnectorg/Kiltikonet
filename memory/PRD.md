# Culture Connect 2026 - PRD

## Original Problem Statement
Build a bilingual (French/English) accreditation platform and landing website for "Culture Connect 2026", a professional cultural market event dedicated to Afro-descendant creative industries, taking place in Fort-de-France, Martinique from May 20-23, 2026.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components, react-qr-code
- **Backend**: FastAPI (Python) with Motor async MongoDB, reportlab (PDF), qrcode
- **Database**: MongoDB
- **Payments**: Stripe Checkout
- **Images**: Cloudinary
- **Emails**: Resend
- **Hosting**: Kubernetes container

### Routes
- `/` - Landing page
- `/pricing` - Accreditation pricing (50€, 150€, 300€)
- `/register` or `/inscription` - Multi-step registration form
- `/confirmation` - Payment success confirmation
- `/partenaires` - Partnership packages (2500€, 5000€, 10000€)
- `/partenaire/confirmation` - Partnership payment success
- `/catalog` - Public participant directory
- `/participant/:participantId` - **NEW** Public participant profile (QR code destination)
- `/admin` - Admin dashboard (password: CC2026admin)

### API Endpoints

#### NEW - Export & Profiles (Feb 26, 2026)
- `GET /api/registrations/export/filtered` - **NEW** Targeted CSV export
  - Params: profile_type, expertise_tags (comma-separated), status, country
  - Returns: CSV file with matching registrations
- `GET /api/participant/{id}` - **NEW** Public participant profile for QR validation
- `GET /api/participant/{id}/badge` - **NEW** Generate PDF badge with QR code

#### NEW - Partner Management (Feb 26, 2026)
- `GET /api/partners/admin` - Get all partners with full details + sponsored registrations
- `POST /api/partners/manual` - Create partner manually (without payment)
- `PATCH /api/partners/{id}` - Update partner details
- `DELETE /api/partners/{id}` - Delete partner
- `POST /api/partners/{id}/sponsor/{reg_id}` - Link partner as sponsor to registration
- `DELETE /api/partners/{id}/sponsor/{reg_id}` - Unlink sponsor from registration

#### Stripe Payment
- `POST /api/create-checkout-session` - Create Stripe checkout
- `GET /api/checkout/status/{session_id}` - Check payment status
- `POST /api/webhook/stripe` - Handle Stripe webhooks

#### API v1 - Statistics & Intelligence
- `GET /api/v1/stats` - Aggregated statistics with by_expertise and top_5_interests
- `GET /api/v1/search/match` - Smart Connect matching with expertise parameter
- `GET /api/v1/search/suggestions` - Partner suggestions based on expertise overlap

#### Registrations
- `POST /api/registrations` - Create registration
- `POST /api/registrations/manual` - Admin manual creation (with expertise_tags)
- `GET /api/registrations` - List registrations
- `GET /api/registrations/export` - Full CSV export
- `DELETE /api/registrations/{id}` - Delete registration
- `PATCH /api/registrations/{id}/status` - Update status
- `PATCH /api/registrations/{id}/catalog` - Toggle catalog visibility

## What's Been Implemented (Feb 26, 2026)

### Export Ciblé - FULL STACK ✅ (NEW)
- [x] **Backend endpoint** `/api/registrations/export/filtered` with query params
- [x] **Admin modal** "Export ciblé" with profile type dropdown
- [x] **Multi-select expertise tags** (12 tags available)
- [x] **Dynamic filename** based on selected filters
- [x] **CSV includes expertise_tags** column

### Badges PDF & QR Codes - FULL STACK ✅ (NEW)
- [x] **Public profile page** `/participant/:id` with status banner
- [x] **Status validation** "ACCRÉDITATION VALIDÉE" for approved participants
- [x] **PDF badge generation** using reportlab with QR code
- [x] **QR code points to profile URL** for entry validation
- [x] **Badge modal** in catalog with real QR code (react-qr-code)
- [x] **Download buttons** on profile page and badge modal

### Gestion Partenaires - FULL STACK ✅ (NEW)
- [x] **Admin tab "Partenaires"** in dashboard
- [x] **Full CRUD** for partners (add, edit, delete)
- [x] **Tier badges** Bronze/Silver/Gold with colors
- [x] **Link participants** to partners as sponsors
- [x] **Unlink sponsors** from participants
- [x] **Show on landing toggle** for partner visibility
- [x] **Sponsored registrations count** per partner

### Networking & Business Intelligence - FULL STACK ✅
- [x] **12 expertise tags** based on flyer categories
- [x] **Top 5 Interests chart** in admin dashboard
- [x] **Marché Culturel indicator** for 40+ stands segmentation
- [x] **Catalog filters** by expertise with similarity scores
- [x] **Colored pills** on participant cards

### Previous Implementations ✅
- Stripe payment flows (accreditation + partnership)
- Cloudinary image upload
- Resend email notifications
- Admin CRUD operations
- Multi-step registration form
- Public catalog with live data

## MongoDB Collections
- `registrations` - All accredited participants (includes expertise_tags, sponsored_by)
- `partners` - Partnership records (includes show_on_landing, vip_accreditations)
- `payment_transactions` - Stripe session tracking

## Test Results (Feb 26, 2026)
- ✅ Export Ciblé: Backend 100% (5 tests) | Frontend 100% (3 features)
- ✅ Badges & QR: Backend 100% (4 tests) | Frontend 100% (6 features)
- ✅ Partner Management: Backend 100% (8 tests) | Frontend 100% (10 features)

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- All payment flows
- Email notifications
- Image storage
- Networking & Intelligence
- **Export ciblé**
- **Badges PDF avec QR**
- **Gestion partenaires**

### P2 (Medium Priority) - DONE ✅
- PDF badge generation with real QR code
- Admin partner management section

### P3 (Low Priority)
- Multi-language admin interface
- Batch actions in admin
- Bulk email sending

## Files Reference

### Backend
- `/app/backend/server.py` - All API endpoints
- `/app/backend/tests/test_new_features.py` - Tests for new features

### Frontend
- `/app/frontend/src/components/ParticipantProfile.jsx` - **NEW** Public profile page
- `/app/frontend/src/components/BadgeGenerator.jsx` - **UPDATED** Badge modal with QR
- `/app/frontend/src/components/PartnerManagement.jsx` - **NEW** Partner admin section
- `/app/frontend/src/components/AdminDashboard.jsx` - **UPDATED** Tabs + Export modal
- `/app/frontend/src/components/RegistrationForm.jsx` - Registration form
- `/app/frontend/src/components/CatalogPage.jsx` - Catalog with filters
- `/app/frontend/src/lib/translations.js` - expertiseTags array

## Security Notes
- Stripe webhook signature verified with STRIPE_WEBHOOK_SECRET
- Admin password: CC2026admin (should be changed for production)
- Public profile excludes sensitive data (email, phone, siret)
- Badge PDF only available for approved participants
