/**
 * PDF Generation Utility for PSA Incident Reports
 * Generates professional PDF reports from incident data
 */

import jsPDF from "jspdf";

interface IncidentData {
  case_id?: string;
  alert_text: string;
  parsed_entities: {
    module: string;
    entities: string[];
    alert_type: string;
    severity: string;
    urgency: string;
  };
  analysis: {
    best_sop_id: string;
    reasoning: string;
    problem_statement: string;
    resolution_summary: string;
  };
  escalation_contact: {
    escalation_contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
  sql_data?: any;
}

export function generateIncidentReportPDF(incident: IncidentData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, marginLeft, yPos);
      yPos += fontSize * 0.5;
    });
    yPos += 3;
  };

  // Helper function to add a section box
  const addBox = (
    title: string,
    content: string,
    bgColor: [number, number, number] = [245, 247, 250]
  ) => {
    const boxHeight = doc.splitTextToSize(content, contentWidth - 10).length * 5 + 20;
    
    if (yPos + boxHeight > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }

    // Draw background box
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(marginLeft, yPos, contentWidth, boxHeight, 3, 3, "F");

    // Add title
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(title, marginLeft + 5, yPos);

    // Add content
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(content, contentWidth - 10);
    lines.forEach((line: string) => {
      doc.text(line, marginLeft + 5, yPos);
      yPos += 5;
    });

    yPos += 8;
  };

  // Get severity color
  const getSeverityColor = (severity: string): [number, number, number] => {
    const colors: Record<string, [number, number, number]> = {
      critical: [220, 38, 38],
      high: [234, 88, 12],
      medium: [245, 158, 11],
      low: [16, 185, 129],
    };
    return colors[severity.toLowerCase()] || [107, 114, 128];
  };

  // ==== HEADER ====
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PSA Incident Report", marginLeft, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Automated Alert Processing System", marginLeft, 28);
  
  yPos = 50;

  // ==== CASE ID ====
  if (incident.case_id) {
    doc.setFillColor(31, 41, 55);
    doc.roundedRect(marginLeft, yPos, contentWidth, 15, 3, 3, "F");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`Case ID: ${incident.case_id}`, marginLeft + 5, yPos + 10);
    
    yPos += 25;
  }

  // ==== METADATA BADGES ====
  const module = incident.parsed_entities.module;
  const severity = incident.parsed_entities.severity;
  const urgency = incident.parsed_entities.urgency;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  // Module badge
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(marginLeft, yPos, 40, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(module, marginLeft + 5, yPos + 7);
  
  // Severity badge
  const severityColor = getSeverityColor(severity);
  doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
  doc.roundedRect(marginLeft + 45, yPos, 40, 10, 2, 2, "F");
  doc.text(severity.toUpperCase(), marginLeft + 50, yPos + 7);
  
  // Urgency badge
  doc.setFillColor(107, 114, 128);
  doc.roundedRect(marginLeft + 90, yPos, 40, 10, 2, 2, "F");
  doc.text(urgency.toUpperCase(), marginLeft + 95, yPos + 7);
  
  yPos += 20;

  // ==== ALERT MESSAGE ====
  addBox("🚨 Alert Message", incident.alert_text, [254, 243, 199]);

  // ==== PROBLEM STATEMENT ====
  addBox(
    "📋 Problem Statement",
    incident.analysis.problem_statement,
    [249, 250, 251]
  );

  // ==== RESOLUTION SUMMARY ====
  addBox(
    "✅ Recommended Resolution",
    incident.analysis.resolution_summary,
    [236, 253, 245]
  );

  // ==== SOP INFORMATION ====
  const sopName = incident.analysis.best_sop_id;
  const sopText = `SOP: ${sopName}\n\nReasoning: ${incident.analysis.reasoning}`;
  addBox("📚 Best Matching SOP", sopText, [239, 246, 255]);

  // ==== ESCALATION CONTACT ====
  const contact = incident.escalation_contact.escalation_contact;
  const contactText = `Name: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone}`;
  addBox("👤 Escalation Contact", contactText, [249, 250, 251]);

  // ==== FOOTER ====
  const timestamp = new Date().toLocaleString();
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Generated on ${timestamp} by PSA Alert Processing System`,
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  return doc;
}

export function downloadPDF(incident: IncidentData, filename?: string) {
  const pdf = generateIncidentReportPDF(incident);
  const caseId = incident.case_id || "unknown";
  const finalFilename = filename || `incident_report_${caseId}.pdf`;
  pdf.save(finalFilename);
}

