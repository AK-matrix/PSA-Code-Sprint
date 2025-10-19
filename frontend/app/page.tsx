"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import axios from "axios";

// Types
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

interface ProcessResult {
  success: boolean;
  parsed_entities: ParsedEntities;
  analysis: Analysis;
  email_content: {
    to: string;
    subject: string;
    body: string;
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertText, setAlertText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState("");

  // Settings state
  const [settings, setSettings] = useState({
    aiModel: "gemini-2.5-flash",
    apiEndpoint: "http://localhost:5000",
    autoEscalate: false,
    notificationsEnabled: true,
  });

  const processAlert = async () => {
    if (!alertText.trim()) {
      setError("Please enter alert text");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post(`${settings.apiEndpoint}/process_alert`, {
        alert_text: alertText,
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to process alert");
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!result?.email_content) return;

    try {
      await axios.post(`${settings.apiEndpoint}/send_email`, result.email_content);
      alert("Escalation email sent successfully!");
    } catch (err: any) {
      alert(`Failed to send email: ${err.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[severity.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">PSA AI Co-pilot</h1>
              <p className="text-xs text-gray-500">Operations Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Status</p>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTab === "dashboard" ? "Alert Processing" : "System Settings"}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeTab === "dashboard"
                    ? "AI-powered incident management and escalation"
                    : "Configure your AI operations platform"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">AI Model</p>
                <p className="text-xs text-gray-500">{settings.aiModel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Input Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Alert Input
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Paste your PSA alert text below for AI-powered analysis
                  </p>
                  <textarea
                    value={alertText}
                    onChange={(e) => setAlertText(e.target.value)}
                    placeholder="RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>
                <button
                  onClick={processAlert}
                  disabled={loading || !alertText.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Alert...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Process Alert with AI
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-6">
                  {/* Parsed Entities */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">Parsed Information</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Module</p>
                        <p className="text-sm font-medium text-gray-900">{result.parsed_entities.module}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Alert Type</p>
                        <p className="text-sm font-medium text-gray-900">{result.parsed_entities.alert_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Severity</p>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(
                            result.parsed_entities.severity
                          )}`}
                        >
                          {result.parsed_entities.severity.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Urgency</p>
                        <p className="text-sm font-medium text-gray-900">{result.parsed_entities.urgency}</p>
                      </div>
                    </div>
                    {result.parsed_entities.entities.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Entities</p>
                        <div className="flex flex-wrap gap-2">
                          {result.parsed_entities.entities.map((entity, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200"
                            >
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">AI Analysis & Resolution</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended SOP</p>
                        <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                          {result.analysis.best_sop_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Problem Statement</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.analysis.problem_statement}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Resolution Steps</p>
                        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono">
                          {result.analysis.resolution_summary}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Reasoning</p>
                        <p className="text-sm text-gray-600 italic">{result.analysis.reasoning}</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Escalation */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-gray-900" />
                        <h3 className="text-lg font-bold text-gray-900">Escalation Email</h3>
                      </div>
                      <button
                        onClick={sendEmail}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send Email
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">To</p>
                        <p className="text-sm text-gray-900">{result.email_content.to}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Subject</p>
                        <p className="text-sm font-medium text-gray-900">{result.email_content.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Message Body</p>
                        <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-gray-200">
                          {result.email_content.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!result && !loading && !error && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Process Alerts</h3>
                  <p className="text-sm text-gray-500">
                    Enter an alert above to get AI-powered analysis, resolution steps, and automated escalation
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Settings Page
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">AI Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      AI Model
                    </label>
                    <select
                      value={settings.aiModel}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the Google Gemini model for alert analysis
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      API Endpoint
                    </label>
                    <input
                      type="text"
                      value={settings.apiEndpoint}
                      onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="http://localhost:5000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Backend API endpoint URL</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Automation Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Auto-escalate Critical Alerts</p>
                      <p className="text-sm text-gray-500">
                        Automatically send escalation emails for critical severity alerts
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({ ...settings, autoEscalate: !settings.autoEscalate })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoEscalate ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoEscalate ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Enable Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive browser notifications for processed alerts
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notificationsEnabled: !settings.notificationsEnabled,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notificationsEnabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Settings Saved</p>
                    <p className="text-sm text-blue-700">
                      All changes are saved automatically to your browser
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
