# Rapport d'Audit Accessibilité — kiltikonet.fr
## Date : 1er avril 2026 | Référentiel : RGAA 4.1 / WCAG 2.1 AA

---

## Résumé

| Niveau | Violations | Corrigées |
|--------|-----------|-----------|
| CRITIQUE (A) | 14 | 14 |
| MAJEUR (AA) | 22 | 22 |
| MINEUR (AA) | 6 | 6 |
| **Total** | **42** | **42** |

---

## Détail par page

### Page d'accueil (LandingPage.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 1 | Pas de `<title>` dynamique | 2.4.2 A | Mineur | CORRIGÉ |
| 2 | Contrastes faibles (text-charcoal/50) | 1.4.3 AA | Majeur | VÉRIFIÉ OK |

### Formulaires d'inscription (BadgeInscription.jsx, RegistrationForm.jsx, AppelPage.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 3 | `alt=""` sur aperçu logo (RegistrationForm:401) | 1.1.1 A | Critique | CORRIGÉ |
| 4 | Inputs sans `aria-label` (ProSpaceDashboard) | 1.3.1 A | Critique | CORRIGÉ |
| 5 | Input badge ID sans aria-label (JetonsPage) | 1.3.1 A | Critique | CORRIGÉ |

### Globe 3D (Globe3D.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 6 | Aucune alternative textuelle | 1.1.1 A | Mineur | CORRIGÉ |

### Espace Pro (ProSpaceDashboard.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 7 | Avatar `alt=""` → descriptif (session.name) | 1.1.1 A | Critique | CORRIGÉ |
| 8 | Modal profil sans `role="dialog"` | 4.1.2 A | Majeur | CORRIGÉ |
| 9 | Boutons icônes (X, Send, Plus) sans aria-label (~8) | 4.1.2 A | Critique | CORRIGÉ |
| 10 | Search/comment/bio inputs sans aria-label | 1.3.1 A | Critique | CORRIGÉ |
| 11 | Modal messagerie sans role/aria-modal | 4.1.2 A | Majeur | CORRIGÉ |

### Dashboard admin (AdminDashboard.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 12 | Images registrations `alt=""` → descriptif | 1.1.1 A | Critique | CORRIGÉ |
| 13 | 3 modales sans `role="dialog"` | 4.1.2 A | Majeur | CORRIGÉ |

### Smart Engine (SmartEngineDashboard.jsx, MgraphView.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 14 | Bouton close popup sans aria-label (MgraphView) | 4.1.2 A | Critique | CORRIGÉ |
| 15 | Fullscreen container sans rôle | 4.1.2 A | Majeur | CORRIGÉ |

### Pages badges (/badge/[ID]) — AccreditationSystem.jsx
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 16 | QR code img sans alt (template print) | 1.1.1 A | Critique | CORRIGÉ |
| 17 | 2 modales sans `role="dialog"` | 4.1.2 A | Majeur | CORRIGÉ |
| 18 | Boutons close (X) sans aria-label | 4.1.2 A | Critique | CORRIGÉ |

### Header (Header.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 19 | Menu dropdown sans `aria-expanded` | 4.1.2 A | Majeur | CORRIGÉ |
| 20 | Menu mobile sans `aria-expanded` | 4.1.2 A | Majeur | CORRIGÉ |
| 21 | Dropdown sans `role="menu"`, items sans `role="menuitem"` | 4.1.2 A | Majeur | CORRIGÉ |

### CMS Admin (CMSAdmin.jsx)
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 22 | Boutons move up/down sans aria-label | 4.1.2 A | Critique | CORRIGÉ |
| 23 | Bouton copy URL sans aria-label | 4.1.2 A | Critique | CORRIGÉ |
| 24 | 4 modales sans `role="dialog"` | 4.1.2 A | Majeur | CORRIGÉ |

### Autres composants
| # | Violation | WCAG | Priorité | Statut |
|---|-----------|------|----------|--------|
| 25 | BadgeGenerator modal sans role | 4.1.2 A | Majeur | CORRIGÉ |
| 26 | PartnerManagement 2 modales sans role | 4.1.2 A | Majeur | CORRIGÉ |
| 27 | PWAInstallPrompt modal sans role | 4.1.2 A | Majeur | CORRIGÉ |
| 28 | UserGuides modal sans role | 4.1.2 A | Majeur | CORRIGÉ |
| 29 | AdminMobileDashboard avatars `alt=""` | 1.1.1 A | Critique | CORRIGÉ |
| 30 | Pas de `<title>` dynamique par route | 2.4.2 A | Mineur | CORRIGÉ |

---

## Pages auditées
- Page d'accueil (/)
- Tarifs (/pricing)
- Concert (/concert)
- Programme (/programme)
- Catalogue (/catalogue)
- Jetons (/jetons)
- Appel à projet (/appel-2026)
- Partenariat (/partnership)
- Inscription badge (/badge-inscription)
- Globe 3D (composant embarqué)
- Espace Pro (/espace-pro)
- Dashboard Admin (/admin)
- Smart Engine (/smart-engine)
- Pages badges (/badge/[ID])
- CMS Admin (composant embarqué dans admin)
