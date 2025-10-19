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
  Bot,
  Database,
  FileSearch,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";

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

export function PSADashboard() {
  const [alertText, setAlertText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const processAlert = async () => {
    if (!alertText.trim()) {
      setError("Please enter alert text");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setCurrentStep("triage");

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const response = await fetch("http://localhost:5000/process_alert", {
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
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!result?.email_content) return;

    setSendingEmail(true);
    try {
      const response = await fetch("http://localhost:5000/send_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.email_content),
      });

      const data = await response.json();

      if (data.success) {
        alert("Email sent successfully!");
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
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

  const getModuleColor = (module: string) => {
    switch (module) {
      case "CNTR":
        return "bg-blue-500";
      case "VSL":
        return "bg-purple-500";
      case "EDI/API":
        return "bg-cyan-500";
      case "Infra/SRE":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PSA AI Co-Pilot</h1>
                <p className="text-sm text-slate-400">Multi-Agent Operations Intelligence</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise Ready
              </Badge>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Hero Section */}
        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Alert Processing System</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Enter a PSA alert below to trigger intelligent triage, SOP matching, and automated escalation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste PSA alert text here..."
              value={alertText}
              onChange={(e) => setAlertText(e.target.value)}
              className="min-h-[150px] bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              disabled={loading}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={processAlert}
                disabled={loading || !alertText.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                {loading ? (
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
              {loading && (
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Timeline */}
        {loading && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                Agent Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { step: "triage", icon: AlertCircle, label: "Triage Agent" },
                  { step: "retrieval", icon: Database, label: "Retrieval Engine" },
                  { step: "analysis", icon: FileSearch, label: "Analyst Agent" },
                  { step: "email", icon: Mail, label: "Escalation" },
                ].map(({ step, icon: Icon, label }) => (
                  <div
                    key={step}
                    className={`p-4 rounded-lg border ${
                      currentStep === step
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-900/50"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 mb-2 ${
                        currentStep === step ? "text-cyan-400 animate-pulse" : "text-slate-500"
                      }`}
                    />
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-400">
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Parsed Entities */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Parsed Entities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Module</p>
                    <Badge className={`${getModuleColor(result.parsed_entities.module)} text-white`}>
                      {result.parsed_entities.module}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Alert Type</p>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {result.parsed_entities.alert_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Severity</p>
                    <Badge className={`${getSeverityColor(result.parsed_entities.severity)} text-white`}>
                      {result.parsed_entities.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Urgency</p>
                    <Badge variant="secondary">{result.parsed_entities.urgency}</Badge>
                  </div>
                </div>
                {result.parsed_entities.entities.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Extracted Entities</p>
                    <div className="flex flex-wrap gap-2">
                      {result.parsed_entities.entities.map((entity, idx) => (
                        <Badge key={idx} variant="outline" className="border-cyan-500/50 text-cyan-300">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SOP Candidates */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-400" />
                  Candidate SOPs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Top matching procedures from vector database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.candidate_sops.map((sop, idx) => (
                  <div
                    key={sop.id}
                    className={`p-4 rounded-lg border ${
                      sop.id === result.analysis.best_sop_id
                        ? "border-green-500 bg-green-500/10"
                        : "border-slate-700 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-slate-600">
                          #{idx + 1}
                        </Badge>
                        <h4 className="font-semibold text-white">{sop.metadata.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getModuleColor(sop.metadata.module)}>
                          {sop.metadata.module}
                        </Badge>
                        <Badge variant="secondary">
                          {((1 - sop.distance) * 100).toFixed(1)}% match
                        </Badge>
                        {sop.id === result.analysis.best_sop_id && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{sop.metadata.overview}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-cyan-400" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Problem Statement</h4>
                  <p className="text-slate-300">{result.analysis.problem_statement}</p>
                </div>
                <Separator className="bg-slate-700" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Resolution Summary</h4>
                  <p className="text-slate-300">{result.analysis.resolution_summary}</p>
                </div>
                <Separator className="bg-slate-700" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Reasoning</h4>
                  <p className="text-slate-400 text-sm">{result.analysis.reasoning}</p>
                </div>
              </CardContent>
            </Card>

            {/* Escalation Email */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-400" />
                      Escalation Email
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      To: {result.escalation_contact.primary_contact.name} (
                      {result.escalation_contact.primary_contact.escalation_level})
                    </CardDescription>
                  </div>
                  <Button
                    onClick={sendEmail}
                    disabled={sendingEmail}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
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
                  <p className="text-sm text-slate-400 mb-1">Subject</p>
                  <p className="text-white font-medium">{result.email_content.subject}</p>
                </div>
                <Separator className="bg-slate-700" />
                <div>
                  <p className="text-sm text-slate-400 mb-2">Message Body</p>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {result.email_content.body}
                    </pre>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Primary Contact</p>
                    <p className="text-sm text-white font-medium">
                      {result.escalation_contact.primary_contact.name}
                    </p>
                    <p className="text-xs text-slate-400">{result.escalation_contact.primary_contact.email}</p>
                    <p className="text-xs text-slate-400">{result.escalation_contact.primary_contact.phone}</p>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Escalation Contact</p>
                    <p className="text-sm text-white font-medium">
                      {result.escalation_contact.escalation_contact.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {result.escalation_contact.escalation_contact.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      {result.escalation_contact.escalation_contact.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
