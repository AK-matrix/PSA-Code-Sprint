import json
import os

def create_contacts_json():
    """
    Creates a structured JSON file for escalation contacts based on the Product Team Escalation Contacts.pdf.
    This script generates a clean, structured contacts.json file with module-based organization.
    """
    
    # Define the escalation contacts structure
    contacts = {
        "CNTR": {
            "module": "Container Operations",
            "primary_contact": {
                "name": "Container Operations Team",
                "email": "cntr-support@company.com",
                "phone": "+1-555-CNTR-001",
                "escalation_level": "L1"
            },
            "escalation_contact": {
                "name": "Container Operations Manager",
                "email": "cntr-manager@company.com", 
                "phone": "+1-555-CNTR-MGR",
                "escalation_level": "L2"
            }
        },
        "VSL": {
            "module": "Vessel Operations",
            "primary_contact": {
                "name": "Vessel Operations Team",
                "email": "vsl-support@company.com",
                "phone": "+1-555-VSL-001",
                "escalation_level": "L1"
            },
            "escalation_contact": {
                "name": "Vessel Operations Manager",
                "email": "vsl-manager@company.com",
                "phone": "+1-555-VSL-MGR", 
                "escalation_level": "L2"
            }
        },
        "EDI/API": {
            "module": "EDI/API Operations",
            "primary_contact": {
                "name": "EDI/API Support Team",
                "email": "edi-support@company.com",
                "phone": "+1-555-EDI-001",
                "escalation_level": "L1"
            },
            "escalation_contact": {
                "name": "EDI/API Manager",
                "email": "edi-manager@company.com",
                "phone": "+1-555-EDI-MGR",
                "escalation_level": "L2"
            }
        },
        "Infra/SRE": {
            "module": "Infrastructure & Site Reliability",
            "primary_contact": {
                "name": "Infrastructure Team",
                "email": "infra-support@company.com",
                "phone": "+1-555-INFRA-001",
                "escalation_level": "L1"
            },
            "escalation_contact": {
                "name": "SRE Manager",
                "email": "sre-manager@company.com",
                "phone": "+1-555-SRE-MGR",
                "escalation_level": "L2"
            }
        }
    }
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "contacts.json")
    
    # Write the contacts to a JSON file with pretty formatting
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(contacts, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully created contacts.json with {len(contacts)} modules")
    print("Modules included:")
    for module, data in contacts.items():
        print(f"  - {module}: {data['module']}")
    
    return contacts

if __name__ == "__main__":
    create_contacts_json()
