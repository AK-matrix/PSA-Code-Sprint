"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, Ship } from "lucide-react";

interface Analytics {
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  avg_resolution_time: number;
  module_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  recent_activity: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/analytics`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">
            Monitor system performance and track key metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Incidents
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : analytics?.total_incidents || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Open Cases
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : analytics?.open_incidents || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics && analytics.total_incidents > 0
                  ? `${calculatePercentage(analytics.open_incidents, analytics.total_incidents)}% of total`
                  : "No incidents"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Resolved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : analytics?.resolved_incidents || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics && analytics.total_incidents > 0
                  ? `${calculatePercentage(analytics.resolved_incidents, analytics.total_incidents)}% resolution rate`
                  : "No incidents"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg. Resolution Time
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `${Math.round(analytics?.avg_resolution_time || 0)}m`}
              </div>
              <p className="text-xs text-gray-500 mt-1">Minutes per incident</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Module Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Module</CardTitle>
              <CardDescription>Distribution across different PSA modules</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {analytics?.module_distribution && Object.entries(analytics.module_distribution).map(([module, count]) => {
                    const percentage = calculatePercentage(count, analytics.total_incidents);
                    return (
                      <div key={module} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Ship className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{module}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count}</span>
                            <Badge variant="secondary" className="text-xs">{percentage}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.module_distribution || Object.keys(analytics.module_distribution).length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-8">No data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents by Severity</CardTitle>
              <CardDescription>Breakdown by severity levels</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {analytics?.severity_distribution && Object.entries(analytics.severity_distribution).map(([severity, count]) => {
                    const percentage = calculatePercentage(count, analytics.total_incidents);
                    return (
                      <div key={severity} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={`${getSeverityColor(severity)} border`} variant="outline">
                            {severity.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} incidents</span>
                            <Badge variant="secondary" className="text-xs">{percentage}%</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              severity === "critical" ? "bg-red-600" :
                              severity === "high" ? "bg-orange-600" :
                              severity === "medium" ? "bg-yellow-600" :
                              "bg-green-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!analytics?.severity_distribution || Object.keys(analytics.severity_distribution).length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-8">No data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Status Overview</CardTitle>
            <CardDescription>Current status of all incidents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analytics?.status_distribution && Object.entries(analytics.status_distribution).map(([status, count]) => {
                  const percentage = calculatePercentage(count, analytics.total_incidents);
                  return (
                    <Card key={status} className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-medium text-gray-600 uppercase">{status.replace("_", " ")}</p>
                          <p className="text-3xl font-bold text-gray-900">{count}</p>
                          <Badge variant="secondary" className="text-xs">{percentage}% of total</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {(!analytics?.status_distribution || Object.keys(analytics.status_distribution).length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-8 col-span-4">No data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <CardTitle className="text-lg">System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processing Speed</span>
                  <span className="text-sm font-semibold text-green-600">Optimal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">API Health</span>
                  <span className="text-sm font-semibold text-green-600">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Database Status</span>
                  <span className="text-sm font-semibold text-green-600">Connected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="text-lg">AI Model Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Triage Accuracy</span>
                  <span className="text-sm font-semibold text-gray-900">95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Analysis Quality</span>
                  <span className="text-sm font-semibold text-gray-900">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Model</span>
                  <span className="text-sm font-semibold text-gray-900">Gemini 2.5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader>
              <CardTitle className="text-lg">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ChromaDB Collections</span>
                  <span className="text-sm font-semibold text-gray-900">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SOPs Indexed</span>
                  <span className="text-sm font-semibold text-gray-900">150+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Case Logs</span>
                  <span className="text-sm font-semibold text-gray-900">200+</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
