"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Database,
  FileSearch,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
  Settings,
  GitBranch,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
  ChevronRight,
  Play,
} from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { toast } from "sonner";
import { SettingsPage } from "./settings-page-minimal";
import { WorkflowSection } from "./workflow-section-minimal";

interface ParsedEntities {
  module: string;
  entities: string[];
  alert_type: string;
  severity: string;
  urgency: string;
}

interface SOPCandidate {
  id: string;
  document: string;
  metadata: {
    module: string;
    title: string;
    overview: string;
    resolution: string;
  };
  distance: number;
}

interface Analysis {
  best_sop_id: string;
  reasoning: string;
  problem_statement: string;
  resolution_summary: string;
}

interface EscalationContact {
  module: string;
  primary_contact: {
    name: string;
    email: string;
    phone: string;
    escalation_level: string;
  };
  escalation_contact: {
    name: string;
    email: string;
    phone: string;
    escalation_level: string;
  };
}

interface EmailContent {
  to: string;
  subject: string;
  body: string;
}

interface ProcessResult {
  success: boolean;
  parsed_entities: ParsedEntities;
  candidate_sops: SOPCandidate[];
  analysis: Analysis;
  escalation_contact: EscalationContact;
  email_content: EmailContent;
}

type AgentStep = "idle" | "triage" | "retrieval" | "analysis" | "email";
type ActiveSection = "dashboard" | "workflow" | "settings";

