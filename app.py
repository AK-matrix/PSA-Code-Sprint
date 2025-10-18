import os
import json
import smtplib
import chromadb
from flask import Flask, render_template, request, jsonify
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from chromadb.config import Settings
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Global variables for models and data
sentence_transformer = None
chroma_client = None
collection = None
contacts_data = None

# Enhanced LLM Prompts for Multi-Agent Architecture
TRIAGE_AGENT_PROMPT = """
You are a specialized Triage Agent for PSA (Port System Alert) processing. 
Your task is to analyze ANY alert text format and extract key information in JSON format.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations, no additional text.

{{
    "module": "CNTR|VSL|EDI/API|Infra/SRE",
    "entities": ["entity1", "entity2", "entity3"],
    "alert_type": "error|warning|info",
    "severity": "critical|high|medium|low",
    "urgency": "immediate|high|medium|low"
}}

MODULE DETECTION RULES:
- CNTR (Container): Look for "container", "CMAU", "MSCU", "cntr_no", "duplicate", "identical containers", "bay", "slots"
- VSL (Vessel): Look for "vessel", "MV", "vessel advice", "VESSEL_ERR_4", "System Vessel Name", "BAPLIE", "COARRI", "terminal", "load completed"
- EDI/API: Look for "EDI", "message", "REF-IFT", "stuck in ERROR", "acknowledgment", "ack_at is NULL", "correlation_id", "httpStatus"
- Infra/SRE: Look for "database", "connection", "timeout", "service", "system", "infrastructure"

ENTITY EXTRACTION:
- Extract container numbers (CMAU, MSCU patterns)
- Extract vessel names (MV patterns)
- Extract error codes (VESSEL_ERR_4, EDI_ERR_1, etc.)
- Extract message references (REF-IFT-0007, etc.)
- Extract terminal/port names
- Extract any technical identifiers

SEVERITY ASSESSMENT:
- critical: System down, data corruption, security breach
- high: Service degradation, multiple users affected
- medium: Single user issues, minor errors
- low: Informational, warnings

URGENCY ASSESSMENT:
- immediate: Production down, data loss risk
- high: Customer impact, SLA breach
- medium: Operational impact
- low: Non-critical issues

Alert text: {alert_text}

Return ONLY the JSON object above, nothing else.
"""

ANALYST_AGENT_PROMPT = """
You are an expert Technical Analyst Agent for PSA support. You have been provided with an alert and 3 candidate SOP documents. 
Your task is to perform a detailed analysis and select the best match.

ALERT TO ANALYZE:
{alert_text}

CANDIDATE SOPs:
{sop_candidates}

INSTRUCTIONS:
1. Carefully compare the incoming alert against each of the 3 candidate SOPs
2. Analyze the relevance, accuracy, and applicability of each SOP to the alert
3. Select the single best SOP that provides the most accurate and relevant guidance
4. Provide detailed reasoning for your choice
5. Generate a comprehensive problem statement and step-by-step resolution

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations, no additional text.

{{
    "best_sop_id": "sop_X",
    "reasoning": "Detailed explanation of why this SOP was chosen over the others, including specific comparisons",
    "problem_statement": "Clear, detailed description of the issue based on the alert and chosen SOP",
    "resolution_summary": "Step-by-step resolution approach with specific actions to take"
}}

Return ONLY the JSON object above, nothing else.
"""

def initialize_models():
    """Initialize all required models and load data"""
    global sentence_transformer, chroma_client, collection, contacts_data
    
    try:
        # Initialize SentenceTransformer
        print("Loading SentenceTransformer model...")
        sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB
        print("Connecting to ChromaDB...")
        script_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_client = chromadb.PersistentClient(
            path=os.path.join(script_dir, "chroma_db"),
            settings=Settings(anonymized_telemetry=False)
        )
        collection = chroma_client.get_collection("psa_sop_collection")
        
        # Load contacts
        print("Loading contacts data...")
        contacts_file = os.path.join(script_dir, "contacts.json")
        with open(contacts_file, 'r', encoding='utf-8') as f:
            contacts_data = json.load(f)
        
        # Initialize Gemini
        print("Initializing Gemini API...")
        api_key = os.getenv('GOOGLE_API_KEY')
        print(f"DEBUG: API Key loaded: {api_key[:10]}..." if api_key else "DEBUG: No API key found")
        if not api_key or api_key == 'your-google-api-key-here':
            raise ValueError("Please set GOOGLE_API_KEY in your .env file")
        genai.configure(api_key=api_key)
        print("DEBUG: Gemini configured successfully")
        
        print("All models and data loaded successfully!")
        
    except Exception as e:
        print(f"Error initializing models: {e}")
        raise e

