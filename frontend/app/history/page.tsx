"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Search, Filter, Eye, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Incident {
  case_id: string;
  alert_text: string;
  module: string;
  severity: string;
  urgency: string;
  alert_type: string;
  problem_statement: string;
  resolution_summary: string;
  best_sop_id: string;
  status: string;
  created_at: string;
  entities?: string;
}

export default function HistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    fetchIncidents();
  }, [filterModule, filterSeverity]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const params = new URLSearchParams();
      if (filterModule !== "all") params.append("module", filterModule);
      if (filterSeverity !== "all") params.append("severity", filterSeverity);

      const response = await fetch(`${apiUrl}/history?${params}`);
      const data = await response.json();

      if (data.success) {
        setIncidents(data.incidents);
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast.error("Failed to fetch incident history");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchIncidents();
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setIncidents(data.results);
      }
    } catch (error) {
      console.error("Error searching incidents:", error);
      toast.error("Search failed");
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "open":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const parseEntities = (entities: string | undefined) => {
    if (!entities) return [];
    try {
      return JSON.parse(entities);
    } catch {
      return [];
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Incident History</h1>
          <p className="text-gray-600 mt-1">
            View and manage all processed PSA alerts
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="CNTR">Container</SelectItem>
                  <SelectItem value="VSL">Vessel</SelectItem>
                  <SelectItem value="EDI/API">EDI/API</SelectItem>
                  <SelectItem value="Infra/SRE">Infra/SRE</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Cases</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {incidents.filter(i => i.status === "open").length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {incidents.filter(i => i.status === "resolved" || i.status === "closed").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incident List */}
        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500">Loading incidents...</p>
            </CardContent>
          </Card>
        ) : incidents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Found</h3>
              <p className="text-gray-600">
                {searchQuery ? "Try adjusting your search query" : "Process your first alert to see it appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.case_id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="font-mono">
                          {incident.case_id}
                        </Badge>
                        <Badge variant="secondary">
                          {incident.module}
                        </Badge>
                        <Badge className={`${getSeverityColor(incident.severity)} border`} variant="outline">
                          {incident.severity?.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(incident.status)} border`} variant="outline">
                          {incident.status}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Alert Text</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{incident.alert_text}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(incident.created_at)}
                        </div>
                        {incident.best_sop_id && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">SOP:</span>
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{incident.best_sop_id}</code>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIncident(incident)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Incident Details</DialogTitle>
              <DialogDescription>
                Case ID: {selectedIncident?.case_id}
              </DialogDescription>
            </DialogHeader>
            {selectedIncident && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Original Alert</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-mono whitespace-pre-wrap">{selectedIncident.alert_text}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Classification</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Module</p>
                      <Badge variant="secondary">{selectedIncident.module}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <Badge className={getSeverityColor(selectedIncident.severity)} variant="outline">
                        {selectedIncident.severity?.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedIncident.status)} variant="outline">
                        {selectedIncident.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm font-medium">{formatDate(selectedIncident.created_at)}</p>
                    </div>
                  </div>

                  {selectedIncident.entities && parseEntities(selectedIncident.entities).length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Detected Entities</p>
                      <div className="flex flex-wrap gap-2">
                        {parseEntities(selectedIncident.entities).map((entity: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">{entity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Problem Statement</h4>
                  <p className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900">
                    {selectedIncident.problem_statement}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Resolution Summary</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {selectedIncident.resolution_summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended SOP</h4>
                  <Badge variant="outline" className="font-mono">{selectedIncident.best_sop_id}</Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
