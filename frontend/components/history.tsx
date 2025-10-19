"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Eye, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
  timestamp: string;
  alert_text: string;
  result: {
    parsed_entities: {
      module: string;
      severity: string;
      urgency: string;
      entities: string[];
    };
    analysis: {
      problem_statement: string;
      resolution_summary: string;
      best_sop_id: string;
    };
  };
}

export function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem("alert_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  };

  const handleDeleteItem = (timestamp: string) => {
    const updatedHistory = history.filter(item => item.timestamp !== timestamp);
    setHistory(updatedHistory);
    localStorage.setItem("alert_history", JSON.stringify(updatedHistory));
    toast.success("Item deleted from history");
  };

  const handleClearAll = () => {
    setHistory([]);
    localStorage.removeItem("alert_history");
    toast.success("History cleared");
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Processing History
          </h2>
          <p className="text-muted-foreground">
            View and manage previously processed alerts
          </p>
        </div>
        {history.length > 0 && (
          <Button onClick={handleClearAll} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
              <p className="text-muted-foreground">
                Process your first alert to see it appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <Card key={item.timestamp} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-sm">
                          {item.result.parsed_entities.module}
                        </Badge>
                        <Badge className={`${getSeverityColor(item.result.parsed_entities.severity)} text-white`}>
                          {item.result.parsed_entities.severity?.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {item.result.analysis.best_sop_id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.timestamp)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Alert Details</DialogTitle>
                            <DialogDescription>
                              Processed on {formatDate(item.timestamp)}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4 mt-4">
                              <div>
                                <h4 className="font-semibold mb-2">Original Alert</h4>
                                <div className="bg-muted p-4 rounded-md">
                                  <p className="text-sm font-mono whitespace-pre-wrap">{selectedItem.alert_text}</p>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-semibold mb-2">Triage Results</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Module</p>
                                    <Badge variant="secondary">{selectedItem.result.parsed_entities.module}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Severity</p>
                                    <Badge className={`${getSeverityColor(selectedItem.result.parsed_entities.severity)} text-white`}>
                                      {selectedItem.result.parsed_entities.severity?.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                {selectedItem.result.parsed_entities.entities && selectedItem.result.parsed_entities.entities.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-muted-foreground mb-2">Detected Entities</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedItem.result.parsed_entities.entities.map((entity, idx) => (
                                        <Badge key={idx} variant="outline">{entity}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-semibold mb-2">Problem Statement</h4>
                                <p className="text-sm">{selectedItem.result.analysis.problem_statement}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Resolution Summary</h4>
                                <p className="text-sm whitespace-pre-wrap">{selectedItem.result.analysis.resolution_summary}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Selected SOP</h4>
                                <Badge>{selectedItem.result.analysis.selected_sop || selectedItem.result.analysis.best_sop_id}</Badge>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.timestamp)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Alert Text Preview</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.alert_text}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Problem Statement</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.result.analysis.problem_statement}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
