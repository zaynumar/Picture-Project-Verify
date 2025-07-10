import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { RejectionModal } from "@/components/rejection-modal";
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Lock, 
  Camera,
  User,
  Calendar,
  List,
  Trash2,
  Download
} from "lucide-react";
import type { JobWithDetails, StepWithDetails } from "@shared/schema";

export default function JobDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUpload, setSelectedUpload] = useState<{ uploadId: number; stepTitle: string } | null>(null);

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

  const { data: job, isLoading: jobLoading, refetch } = useQuery({
    queryKey: ["/api/jobs", id],
    enabled: isAuthenticated && !!id,
  });

  const approveUpload = useMutation({
    mutationFn: async (uploadId: number) => {
      await apiRequest("POST", "/api/reviews", {
        uploadId,
        status: "approved",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo approved successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
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
        description: "Failed to approve photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectUpload = useMutation({
    mutationFn: async ({ uploadId, feedback }: { uploadId: number; feedback: string }) => {
      await apiRequest("POST", "/api/reviews", {
        uploadId,
        status: "rejected",
        feedback,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo rejected with feedback sent.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
      setSelectedUpload(null);
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
        description: "Failed to reject photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStep = useMutation({
    mutationFn: async (stepId: number) => {
      await apiRequest("DELETE", `/api/steps/${stepId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Step deleted successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
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
        description: "Failed to delete step. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "awaiting_review": return "bg-yellow-100 text-yellow-800";
      case "awaiting_upload": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStepIcon = (step: StepWithDetails) => {
    switch (step.status) {
      case "approved": 
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "awaiting_review":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "awaiting_upload":
        return <Camera className="h-5 w-5 text-blue-600" />;
      default:
        return <Lock className="h-5 w-5 text-gray-400" />;
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

  if (isLoading || jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The job you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => window.location.href = '/manager'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                onClick={() => window.location.href = '/manager'}
                variant="ghost"
                size="sm"
                className="mr-3 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">{job.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => refetch()}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm">{user?.firstName} {user?.lastName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{job.title}</span>
              <Badge className={getStepStatusColor(job.status)}>
                {job.status.replace('_', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>Worker: {job.worker.firstName} {job.worker.lastName}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Started: {formatTimeAgo(job.createdAt!)}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <List className="h-4 w-4 mr-2" />
                <span>{job.steps.length} steps total</span>
              </div>
            </div>
            {job.description && (
              <p className="text-muted-foreground mt-3">{job.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Step Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {job.steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    step.status === "awaiting_review" ? "border-yellow-200 bg-yellow-50" :
                    step.status === "approved" ? "border-green-200 bg-green-50" :
                    step.status === "rejected" ? "border-red-200 bg-red-50" :
                    "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">
                        Step {step.order}: {step.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStepStatusColor(step.status)}>
                          {step.status.replace('_', ' ')}
                        </Badge>
                        {(user as any)?.role === "manager" && (
                          <Button
                            onClick={() => deleteStep.mutate(step.id)}
                            disabled={deleteStep.isPending}
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    
                    {step.instructions && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                        <p className="text-sm text-blue-800">{step.instructions}</p>
                      </div>
                    )}

                    {/* Upload Review Section - Only show latest upload */}
                    {step.uploads.length > 0 && (
                      <div className="mt-4">
                        {(() => {
                          // Only show the latest upload for review
                          const latestUpload = step.uploads[step.uploads.length - 1];
                          const hasNoReview = latestUpload.reviews.length === 0;
                          
                          return (
                            <div key={latestUpload.id} className="bg-white p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-muted-foreground">
                                  <span>Uploaded: {formatTimeAgo(latestUpload.uploadedAt!)}</span>
                                  <span className="ml-4">File: {latestUpload.originalName}</span>
                                </div>
                                {/* Download button */}
                                <Button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `/api/uploads/${latestUpload.filename}`;
                                    link.download = latestUpload.originalName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                              
                              {/* Photo Preview */}
                              <div className="mb-3">
                                <img 
                                  src={`/api/uploads/${latestUpload.filename}`}
                                  alt={`Upload for ${step.title}`}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              </div>
                              
                              {/* Review Actions - Only show if this upload hasn't been reviewed yet and user is manager */}
                              {step.status === "awaiting_review" && hasNoReview && (user as any)?.role === "manager" && (
                                <div className="flex items-center space-x-3">
                                  <Button 
                                    onClick={() => approveUpload.mutate(latestUpload.id)}
                                    disabled={approveUpload.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button 
                                    onClick={() => setSelectedUpload({ uploadId: latestUpload.id, stepTitle: step.title })}
                                    disabled={rejectUpload.isPending}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              
                              {/* View-only message for manager_view_only users */}
                              {step.status === "awaiting_review" && hasNoReview && (user as any)?.role === "manager_view_only" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-blue-800">
                                    This photo is awaiting review. You have view-only access and cannot approve or reject submissions.
                                  </p>
                                </div>
                              )}
                              
                              {/* Show review feedback if exists */}
                              {latestUpload.reviews.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-foreground mb-1">
                                    Review: {latestUpload.reviews[0].status}
                                  </p>
                                  {latestUpload.reviews[0].feedback && (
                                    <p className="text-sm text-muted-foreground">
                                      {latestUpload.reviews[0].feedback}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimeAgo(latestUpload.reviews[0].reviewedAt!)}
                                  </p>
                                </div>
                              )}
                              
                              {/* Show previous uploads history if there are multiple */}
                              {step.uploads.length > 1 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">Previous uploads ({step.uploads.length - 1}):</p>
                                  <div className="space-y-1">
                                    {step.uploads.slice(0, -1).map((oldUpload, idx) => (
                                      <div key={oldUpload.id} className="text-xs text-muted-foreground flex items-center justify-between">
                                        <span>Upload {idx + 1}: {oldUpload.reviews[0]?.status || 'No review'}</span>
                                        <Button
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `/api/uploads/${oldUpload.filename}`;
                                            link.download = oldUpload.originalName;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={!!selectedUpload}
        onClose={() => setSelectedUpload(null)}
        onReject={(feedback) => {
          if (selectedUpload) {
            rejectUpload.mutate({ uploadId: selectedUpload.uploadId, feedback });
          }
        }}
        stepTitle={selectedUpload?.stepTitle || ""}
        isLoading={rejectUpload.isPending}
      />
    </div>
  );
}
