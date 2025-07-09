import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Lock, 
  Camera,
  User,
  Calendar,
  List,
  MapPin,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import type { JobWithDetails, StepWithDetails } from "@shared/schema";

export default function WorkerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

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

  // Remove current step query since we'll work with multiple jobs
  // const { data: currentStep, isLoading: stepLoading, refetch: refetchStep } = useQuery({
  //   queryKey: ["/api/worker/current-step"],
  //   enabled: isAuthenticated,
  // });

  const uploadPhoto = useMutation({
    mutationFn: async ({ file, stepId }: { file: File; stepId: number }) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("stepId", stepId.toString());
      
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo uploaded successfully! Waiting for approval.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setUploadingFile(null);
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
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const getJobProgress = (job: JobWithDetails) => {
    const approvedSteps = job.steps.filter(step => step.status === "approved").length;
    return (approvedSteps / job.steps.length) * 100;
  };

  // Helper function to get current active step
  function getCurrentStep(job: JobWithDetails) {
    return job.steps.find(step => 
      step.status === "awaiting_upload" || step.status === "awaiting_review"
    );
  }

  // Filter jobs assigned to this worker
  const workerJobs = jobs.filter((job: JobWithDetails) => job.workerId === user?.id);

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
            <div className="flex items-center">
              <Camera className="h-6 w-6 mr-3" />
              <h1 className="text-xl font-semibold">Worker Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm">{user?.firstName} {user?.lastName}</span>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">My Jobs</h2>
            <p className="text-muted-foreground">Complete photo verification tasks step by step</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {workerJobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any jobs assigned yet. Please contact your manager.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workerJobs.map((job: JobWithDetails) => {
              const currentStep = getCurrentStep(job);
              const progress = getJobProgress(job);
              
              return (
                <Card key={job.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge className={
                        job.status === "completed" ? "bg-green-100 text-green-800" :
                        job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }>
                        {job.status === "completed" ? <CheckCircle className="h-4 w-4 mr-1" /> :
                         job.status === "in_progress" ? <Clock className="h-4 w-4 mr-1" /> :
                         <Clock className="h-4 w-4 mr-1" />}
                        {job.status === "completed" ? "Completed" :
                         job.status === "in_progress" ? "In Progress" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Job Info */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <User className="h-4 w-4 mr-2" />
                          <span>Manager: {job.manager.firstName} {job.manager.lastName}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Started: {formatTimeAgo(job.createdAt!)}</span>
                        </div>
                      </div>

                      {job.description && (
                        <p className="text-sm text-muted-foreground">{job.description}</p>
                      )}

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Current Step */}
                      {currentStep && (
                        <div className="p-4 bg-blue-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-blue-900">
                              Step {currentStep.order}: {currentStep.title}
                            </h4>
                            <Badge className={
                              currentStep.status === "awaiting_upload" ? "bg-blue-100 text-blue-800" :
                              currentStep.status === "awaiting_review" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {currentStep.status === "awaiting_upload" ? "Ready to Upload" :
                               currentStep.status === "awaiting_review" ? "Pending Review" : 
                               currentStep.status}
                            </Badge>
                          </div>
                          
                          {currentStep.description && (
                            <p className="text-sm text-blue-700 mb-3">{currentStep.description}</p>
                          )}
                          
                          {currentStep.instructions && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-blue-900 mb-1">Instructions:</p>
                              <p className="text-xs text-blue-700">{currentStep.instructions}</p>
                            </div>
                          )}

                          {/* Show rejection feedback if there was a previous rejection */}
                          {currentStep.status === "awaiting_upload" && currentStep.uploads.length > 0 && (
                            <>
                              {currentStep.uploads[currentStep.uploads.length - 1].reviews.some(r => r.status === "rejected") && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <p className="text-sm font-medium text-red-800 mb-1">Previous upload was rejected</p>
                                  {currentStep.uploads[currentStep.uploads.length - 1].reviews
                                    .filter(r => r.status === "rejected")
                                    .map((review, idx) => (
                                      <p key={idx} className="text-xs text-red-700">
                                        Manager feedback: {review.feedback || "No feedback provided"}
                                      </p>
                                    ))
                                  }
                                </div>
                              )}
                            </>
                          )}

                          {/* Upload Section */}
                          {currentStep.status === "awaiting_upload" && (
                            <div className="mt-3">
                              <FileUpload
                                onFileSelect={(file) => {
                                  setUploadingFile(file);
                                  uploadPhoto.mutate({ file, stepId: currentStep.id });
                                }}
                                isUploading={uploadPhoto.isPending && uploadingFile !== null}
                                accept="image/*"
                                maxSize={10 * 1024 * 1024}
                                className="border-dashed border-2 border-blue-300"
                              />
                            </div>
                          )}

                          {/* Show uploaded photo if pending review */}
                          {currentStep.status === "awaiting_review" && currentStep.uploads.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-yellow-700 mb-2">Photo uploaded, waiting for review:</p>
                              <img 
                                src={`/api/uploads/${currentStep.uploads[0].filename}`}
                                alt="Uploaded photo"
                                className="w-full max-w-xs rounded border"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Steps Overview */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">All Steps:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.steps.sort((a, b) => a.order - b.order).map((step) => (
                            <div 
                              key={step.id}
                              className={`px-2 py-1 rounded text-xs ${
                                step.status === "approved" ? "bg-green-100 text-green-700" :
                                step.status === "awaiting_review" ? "bg-yellow-100 text-yellow-700" :
                                step.status === "awaiting_upload" ? "bg-blue-100 text-blue-700" :
                                step.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              Step {step.order}: {step.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