export function MinimalistDashboard() {
  const { settings } = useSettings();
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [alertText, setAlertText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const stats = {
    totalAlerts: 147,
    processedToday: 23,
    avgResponseTime: "1.2s",
    successRate: 98.5,
  };

  const processAlert = async () => {
    if (!alertText.trim()) {
      toast.error("Please enter alert text");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setCurrentStep("triage");

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const response = await fetch(`${settings.backendUrl}/process_alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alert_text: alertText }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Failed to process alert");
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setCurrentStep("idle");
        toast.success("Alert processed successfully");
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setCurrentStep("idle");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!result?.email_content) return;

    setSendingEmail(true);
    try {
      const response = await fetch(`${settings.backendUrl}/send_email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.email_content),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email sent successfully");
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case "CNTR":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "VSL":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "EDI/API":
        return "text-cyan-700 bg-cyan-50 border-cyan-200";
      case "Infra/SRE":
        return "text-pink-700 bg-pink-50 border-pink-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const navigationItems = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { id: "workflow" as const, icon: GitBranch, label: "Workflow" },
    { id: "settings" as const, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">PSA Co-Pilot</div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Operations Intelligence</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            v1.0.0 • Connected
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeSection === "dashboard" && "Dashboard"}
              {activeSection === "workflow" && "Workflow"}
              {activeSection === "settings" && "Settings"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeSection === "dashboard" && "Process and manage alerts"}
              {activeSection === "workflow" && "Multi-agent processing pipeline"}
              {activeSection === "settings" && "Configure system preferences"}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {activeSection === "dashboard" && (
            <div className="max-w-6xl space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Alerts</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalAlerts}</p>
                      </div>
                      <Activity className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.processedToday}</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Response Time</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.avgResponseTime}</p>
                      </div>
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Success Rate</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.successRate}%</p>
                      </div>
                      <BarChart3 className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Input */}
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg font-semibold">Process New Alert</CardTitle>
                  <CardDescription className="text-gray-500">
                    Enter alert text to trigger AI processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste PSA alert text here..."
                    value={alertText}
                    onChange={(e) => setAlertText(e.target.value)}
                    className="min-h-[120px] border-gray-200 focus:border-gray-400 resize-none"
                    disabled={loading}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={processAlert}
                      disabled={loading || !alertText.trim()}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Process Alert
                        </>
                      )}
                    </Button>
                    {loading && (
                      <div className="flex-1">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Pipeline */}
              {loading && (
                <Card className="border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-lg font-semibold">Processing Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { step: "triage", icon: AlertCircle, label: "Triage" },
                        { step: "retrieval", icon: Database, label: "Retrieval" },
                        { step: "analysis", icon: FileSearch, label: "Analysis" },
                        { step: "email", icon: Mail, label: "Email" },
                      ].map(({ step, icon: Icon, label }) => (
                        <div
                          key={step}
                          className={`p-4 rounded-lg border ${
                            currentStep === step
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 mb-2 ${
                              currentStep === step ? "text-gray-900" : "text-gray-400"
                            }`}
                          />
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentStep === step ? "Processing..." : "Pending"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-6">
                  {/* Parsed Entities */}
                  <Card className="border-gray-200 bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Parsed Entities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Module</p>
                          <Badge className={`${getModuleColor(result.parsed_entities.module)} border`}>
                            {result.parsed_entities.module}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Type</p>
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {result.parsed_entities.alert_type}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Severity</p>
                          <Badge className={`${getSeverityColor(result.parsed_entities.severity)} border`}>
                            {result.parsed_entities.severity}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Urgency</p>
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {result.parsed_entities.urgency}
                          </Badge>
                        </div>
                      </div>
                      {result.parsed_entities.entities.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Entities</p>
                          <div className="flex flex-wrap gap-2">
                            {result.parsed_entities.entities.map((entity, idx) => (
                              <Badge key={idx} variant="outline" className="border-gray-300 text-gray-600">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SOP Candidates */}
                  <Card className="border-gray-200 bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5 text-gray-600" />
                        Candidate SOPs
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Top matching procedures
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.candidate_sops.map((sop, idx) => (
                        <div
                          key={sop.id}
                          className={`p-4 rounded-lg border ${
                            sop.id === result.analysis.best_sop_id
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-gray-300 text-gray-600">
                                #{idx + 1}
                              </Badge>
                              <h4 className="font-medium text-gray-900">{sop.metadata.title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getModuleColor(sop.metadata.module)}>
                                {sop.metadata.module}
                              </Badge>
                              <Badge variant="outline" className="border-gray-300 text-gray-600">
                                {((1 - sop.distance) * 100).toFixed(1)}%
                              </Badge>
                              {sop.id === result.analysis.best_sop_id && (
                                <Badge className="bg-green-600 text-white border-0">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{sop.metadata.overview}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* AI Analysis */}
                  <Card className="border-gray-200 bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-gray-600" />
                        Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Problem</h4>
                        <p className="text-sm text-gray-600">{result.analysis.problem_statement}</p>
                      </div>
                      <Separator className="bg-gray-200" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Resolution</h4>
                        <p className="text-sm text-gray-600">{result.analysis.resolution_summary}</p>
                      </div>
                      <Separator className="bg-gray-200" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Reasoning</h4>
                        <p className="text-sm text-gray-500">{result.analysis.reasoning}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Escalation Email */}
                  <Card className="border-gray-200 bg-white">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                            <Mail className="h-5 w-5 text-gray-600" />
                            Escalation Email
                          </CardTitle>
                          <CardDescription className="text-gray-500 mt-1">
                            To: {result.escalation_contact.primary_contact.name}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={sendEmail}
                          disabled={sendingEmail}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          {sendingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Email
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Subject</p>
                        <p className="text-sm text-gray-900 font-medium">{result.email_content.subject}</p>
                      </div>
                      <Separator className="bg-gray-200" />
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Message</p>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                            {result.email_content.body}
                          </pre>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Primary Contact</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {result.escalation_contact.primary_contact.name}
                          </p>
                          <p className="text-xs text-gray-600">{result.escalation_contact.primary_contact.email}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Escalation Contact</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {result.escalation_contact.escalation_contact.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {result.escalation_contact.escalation_contact.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeSection === "workflow" && <WorkflowSection />}
          {activeSection === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
