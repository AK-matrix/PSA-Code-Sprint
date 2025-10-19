"""
Email Service using Resend API
Sends professional incident reports with HTML templates
"""

import os
import resend
from datetime import datetime
from typing import Dict, Any, Optional

# Configure Resend API key
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SENDER_EMAIL = "alert@psacodesprint.arnavjhajharia.com"


def send_incident_report_email(
    recipient_email: str,
    incident_data: Dict[str, Any],
    pdf_attachment: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Send incident report email using Resend
    
    Args:
        recipient_email: Primary recipient email address
        incident_data: Dictionary containing incident information
        pdf_attachment: Optional PDF file as bytes
    
    Returns:
        Dictionary with success status and message
    """
    try:
        # Set API key
        resend.api_key = RESEND_API_KEY
        
        if not RESEND_API_KEY:
            return {
                "success": False,
                "error": "RESEND_API_KEY not configured in environment"
            }
        
        # Extract incident information
        case_id = incident_data.get("case_id", "N/A")
        alert_text = incident_data.get("alert_text", "")
        parsed_entities = incident_data.get("parsed_entities", {})
        analysis = incident_data.get("analysis", {})
        escalation_contact = incident_data.get("escalation_contact", {})
        
        module = parsed_entities.get("module", "Unknown")
        severity = parsed_entities.get("severity", "medium")
        urgency = parsed_entities.get("urgency", "medium")
        
        problem_statement = analysis.get("problem_statement", "N/A")
        resolution_summary = analysis.get("resolution_summary", "N/A")
        best_sop_id = analysis.get("best_sop_id", "N/A")
        reasoning = analysis.get("reasoning", "N/A")
        
        # Generate HTML email template
        html_content = generate_email_template(
            case_id=case_id,
            alert_text=alert_text,
            module=module,
            severity=severity,
            urgency=urgency,
            problem_statement=problem_statement,
            resolution_summary=resolution_summary,
            best_sop_id=best_sop_id,
            reasoning=reasoning,
            escalation_contact=escalation_contact
        )
        
        # Prepare email params
        email_params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "cc": [recipient_email],  # User's email as CC
            "subject": f"PSA Incident Report - {case_id} [{severity.upper()}]",
            "html": html_content,
        }
        
        # Add PDF attachment if provided
        if pdf_attachment:
            email_params["attachments"] = [{
                "filename": f"incident_report_{case_id}.pdf",
                "content": pdf_attachment
            }]
        
        # Send email
        response = resend.Emails.send(email_params)
        
        return {
            "success": True,
            "message": f"Email sent successfully to {recipient_email}",
            "email_id": response.get("id")
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def generate_email_template(
    case_id: str,
    alert_text: str,
    module: str,
    severity: str,
    urgency: str,
    problem_statement: str,
    resolution_summary: str,
    best_sop_id: str,
    reasoning: str,
    escalation_contact: Dict
) -> str:
    """Generate professional HTML email template"""
    
    # Get current timestamp
    timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    
    # Severity color mapping
    severity_colors = {
        "critical": "#dc2626",
        "high": "#ea580c",
        "medium": "#f59e0b",
        "low": "#10b981"
    }
    severity_color = severity_colors.get(severity.lower(), "#6b7280")
    
    # Module color mapping
    module_colors = {
        "CNTR": "#3b82f6",
        "VSL": "#8b5cf6",
        "EDI/API": "#ec4899",
        "Infra/SRE": "#14b8a6"
    }
    module_color = module_colors.get(module, "#6b7280")
    
    # Get escalation contact info
    contact = escalation_contact.get("escalation_contact", {})
    contact_name = contact.get("name", "N/A")
    contact_email = contact.get("email", "N/A")
    contact_phone = contact.get("phone", "N/A")
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PSA Incident Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🚨 PSA Incident Report
                            </h1>
                            <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px;">
                                Automated Alert Processing System
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Case ID Banner -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="margin-top: -15px; background-color: #1f2937; color: #ffffff; padding: 16px 20px; border-radius: 8px; text-align: center;">
                                <span style="font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Case ID</span>
                                <h2 style="margin: 4px 0 0; font-size: 20px; font-weight: 700;">{case_id}</h2>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Metadata Row -->
                    <tr>
                        <td style="padding: 30px 40px 20px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="width: 33%; text-align: center; padding: 15px 10px; background-color: #f9fafb; border-radius: 8px;">
                                        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Module</div>
                                        <div style="display: inline-block; background-color: {module_color}; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                            {module}
                                        </div>
                                    </td>
                                    <td style="width: 33%; text-align: center; padding: 15px 10px; background-color: #f9fafb; border-radius: 8px;">
                                        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Severity</div>
                                        <div style="display: inline-block; background-color: {severity_color}; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase;">
                                            {severity}
                                        </div>
                                    </td>
                                    <td style="width: 33%; text-align: center; padding: 15px 10px; background-color: #f9fafb; border-radius: 8px;">
                                        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Urgency</div>
                                        <div style="display: inline-block; background-color: #6b7280; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase;">
                                            {urgency}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Alert Text -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 6px;">
                                <h3 style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">Alert Message</h3>
                                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                                    {alert_text}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Problem Statement -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px; font-weight: 600;">📋 Problem Statement</h3>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.7; background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                {problem_statement}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Resolution Summary -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px; font-weight: 600;">✅ Recommended Resolution</h3>
                            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px;">
                                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.7; white-space: pre-line;">
                                    {resolution_summary}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- SOP Information -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px 20px; border-radius: 8px;">
                                <h3 style="margin: 0 0 8px; color: #1e40af; font-size: 14px; font-weight: 600;">📚 Best Matching SOP</h3>
                                <p style="margin: 0 0 12px; color: #1e3a8a; font-size: 14px; font-weight: 600;">
                                    {best_sop_id}
                                </p>
                                <p style="margin: 0; color: #3730a3; font-size: 13px; line-height: 1.6;">
                                    <strong>Reasoning:</strong> {reasoning}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Escalation Contact -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px; font-weight: 600;">👤 Escalation Contact</h3>
                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px 20px; border-radius: 8px;">
                                <p style="margin: 0 0 8px; color: #111827; font-size: 14px;">
                                    <strong>{contact_name}</strong>
                                </p>
                                <p style="margin: 0 0 4px; color: #4b5563; font-size: 13px;">
                                    📧 {contact_email}
                                </p>
                                <p style="margin: 0; color: #4b5563; font-size: 13px;">
                                    📞 {contact_phone}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Timestamp -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                Generated on {timestamp}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                                <strong>PSA Alert Processing System</strong>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                Multi-Agent RAG Platform for PORTNET® Support
                            </p>
                            <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                                This is an automated email. Please do not reply directly to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    return html

