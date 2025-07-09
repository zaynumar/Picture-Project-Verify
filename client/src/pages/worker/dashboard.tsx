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

  const { data: currentStep, isLoading: stepLoading, refetch: refetchStep } = useQuery({
    queryKey: ["/api/worker/current-step"],
    enabled: isAuthenticated,
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("stepId", currentStep?.id.toString() || "");
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/worker/current-step"] });
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

  const getCurrentStepNumber = (job: JobWithDetails) => {
    const currentStep = job.steps.find(step => step.status !== "approved");
    return currentStep ? job.steps.indexOf(currentStep) + 1 : job.steps.length;
  };

  const activeJob = jobs.find((job: JobWithDetails) => job.status === "in_progress");

  if (isLoading || jobsLoading || stepLoading) {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeJob ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Job</h3>
              <p className="text-muted-foreground">
                You don't have any active jobs assigned. Please contact your manager.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current Job Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{activeJob.title}</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="h-4 w-4 mr-1" />
                    In Progress
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    <span>Manager: {activeJob.manager.firstName} {activeJob.manager.lastName}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Started: {formatTimeAgo(activeJob.createdAt!)}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <List className="h-4 w-4 mr-2" />
                    <span>Step {getCurrentStepNumber(activeJob)} of {activeJob.steps.length}</span>
                  </div>
                </div>
                
                {activeJob.description && (
                  <p className="text-muted-foreground mb-4">{activeJob.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(getJobProgress(activeJob))}%</span>
                  </div>
                  <Progress value={getJobProgress(activeJob)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Step Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                  {activeJob.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === "approved" ? "bg-green-500" :
                          step.status === "awaiting_review" ? "bg-yellow-500" :
                          step.status === "rejected" ? "bg-red-500" :
                          step.status === "awaiting_upload" ? "bg-blue-500" :
                          "bg-gray-400"
                        }`}>
                          {step.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : step.status === "awaiting_review" ? (
                            <Clock className="h-4 w-4 text-white" />
                          ) : step.status === "awaiting_upload" ? (
                            <Camera className="h-4 w-4 text-white" />
                          ) : (
                            <Lock className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${
                          step.status === "approved" ? "text-green-600" :
                          step.status === "awaiting_review" ? "text-yellow-600" :
                          step.status === "rejected" ? "text-red-600" :
                          step.status === "awaiting_upload" ? "text-blue-600" :
                          "text-gray-400"
                        }`}>
                          Step {index + 1}
                        </span>
                      </div>
                      {index < activeJob.steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${
                          step.status === "approved" ? "bg-green-500" : "bg-gray-200"
                        }`} style={{ minWidth: "2rem" }} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Step */}
            {currentStep && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      currentStep.status === "awaiting_review" ? "bg-yellow-500" :
                      currentStep.status === "rejected" ? "bg-red-500" :
                      "bg-blue-500"
                    }`}>
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>
                        Step {activeJob.steps.indexOf(currentStep) + 1}: {currentStep.title}
                      </CardTitle>
                      <p className="text-muted-foreground">{currentStep.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Step Instructions */}
                  {currentStep.instructions && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                      <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
                      <p className="text-sm text-blue-700">{currentStep.instructions}</p>
                    </div>
                  )}

                  {/* Upload Status */}
                  {currentStep.status === "awaiting_review" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Photo Submitted - Awaiting Review</h4>
                          <p className="text-sm text-yellow-700">
                            Your photo has been uploaded and is being reviewed by the manager.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep.status === "rejected" && currentStep.uploads.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-red-800">Photo Rejected</h4>
                          <p className="text-sm text-red-700 mb-2">
                            Your photo was not approved. Please review the feedback and upload a new photo.
                          </p>
                          {currentStep.uploads[0]?.reviews[0]?.feedback && (
                            <div className="bg-red-100 p-3 rounded mt-2">
                              <p className="text-sm text-red-800 font-medium">Manager Feedback:</p>
                              <p className="text-sm text-red-700">{currentStep.uploads[0].reviews[0].feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Section */}
                  {(currentStep.status === "awaiting_upload" || currentStep.status === "rejected") && (
                    <div className="space-y-4">
                      <FileUpload
                        onFileSelect={(file) => {
                          setUploadingFile(file);
                          uploadPhoto.mutate(file);
                        }}
                        isUploading={uploadPhoto.isPending}
                        accept="image/*"
                        maxSize={10 * 1024 * 1024} // 10MB
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Maximum file size: 10MB. Supported formats: JPG, PNG
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button variant="outline" size="sm">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Get Help
                    </Button>
                    <Button 
                      onClick={() => {
                        refetch();
                        refetchStep();
                      }}
                      variant="outline" 
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
