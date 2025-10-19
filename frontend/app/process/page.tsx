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
import { Send, Loader2, AlertCircle, CheckCircle2, Mail, Database, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
}

export default function ProcessPage() {
  const [alertText, setAlertText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedAlert | null>(null);
  const [progress, setProgress] = useState(0);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alert_text: alertText }),
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error("Failed to process alert");
      }

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
                  <Button
                    variant="outline"
                    onClick={() => setAlertText("")}
                  >
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

                  {processedData.parsed_entities.entities && processedData.parsed_entities.entities.length > 0 && (
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
                      <p className="text-sm whitespace-pre-wrap text-gray-800">{processedData.analysis.resolution_summary}</p>
                    </div>
                  </div>

                  <Separator />

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
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
