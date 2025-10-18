import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv('GOOGLE_API_KEY')
print(f"API Key: {api_key[:10]}..." if api_key else "No API key found")

if api_key:
    genai.configure(api_key=api_key)
    
    # Test the exact triage agent function
    def triage_agent(alert_text):
        """Layer 1: Triage Agent - Parse alert text to extract entities and module"""
        print("=" * 50)
        print("TRIAGE AGENT CALLED!")
        print(f"Alert text: {alert_text}")
        print("=" * 50)
        
        try:
            print(f"TRIAGE AGENT: Processing alert: {alert_text[:100]}...")
            # First try with the main prompt
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = f"""
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

Alert text: {alert_text}

Return ONLY the JSON object above, nothing else.
"""
            print(f"TRIAGE AGENT: Calling Gemini API...")
            response = model.generate_content(prompt)
            print(f"TRIAGE AGENT: Gemini response received")
            
            # Extract JSON from response
            response_text = response.text.strip()
            print(f"Raw response: {response_text}")
            
            # Clean up the response
            response_text = response_text.replace('\n', ' ').replace('\r', ' ')
            response_text = ' '.join(response_text.split())
            
            print(f"Cleaned response: {response_text}")
            
            # Try to parse JSON
            parsed = json.loads(response_text)
            print(f"Parsed JSON: {parsed}")
            return parsed
            
        except Exception as e:
            print(f"Error in triage agent: {e}")
            return {"module": "Unknown", "entities": [], "alert_type": "error", "severity": "medium", "urgency": "medium"}
    
    # Test with the exact alert
    alert_text = "RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received"
    result = triage_agent(alert_text)
    print(f"Final result: {result}")
    
else:
    print("No API key found")
