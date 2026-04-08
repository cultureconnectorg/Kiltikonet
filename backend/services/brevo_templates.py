"""Brevo transactional email templates — OLED #0a0a0b + Gold #f2ca50."""

STYLES = """
<style>
body{margin:0;padding:0;background:#0a0a0b;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;}
.container{max-width:500px;margin:0 auto;padding:40px 20px;background:#0a0a0b;color:#e0e0e0;}
.card{background:#1a1a1c;padding:30px;border-radius:16px;text-align:center;border:1px solid rgba(242,202,80,0.25);}
.gold{color:#f2ca50;} .dim{color:#888;} .small{font-size:12px;color:#666;} .tiny{font-size:10px;color:#555;}
.badge{background:#0a0a0b;padding:20px;border-radius:12px;margin:20px 0;border:1px solid rgba(242,202,80,0.2);text-align:center;}
.badge-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.3em;}
.badge-value{font-size:22px;font-weight:bold;color:#f2ca50;font-family:'Courier New',monospace;margin-top:8px;}
.btn{display:inline-block;background:#f2ca50;color:#0a0a0b;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;margin-top:20px;letter-spacing:0.05em;}
.footer{text-align:center;padding-top:24px;border-top:1px solid rgba(255,255,255,0.05);margin-top:24px;}
.footer a{color:#f2ca50;text-decoration:underline;font-size:10px;}
</style>
"""

FOOTER = """
<div class="footer">
    <p class="tiny">kiltikonet.fr — CC2026</p>
    <p class="tiny" style="margin-top:4px;"><a href="https://kiltikonet.fr/pro">Mon Espace Pro</a></p>
    <p style="font-size:8px;color:#444;margin-top:8px;">Conformement au RGPD, vous pouvez vous desabonner a tout moment depuis vos parametres kiltikonet.</p>
</div>
"""


def badge_confirmation(prenom: str, type_badge: str, frek_id: str, badge_id: str) -> tuple:
    """Template 1: Badge CC2026 confirmé."""
    subject = f"Ton badge CC2026 est pret — {prenom}"
    html = f"""<!DOCTYPE html><html><head>{STYLES}</head><body>
    <div class="container">
        <div class="card">
            <h1 class="gold" style="margin:0 0 8px 0;">Badge CC2026</h1>
            <p>Bonjour <strong>{prenom}</strong>,</p>
            <p class="dim">Ton badge pour Culture Connect 2026 est confirme.</p>
            <div class="badge"><div class="badge-label">Type</div><div class="badge-value">{type_badge}</div></div>
            <div class="badge"><div class="badge-label">FREK-ID</div><div class="badge-value">{frek_id}</div></div>
            <div class="badge"><div class="badge-label">QR Badge</div><div class="badge-value" style="font-size:14px;">kiltikonet.fr/badge/{badge_id}</div></div>
            <p class="small" style="margin-top:16px;">20-23 mai 2026 · La Savane, Fort-de-France</p>
            <p class="small">Ton badge est compatible NFC — presente-le a l'entree pour un acces instantane.</p>
            <a href="https://kiltikonet.fr/pro" class="btn">Mon Espace Pro</a>
        </div>
        {FOOTER}
    </div></body></html>"""
    return subject, html


def jeton_achat_confirmation(prenom: str, nb_jetons: int, solde_total: int) -> tuple:
    """Template 2: Jetons CC credites."""
    subject = f"Tes {nb_jetons} Jetons CC sont credites"
    html = f"""<!DOCTYPE html><html><head>{STYLES}</head><body>
    <div class="container">
        <div class="card">
            <h1 class="gold" style="margin:0 0 8px 0;">Jetons CC</h1>
            <p>Bonjour <strong>{prenom}</strong>,</p>
            <p class="dim">Tes jetons ont ete credites avec succes.</p>
            <div class="badge"><div class="badge-label">Jetons ajoutes</div><div class="badge-value">+{nb_jetons} JCC</div></div>
            <div class="badge"><div class="badge-label">Solde total</div><div class="badge-value">{solde_total} JCC</div></div>
            <p class="small" style="margin-top:16px;">Tes jetons n'expirent jamais — utilisables a CC2026 et toutes editions futures.</p>
            <a href="https://kiltikonet.fr/pro" class="btn">Mon Wallet</a>
        </div>
        {FOOTER}
    </div></body></html>"""
    return subject, html


def adhesion_confirmation(prenom: str, niveau: str, kt_offerts: int) -> tuple:
    """Template 3: Adhesion confirmee."""
    subject = f"Bienvenue en {niveau} — kiltikonet"
    html = f"""<!DOCTYPE html><html><head>{STYLES}</head><body>
    <div class="container">
        <div class="card">
            <h1 class="gold" style="margin:0 0 8px 0;">Adhesion Confirmee</h1>
            <p>Bonjour <strong>{prenom}</strong>,</p>
            <p class="dim">Tu fais maintenant partie du niveau <strong class="gold">{niveau}</strong>.</p>
            <div class="badge"><div class="badge-label">Niveau</div><div class="badge-value">{niveau}</div></div>
            <div class="badge"><div class="badge-label">KT offerts</div><div class="badge-value">+{kt_offerts} KT</div></div>
            <p class="small" style="margin-top:16px;">Tes nouveaux droits sont actifs immediatement dans l'Espace Pro.</p>
            <a href="https://kiltikonet.fr/pro" class="btn">Explorer</a>
        </div>
        {FOOTER}
    </div></body></html>"""
    return subject, html


def compte_suppression(prenom: str) -> tuple:
    """Template 4: Compte supprime."""
    subject = "Ton compte kiltikonet a ete supprime"
    html = f"""<!DOCTYPE html><html><head>{STYLES}</head><body>
    <div class="container">
        <div class="card">
            <h1 style="color:#e0e0e0;margin:0 0 8px 0;">Compte supprime</h1>
            <p>Bonjour <strong>{prenom}</strong>,</p>
            <p class="dim">Ton compte kiltikonet a ete supprime conformement a ta demande.</p>
            <div class="badge">
                <div class="badge-label">Conservation legale</div>
                <div style="font-size:14px;color:#e0e0e0;margin-top:8px;">Conformement a la loi, certaines donnees seront conservees pendant 5 ans.</div>
            </div>
            <p class="small" style="margin-top:16px;">Si tu souhaites recreer un compte, tu pourras le faire a tout moment sur kiltikonet.fr.</p>
            <p class="tiny" style="margin-top:12px;">Contact : support@kiltikonet.fr</p>
        </div>
        {FOOTER}
    </div></body></html>"""
    return subject, html
