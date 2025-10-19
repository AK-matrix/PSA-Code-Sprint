"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useHydration } from "@/hooks/use-hydration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Database,
  Brain,
  Activity,
  Mail,
  Download,
  FileDown,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface LogFile {
  name: string;
  size: number;
  lastModified: string;
  content: string;
}

interface SimulationResult {
  file: string;
  triage_analysis?: {
    problem_statement: string;
    severity: string;
    entities: string[];
  };
  analyst_analysis?: {
    root_cause: string;
    resolution_summary: string;
    selected_sop: string;
  };
  predictive_insight?: {
    predictive_insight: string;
    confidence: string;
  };
  escalation_contact?: {
    escalation_contact: {
      name: string;
      email: string;
      phone: string;
    };
  };
  email_content?: {
    to: string;
    subject: string;
    body: string;
  };
  processing_time: number;
}

interface SimulationStatus {
  isRunning: boolean;
  currentFile: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  results: SimulationResult[];
}

export default function SimulationPage() {
  const [status, setStatus] = useState<SimulationStatus>({
    isRunning: false,
    currentFile: "",
    progress: 0,
    totalFiles: 0,
    processedFiles: 0,
    results: []
  });
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isHydrated = useHydration();

  useEffect(() => {
    if (isHydrated) {
      fetchLogFiles();
    }
  }, [isHydrated]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="relative h-screen bg-white border-r border-gray-200 w-64 flex flex-col">
          <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200">
            <div className="bg-blue-600 p-1.5 rounded">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 px-3 py-4 space-y-1">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fetchLogFiles = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/simulation/logs`);
      const data = await response.json();
      
      if (data.success) {
        setLogFiles(data.log_files);
        setStatus(prev => ({ ...prev, totalFiles: data.log_files.length }));
      }
    } catch (error) {
      console.error("Error fetching log files:", error);
      // toast.error("Failed to fetch log files");
      console.error("Failed to fetch log files");
    } finally {
      setIsLoading(false);
    }
  };

  const startSimulation = async () => {
    setStatus(prev => ({ 
      ...prev, 
      isRunning: true, 
      progress: 0, 
      processedFiles: 0, 
      results: [] 
    }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/simulation/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start simulation");
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus(prev => ({
          ...prev,
          isRunning: false,
          results: data.results || [],
          processedFiles: data.processed_files || 0,
          totalFiles: data.total_files || 0,
          progress: 100
        }));
        // toast.success(`Simulation completed! Processed ${data.processed_files} files`);
        console.log(`Simulation completed! Processed ${data.processed_files} files`);
      } else {
        throw new Error(data.error || "Simulation failed");
      }
    } catch (error) {
      console.error("Error starting simulation:", error);
      // toast.error("Failed to start simulation");
      console.error("Failed to start simulation");
      setStatus(prev => ({ ...prev, isRunning: false }));
    }
  };

  const pollSimulationStatus = async () => {
    const poll = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/simulation/status`);
        const data = await response.json();

        if (data.success) {
          setStatus(prev => ({
            ...prev,
            currentFile: data.current_file || "",
            progress: data.progress || 0,
            processedFiles: data.processed_files || 0,
            results: data.results || [],
            isRunning: data.is_running || false
          }));

          if (data.is_running) {
            setTimeout(poll, 1000); // Poll every second
          } else {
            toast.success("Log simulation completed!");
          }
        }
      } catch (error) {
        console.error("Error polling simulation status:", error);
        setStatus(prev => ({ ...prev, isRunning: false }));
      }
    };

    poll();
  };

  const stopSimulation = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${apiUrl}/simulation/stop`, { method: "POST" });
      
      setStatus(prev => ({ ...prev, isRunning: false }));
      // toast.info("Simulation stopped");
      console.log("Simulation stopped");
    } catch (error) {
      console.error("Error stopping simulation:", error);
    }
  };

  const resetSimulation = () => {
    setStatus({
      isRunning: false,
      currentFile: "",
      progress: 0,
      totalFiles: logFiles.length,
      processedFiles: 0,
      results: []
    });
  };

  const handleSendEmail = async (result: SimulationResult) => {
    if (!result.email_content) {
      toast.error("No email content available");
      return;
    }

    try {
      toast.info("Sending escalation email...");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/send_email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.email_content),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Escalation email sent successfully!");
    } catch (error: any) {
      console.error("Error sending escalation email:", error);
      toast.error("Failed to send email. Please check your email configuration.");
    }
  };

  const handleDownloadPDF = (result: SimulationResult) => {
    try {
      toast.info("Generating PDF report...");
      
      const incidentData = {
        alert_text: `Log Simulation Analysis for ${result.file}`,
        parsed_entities: result.triage_analysis,
        analysis: {
        best_sop_id: result.analyst_analysis?.selected_sop || 'none',
        reasoning: result.analyst_analysis?.root_cause || 'Not available',
        problem_statement: result.analyst_analysis?.root_cause || 'Not available',
          resolution_summary: result.analyst_analysis?.resolution_summary || 'Not available'
        },
        escalation_contact: result.escalation_contact || {
          primary_contact: { name: "", email: "", phone: "" },
          escalation_contact: { name: "", email: "", phone: "" }
        },
        case_id: `SIM-${Date.now()}`,
      };
      
      downloadPDF(incidentData);
      toast.success("PDF report downloaded successfully");
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      toast.error(error.message || "Failed to generate PDF report");
    }
  };

  const handleSendIncidentReport = async (result: SimulationResult) => {
    if (!recipientEmail.trim()) {
      toast.error("Please enter recipient email");
      return;
    }

    setIsSendingEmail(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const incidentData = {
        alert_text: `Log Simulation Analysis for ${result.file}`,
        parsed_entities: result.triage_analysis,
        analysis: {
        best_sop_id: result.analyst_analysis?.selected_sop || 'none',
        reasoning: result.analyst_analysis?.root_cause || 'Not available',
        problem_statement: result.analyst_analysis?.root_cause || 'Not available',
          resolution_summary: result.analyst_analysis?.resolution_summary || 'Not available'
        },
        escalation_contact: result.escalation_contact || {
          primary_contact: { name: "", email: "", phone: "" },
          escalation_contact: { name: "", email: "", phone: "" }
        },
        case_id: `SIM-${Date.now()}`,
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

      const result_data = await response.json();
      
      if (result_data.success) {
        toast.success(`Incident report sent to ${recipientEmail}!`);
        setShowEmailDialog(false);
        setRecipientEmail("");
        setSelectedResult(null);
      } else {
        throw new Error(result_data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error sending incident report:", error);
      toast.error(error.message || "Failed to send incident report");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "bg-gray-100 text-gray-800 border-gray-200";
    
    switch (severity.toLowerCase()) {
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
      <div className="p-8" suppressHydrationWarning>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Log Simulation</h1>
          <p className="text-gray-600 mt-1">
            Simulate processing of Application Logs with Predictive Agent analysis
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Simulation Control
            </CardTitle>
            <CardDescription>
              Process Application Logs through the Predictive Agent to identify potential issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={startSimulation}
                disabled={status.isRunning || logFiles.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Simulation
              </Button>
              
              <Button
                onClick={stopSimulation}
                disabled={!status.isRunning}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Pause className="mr-2 h-4 w-4" />
                Stop
              </Button>
              
              <Button
                onClick={resetSimulation}
                disabled={status.isRunning}
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            {status.isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing: {status.currentFile}</span>
                  <span>{status.processedFiles}/{status.totalFiles} files</span>
                </div>
                <Progress value={status.progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Files Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Application Logs
            </CardTitle>
            <CardDescription>
              Available log files for simulation processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500">Loading log files...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{file.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Size: {(file.size / 1024).toFixed(1)} KB</p>
                      <p>Modified: {new Date(file.lastModified).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Results */}
        {status.results.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-600" />
                Full Agent Chain Analysis Results
              </CardTitle>
              <CardDescription>
                Complete analysis through Triage → Analyst → Predictive Agent chain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {status.results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{result.file}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.processing_time}ms
                      </Badge>
                    </div>
                  </div>

                  {/* Triage Agent Results */}
                  {result.triage_analysis && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Triage Agent Analysis
                      </h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Problem Statement:</strong> {result.analyst_analysis?.problem_statement || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Severity:</strong> 
                          <Badge 
                            className={`ml-2 text-xs ${getSeverityColor(result.triage_analysis.severity)}`}
                            variant="outline"
                          >
                            {result.triage_analysis.severity?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Entities Found:</strong> {result.triage_analysis.entities?.join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Analyst Agent Results */}
                  {result.analyst_analysis && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Analyst Agent Analysis
                      </h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Root Cause:</strong> {result.analyst_analysis?.reasoning || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Resolution Summary:</strong> {result.analyst_analysis.resolution_summary || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Selected SOP:</strong> {result.analyst_analysis?.selected_sop || result.analyst_analysis?.best_sop_id || 'None'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Predictive Agent Results */}
                  {result.predictive_insight && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Predictive Agent Analysis
                      </h4>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Predicted Impact:</strong> {result.predictive_insight.predictive_insight || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Confidence:</strong> 
                          <Badge 
                            variant="outline" 
                            className={`ml-2 text-xs ${
                              result.predictive_insight.confidence === 'high' ? 'border-green-300 text-green-700' :
                              result.predictive_insight.confidence === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-red-300 text-red-700'
                            }`}
                          >
                            {result.predictive_insight.confidence?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Escalation Contact */}
                  {result.escalation_contact && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Escalation Contact
                      </h4>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Contact:</strong> {result.escalation_contact.escalation_contact?.name || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Email:</strong> {result.escalation_contact.escalation_contact?.email || 'Not available'}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Phone:</strong> {result.escalation_contact.escalation_contact?.phone || 'Not available'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email and PDF Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      Export & Share Report
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => handleDownloadPDF(result)} 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      
                      <Button 
                        onClick={() => handleSendEmail(result)} 
                        className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                        size="sm"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setSelectedResult(result);
                          setShowEmailDialog(true);
                        }} 
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        size="sm"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email Report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : status.processedFiles > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                No Issues Found
              </CardTitle>
              <CardDescription>
                All log files processed successfully - no errors detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Systems Operational</h3>
                <p className="text-gray-600">
                  No errors, warnings, or issues were detected in the Application Logs.
                  The system is running normally.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Summary Stats */}
        {status.results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Simulation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{status.results.length}</div>
                  <div className="text-sm text-gray-600">Files Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {status.results.filter(r => 
                      r.triage_analysis?.severity === 'high' || 
                      r.triage_analysis?.severity === 'critical'
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">High Priority Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {status.results.filter(r => 
                      r.predictive_insight?.confidence === 'high'
                    ).length}
                  </div>
                  <div className="text-sm text-gray-600">High Confidence Predictions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {status.results.filter(r => r.analyst_analysis?.selected_sop).length}
                  </div>
                  <div className="text-sm text-gray-600">SOPs Selected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Dialog */}
        {showEmailDialog && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Email Incident Report</h3>
              <div className="space-y-4">
                <div>
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
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email will be sent from psacodesprint@arnavjhajharia.com with this address in CC
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSendIncidentReport(selectedResult)}
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
                        <Mail className="mr-2 h-4 w-4" />
                        Send Report
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowEmailDialog(false);
                      setRecipientEmail("");
                      setSelectedResult(null);
                    }}
                    variant="outline"
                    disabled={isSendingEmail}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
