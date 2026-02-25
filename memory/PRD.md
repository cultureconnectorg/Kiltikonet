# Culture Connect 2026 - PRD

## Original Problem Statement
Build a bilingual (French/English) accreditation platform and landing website for "Culture Connect 2026", a professional cultural market event dedicated to Afro-descendant creative industries, taking place in Fort-de-France, Martinique from May 20-23, 2026.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with Motor async MongoDB
- **Database**: MongoDB
- **Hosting**: Kubernetes container

### Design Theme: "High-End Institutional"
- **Background**: #F4F1EA (paper white)
- **Text**: #1A1A1A (charcoal)
- **Accent Primary**: #A65D47 (terracotta)
- **Accent Secondary**: #4A5D4E (sage green)
- **Borders**: #E5E0D8 (light border)
- **Fonts**: Lora (serif titles), Syne (sans-serif body), Playfair Display (headings)
- **Style**: No glassmorphism, no neon glow, clean and minimal

### Routes
- `/` - Landing page with 7 sections
- `/pricing` - Pricing tiers page (Émergent 50€, Professionnel 150€, Institutionnel 300€)
- `/register` - Multi-step registration form (3 steps)
- `/confirmation` - Success confirmation with badge preview
- `/catalog` - Public participant directory
- `/partnership` - Partner program page
- `/admin` - Admin dashboard (password protected: CC2026admin)

### API Endpoints
- `POST /api/registrations` - Create registration (form submission)
- `POST /api/registrations/manual` - Admin manual participant creation
- `GET /api/registrations` - List registrations (with filters)
- `DELETE /api/registrations/{id}` - Delete a registration
- `PATCH /api/registrations/{id}/status` - Update status (pending/approved/rejected)
- `PATCH /api/registrations/{id}/catalog` - Toggle catalog visibility
- `GET /api/catalog` - Get catalog-visible participants only
- `GET /api/registrations/export` - CSV export
- `POST /api/admin/verify` - Admin authentication
- `GET /api/countries` - Get distinct countries list

## User Personas

1. **Cultural Professional** - Artists, labels, booking agencies seeking accreditation
2. **Institutional Representative** - Government, educational institutions
3. **Press** - Media professionals covering the event
4. **Event Administrator** - Managing registrations and approvals

## What's Been Implemented (Feb 25, 2026)

### Landing Page ✅
- [x] Hero section with logo and CTAs
- [x] Vision section with 3 columns
- [x] Programme section with 4 days (Day 3 highlighted)
- [x] Marché Culturel section with 5 zone cards
- [x] Partners section with real partner names
- [x] CTA section
- [x] Contact form with email, Instagram, LinkedIn
- [x] Footer with Factory Maker Studio credit

### Pricing Page ✅
- [x] 3 pricing tiers: Émergent (50€), Professionnel (150€), Institutionnel (300€)
- [x] Feature comparison lists
- [x] Selection buttons linking to registration

### Registration System ✅
- [x] Multi-step form (3 steps: Identity, Activity, Goals)
- [x] All fields: name, org, country, email, phone, profile type, stand request, bio, logo upload
- [x] Dropdowns work correctly (profileType, country, howDidYouHear)
- [x] File upload for logo/photo (max 5MB)
- [x] Form validation with error highlighting
- [x] Confirmation screen with badge preview

### Admin Dashboard (FULL CRUD) ✅
- [x] Password protection (CC2026admin)
- [x] Statistics cards (Total, Pending, Approved, Rejected, In Catalog)
- [x] Filter dropdowns (status, profile type)
- [x] Search by name/org/email
- [x] Registration table with status badges
- [x] **ADD**: "Ajouter" button opens modal to create participant manually
- [x] **DELETE**: Trash icon with confirmation deletes participant
- [x] **CATALOG**: Eye toggle shows/hides participant from public catalog
- [x] **STATUS**: Quick status change buttons (approve/reject)
- [x] Detail panel on row click
- [x] CSV export functionality
- [x] Logout button

### Public Catalog ✅
- [x] Filterable directory of catalog-visible participants
- [x] Grid and list view modes
- [x] Profile cards with tier badges
- [x] Badge preview modal

### Partnership Page ✅
- [x] Partner benefits section
- [x] 3 partnership tiers (Argent, Or, Platine)
- [x] Contact form for partnership inquiries
- [x] Scroll-to-form from header link

### Badge Generator ✅
- [x] Visual badge with participant info
- [x] Tier-colored border
- [x] QR code placeholder
- [x] Download button (pending actual implementation)

### Bilingual Support ✅
- [x] French/English toggle in header
- [x] All content translated
- [x] Persistent language preference

### Design Theme ✅
- [x] "High-End Institutional" aesthetic applied to ALL pages
- [x] Consistent color palette throughout
- [x] Clean borders, no transparency effects
- [x] Serif/sans-serif font pairing
- [x] Mobile responsive

## Test Results (Feb 25, 2026)
- Backend: 13/13 tests passed (100%)
- Frontend: 15/15 tests passed (100%)
- Dropdown bug (P2): RESOLVED - was a false positive, all values captured correctly

## Prioritized Backlog

### P0 (Critical) - DONE ✅
- All core features implemented and tested

### P1 (High Priority)
- Email notification integration (SendGrid/Resend) - awaiting API key
- Actual file storage (S3/cloud) for logo uploads
- Real QR code generation for badges

### P2 (Medium Priority)
- PDF badge generation and download
- Partner logo upload in admin
- Programme detail pages
- Registration confirmation email

### P3 (Low Priority)
- Analytics dashboard
- Multi-language admin interface
- Export to PDF
- Bulk actions in admin

## Files Reference

### Backend
- `/app/backend/server.py` - All API endpoints

### Frontend Pages
- `/app/frontend/src/components/LandingPage.jsx`
- `/app/frontend/src/components/PricingPage.jsx`
- `/app/frontend/src/components/RegistrationForm.jsx`
- `/app/frontend/src/components/ConfirmationScreen.jsx`
- `/app/frontend/src/components/CatalogPage.jsx`
- `/app/frontend/src/components/PartnershipPage.jsx`
- `/app/frontend/src/components/AdminDashboard.jsx`
- `/app/frontend/src/components/AdminLogin.jsx`
- `/app/frontend/src/components/BadgeGenerator.jsx`
- `/app/frontend/src/components/Header.jsx`

### Config
- `/app/frontend/tailwind.config.js` - Custom theme colors
- `/app/frontend/src/index.css` - Global styles and CSS variables
