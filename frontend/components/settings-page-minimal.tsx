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
import { Save, RotateCcw, Key, Mail, Server, Cpu } from "lucide-react";

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateSettings(localSettings);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
    toast.info("Settings reset");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="api" className="data-[state=active]:bg-white">
            <Key className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-white">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="model" className="data-[state=active]:bg-white">
            <Cpu className="h-4 w-4 mr-2" />
            Model
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-white">
            <Server className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* API Configuration */}
        <TabsContent value="api" className="space-y-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">API Configuration</CardTitle>
              <CardDescription className="text-gray-500">
                Configure your Google Gemini API key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-gray-900 text-sm">
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
                  className="border-gray-200 focus:border-gray-400"
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">Email Settings</CardTitle>
              <CardDescription className="text-gray-500">
                Configure email for escalation notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailSender" className="text-gray-900 text-sm">
                  Sender Email
                </Label>
                <Input
                  id="emailSender"
                  type="email"
                  placeholder="your-email@company.com"
                  value={localSettings.emailSender}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, emailSender: e.target.value })
                  }
                  className="border-gray-200 focus:border-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPassword" className="text-gray-900 text-sm">
                  App Password
                </Label>
                <Input
                  id="emailPassword"
                  type="password"
                  placeholder="Enter your app password"
                  value={localSettings.emailPassword}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, emailPassword: e.target.value })
                  }
                  className="border-gray-200 focus:border-gray-400"
                />
                <p className="text-xs text-gray-500">
                  For Gmail, generate an app password from{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 underline"
                  >
                    Google Account
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Selection */}
        <TabsContent value="model" className="space-y-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">Model Selection</CardTitle>
              <CardDescription className="text-gray-500">
                Choose the AI model for processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-gray-900 text-sm">
                  Gemini Model
                </Label>
                <Select
                  value={localSettings.model}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, model: value })
                  }
                >
                  <SelectTrigger className="border-gray-200 focus:border-gray-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="gemini-2.5-flash">
                      Gemini 2.5 Flash (Recommended)
                    </SelectItem>
                    <SelectItem value="gemini-2.0-flash">
                      Gemini 2.0 Flash
                    </SelectItem>
                    <SelectItem value="gemini-1.5-pro">
                      Gemini 1.5 Pro
                    </SelectItem>
                    <SelectItem value="gemini-1.5-flash">
                      Gemini 1.5 Flash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg font-semibold">Advanced Settings</CardTitle>
              <CardDescription className="text-gray-500">
                System configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backendUrl" className="text-gray-900 text-sm">
                  Backend URL
                </Label>
                <Input
                  id="backendUrl"
                  type="url"
                  placeholder="http://localhost:5000"
                  value={localSettings.backendUrl}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, backendUrl: e.target.value })
                  }
                  className="border-gray-200 focus:border-gray-400"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-gray-900 text-sm">Auto-save responses</Label>
                  <p className="text-xs text-gray-500">
                    Save AI responses to local storage
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Settings
                </Button>
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
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          {isSaving ? (
            <>Saving...</>
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
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