def triage_agent(alert_text):
    """Layer 1: Triage Agent - Parse alert text to extract entities and module"""
    print("=" * 50)
    print("TRIAGE AGENT CALLED!")
    print(f"Alert text: {alert_text}")
    print("=" * 50)
    
    # Force flush output
    import sys
    sys.stdout.flush()
    try:
        print(f"TRIAGE AGENT: Processing alert: {alert_text[:100]}...")
        # First try with the main prompt
        print("TRIAGE AGENT: Creating Gemini model...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("TRIAGE AGENT: Model created successfully")
        prompt = TRIAGE_AGENT_PROMPT.format(alert_text=alert_text)
        print(f"TRIAGE AGENT: Prompt created, length: {len(prompt)}")
        print(f"TRIAGE AGENT: Calling Gemini API...")
        response = model.generate_content(prompt)
        print(f"TRIAGE AGENT: Gemini response received")
        
        # Extract JSON from response with better parsing
        response_text = response.text.strip()
        print(f"Raw Gemini response: {response_text}")
        
        # Remove ALL markdown code blocks (handle multiple formats)
        response_text = response_text.replace('```json', '').replace('```', '')
        response_text = response_text.strip()
        
        # Try to find JSON object boundaries
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            response_text = response_text[start_idx:end_idx + 1]
        
        # Clean up whitespace and newlines
        response_text = response_text.replace('\n', ' ').replace('\r', ' ')
        response_text = ' '.join(response_text.split())  # Remove extra whitespace
        
        print(f"Extracted JSON: {response_text}")
        
        # Try to parse JSON with fallback
        try:
            parsed = json.loads(response_text)
            print(f"Successfully parsed JSON: {parsed}")
        except json.JSONDecodeError as e:
            print(f"JSON decode error in triage: {e}")
            # Try to fix common JSON issues
            response_text = response_text.replace("'", '"')  # Replace single quotes with double quotes
            try:
                parsed = json.loads(response_text)
                print(f"Successfully parsed JSON after fix: {parsed}")
            except json.JSONDecodeError as e2:
                print(f"Second JSON decode attempt failed: {e2}")
                # Try fallback extraction using simple pattern matching
                return fallback_triage_agent(alert_text)
        
        # Ensure required fields exist
        if 'module' not in parsed:
            parsed['module'] = 'Unknown'
        if 'entities' not in parsed:
            parsed['entities'] = []
        if 'alert_type' not in parsed:
            parsed['alert_type'] = 'error'
        if 'severity' not in parsed:
            parsed['severity'] = 'medium'
        if 'urgency' not in parsed:
            parsed['urgency'] = 'medium'
            
        return parsed
        
    except json.JSONDecodeError as e:
        print(f"Triage JSON decode error: {e}")
        print(f"Response text: {response_text}")
        return {"module": "Unknown", "entities": [], "alert_type": "error", "severity": "medium", "urgency": "medium"}
    except Exception as e:
        print(f"Error in triage agent: {e}")
        return {"module": "Unknown", "entities": [], "alert_type": "error", "severity": "medium", "urgency": "medium"}

def fallback_triage_agent(alert_text):
    """Fallback triage agent using simple pattern matching when LLM fails"""
    print("Using fallback triage agent")
    
    # Convert to lowercase for pattern matching
    text_lower = alert_text.lower()
    
    # Determine module based on keywords
    module = "Unknown"
    entities = []
    
    # Container patterns
    if any(keyword in text_lower for keyword in ["container", "cmau", "mscu", "cntr_no", "duplicate", "identical containers", "bay", "slots"]):
        module = "CNTR"
        # Extract container numbers
        import re
        container_matches = re.findall(r'[CM]MAU\d+|[CM]SCU\d+', alert_text)
        entities.extend(container_matches)
    
    # Vessel patterns
    elif any(keyword in text_lower for keyword in ["vessel", "mv", "vessel advice", "vessel_err_4", "system vessel name", "baplie", "coarri", "terminal", "load completed"]):
        module = "VSL"
        # Extract vessel names
        import re
        vessel_matches = re.findall(r'MV\s+[A-Z\s]+', alert_text)
        entities.extend(vessel_matches)
    
    # EDI/API patterns
    elif any(keyword in text_lower for keyword in ["edi", "message", "ref-ift", "stuck in error", "acknowledgment", "ack_at is null", "correlation_id", "httpstatus"]):
        module = "EDI/API"
        # Extract message references
        import re
        message_matches = re.findall(r'REF-[A-Z]+-\d+', alert_text)
        entities.extend(message_matches)
    
    # Infrastructure patterns
    elif any(keyword in text_lower for keyword in ["database", "connection", "timeout", "service", "system", "infrastructure"]):
        module = "Infra/SRE"
    
    # Extract other entities
    import re
    error_codes = re.findall(r'[A-Z_]+_ERR_\d+', alert_text)
    entities.extend(error_codes)
    
    # Determine severity and urgency based on keywords
    severity = "medium"
    urgency = "medium"
    
    if any(keyword in text_lower for keyword in ["critical", "urgent", "immediate", "down", "failed", "error"]):
        severity = "high"
        urgency = "high"
    elif any(keyword in text_lower for keyword in ["warning", "issue", "problem"]):
        severity = "medium"
        urgency = "medium"
    elif any(keyword in text_lower for keyword in ["info", "information", "notice"]):
        severity = "low"
        urgency = "low"
    
    return {
        "module": module,
        "entities": entities[:5],  # Limit to 5 entities
        "alert_type": "error" if "error" in text_lower else "warning" if "warning" in text_lower else "info",
        "severity": severity,
        "urgency": urgency
    }

def retrieve_candidate_sops(alert_text, parsed_entities):
    """Retrieve top 3 most relevant SOPs from ChromaDB"""
    try:
        module = parsed_entities.get('module', 'Unknown')
        
        # Filter by module if possible
        where_clause = {"module": module} if module != "Unknown" else None
        
        # Perform vector search for top 3 results
        results = collection.query(
            query_texts=[alert_text],
            n_results=3,
            where=where_clause
        )
        
        candidate_sops = []
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                candidate_sops.append({
                    'id': results['ids'][0][i],
                    'document': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i]
                })
        
        return candidate_sops
        
    except Exception as e:
        print(f"Error retrieving candidate SOPs: {e}")
        return []

