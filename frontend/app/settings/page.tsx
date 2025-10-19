"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Server, Bell, Mail, Database, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    apiUrl: "http://localhost:5000",
    enableNotifications: true,
    emailEnabled: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    const savedSettings = localStorage.getItem("app_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch(`${settings.apiUrl}/analytics`);
      if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      setConnectionStatus("error");
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("app_settings", JSON.stringify(settings));
      toast.success("Settings saved successfully!");
      setIsSaving(false);
    }, 500);
  };

  const handleTestConnection = async () => {
    setConnectionStatus("checking");
    try {
      const response = await fetch(`${settings.apiUrl}/analytics`);
      if (response.ok) {
        setConnectionStatus("connected");
        toast.success("Connection successful!");
      } else {
        setConnectionStatus("error");
        toast.error("Connection failed. Check your API URL.");
      }
    } catch (error) {
      setConnectionStatus("error");
      toast.error("Cannot connect to API. Make sure the backend is running.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your PSA Alert Processing System
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure the backend API connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">Backend API URL</Label>
                <Input
                  id="apiUrl"
                  type="url"
                  value={settings.apiUrl}
                  onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                  placeholder="http://localhost:5000"
                />
                <p className="text-sm text-gray-500">
                  The URL of your Flask backend API
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleTestConnection} variant="outline">
                  Test Connection
                </Button>
                {connectionStatus === "checking" && (
                  <Badge variant="secondary">Checking...</Badge>
                )}
                {connectionStatus === "connected" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {connectionStatus === "error" && (
                  <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
                    Connection Failed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Show toast notifications for processing updates
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure email escalation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailEnabled">Enable Email Sending</Label>
                  <p className="text-sm text-gray-500">
                    Allow sending escalation emails
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailEnabled: checked })
                  }
                />
              </div>

              {!settings.emailEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Email credentials must be configured in the backend .env file (SENDER_EMAIL and EMAIL_APP_PASSWORD)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Application Version</p>
                  <Badge variant="secondary">v1.0.0</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Environment</p>
                  <Badge variant="outline">{process.env.NODE_ENV || "development"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Frontend Framework</p>
                  <Badge>Next.js 15</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Backend</p>
                  <Badge>Flask + Gemini AI</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">UI Library</p>
                  <Badge>shadcn/ui</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Database</p>
                  <Badge>SQLite + ChromaDB</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About PSA Alert Processing System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  The PSA Alert Processing System is a Multi-Agent RAG (Retrieval-Augmented Generation)
                  platform designed to automate and enhance the processing of Port System Alerts.
                </p>
                <p>
                  It uses advanced AI models from Google Gemini 2.5 to analyze alerts, retrieve relevant
                  Standard Operating Procedures, and provide actionable recommendations to support teams.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              size="lg"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Server className="mr-2 h-4 w-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
