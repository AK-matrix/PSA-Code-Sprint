"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, TrendingUp, Activity, Ship } from "lucide-react";

interface Analytics {
  total_incidents: number;
  open_incidents: number;
  resolved_incidents: number;
  avg_resolution_time: number;
  module_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  recent_activity: any[];
}

export default function Home() {
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

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to the PSA Alert Processing System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Incidents
              </CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
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
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
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
              <p className="text-xs text-gray-500 mt-1">Successfully closed</p>
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
              <p className="text-xs text-gray-500 mt-1">Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Module Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Incidents by Module</CardTitle>
              <CardDescription>Distribution across different modules</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.module_distribution && Object.entries(analytics.module_distribution).map(([module, count]) => (
                    <div key={module} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Ship className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{module}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  {(!analytics?.module_distribution || Object.keys(analytics.module_distribution).length === 0) && (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Incidents by Severity</CardTitle>
              <CardDescription>Breakdown by severity levels</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {analytics?.severity_distribution && Object.entries(analytics.severity_distribution).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <Badge className={getSeverityColor(severity)} variant="outline">
                        {severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-700">{count} incidents</span>
                    </div>
                  ))}
                  {(!analytics?.severity_distribution || Object.keys(analytics.severity_distribution).length === 0) && (
                    <p className="text-sm text-gray-500">No data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Quick Start Guide</CardTitle>
            <CardDescription>Get started with the PSA Alert Processing System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Process Alert</h3>
                <p className="text-sm text-gray-600">Submit and analyze new PSA alerts with AI-powered recommendations</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">View History</h3>
                <p className="text-sm text-gray-600">Access and review all previously processed incidents</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                <p className="text-sm text-gray-600">Monitor system performance and track key metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