def analyst_agent(alert_text, candidate_sops):
    """Layer 2: Analyst Agent - Analyze candidates and select best SOP"""
    try:
        if not candidate_sops:
            return {
                "best_sop_id": "none",
                "reasoning": "No candidate SOPs available for analysis",
                "problem_statement": "Unable to find relevant SOP for this alert",
                "resolution_summary": "Manual investigation and escalation required"
            }
        
        # Format candidate SOPs for the prompt
        sop_candidates_text = ""
        for i, sop in enumerate(candidate_sops, 1):
            sop_candidates_text += f"\n--- SOP {i} (ID: {sop['id']}) ---\n"
            sop_candidates_text += f"Title: {sop['metadata'].get('title', 'Unknown')}\n"
            sop_candidates_text += f"Module: {sop['metadata'].get('module', 'Unknown')}\n"
            sop_candidates_text += f"Content: {sop['document'][:1000]}...\n"
            sop_candidates_text += f"Relevance Score: {(1 - sop['distance']):.3f}\n"
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = ANALYST_AGENT_PROMPT.format(
            alert_text=alert_text,
            sop_candidates=sop_candidates_text
        )
        response = model.generate_content(prompt)
        
        # Extract JSON from response with better parsing
        response_text = response.text.strip()
        print(f"Raw Analyst response: {response_text}")
        
        # Remove ALL markdown code blocks (handle multiple formats)
        response_text = response_text.replace('```json', '').replace('```', '')
        response_text = response_text.strip()
        
        # Try to find JSON object boundaries
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            response_text = response_text[start_idx:end_idx + 1]
        
        # Clean up whitespace and newlines aggressively
        response_text = response_text.replace('\n', ' ').replace('\r', ' ')
        response_text = ' '.join(response_text.split())  # Remove extra whitespace
        
        print(f"Extracted Analyst JSON: {response_text}")
        
        # Try to parse JSON with fallback
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON decode error in analyst: {e}")
            # Try to fix common JSON issues
            response_text = response_text.replace("'", '"')  # Replace single quotes with double quotes
            try:
                return json.loads(response_text)
            except json.JSONDecodeError as e2:
                print(f"Second JSON decode attempt failed: {e2}")
                # Return default values if JSON parsing completely fails
                # Use fallback analyst agent
                return fallback_analyst_agent(alert_text, candidate_sops)
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Response text: {response_text}")
        return {
            "best_sop_id": "error",
            "reasoning": f"JSON parsing failed: {str(e)}",
            "problem_statement": "Unable to parse AI analysis response",
            "resolution_summary": "Manual review and escalation required"
        }
    except Exception as e:
        print(f"Error in analyst agent: {e}")
        return {
            "best_sop_id": "error",
            "reasoning": f"Analysis failed: {str(e)}",
            "problem_statement": "Unable to analyze the alert due to processing error",
            "resolution_summary": "Manual review and escalation required"
        }

