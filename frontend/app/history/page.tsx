"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Search, Filter, Eye, Calendar, AlertCircle, CheckCircle, XCircle, Download, FileDown, Mail, Send, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { downloadPDF } from "@/lib/pdf-generator";

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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

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

  const handleMarkAsResolved = async (caseId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/history/${caseId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Incident marked as resolved and added to knowledge base!");
        fetchIncidents(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to mark as resolved");
      }
    } catch (error) {
      console.error("Error marking as resolved:", error);
      toast.error("Failed to mark incident as resolved");
    }
  };

  const handleDownloadPDF = (incident: Incident) => {
    try {
      const incidentData = {
        alert_text: incident.alert_text,
        parsed_entities: {
          module: incident.module,
          entities: incident.entities ? parseEntities(incident.entities) : [],
          alert_type: incident.alert_type,
          severity: incident.severity,
          urgency: incident.urgency,
        },
        analysis: {
          best_sop_id: incident.best_sop_id,
          reasoning: "",
          problem_statement: incident.problem_statement,
          resolution_summary: incident.resolution_summary,
        },
        escalation_contact: {
          primary_contact: { name: "", email: "", phone: "" },
          escalation_contact: { name: "", email: "", phone: "" },
        },
        case_id: incident.case_id,
      };

      downloadPDF(incidentData);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report.");
    }
  };

  const handleSendIncidentReport = async () => {
    if (!selectedIncident || !recipientEmail.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }

    setIsSendingEmail(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const incidentData = {
        alert_text: selectedIncident.alert_text,
        parsed_entities: {
          module: selectedIncident.module,
          entities: selectedIncident.entities ? parseEntities(selectedIncident.entities) : [],
          alert_type: selectedIncident.alert_type,
          severity: selectedIncident.severity,
          urgency: selectedIncident.urgency,
        },
        analysis: {
          best_sop_id: selectedIncident.best_sop_id,
          reasoning: "",
          problem_statement: selectedIncident.problem_statement,
          resolution_summary: selectedIncident.resolution_summary,
        },
        escalation_contact: {
          primary_contact: { name: "", email: "", phone: "" },
          escalation_contact: { name: "", email: "", phone: "" },
        },
        case_id: selectedIncident.case_id,
      };

      const response = await fetch(`${apiUrl}/send_incident_report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          incident_data: incidentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send incident report");
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Incident report sent to ${recipientEmail}!`);
        setShowEmailDialog(false);
        setRecipientEmail("");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Error sending incident report:", error);
      toast.error(error.message || "Failed to send incident report.");
    } finally {
      setIsSendingEmail(false);
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

        {/* Incident List with Tabs */}
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
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="open" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Open ({incidents.filter(i => i.status === "open").length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved ({incidents.filter(i => i.status === "resolved" || i.status === "closed").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {incidents.filter(i => i.status === "open").length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                    <p className="text-gray-600">No open incidents! All clear 🎉</p>
                  </CardContent>
                </Card>
              ) : (
                incidents.filter(i => i.status === "open").map((incident) => (
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

                        <div className="ml-4 flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsResolved(incident.case_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {incidents.filter(i => i.status === "resolved" || i.status === "closed").length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No resolved incidents yet</p>
                  </CardContent>
                </Card>
              ) : (
                incidents.filter(i => i.status === "resolved" || i.status === "closed").map((incident) => (
                  <Card key={incident.case_id} className="hover:shadow-md transition-shadow border-green-200 bg-green-50/30">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <Badge variant="secondary" className="font-mono">
                              {incident.case_id}
                            </Badge>
                            <Badge variant="secondary">
                              {incident.module}
                            </Badge>
                            <Badge className={`${getSeverityColor(incident.severity)} border`} variant="outline">
                              {incident.severity?.toUpperCase()}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 border-green-200 border" variant="outline">
                              RESOLVED
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
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
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

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Export & Share</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => handleDownloadPDF(selectedIncident)} 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Report
                    </Button>
                    
                    <Button 
                      onClick={() => setShowEmailDialog(!showEmailDialog)} 
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email Report
                    </Button>
                  </div>

                  {/* Email Dialog */}
                  {showEmailDialog && (
                    <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail" className="text-sm font-medium">
                          Recipient Email Address
                        </Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          placeholder="user@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          disabled={isSendingEmail}
                        />
                        <p className="text-xs text-gray-500">
                          Email will be sent from psacodesprint@arnavjhajharia.com
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendIncidentReport}
                          disabled={isSendingEmail || !recipientEmail.trim()}
                          className="flex-1"
                        >
                          {isSendingEmail ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Report
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => {
                            setShowEmailDialog(false);
                            setRecipientEmail("");
                          }}
                          variant="outline"
                          disabled={isSendingEmail}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
