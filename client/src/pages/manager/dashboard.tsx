import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Plus, RefreshCw, Clock, CheckCircle, AlertCircle, User, Calendar, List, Users, Trash2, FileText } from "lucide-react";
import type { JobWithDetails, User as UserType, DocumentSetWithDetails } from "@shared/schema";

// Document Sets List Component
function DocumentSetsList() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: documentSets = [], isLoading } = useQuery<DocumentSetWithDetails[]>({
    queryKey: ["/api/document-sets"],
  });

  const deleteDocumentSet = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/document-sets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document set deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/document-sets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document set",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document sets...</p>
        </CardContent>
      </Card>
    );
  }

  if (documentSets.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No document sets yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first document set to manage PDF documents.
          </p>
          <Button onClick={() => setLocation('/manager/upload-documents')}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documentSets.map((documentSet) => (
        <Card key={documentSet.id} className="hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg truncate">{documentSet.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <FileText className="h-3 w-3 mr-1" />
                  {documentSet.documents.length} files
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this document set? This action cannot be undone.")) {
                      deleteDocumentSet.mutate(documentSet.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent 
            className="cursor-pointer"
            onClick={() => setLocation(`/manager/document-set/${documentSet.id}`)}
          >
            {documentSet.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {documentSet.description}
              </p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created: {new Date((documentSet as any).createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>By: {documentSet.manager.firstName} {documentSet.manager.lastName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ManagerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: jobs = [], isLoading: jobsLoading, refetch } = useQuery({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: number) => {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "awaiting_review": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "awaiting_review": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  };

  const getCurrentStep = (job: JobWithDetails) => {
    const currentStep = job.steps.find(step => step.status !== "approved");
    return currentStep ? job.steps.indexOf(currentStep) + 1 : job.steps.length;
  };

  const getJobStatus = (job: JobWithDetails) => {
    const hasAwaitingReview = job.steps.some(step => step.status === "awaiting_review");
    if (hasAwaitingReview) return "awaiting_review";
    
    const allApproved = job.steps.every(step => step.status === "approved");
    if (allApproved) return "completed";
    
    const hasStarted = job.steps.some(step => step.status !== "pending");
    return hasStarted ? "in_progress" : "pending";
  };

  if (isLoading || jobsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold">Manager Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(user as UserType)?.firstName?.charAt(0)}{(user as UserType)?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm">{(user as UserType)?.firstName} {(user as UserType)?.lastName}</span>
              </div>
              <Button 
                onClick={() => window.location.href = '/api/logout'}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Active Jobs</h2>
            <p className="text-muted-foreground">Monitor and manage field worker photo verification workflows</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setLocation('/manager/manage-users')} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            {(user as any)?.role === "manager" && (
              <>
                <Button onClick={() => setLocation('/manager/upload-documents')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
                <Button onClick={() => setLocation('/manager/create-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                {(user as any)?.role === "manager" 
                  ? "Create your first job to start managing field worker photo verification workflows."
                  : "No jobs to display. Jobs will appear here when created by managers."
                }
              </p>
              {(user as any)?.role === "manager" && (
                <Button onClick={() => setLocation('/manager/create-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: JobWithDetails) => {
              const jobStatus = getJobStatus(job);
              const currentStep = getCurrentStep(job);
              
              return (
                <Card key={job.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(jobStatus)}>
                          {getStatusIcon(jobStatus)}
                          <span className="ml-1 capitalize">
                            {jobStatus.replace('_', ' ')}
                          </span>
                        </Badge>
                        {(user as any)?.role === "manager" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
                                deleteJob.mutate(job.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="cursor-pointer"
                    onClick={() => setLocation(`/manager/job/${job.id}`)}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        <span>Worker: {job.worker.firstName} {job.worker.lastName}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Started: {formatTimeAgo((job as any).createdAt!)}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <List className="h-4 w-4 mr-2" />
                        <span>Step {currentStep} of {job.steps.length}</span>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Document Sets Section */}
        {(user as any)?.role === "manager" && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Document Sets</h2>
                <p className="text-muted-foreground">Manage uploaded PDF documents</p>
              </div>
            </div>
            
            <DocumentSetsList />
          </div>
        )}
      </main>
    </div>
  );
}
