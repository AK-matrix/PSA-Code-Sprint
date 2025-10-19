"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Database,
  FileSearch,
  Mail,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function WorkflowSection() {
  const steps = [
    {
      id: 1,
      icon: AlertCircle,
      title: "Triage Agent",
      description: "Parses alert and extracts metadata",
      details: [
        "Analyzes incoming alert text",
        "Extracts entities and metadata",
        "Classifies module and severity",
        "Determines urgency level",
      ],
    },
    {
      id: 2,
      icon: Database,
      title: "Retrieval Engine",
      description: "Searches vector database for SOPs",
      details: [
        "Embeds alert text",
        "Performs semantic search",
        "Retrieves top 3 candidates",
        "Ranks by relevance",
      ],
    },
    {
      id: 3,
      icon: FileSearch,
      title: "Analyst Agent",
      description: "Analyzes and selects best SOP",
      details: [
        "Analyzes candidate SOPs",
        "Selects best match",
        "Generates problem statement",
        "Creates resolution steps",
      ],
    },
    {
      id: 4,
      icon: Mail,
      title: "Escalation Engine",
      description: "Drafts and sends email",
      details: [
        "Identifies contacts",
        "Drafts email content",
        "Includes full context",
        "Sends to team",
      ],
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Workflow Overview */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg font-semibold">Process Flow</CardTitle>
          <CardDescription className="text-gray-500">
            How the multi-agent system processes alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="relative">
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-gray-600">
                        {step.id}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>

                  {!isLast && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <Card key={step.id} className="border-gray-200 bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 text-base font-semibold">{step.title}</CardTitle>
                    <CardDescription className="text-gray-500 text-xs">
                      {step.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technology Stack */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 text-lg font-semibold">Technology Stack</CardTitle>
          <CardDescription className="text-gray-500">
            Powered by modern AI and database technologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">LLM</h4>
              <p className="text-xs text-gray-600">Gemini 2.5 Flash</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Vector DB</h4>
              <p className="text-xs text-gray-600">ChromaDB</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Embeddings</h4>
              <p className="text-xs text-gray-600">MiniLM-L6-v2</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Framework</h4>
              <p className="text-xs text-gray-600">Multi-Agent RAG</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
