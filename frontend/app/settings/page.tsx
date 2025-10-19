"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Server, Bell, CheckCircle, Brain, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    showToastNotifications: true,
    autoSaveHistory: true,
    aiProvider: "gemini",
    theme: "light",
    language: "en",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("app_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("app_settings", JSON.stringify(settings));
      toast.success("Settings saved successfully!");
      setIsSaving(false);
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your PSA Alert Processing System preferences and AI models
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Choose your preferred AI assistant for processing alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="aiProvider" className="text-sm font-medium">AI Assistant</Label>
                <Select
                  value={settings.aiProvider}
                  onValueChange={(value) => setSettings({ ...settings, aiProvider: value })}
                >
                  <SelectTrigger id="aiProvider" className="w-full">
                    <SelectValue placeholder="Select AI Assistant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini (Recommended)</SelectItem>
                    <SelectItem value="openai">OpenAI ChatGPT</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Both assistants are configured and ready to use. Gemini is recommended for faster processing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="toastNotifications" className="text-sm font-medium cursor-pointer">
                      Show Notifications
                    </Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get popup notifications when alerts are processed successfully or encounter errors
                  </p>
                </div>
                <Switch
                  id="toastNotifications"
                  checked={settings.showToastNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showToastNotifications: checked })
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="autoSave" className="text-sm font-medium cursor-pointer">
                      Save History
                    </Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatically save processed alerts to your browser for later review
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={settings.autoSaveHistory}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoSaveHistory: checked })
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => setSettings({ ...settings, theme: value })}
                >
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Select Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Choose your preferred color theme
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Select your preferred language for the interface
                </p>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-gray-600" />
                About
              </CardTitle>
              <CardDescription>
                Information about the PSA Alert Processing System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">Version 1.0.0</Badge>
                  <Badge className="bg-green-600 text-white text-sm">Ready to Use</Badge>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">What this system does:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Automatically processes Port System Alerts using AI</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Provides step-by-step solutions and recommendations</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Tracks your alert history for better insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Options */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Reset Options
              </CardTitle>
              <CardDescription className="text-orange-600">
                Clear your data or reset settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-900">Clear History</Label>
                    <p className="text-sm text-gray-600">
                      Delete all saved alert history from your browser
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all history? This cannot be undone.")) {
                        localStorage.removeItem("alert_history");
                        toast.success("History cleared");
                      }
                    }}
                  >
                    Clear History
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-900">Reset Settings</Label>
                    <p className="text-sm text-gray-600">
                      Reset all settings to default values
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
                        localStorage.removeItem("app_settings");
                        window.location.reload();
                      }
                    }}
                  >
                    Reset Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="sticky bottom-6 z-10">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ready to save your changes?</p>
                    <p className="text-xs text-gray-500">Settings will be saved to your browser</p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  size="lg"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
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
        </div>
      </div>
    </DashboardLayout>
  );
}
