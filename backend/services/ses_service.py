"""
AWS SES Email Service — 7 templates CC2026
Palette: fond #0C0818 · violet #3B0764 · or #C9A84C
"""
import os
import io
import logging
import asyncio
import base64
import qrcode
from datetime import datetime, timezone
from typing import Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
SES_FROM_EMAIL = os.environ.get("SES_FROM_EMAIL", "noreply@kiltikonet.fr")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "cc@kiltikonet.fr")
APP_URL = os.environ.get("BASE_URL", "https://kiltikonet.fr")


def _get_ses_client():
    return boto3.client(
        "ses",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def _generate_qr_base64(data: str, size: int = 200) -> str:
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#3B0764", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ============ BASE TEMPLATE ============
def _wrap_template(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0C0818;font-family:'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0818;">
<tr><td align="center" style="padding:20px 0;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1040;border-radius:12px;overflow:hidden;">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#3B0764,#6B21A8);padding:30px;text-align:center;">
  <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:2px;">CULTURE CONNECT 2026</h1>
  <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;">22 Mai 2026 · Parc de La Savane · Fort-de-France</p>
</td></tr>
<!-- Content -->
<tr><td style="padding:30px;color:#e0d8f0;line-height:1.7;font-size:15px;">
{content}
</td></tr>
<!-- Footer -->
<tr><td style="background:#0C0818;padding:20px 30px;text-align:center;border-top:1px solid #3B0764;">
  <p style="color:#C9A84C;margin:0 0 5px;font-size:12px;">Factory Maker Studio (EURL) · CVLN Group</p>
  <p style="color:rgba(255,255,255,0.4);margin:0;font-size:11px;">kiltikonet.fr · cc@kiltikonet.fr</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""


# ============ 7 TEMPLATES ============

def template_bienvenue(prenom: str, badge_id: str, frek_id: str, qr_token: str) -> str:
    qr_b64 = _generate_qr_base64(f"{APP_URL}/activer-badge/{qr_token}")
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">Bienvenue {prenom} !</h2>
<p>Votre inscription a bien ete enregistree pour <strong style="color:#C9A84C;">Culture Connect 2026</strong>.</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
  <p style="color:rgba(255,255,255,0.6);margin:0 0 10px;font-size:12px;">VOTRE BADGE</p>
  <p style="color:#C9A84C;font-size:22px;font-weight:bold;margin:0 0 5px;">{badge_id}</p>
  <p style="color:rgba(255,255,255,0.5);margin:0 0 15px;font-size:12px;">FREK-ID: {frek_id}</p>
  <img src="data:image/png;base64,{qr_b64}" alt="QR Code" style="width:160px;height:160px;border-radius:8px;"/>
  <p style="color:rgba(255,255,255,0.5);margin:10px 0 0;font-size:11px;">Scannez pour activer votre badge</p>
</div>
<a href="{APP_URL}/activer-badge/{qr_token}" style="display:inline-block;background:#C9A84C;color:#0C0818;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;margin:10px 0;">
  Activer mon Badge
</a>
<p style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:20px;">Conservez cet email — il contient votre QR code d'acces.</p>
""")


def template_wallet_recharge(prenom: str, badge_id: str, pack_name: str, jetons_ajoutes: int, nouveau_solde: int) -> str:
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">Rechargement confirme !</h2>
<p>Bonjour {prenom},</p>
<p>Votre porte-monnaie Culture Connect a bien ete recharge.</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
  <p style="color:rgba(255,255,255,0.6);margin:0 0 5px;font-size:12px;">PACK {pack_name.upper()}</p>
  <p style="color:#C9A84C;font-size:36px;font-weight:bold;margin:0;">+{jetons_ajoutes} Jetons</p>
  <hr style="border:none;border-top:1px solid #3B0764;margin:15px 0;"/>
  <p style="color:rgba(255,255,255,0.6);margin:0 0 5px;font-size:12px;">SOLDE ACTUEL</p>
  <p style="color:#fff;font-size:28px;font-weight:bold;margin:0;">{nouveau_solde} Jetons CC</p>
</div>
<p>Badge: <strong style="color:#C9A84C;">{badge_id}</strong></p>
<p style="color:rgba(255,255,255,0.5);font-size:13px;">1 Jeton CC = 1.50EUR de valeur faciale sur l'evenement.</p>
""")


def template_rappel_j15(prenom: str, badge_id: str) -> str:
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">J-15 — On vous attend !</h2>
<p>Bonjour {prenom},</p>
<p>Plus que <strong style="color:#C9A84C;">15 jours</strong> avant Culture Connect 2026 !</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 10px;">Votre badge <strong style="color:#C9A84C;">{badge_id}</strong> est pret.</p>
  <p style="margin:0 0 10px;">Pensez a recharger vos Jetons CC pour profiter de toutes les experiences du Parc de La Savane.</p>
</div>
<a href="{APP_URL}/jetons" style="display:inline-block;background:#C9A84C;color:#0C0818;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;">
  Recharger mes Jetons
</a>
""")


def template_rappel_j1(prenom: str, badge_id: str) -> str:
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">C'est demain !</h2>
<p>Bonjour {prenom},</p>
<p><strong style="color:#C9A84C;">Culture Connect 2026</strong> c'est demain, 22 Mai !</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 10px;">Votre badge: <strong style="color:#C9A84C;">{badge_id}</strong></p>
  <p style="margin:0 0 10px;">Lieu: <strong>Parc de La Savane, Fort-de-France</strong></p>
  <p style="margin:0;">Presentez votre QR code a l'entree.</p>
</div>
<p style="color:rgba(255,255,255,0.5);font-size:13px;">N'oubliez pas votre QR code (email de bienvenue) !</p>
""")


