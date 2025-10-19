"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  FileSearch,
  Brain,
  Database,
  Mail,
  Shield,
  Network,
  Zap
} from "lucide-react";

export function WorkflowExplanation() {
  const workflows = [
    {
      step: "1",
      title: "Triage Agent",
      icon: FileSearch,
      description: "Parses the incoming alert text to extract key information",
      details: [
        "Identifies the module (CNTR, VSL, EDI/API, Infra/SRE)",
        "Extracts entities (container numbers, vessel names, error codes)",
        "Determines alert type, severity, and urgency",
        "Uses Gemini 2.5 Flash LLM for intelligent parsing"
      ],
      color: "text-blue-600 bg-blue-50"
    },
    {
      step: "2",
      title: "Document Retrieval",
      icon: Database,
      description: "Retrieves relevant SOPs and case logs from ChromaDB",
      details: [
        "Searches module-specific collections",
        "Retrieves top 3-4 Standard Operating Procedures",
        "Retrieves top 4-5 historical case logs",
        "Uses semantic similarity for ranking"
      ],
      color: "text-green-600 bg-green-50"
    },
    {
      step: "3",
      title: "SQL Data Extraction",
      icon: Network,
      description: "Queries SQL database for contextual information",
      details: [
        "Extracts vessel data if applicable",
        "Retrieves container records",
        "Gathers EDI/API event logs",
        "Provides real-time operational context"
      ],
      color: "text-purple-600 bg-purple-50"
    },
    {
      step: "4",
      title: "Analyst Agent",
      icon: Brain,
      description: "Analyzes all gathered information to provide recommendations",
      details: [
        "Evaluates candidate SOPs and case logs",
        "Considers SQL database context",
        "Generates clear problem statement",
        "Provides step-by-step resolution approach",
        "Selects the most relevant SOP"
      ],
      color: "text-orange-600 bg-orange-50"
    },
    {
      step: "5",
      title: "Escalation & Email",
      icon: Mail,
      description: "Prepares escalation email with all analysis results",
      details: [
        "Identifies appropriate escalation contacts",
        "Generates comprehensive email content",
        "Includes all technical analysis",
        "Ready to send via SMTP"
      ],
      color: "text-red-600 bg-red-50"
    }
  ];

  const modules = [
    { name: "CNTR (Container)", desc: "Container-related alerts and operations", icon: "📦" },
    { name: "VSL (Vessel)", desc: "Vessel operations and scheduling", icon: "🚢" },
    { name: "EDI/API", desc: "Electronic Data Interchange and API integration", icon: "🔄" },
    { name: "Infra/SRE", desc: "Infrastructure and Site Reliability Engineering", icon: "⚙️" },
    { name: "Container Report", desc: "Container reporting and analytics", icon: "📊" },
    { name: "Container Booking", desc: "Container booking management", icon: "📝" },
    { name: "IMPORT/EXPORT", desc: "Import and export operations", icon: "🌍" }
  ];

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Multi-Agent RAG Architecture
          </CardTitle>
          <CardDescription>
            Intelligent alert processing using Retrieval-Augmented Generation with specialized AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflows.map((workflow, index) => (
              <div key={workflow.step}>
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${workflow.color} flex items-center justify-center font-bold text-lg`}>
                    {workflow.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <workflow.icon className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">{workflow.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{workflow.description}</p>
                    <ul className="space-y-1 ml-4">
                      {workflow.details.map((detail, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-muted-foreground mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {index < workflows.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Supported Modules
          </CardTitle>
          <CardDescription>
            The system is trained on the following PSA operational modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => (
              <Card key={module.name} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{module.icon}</div>
                    <div>
                      <h4 className="font-semibold mb-1">{module.name}</h4>
                      <p className="text-sm text-muted-foreground">{module.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Badge className="mb-2">AI/ML</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Google Gemini 2.5</li>
                <li>SentenceTransformers</li>
                <li>ChromaDB</li>
              </ul>
            </div>
            <div>
              <Badge className="mb-2">Backend</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Flask (Python)</li>
                <li>Flask-CORS</li>
                <li>SQL Database</li>
              </ul>
            </div>
            <div>
              <Badge className="mb-2">Frontend</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Next.js 15</li>
                <li>React</li>
                <li>Tailwind CSS</li>
                <li>shadcn/ui</li>
              </ul>
            </div>
            <div>
              <Badge className="mb-2">Features</Badge>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>RAG Architecture</li>
                <li>Multi-Agent System</li>
                <li>SMTP Integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
