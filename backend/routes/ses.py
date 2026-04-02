"""
SES Domain Verification Routes — DKIM/SPF/DMARC for kiltikonet.fr
"""
import os
import logging
import asyncio
from fastapi import APIRouter, HTTPException

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ses", tags=["ses"])

AWS_REGION = os.environ.get("AWS_REGION", "eu-west-1")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
DOMAIN = "kiltikonet.fr"


def _get_ses_client():
    return boto3.client(
        "ses",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def _get_sesv2_client():
    return boto3.client(
        "sesv2",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


@router.get("/domain/status")
async def domain_status():
    """Get full domain verification status for kiltikonet.fr"""
    try:
        ses = _get_ses_client()

        # Get verification status
        verification = await asyncio.to_thread(
            ses.get_identity_verification_attributes,
            Identities=[DOMAIN]
        )
        verif_attrs = verification.get("VerificationAttributes", {}).get(DOMAIN, {})

        # Get DKIM status
        dkim = await asyncio.to_thread(
            ses.get_identity_dkim_attributes,
            Identities=[DOMAIN]
        )
        dkim_attrs = dkim.get("DkimAttributes", {}).get(DOMAIN, {})

        # Get sending quota
        quota = await asyncio.to_thread(ses.get_send_quota)

        # Get notification attributes
        notif = await asyncio.to_thread(
            ses.get_identity_notification_attributes,
            Identities=[DOMAIN]
        )
        notif_attrs = notif.get("NotificationAttributes", {}).get(DOMAIN, {})

        return {
            "domain": DOMAIN,
            "verification": {
                "status": verif_attrs.get("VerificationStatus", "NotStarted"),
                "token": verif_attrs.get("VerificationToken", ""),
            },
            "dkim": {
                "enabled": dkim_attrs.get("DkimEnabled", False),
                "status": dkim_attrs.get("DkimVerificationStatus", "NotStarted"),
                "tokens": dkim_attrs.get("DkimTokens", []),
            },
            "quota": {
                "max_24h": quota.get("Max24HourSend", 0),
                "sent_last_24h": quota.get("SentLast24Hours", 0),
                "max_send_rate": quota.get("MaxSendRate", 0),
            },
            "notifications": {
                "bounce_topic": notif_attrs.get("BounceTopic", ""),
                "complaint_topic": notif_attrs.get("ComplaintTopic", ""),
                "delivery_topic": notif_attrs.get("DeliveryTopic", ""),
            },
            "dns_records_needed": {
                "spf": {
                    "type": "TXT",
                    "name": DOMAIN,
                    "value": "v=spf1 include:amazonses.com ~all",
                },
                "dmarc": {
                    "type": "TXT",
                    "name": f"_dmarc.{DOMAIN}",
                    "value": "v=DMARC1; p=quarantine; rua=mailto:dmarc@kiltikonet.fr; pct=100",
                },
                "dkim_cname": [
                    {
                        "type": "CNAME",
                        "name": f"{token}._domainkey.{DOMAIN}",
                        "value": f"{token}.dkim.amazonses.com",
                    }
                    for token in dkim_attrs.get("DkimTokens", [])
                ],
                "verification_txt": {
                    "type": "TXT",
                    "name": f"_amazonses.{DOMAIN}",
                    "value": verif_attrs.get("VerificationToken", ""),
                },
            },
        }
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domain/verify")
async def verify_domain():
    """Initiate domain verification for kiltikonet.fr"""
    try:
        ses = _get_ses_client()

        # Verify domain identity
        result = await asyncio.to_thread(
            ses.verify_domain_identity,
            Domain=DOMAIN
        )
        verification_token = result.get("VerificationToken", "")

        # Enable DKIM signing
        dkim_result = await asyncio.to_thread(
            ses.verify_domain_dkim,
            Domain=DOMAIN
        )
        dkim_tokens = dkim_result.get("DkimTokens", [])

        return {
            "status": "verification_initiated",
            "domain": DOMAIN,
            "verification_token": verification_token,
            "dkim_tokens": dkim_tokens,
            "action_required": "Add the following DNS records to your domain registrar:",
            "dns_records": {
                "1_verification_txt": {
                    "type": "TXT",
                    "name": f"_amazonses.{DOMAIN}",
                    "value": verification_token,
                    "purpose": "Domain verification",
                },
                "2_spf_txt": {
                    "type": "TXT",
                    "name": DOMAIN,
                    "value": "v=spf1 include:amazonses.com ~all",
                    "purpose": "SPF - Authorize SES to send emails",
                },
                "3_dmarc_txt": {
                    "type": "TXT",
                    "name": f"_dmarc.{DOMAIN}",
                    "value": "v=DMARC1; p=quarantine; rua=mailto:dmarc@kiltikonet.fr; pct=100",
                    "purpose": "DMARC - Policy for failed authentication",
                },
                "4_dkim_cnames": [
                    {
                        "type": "CNAME",
                        "name": f"{token}._domainkey.{DOMAIN}",
                        "value": f"{token}.dkim.amazonses.com",
                        "purpose": f"DKIM token {i+1}/3",
                    }
                    for i, token in enumerate(dkim_tokens)
                ],
            },
        }
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domain/enable-dkim")
async def enable_dkim():
    """Enable DKIM signing for the domain"""
    try:
        ses = _get_ses_client()
        await asyncio.to_thread(
            ses.set_identity_dkim_enabled,
            Identity=DOMAIN,
            DkimEnabled=True
        )
        return {"status": "dkim_enabled", "domain": DOMAIN}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/production-request")
async def request_production():
    """Request production access (leave sandbox)"""
    try:
        sesv2 = _get_sesv2_client()
        result = await asyncio.to_thread(
            sesv2.get_account
        )

        production_access = result.get("ProductionAccessEnabled", False)
        sending_enabled = result.get("SendingEnabled", False)

        return {
            "account_status": {
                "enforcement_status": result.get("EnforcementStatus", "UNKNOWN"),
                "production_access": production_access,
                "sending_enabled": sending_enabled,
                "review_status": result.get("Details", {}).get("ReviewDetails", {}).get("Status", "UNKNOWN"),
            },
            "sandbox_mode": not production_access,
            "next_steps": (
                "Production access already granted. You can send to any email address."
                if production_access
                else "Submit a production access request via AWS Console: SES > Account Dashboard > Request Production Access"
            ),
        }
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def ses_stats():
    """Get SES sending statistics"""
    from services.ses_service import get_ses_send_stats
    return get_ses_send_stats()