def fallback_analyst_agent(alert_text, candidate_sops):
    """Fallback analyst agent when LLM fails"""
    print("Using fallback analyst agent")
    
    if not candidate_sops:
        return {
            "best_sop_id": "none",
            "reasoning": "No candidate SOPs available for analysis",
            "problem_statement": "Unable to find relevant SOP for this alert",
            "resolution_summary": "Manual investigation and escalation required"
        }
    
    # Simple keyword matching to select best SOP
    alert_lower = alert_text.lower()
    best_sop = candidate_sops[0]  # Default to first SOP
    best_score = 0
    
    for sop in candidate_sops:
        score = 0
        title = sop['metadata'].get('title', '').lower()
        content = sop['document'].lower()
        
        # Score based on keyword matches
        keywords = ['error', 'issue', 'problem', 'failed', 'stuck', 'duplicate', 'inconsistent']
        for keyword in keywords:
            if keyword in alert_lower and keyword in content:
                score += 1
        
        # Score based on module match
        if 'container' in alert_lower and 'container' in content:
            score += 2
        elif 'vessel' in alert_lower and 'vessel' in content:
            score += 2
        elif 'edi' in alert_lower and 'edi' in content:
            score += 2
        
        if score > best_score:
            best_score = score
            best_sop = sop
    
    return {
        "best_sop_id": best_sop['id'],
        "reasoning": f"Selected based on keyword matching (score: {best_score})",
        "problem_statement": f"Alert requires analysis: {alert_text[:100]}...",
        "resolution_summary": f"Follow SOP: {best_sop['metadata'].get('title', 'Unknown SOP')}"
    }

def get_escalation_contact(module):
    """Get escalation contact information for the specified module"""
    if module in contacts_data:
        return contacts_data[module]
    else:
        # Default contact if module not found
        return {
            "module": "General Support",
            "primary_contact": {
                "name": "General Support Team",
                "email": "support@company.com",
                "phone": "+1-555-SUPPORT",
                "escalation_level": "L1"
            },
            "escalation_contact": {
                "name": "Support Manager",
                "email": "support-manager@company.com",
                "phone": "+1-555-SUPPORT-MGR",
                "escalation_level": "L2"
            }
        }

