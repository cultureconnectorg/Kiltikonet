# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amerique Latine et la Diaspora par la culture. Wallet Universel Kilti-Tokens, Stripe omnicanal, Growth Engine 4000 ghosts.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB
- **Fintech**: Stripe Checkout omnicanal, Wallet Universel (KT), FREK-ID terminal

## Design System Premium
- Fond: `#0a0a0b` (OLED Black)
- Or blanc: `#E8D5A0`
- Police: DM Sans
- Texte secondaire: `#72727a`

## Implemente

### Securite FREK-ID (DONE - 02/04/2026)
- **FREK-ID unique** : Alphabet A-Z+0-9 (36^8 = 2.8 trillion combos), collision-proof avec boucle while + index MongoDB unique sparse
- **Anti-Bot** : Rate limiting 5/heure par IP, blocage emails jetables (44 domaines), cooldown OTP 60s
- **Anti-Fraude** : 1 email = 1 FREK-ID, detection IP suspecte (3+ inscriptions = flag), admin exempt du rate limit
- **Future** : Possibilite de lier numero de telephone ou OAuth Google/Apple

### Login/Inscription Unifie (DONE - 02/04/2026)
- Magic Link avec auto-inscription + FREK-ID unique
- Footer Legal : Factory Maker Studio EURL, Conditions KT, Politique FREK-ID
- Trust Signals : Chiffre E2E, RGPD, KT Ecosystem

### Profil & Parametres (DONE - 02/04/2026)
- FREK-ID visible, selecteur de langue FR/EN/ES/PT
- RGPD : Export JSON + Suppression de compte (KT non rembourses)

### Fintech — Monnaie Forte (DONE - 01/04/2026)
- 5 packs : Decouverte 10EUR→15KT, Culture 25EUR→40KT, Diaspora 50EUR→85KT, VIP 100EUR→180KT, Partenaire 500EUR→1000KT
- Metadata Stripe : Factory Maker Studio EURL
- Dashboard Admin Financier : Float/Passif/Cash

### Growth Engine v2 (DONE)
- 4000 profils : 40% Afrique / 40% Latino / 20% Diaspora

## Securite
- MongoDB unique sparse index sur frek_id
- Rate limit : 5 req/heure par IP (in-memory)
- OTP cooldown : 60s par email
- 44 domaines email jetables bloques
- Detection IP suspecte (3+ auto_register/heure)
- Admin bypass exempt de toutes les securites

## Tests
- iteration_56: Backend 100% — Security hardening
- iteration_55: Backend 100% (19/19), Frontend 100%
- iteration_54: Backend 100% (23/23), Frontend 100%

## Backlog
### P1
- Messages standalone page
- Network standalone page

### P2
- Mgraph D3.js interactif

### P3
- Vue 3D SmartEngine
- AWS SES sortie Sandbox

## Credentials
- Admin: cultureconnectorg@gmail.com / 000000
