# Culture Connect 2026 - PRD

## Original Problem Statement
Build a bilingual (French/English) accreditation platform and landing website for "Culture Connect 2026", a professional cultural market event dedicated to Afro-descendant creative industries, taking place in Fort-de-France, Martinique from May 20-23, 2026.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI, react-qr-code, jspdf
- **Backend**: FastAPI (Python), Motor (async MongoDB), reportlab (PDF), qrcode, resend
- **Database**: MongoDB
- **Payments**: Stripe Checkout
- **Images**: Cloudinary
- **Emails**: Resend (with PDF attachments)

### Routes
- `/` - Landing page (bilingual)
- `/pricing` - Accreditation pricing (50€, 150€, 300€)
- `/register` or `/inscription` - Multi-step registration form
- `/confirmation` - Payment success confirmation
- `/partenaires` - Partnership packages (2500€, 5000€, 10000€)
- `/partenaire/confirmation` - Partnership payment success
- `/catalog` - Public participant directory with expertise filters
- `/participant/:participantId` - Public participant profile (QR code destination)
- `/admin` - Admin dashboard (password: CC2026admin)

## What's Been Implemented

### Feb 26, 2026 - Latest Features ✅

#### 1. Partner Notifications (P2) ✅
- Automatic email to partner when their sponsored participant is approved
- `notify_partner_of_approval()` function sends styled HTML email
- Uses `sponsored_by` field in registrations to link to partners

#### 2. Bulk Email with Badges (P3) ✅
- `POST /api/registrations/batch/send-badges` endpoint
- Sends PDF badges as email attachments via Resend
- Can send to specific IDs or ALL approved participants
- Max 50 badges per batch

#### 3. Batch Actions (P3) ✅
- Checkboxes in admin table for multi-select
- Batch action bar: "X sélectionné(s)"
- "Approuver la sélection" - batch approve up to 50
- "Envoyer les badges sélectionnés" - batch send badges
- "Envoyer les badges à tous les approuvés (N)" - send to all

#### 4. Multilingual Admin (P3) ✅
- Complete FR/EN translations for admin interface
- Language toggle in header (data-testid="language-toggle")
- All labels, buttons, and messages translated
- Partners management in both languages

### Previous Features ✅

#### Export Ciblé (P1) ✅
- Modal with profile type dropdown
- Multi-select expertise tags filter
- Dynamic CSV export with filtered results

#### Badges PDF avec QR (P2) ✅
- Public profile page `/participant/:id`
- PDF badge generation with QR code
- Badge modal with real QR code
- Download buttons

#### Gestion Partenaires (P2) ✅
- Admin tab for partners
- Full CRUD operations
- Sponsor linking to participants
- Tier badges (Bronze/Silver/Gold)

#### Networking & Intelligence ✅
- 12 expertise tags based on flyer
- Top 5 Interests chart in dashboard
- Catalog filters by expertise
- Smart matching algorithm

## API Endpoints

### Batch Operations
- `POST /api/registrations/batch/approve` - Batch approve (max 50)
- `POST /api/registrations/batch/send-badges` - Batch send badges

### Export
- `GET /api/registrations/export/filtered` - Filtered CSV export

### Profiles & Badges
- `GET /api/participant/{id}` - Public profile
- `GET /api/participant/{id}/badge` - Generate PDF badge

### Partners
- `GET /api/partners/admin` - Full partner list with sponsored regs
- `POST /api/partners/manual` - Create partner
- `PATCH /api/partners/{id}` - Update partner
- `DELETE /api/partners/{id}` - Delete partner
- `POST /api/partners/{id}/sponsor/{reg_id}` - Link sponsor
- `DELETE /api/partners/{id}/sponsor/{reg_id}` - Unlink sponsor

### Core
- `POST /api/create-checkout-session` - Stripe checkout
- `POST /api/webhook/stripe` - Stripe webhook
- `GET /api/v1/stats` - Statistics with expertise
- `GET /api/v1/search/match` - Smart matching

## Test Results (Feb 26, 2026)
- Backend: 100% (11/11 batch tests + 17 previous)
- Frontend: 100% (20/20 features + 19 previous)

## Prioritized Backlog

### Completed ✅
- P0: All payment flows, email notifications, image storage
- P1: Export ciblé, networking features
- P2: Badges PDF, partner management, partner notifications
- P3: Bulk email, batch actions, multilingual admin

### Remaining (Low Priority)
- P3: Batch email logs/history
- P3: Advanced analytics dashboard
- P3: Partner dashboard portal

## Security Notes
- Admin password: CC2026admin (change for production)
- Stripe webhook signature verified
- Public profiles exclude sensitive data (email, phone, siret)
- Batch operations limited to 50 per request
