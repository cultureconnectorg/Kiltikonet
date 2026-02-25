# Culture Connect 2026 - PRD

## Original Problem Statement
Build a bilingual (French/English) accreditation platform and landing website for "Culture Connect 2026", a professional cultural market event dedicated to Afro-descendant creative industries, taking place in Fort-de-France, Martinique from May 20-23, 2026.

## Architecture

### Tech Stack
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Hosting**: Kubernetes container

### Routes
- `/` - Landing page (7 sections)
- `/register` - Registration form
- `/confirmation` - Success confirmation
- `/admin` - Admin dashboard (password protected)

### API Endpoints
- `POST /api/registrations` - Create registration
- `GET /api/registrations` - List registrations (with filters)
- `PATCH /api/registrations/{id}/status` - Update status
- `GET /api/registrations/export` - CSV export
- `POST /api/admin/verify` - Admin authentication
- `GET /api/countries` - Get countries list

## User Personas

1. **Cultural Professional** - Artists, labels, booking agencies seeking accreditation
2. **Institutional Representative** - Government, educational institutions
3. **Press** - Media professionals covering the event
4. **Event Administrator** - Managing registrations and approvals

## Core Requirements (Static)

### Landing Page Sections
1. Hero with animated gold particles, title, CTAs
2. Vision - 3 columns (Connecter, Structurer, Rayonner)
3. Programme - 4 days (May 20-23, Day 3 highlighted)
4. Marché Culturel - 5 zones
5. Partenaires - 6 partner placeholders
6. CTA - Gold background with registration button
7. Contact - Form + social icons + footer

### Registration Form Fields
- Full name, organization, country, email, phone
- Profile type (Artist/Label/Booking Agency/Institution/Press/Other)
- Stand request with category
- Bio (300 chars max), logo upload, language preference, how heard

### Admin Dashboard
- Password: CC2026admin
- Statistics cards (Total, Pending, Approved, Rejected)
- Filters (profile type, country, stand, status)
- Status management with colored dots
- CSV export

## What's Been Implemented (Feb 25, 2026)

### Landing Page ✅
- [x] Hero section with gold particle animation
- [x] Vision section with 3 columns
- [x] Programme section with 4 days, Day 3 highlighted
- [x] Marché Culturel section with 5 zone cards
- [x] Partners section with 6 placeholders
- [x] Gold CTA section
- [x] Contact form with email, Instagram, LinkedIn
- [x] Footer with Factory Maker Studio credit

### Registration System ✅
- [x] Full registration form with all fields
- [x] File upload for logo/photo
- [x] Form validation
- [x] Confirmation screen with gold checkmark
- [x] French message display

### Admin Dashboard ✅
- [x] Password protection
- [x] Statistics cards
- [x] 4 filter dropdowns
- [x] Registration table with status dots
- [x] Status dropdown for updates
- [x] CSV export functionality
- [x] Logout button

### Bilingual Support ✅
- [x] French/English toggle in header
- [x] All content translated
- [x] Persistent language preference

### Design ✅
- [x] Dark background (#0C0B09)
- [x] Gold accents (#D2A53C)
- [x] Cream white text (#EDE8DC)
- [x] Playfair Display serif for titles
- [x] Space Grotesk for body
- [x] Smooth scroll animations
- [x] Mobile responsive

## Prioritized Backlog

### P0 (Critical) - DONE
- All core features implemented

### P1 (High Priority)
- Email notification integration (SendGrid/Resend)
- Actual file storage (S3/cloud)
- Enhanced admin features (bulk actions, search)

### P2 (Medium Priority)
- Partner logo upload in admin
- Programme detail pages
- Registration confirmation email
- PDF badge generation

### P3 (Low Priority)
- Analytics dashboard
- Multi-language admin interface
- Export to PDF
- Registration QR codes

## Next Tasks

1. **Email Integration** - Set up SendGrid/Resend for confirmation emails
2. **Cloud Storage** - Move file uploads to S3 or similar
3. **Partner Logos** - Allow admin to upload actual partner logos
4. **Enhanced Search** - Add search functionality to admin dashboard
