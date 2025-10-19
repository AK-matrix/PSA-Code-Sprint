"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, AlertCircle, CheckCircle2, Mail, Database, FileDown, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadPDF } from "@/lib/pdf-generator";

interface ParsedEntities {
  module: string;
  entities: string[];
  alert_type: string;
  severity: string;
  urgency: string;
}

interface Analysis {
  best_sop_id: string;
  reasoning: string;
  problem_statement: string;
  resolution_summary: string;
}

interface ProcessedAlert {
  parsed_entities: ParsedEntities;
  analysis: Analysis;
  escalation_contact: any;
  email_content: any;
  sql_data?: any;
}

const EXAMPLE_ALERTS = [
  {
    label: "Container Duplicate",
    text: "Container CMAU1234567 has identical duplicate records found in the system at Terminal 5, bay slots 014082 and 014084",
    module: "CNTR"
  },
  {
    label: "Vessel Name Mismatch",
    text: "VESSEL_ERR_4 - System Vessel Name does not match with BAPLIE vessel name for MV ATLANTIC WIND. Expected: ATLANTIC WIND, Found: ATLANTIC BREEZE",
    module: "VSL"
  },
  {
    label: "EDI Message Stuck",
    text: "EDI message REF-IFT-0007 stuck in ERROR state for 24 hours, correlation_id: ABC123XYZ, ack_at is NULL, httpStatus: 500",
    module: "EDI/API"
  }
];