def create_escalation_email_content(alert_text, parsed_entities, analysis, contact_info):
    """Create escalation email content"""
    email_subject = f"PSA Alert Escalation - {parsed_entities.get('module', 'Unknown')} Module - {parsed_entities.get('severity', 'Unknown').upper()}"
    
    email_body = f"""
Dear {contact_info['escalation_contact']['name']},

We are escalating the following PSA alert for your immediate review and action:

ALERT DETAILS:
{alert_text}

PARSED INFORMATION:
• Module: {parsed_entities.get('module', 'Unknown')}
• Alert Type: {parsed_entities.get('alert_type', 'Unknown')}
• Severity: {parsed_entities.get('severity', 'Unknown').upper()}
• Urgency: {parsed_entities.get('urgency', 'Unknown').upper()}
• Key Entities: {', '.join(parsed_entities.get('entities', []))}

TECHNICAL ANALYSIS:
• Problem Statement: {analysis.get('problem_statement', 'N/A')}
• Resolution Summary: {analysis.get('resolution_summary', 'N/A')}
• Analyst Reasoning: {analysis.get('reasoning', 'N/A')}

ESCALATION CONTACTS:
• Primary: {contact_info['primary_contact']['name']} ({contact_info['primary_contact']['email']})
• Escalation: {contact_info['escalation_contact']['name']} ({contact_info['escalation_contact']['email']})

Please review and take appropriate action immediately.

Best regards,
PSA Support Agent
AI-Powered Multi-Agent RAG System
    """.strip()
    
    return email_subject, email_body

def send_email(to_email, subject, body):
    """Send email using SMTP"""
    try:
        sender_email = os.getenv('SENDER_EMAIL')
        app_password = os.getenv('EMAIL_APP_PASSWORD')
        
        if not sender_email or not app_password:
            raise ValueError("Email credentials not configured in .env file")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(body, 'plain'))
        
        # Create SMTP session
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()  # Enable security
        server.login(sender_email, app_password)
        
        # Send email
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        
        return True, "Email sent successfully"
        
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/process_alert', methods=['POST'])
def process_alert():
    """Process alert through the multi-agent RAG pipeline"""
    try:
        print("=== PROCESS ALERT ENDPOINT CALLED ===")
        # Get alert text from request
        data = request.get_json()
        print(f"Received data: {data}")
        alert_text = data.get('alert_text', '')
        print(f"Alert text: {alert_text}")
        
        if not alert_text:
            print("ERROR: No alert text provided")
            return jsonify({"error": "No alert text provided"}), 400
        
        # Step 1: Triage Agent
        print("Triage Agent: Parsing alert...")
        try:
            parsed_entities = triage_agent(alert_text)
            print(f"Parsed entities: {parsed_entities}")
        except Exception as e:
            print(f"ERROR in triage_agent: {e}")
            parsed_entities = {"module": "Unknown", "entities": [], "alert_type": "error", "severity": "medium", "urgency": "medium", "debug_error": str(e)}
        
        # Step 2: Retrieve candidate SOPs
        print("Retrieving candidate SOPs...")
        candidate_sops = retrieve_candidate_sops(alert_text, parsed_entities)
        
        # Step 3: Analyst Agent
        print("Analyst Agent: Analyzing candidates...")
        analysis = analyst_agent(alert_text, candidate_sops)
        
        # Step 4: Get escalation contact
        print("Getting escalation contact...")
        contact_info = get_escalation_contact(parsed_entities.get('module', 'Unknown'))
        
        # Step 5: Create escalation email content
        print("Creating escalation email...")
        email_subject, email_body = create_escalation_email_content(
            alert_text, parsed_entities, analysis, contact_info
        )
        
        # Return comprehensive response
        response = {
            "success": True,
            "parsed_entities": parsed_entities,
            "candidate_sops": candidate_sops,
            "analysis": analysis,
            "escalation_contact": contact_info,
            "email_content": {
                "to": contact_info['escalation_contact']['email'],
                "subject": email_subject,
                "body": email_body
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing alert: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/send_email', methods=['POST'])
def send_escalation_email():
    """Send escalation email"""
    try:
        data = request.get_json()
        to_email = data.get('to')
        subject = data.get('subject')
        body = data.get('body')
        
        if not all([to_email, subject, body]):
            return jsonify({"error": "Missing email parameters"}), 400
        
        success, message = send_email(to_email, subject, body)
        
        if success:
            return jsonify({"success": True, "message": message})
        else:
            return jsonify({"success": False, "error": message}), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    # Initialize models and data
    initialize_models()
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)