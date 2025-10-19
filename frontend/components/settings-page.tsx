"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-context";
import { toast } from "sonner";
import {
  Save,
  RotateCcw,
  Key,
  Mail,
  Server,
  Cpu,
  Bell,
  Shield,
  Database,
  Zap,
} from "lucide-react";

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSettings(localSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
    toast.info("Settings reset to default");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 mt-1">
          Configure your PSA AI Co-Pilot system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="api" className="data-[state=active]:bg-slate-700">
            <Key className="h-4 w-4 mr-2" />
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-slate-700">
            <Mail className="h-4 w-4 mr-2" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="model" className="data-[state=active]:bg-slate-700">
            <Cpu className="h-4 w-4 mr-2" />
            Model Selection
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-slate-700">
            <Server className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* API Configuration */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-400" />
                Google Gemini API Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure your Google Gemini API key for AI processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-white">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Google API key"
                  value={localSettings.apiKey}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, apiKey: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-400">
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Secure Storage</h4>
                    <p className="text-sm text-slate-300">
                      Your API key is encrypted and stored locally in your browser. It never
                      leaves your device except when making API calls to Google.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-400" />
                Email Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure email settings for escalation notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailSender" className="text-white">
                  Sender Email Address
                </Label>
                <Input
                  id="emailSender"
                  type="email"
                  placeholder="your-email@company.com"
                  value={localSettings.emailSender}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, emailSender: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPassword" className="text-white">
                  App Password
                </Label>
                <Input
                  id="emailPassword"
                  type="password"
                  placeholder="Enter your app-specific password"
                  value={localSettings.emailPassword}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, emailPassword: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-400">
                  For Gmail, generate an app password from your{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Google Account settings
                  </a>
                </p>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">
                      Email Configuration
                    </h4>
                    <p className="text-sm text-slate-300">
                      Currently configured for Gmail SMTP. For other providers, you may need
                      to update the backend SMTP settings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Selection */}
        <TabsContent value="model" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-400" />
                AI Model Selection
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choose the AI model for alert processing and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-white">
                  Gemini Model
                </Label>
                <Select
                  value={localSettings.model}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, model: value })
                  }
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="gemini-2.5-flash" className="text-white">
                      Gemini 2.5 Flash (Fast & Efficient)
                    </SelectItem>
                    <SelectItem value="gemini-2.0-flash" className="text-white">
                      Gemini 2.0 Flash
                    </SelectItem>
                    <SelectItem value="gemini-1.5-pro" className="text-white">
                      Gemini 1.5 Pro (More Capable)
                    </SelectItem>
                    <SelectItem value="gemini-1.5-flash" className="text-white">
                      Gemini 1.5 Flash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <h4 className="text-sm font-semibold text-white">Speed</h4>
                  </div>
                  <p className="text-sm text-slate-300">
                    Flash models offer faster response times, ideal for real-time processing
                  </p>
                </div>
                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">Capability</h4>
                  </div>
                  <p className="text-sm text-slate-300">
                    Pro models provide enhanced reasoning for complex alert scenarios
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-400" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-sm text-slate-400">
                    Receive email notifications for critical alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Browser Notifications</Label>
                  <p className="text-sm text-slate-400">
                    Show browser notifications for new alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Auto-escalation</Label>
                  <p className="text-sm text-slate-400">
                    Automatically escalate high-severity alerts
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Sound Alerts</Label>
                  <p className="text-sm text-slate-400">
                    Play sound for urgent notifications
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-red-400" />
                Advanced Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Advanced settings for system behavior and backend connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backendUrl" className="text-white">
                  Backend API URL
                </Label>
                <Input
                  id="backendUrl"
                  type="url"
                  placeholder="http://localhost:5000"
                  value={localSettings.backendUrl}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, backendUrl: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-sm text-slate-400">
                  The URL of your PSA backend server
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Debug Mode</Label>
                  <p className="text-sm text-slate-400">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-white">Auto-save Responses</Label>
                  <p className="text-sm text-slate-400">
                    Automatically save AI responses to local storage
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Danger Zone</h4>
                    <p className="text-sm text-slate-300 mb-3">
                      These actions cannot be undone. Please be careful.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReset}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {isSaving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocalSettings(settings)}
          className="border-slate-700 text-white hover:bg-slate-800"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