export function AlertProcessor() {
  const [alertText, setAlertText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedAlert | null>(null);
  const [progress, setProgress] = useState(0);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleProcessAlert = async () => {
    if (!alertText.trim()) {
      toast.error("Please enter an alert text");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // Get AI settings from localStorage
      const savedSettings = localStorage.getItem("app_settings");
      let aiSettings = null;
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        // Only send provider and model preferences, API keys are on backend
        aiSettings = {
          aiProvider: settings.aiProvider || "gemini",
          aiModel: settings.aiModel || "gemini-2.0-flash-exp"
        };
      }

      setProgress(20);
      const response = await fetch(`${apiUrl}/process_alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          alert_text: alertText,
          ai_settings: aiSettings  // Send AI settings if available
        }),
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error("Failed to process alert");
      }

      const data = await response.json();
      setProgress(100);
      setProcessedData(data);

      // Check if toast notifications are enabled
      const showToasts = savedSettings ? JSON.parse(savedSettings).showToastNotifications !== false : true;
      if (showToasts) {
        toast.success("Alert processed successfully!");
      }

      // Check if auto-save is enabled
      const autoSave = savedSettings ? JSON.parse(savedSettings).autoSaveHistory !== false : true;
      if (autoSave) {
        const historyItem = {
          timestamp: new Date().toISOString(),
          alert_text: alertText,
          result: data,
        };

        const history = JSON.parse(localStorage.getItem("alert_history") || "[]");
        history.unshift(historyItem);
        if (history.length > 50) history.pop();
        localStorage.setItem("alert_history", JSON.stringify(history));
      }

    } catch (error) {
      console.error("Error processing alert:", error);
      
      // Check if toast notifications are enabled
      const savedSettings = localStorage.getItem("app_settings");
      const showToasts = savedSettings ? JSON.parse(savedSettings).showToastNotifications !== false : true;
      if (showToasts) {
        toast.error("Failed to process alert. Please try again.");
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleSendEmail = async () => {
    if (!processedData?.email_content) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/send_email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData.email_content),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Escalation email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please check your email configuration.");
    }
  };

  const handleDownloadPDF = () => {
    if (!processedData) return;

    try {
      const incidentData = {
        alert_text: alertText,
        parsed_entities: processedData.parsed_entities,
        analysis: processedData.analysis,
        escalation_contact: processedData.escalation_contact,
        case_id: (processedData as any).case_id,
      };

      downloadPDF(incidentData);
      
      const showToasts = localStorage.getItem("app_settings");
      const shouldShowToast = showToasts ? JSON.parse(showToasts).showToastNotifications !== false : true;
      if (shouldShowToast) {
        toast.success("PDF report downloaded successfully!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report.");
    }
  };

  const handleSendIncidentReport = async () => {
    if (!processedData || !recipientEmail.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }

    setIsSendingEmail(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const incidentData = {
        alert_text: alertText,
        parsed_entities: processedData.parsed_entities,
        analysis: processedData.analysis,
        escalation_contact: processedData.escalation_contact,
        case_id: (processedData as any).case_id,
      };

      const response = await fetch(`${apiUrl}/send_incident_report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          incident_data: incidentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send incident report");
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Incident report sent to ${recipientEmail}!`);
        setShowEmailDialog(false);
        setRecipientEmail("");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error sending incident report:", error);
      toast.error(error.message || "Failed to send incident report.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Submit Alert
          </CardTitle>
          <CardDescription>
            Enter your PSA alert text below for automated processing and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Try an example:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {EXAMPLE_ALERTS.map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setAlertText(example.text)}
                  disabled={isProcessing}
                >
                  <Badge variant="secondary" className="mr-2 text-xs">{example.module}</Badge>
                  {example.label}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Paste your alert text here... (e.g., Container CMAU1234567 has duplicate records in bay slots)"
            value={alertText}
            onChange={(e) => setAlertText(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <Button
            onClick={handleProcessAlert}
            disabled={isProcessing || !alertText.trim()}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Process Alert
              </>
            )}
          </Button>
          {isProcessing && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {progress < 40 && "Analyzing alert with Triage Agent..."}
                {progress >= 40 && progress < 70 && "Retrieving candidate SOPs and case logs..."}
                {progress >= 70 && "Generating recommendations..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {processedData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Triage Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Module</p>
                  <Badge variant="secondary" className="text-base">
                    {processedData.parsed_entities.module}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Alert Type</p>
                  <Badge variant="outline" className="text-base">
                    {processedData.parsed_entities.alert_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Severity</p>
                  <Badge className={`${getSeverityColor(processedData.parsed_entities.severity)} text-white text-base`}>
                    {processedData.parsed_entities.severity?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Urgency</p>
                  <Badge className={`${getSeverityColor(processedData.parsed_entities.urgency)} text-white text-base`}>
                    {processedData.parsed_entities.urgency?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {processedData.parsed_entities.entities && processedData.parsed_entities.entities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Detected Entities</p>
                  <div className="flex flex-wrap gap-2">
                    {processedData.parsed_entities.entities.map((entity, idx) => (
                      <Badge key={idx} variant="secondary">{entity}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Problem Statement</p>
                <Alert>
                  <AlertDescription className="text-base">
                    {processedData.analysis.problem_statement}
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Solution</p>
                <div className="prose prose-sm max-w-none">
                  <p className="text-base whitespace-pre-wrap">{processedData.analysis.resolution_summary}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Selected SOP</p>
                <Badge variant="outline" className="text-base">
                  {processedData.analysis.best_sop_id}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Escalation Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Primary Contact</p>
                  <div className="space-y-1">
                    <p className="font-medium">{processedData.escalation_contact?.primary_contact?.name}</p>
                    <p className="text-sm text-muted-foreground">{processedData.escalation_contact?.primary_contact?.email}</p>
                    <p className="text-sm text-muted-foreground">{processedData.escalation_contact?.primary_contact?.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Escalation Contact</p>
                  <div className="space-y-1">
                    <p className="font-medium">{processedData.escalation_contact?.escalation_contact?.name}</p>
                    <p className="text-sm text-muted-foreground">{processedData.escalation_contact?.escalation_contact?.email}</p>
                    <p className="text-sm text-muted-foreground">{processedData.escalation_contact?.escalation_contact?.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Email Preview</p>
                <div className="bg-muted/50 p-4 rounded-md space-y-2">
                  <p className="font-medium">Subject: {processedData.email_content?.subject}</p>
                  <Separator />
                  <pre className="text-sm whitespace-pre-wrap font-sans">{processedData.email_content?.body}</pre>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSendEmail} className="flex-1 sm:flex-initial" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Escalation Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF and Email Report Actions */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileDown className="h-5 w-5" />
                Export & Share Report
              </CardTitle>
              <CardDescription>
                Download a PDF report or email it to stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleDownloadPDF} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Report
                </Button>
                
                <Button 
                  onClick={() => setShowEmailDialog(!showEmailDialog)} 
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Report
                </Button>
              </div>

              {/* Email Dialog */}
              {showEmailDialog && (
                <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail" className="text-sm font-medium">
                      Recipient Email Address
                    </Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="user@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      disabled={isSendingEmail}
                    />
                    <p className="text-xs text-gray-500">
                      Email will be sent from psacodesprint@arnavjhajharia.com with this address in CC
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendIncidentReport}
                      disabled={isSendingEmail || !recipientEmail.trim()}
                      className="flex-1"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Report
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setShowEmailDialog(false);
                        setRecipientEmail("");
                      }}
                      variant="outline"
                      disabled={isSendingEmail}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
