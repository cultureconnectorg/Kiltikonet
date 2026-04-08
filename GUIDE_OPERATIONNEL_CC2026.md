# Guide Opérationnel CC2026 — Équipe Terrain

## 1. Scanner NFC — /scan

### Accès
Naviguer vers `https://kiltikonet.fr/scan` sur le téléphone de l'agent.
Se connecter avec les identifiants agent fournis.

### Scanner un badge
1. Cliquer sur "Scanner" dans l'interface
2. Pointer la caméra vers le QR code du badge
3. Attendre la confirmation :
   - **Vert** : Badge valide, accès autorisé
   - **Rouge** : Badge invalide ou expiré
   - **Orange** : Badge en attente de validation

### Débiter des jetons
1. Scanner le badge du participant
2. Cliquer "Débiter"
3. Entrer le montant en JCC et la raison
4. Confirmer — le solde est mis à jour en temps réel

### Synchronisation Baserow
Chaque scan est automatiquement synchronisé avec la table Baserow 865847.
En cas de problème de connexion, les scans sont mis en file d'attente et envoyés dès le retour du réseau.

---

## 2. Export CSV Twina

### Depuis l'admin
1. Se connecter sur `/admin/core` avec un compte admin
2. Naviguer vers la section "Badges"
3. Cliquer "Exporter CSV Twina"
4. Le fichier CSV est téléchargé avec les colonnes :
   - FREK-ID, Nom, Prénom, Type badge, Statut, NFC ID

### Format attendu par Twina
Le CSV est formaté selon les spécifications Twina pour l'impression des badges physiques.

---

## 3. Valider un badge (Admin)

1. Se connecter sur `/pro` → COCKPIT → onglet CC2026
2. Ou depuis `/admin/core`
3. Trouver le badge dans la liste
4. Changer le statut :
   - `en_attente` → `valide` (badge approuvé)
   - `valide` → `imprime` (envoyé à l'impression)
   - `imprime` → `remis` (badge remis physiquement)

---

## 4. Broadcaster une notification

### Push notification (temps réel)
1. Se connecter sur `/pro` → COCKPIT → onglet "Santé"
2. Descendre jusqu'à "Broadcast CC2026"
3. Remplir :
   - **Titre** : titre court (ex: "Ouverture des portes")
   - **Message** : contenu détaillé
4. Cliquer "Envoyer à tous"
5. Tous les utilisateurs ayant activé les notifications recevront le message

### Email de masse
1. Se connecter sur `/admin/core`
2. Section "Broadcast Email"
3. Remplir sujet, contenu, segment cible
4. Cliquer "Envoyer"

---

## 5. Gestion d'urgence technique

### L'application ne répond plus
1. Vérifier la connexion internet
2. Essayer un rafraîchissement forcé (Ctrl+Shift+R ou vider le cache)
3. Si le problème persiste, contacter l'équipe technique

### Un badge ne scanne pas
1. Vérifier que le QR code est lisible (pas abîmé, pas trop sombre)
2. Essayer avec un autre appareil
3. Chercher le badge manuellement par FREK-ID dans l'admin
4. Valider manuellement si nécessaire

### Un paiement Stripe échoue
1. Vérifier que la carte du participant est valide
2. Le participant peut réessayer depuis son wallet
3. En cas de problème persistant, contacter Stripe support

### Contacts et escalade
| Rôle | Contact |
|------|---------|
| Admin plateforme | cultureconnectorg@gmail.com |
| Support technique | Via le canal Slack #cc2026-tech |
| Stripe support | dashboard.stripe.com |
| Brevo support | app.brevo.com |

---

## 6. Dashboard CC2026 — Métriques

Accessible depuis `/pro` → COCKPIT → onglet CC2026 (admin uniquement).

Métriques disponibles :
- **J-XX** : Countdown jusqu'au 20 mai 2026
- **Badges émis / validés / imprimés / remis** : Pipeline de production
- **NFC actifs** : Badges avec puce NFC activée
- **JCC vendus** : Total des jetons vendus
- **Revenus** : Total en euros
- **Inscriptions 24h** : Nouvelles inscriptions
- **Scans NFC 24h** : Activité terrain

Auto-rafraîchissement toutes les 30 secondes.
