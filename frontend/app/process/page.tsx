"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Send, Loader2, AlertCircle, CheckCircle2, Mail, Database, Sparkles, FileDown, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { downloadPDF } from "@/lib/pdf-generator";

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

interface NearestPSItem {
  problem_statement: string;
  metadata?: {
    TIMESTAMP?: string;
    timestamp?: string;
    Solution?: string;
    solution?: string;
    SOP?: string;
    sop?: string;
    row_index?: number;
  };
  id: string;
  distance: number;
}

interface ProcessedAlert {
  case_id: string;
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
  escalation_contact: any;
  email_content: any;
  nearest_problem_statements?: NearestPSItem[]; // <--- NEW
}

export default function ProcessPage() {
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

      setProgress(20);
      const response = await fetch(`${apiUrl}/process_alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_text: alertText }),
      });

      setProgress(60);

      if (!response.ok) throw new Error("Failed to process alert");

      const data = await response.json();
      setProgress(100);
      setProcessedData(data);

      toast.success("Alert processed successfully!");
    } catch (error) {
      console.error("Error processing alert:", error);
      toast.error("Failed to process alert. Please try again.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData.email_content),
      });

      if (!response.ok) throw new Error("Failed to send email");

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
        case_id: processedData.case_id,
      };

      downloadPDF(incidentData);
      toast.success("PDF report downloaded successfully!");
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
        case_id: processedData.case_id,
      };

      const response = await fetch(`${apiUrl}/send_incident_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          incident_data: incidentData,
        }),
      });

      if (!response.ok) throw new Error("Failed to send incident report");

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

  const handleMarkAsResolved = async (caseId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/history/${caseId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Incident marked as resolved and added to knowledge base! 🎉");
      } else {
        toast.error(data.error || "Failed to mark as resolved");
      }
    } catch (error) {
      console.error("Error marking as resolved:", error);
      toast.error("Failed to mark incident as resolved");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Process Alert</h1>
          <p className="text-gray-600 mt-1">
            Submit PSA alerts for AI-powered analysis and recommendations
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Submit Alert
              </CardTitle>
              <CardDescription>
                Enter your PSA alert text below for automated processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2 text-gray-700">Try an example:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {EXAMPLE_ALERTS.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertText(example.text)}
                      disabled={isProcessing}
                      className="hover:border-blue-400"
                    >
                      <Badge variant="secondary" className="mr-2 text-xs">{example.module}</Badge>
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Paste your alert text here..."
                value={alertText}
                onChange={(e) => setAlertText(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleProcessAlert}
                  disabled={isProcessing || !alertText.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Process Alert
                    </>
                  )}
                </Button>
                {alertText && !isProcessing && (
                  <Button variant="outline" onClick={() => setAlertText("")}>
                    Clear
                  </Button>
                )}
              </div>
              {isProcessing && progress > 0 && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">
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
              {processedData.case_id && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Alert processed successfully! Case ID: <strong>{processedData.case_id}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Triage Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Module</p>
                      <Badge variant="secondary" className="text-base">
                        {processedData.parsed_entities.module}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Alert Type</p>
                      <Badge variant="outline" className="text-base">
                        {processedData.parsed_entities.alert_type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Severity</p>
                      <Badge className={`${getSeverityColor(processedData.parsed_entities.severity)} text-base border`} variant="outline">
                        {processedData.parsed_entities.severity?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Urgency</p>
                      <Badge className={`${getSeverityColor(processedData.parsed_entities.urgency)} text-base border`} variant="outline">
                        {processedData.parsed_entities.urgency?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {processedData.parsed_entities.entities?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Detected Entities</p>
                      <div className="flex flex-wrap gap-2">
                        {processedData.parsed_entities.entities.map((entity, idx) => (
                          <Badge key={idx} variant="secondary" className="font-mono">{entity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Technical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Problem Statement</p>
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-900">
                        {processedData.analysis.problem_statement}
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Recommended Solution</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm whitespace-pre-wrap text-gray-800">
                        {processedData.analysis.resolution_summary}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* NEW: Similar Past Problem Statements table */}
                  {processedData.nearest_problem_statements &&
                    processedData.nearest_problem_statements.length > 0 && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            Similar Past Problem Statements (most similar first)
                          </p>
                          <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                  <th className="px-3 py-2 font-medium">Timestamp</th>
                                  <th className="px-3 py-2 font-medium">Nearest Problem Statement</th>
                                  <th className="px-3 py-2 font-medium">Solution</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {processedData.nearest_problem_statements.slice(0, 5).map((row, i) => {
                                  const meta = row.metadata || {};
                                  const ts = meta.TIMESTAMP || meta.timestamp || "—";
                                  const sol = meta.Solution || meta.solution || "—";
                                  return (
                                    <tr key={row.id || i} className="align-top">
                                      <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                                        {ts}
                                      </td>
                                      <td className="px-3 py-2 text-gray-800">
                                        {row.problem_statement}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {sol}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <Separator />
                      </>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Selected SOP</p>
                    <Badge variant="outline" className="text-base font-mono">
                      {processedData.analysis.best_sop_id}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-orange-600" />
                    Escalation Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm font-medium text-gray-600 mb-2">Primary Contact</p>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{processedData.escalation_contact?.primary_contact?.name}</p>
                        <p className="text-sm text-gray-600">{processedData.escalation_contact?.primary_contact?.email}</p>
                        <p className="text-sm text-gray-600">{processedData.escalation_contact?.primary_contact?.phone}</p>
                      </div>
                    </div>
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <p className="text-sm font-medium text-orange-800 mb-2">Escalation Contact</p>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{processedData.escalation_contact?.escalation_contact?.name}</p>
                        <p className="text-sm text-gray-700">{processedData.escalation_contact?.escalation_contact?.email}</p>
                        <p className="text-sm text-gray-700">{processedData.escalation_contact?.escalation_contact?.phone}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Email Preview</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-gray-900">Subject: {processedData.email_content?.subject}</p>
                      <Separator />
                      <pre className="text-sm whitespace-pre-wrap font-sans text-gray-700">{processedData.email_content?.body}</pre>
                    </div>
                  </div>

                  <Button onClick={handleSendEmail} className="bg-orange-600 hover:bg-orange-700">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Escalation Email
                  </Button>
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

              {/* Mark as Resolved */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <CheckCircle2 className="h-5 w-5" />
                    Resolution Status
                  </CardTitle>
                  <CardDescription>
                    Mark this incident as resolved to add it to the knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      if (processedData?.case_id) {
                        handleMarkAsResolved(processedData.case_id);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Resolved & Add to Knowledge Base
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">
                    This will update the incident status and add the resolution to the knowledge base for future reference
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
