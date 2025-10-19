"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Server, Bell, Mail, Database } from "lucide-react";
import { toast } from "sonner";

export function Settings() {
  const [settings, setSettings] = useState({
    apiUrl: "http://localhost:5000",
    enableNotifications: true,
    enableAutoSave: true,
    emailEnabled: false,
    maxHistoryItems: "50",
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("app_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    toast.success("Settings saved successfully!");
  };

  const handleClearHistory = () => {
    localStorage.removeItem("alert_history");
    toast.success("Alert history cleared!");
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${settings.apiUrl}/`);
      if (response.ok) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed. Check your API URL.");
      }
    } catch (error) {
      toast.error("Cannot connect to API. Make sure the backend is running.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
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
            <p className="text-sm text-muted-foreground">
              The URL of your Flask backend API
            </p>
          </div>

          <Button onClick={handleTestConnection} variant="outline">
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
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
              <p className="text-sm text-muted-foreground">
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

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave">Auto-save History</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save processed alerts to history
              </p>
            </div>
            <Switch
              id="autoSave"
              checked={settings.enableAutoSave}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enableAutoSave: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
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
              <p className="text-sm text-muted-foreground">
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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Email credentials must be configured in the backend .env file (SENDER_EMAIL and EMAIL_APP_PASSWORD)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your application data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxHistory">Maximum History Items</Label>
            <Input
              id="maxHistory"
              type="number"
              value={settings.maxHistoryItems}
              onChange={(e) => setSettings({ ...settings, maxHistoryItems: e.target.value })}
              min="10"
              max="200"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of alerts to store in history
            </p>
          </div>

          <Separator />

          <div>
            <Button onClick={handleClearHistory} variant="destructive">
              Clear Alert History
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete all saved alert history from local storage
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Environment</p>
              <Badge variant="outline">{process.env.NODE_ENV || "development"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Frontend</p>
              <Badge>Next.js 15</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Backend</p>
              <Badge>Flask + Gemini</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