def template_jour_j(prenom: str, badge_id: str) -> str:
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">Jour J — Bienvenue !</h2>
<p>Bonjour {prenom},</p>
<p style="font-size:18px;"><strong style="color:#C9A84C;">Culture Connect 2026</strong> commence maintenant !</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 10px;">Badge: <strong style="color:#C9A84C;">{badge_id}</strong></p>
  <p style="margin:0 0 10px;">Ouverture des portes: <strong>9h00</strong></p>
  <p style="margin:0;">Scene principale: <strong>10h00</strong></p>
</div>
<p>Scannez votre badge a l'entree pour valider votre presence. Profitez de chaque instant !</p>
""")


def template_merci_j1(prenom: str, badge_id: str) -> str:
    return _wrap_template(f"""
<h2 style="color:#C9A84C;margin:0 0 15px;">Merci {prenom} !</h2>
<p>Culture Connect 2026 s'est acheve, et vous en avez fait partie.</p>
<div style="background:#0C0818;border:1px solid #3B0764;border-radius:8px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 10px;">Votre badge <strong style="color:#C9A84C;">{badge_id}</strong> reste actif.</p>
  <p style="margin:0 0 10px;">Vos Jetons CC non utilises seront convertis pour CC2027 (Option A : 100%).</p>
</div>
<p>La reconnexion ne fait que commencer. A l'annee prochaine !</p>
<p style="color:#C9A84C;font-weight:bold;">— L'equipe Culture Connect</p>
""")


def template_admin_alert(alert_type: str, details: str) -> str:
    return _wrap_template(f"""
<h2 style="color:#ff4444;margin:0 0 15px;">ALERTE ADMIN</h2>
<div style="background:#2a0000;border:1px solid #ff4444;border-radius:8px;padding:20px;margin:20px 0;">
  <p style="color:#ff4444;font-weight:bold;margin:0 0 10px;">{alert_type}</p>
  <p style="margin:0;color:#e0d8f0;">{details}</p>
  <p style="margin:10px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">{datetime.now(timezone.utc).isoformat()}</p>
</div>
""")


# ============ SEND FUNCTIONS ============

async def _send_ses_email(to_email: str, subject: str, html_body: str) -> dict:
    """Send email via AWS SES"""
    try:
        ses = _get_ses_client()
        response = await asyncio.to_thread(
            ses.send_email,
            Source=SES_FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
            },
        )
        msg_id = response.get("MessageId", "unknown")
        logger.info(f"SES email sent to {to_email}: {msg_id}")
        return {"status": "sent", "message_id": msg_id}
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_msg = e.response["Error"]["Message"]
        logger.error(f"SES error [{error_code}]: {error_msg}")
        return {"status": "error", "error": f"{error_code}: {error_msg}"}
    except Exception as e:
        logger.error(f"SES send failed: {e}")
        return {"status": "error", "error": str(e)}


async def send_bienvenue(to_email: str, prenom: str, badge_id: str, frek_id: str, qr_token: str) -> dict:
    html = template_bienvenue(prenom, badge_id, frek_id, qr_token)
    return await _send_ses_email(to_email, f"Bienvenue {prenom} — Culture Connect 2026", html)


async def send_wallet_recharge(to_email: str, prenom: str, badge_id: str, pack_name: str, jetons_ajoutes: int, nouveau_solde: int) -> dict:
    html = template_wallet_recharge(prenom, badge_id, pack_name, jetons_ajoutes, nouveau_solde)
    return await _send_ses_email(to_email, "Rechargement confirme — Culture Connect 2026", html)


async def send_rappel_j15(to_email: str, prenom: str, badge_id: str) -> dict:
    html = template_rappel_j15(prenom, badge_id)
    return await _send_ses_email(to_email, "J-15 Culture Connect 2026 — Preparez-vous !", html)


async def send_rappel_j1(to_email: str, prenom: str, badge_id: str) -> dict:
    html = template_rappel_j1(prenom, badge_id)
    return await _send_ses_email(to_email, "C'est demain ! Culture Connect 2026", html)


async def send_jour_j(to_email: str, prenom: str, badge_id: str) -> dict:
    html = template_jour_j(prenom, badge_id)
    return await _send_ses_email(to_email, "Jour J — Culture Connect 2026 commence !", html)


async def send_merci_j1(to_email: str, prenom: str, badge_id: str) -> dict:
    html = template_merci_j1(prenom, badge_id)
    return await _send_ses_email(to_email, "Merci — Culture Connect 2026", html)


async def send_admin_alert(alert_type: str, details: str) -> dict:
    html = template_admin_alert(alert_type, details)
    return await _send_ses_email(ADMIN_EMAIL, f"[ALERTE] {alert_type}", html)
