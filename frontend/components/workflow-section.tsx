"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Database,
  FileSearch,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Bot,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      id: 1,
      icon: AlertCircle,
      title: "Triage Agent",
      description: "Intelligent Alert Parsing",
      details: [
        "Analyzes incoming alert text",
        "Extracts entities and metadata",
        "Classifies module (CNTR/VSL/EDI/Infra)",
        "Determines severity and urgency",
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      id: 2,
      icon: Database,
      title: "Retrieval Engine",
      description: "Vector Database Search",
      details: [
        "Embeds alert using sentence transformers",
        "Performs semantic vector search",
        "Retrieves top 3 candidate SOPs",
        "Ranks by relevance score",
      ],
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      id: 3,
      icon: FileSearch,
      title: "Analyst Agent",
      description: "AI-Powered Analysis",
      details: [
        "Analyzes candidate SOPs with LLM",
        "Selects best matching procedure",
        "Generates problem statement",
        "Creates resolution summary",
      ],
      color: "from-orange-500 to-yellow-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      id: 4,
      icon: Mail,
      title: "Escalation Engine",
      description: "Automated Communication",
      details: [
        "Identifies escalation contacts",
        "Drafts professional email",
        "Includes full analysis context",
        "Sends to appropriate team",
      ],
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      iconColor: "text-green-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bot className="h-8 w-8 text-cyan-400" />
          Multi-Agent Workflow
        </h2>
        <p className="text-slate-400 mt-1">
          Understanding how our AI agents collaborate to process alerts
        </p>
      </div>

      {/* Workflow Overview */}
      <Card className="border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-white">How It Works</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Our system uses a sophisticated multi-agent architecture to process alerts with human-like
            intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="relative">
                  <div
                    className={`p-6 rounded-lg border ${step.borderColor} ${step.bgColor} backdrop-blur-sm transition-all hover:scale-105`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        Step {step.id}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{step.description}</p>
                  </div>

                  {!isLast && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-cyan-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <Card key={step.id} className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {step.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 ${step.iconColor}`} />
                      <p className="text-sm text-slate-300">{detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technology Stack */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Technology Stack</CardTitle>
          <CardDescription className="text-slate-400">
            Powered by cutting-edge AI and database technologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">LLM</h4>
              <p className="text-xs text-slate-400">Google Gemini 2.5 Flash</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Vector DB</h4>
              <p className="text-xs text-slate-400">ChromaDB</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Embeddings</h4>
              <p className="text-xs text-slate-400">Sentence Transformers</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Framework</h4>
              <p className="text-xs text-slate-400">Multi-Agent RAG</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
