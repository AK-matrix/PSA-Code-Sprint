"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Send, Loader2, AlertCircle, CheckCircle2, Mail, Database } from "lucide-react";
import { toast } from "sonner";

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

      const historyItem = {
        timestamp: new Date().toISOString(),
        alert_text: alertText,
        result: data,
      };

      const history = JSON.parse(localStorage.getItem("alert_history") || "[]");
      history.unshift(historyItem);
      if (history.length > 50) history.pop();
      localStorage.setItem("alert_history", JSON.stringify(history));

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

              <Button onClick={handleSendEmail} className="w-full sm:w-auto">
                <Mail className="mr-2 h-4 w-4" />
                Send Escalation Email
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
