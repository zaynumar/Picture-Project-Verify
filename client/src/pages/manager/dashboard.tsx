import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import { Plus, RefreshCw, Clock, CheckCircle, AlertCircle, User, Calendar, List, Users } from "lucide-react";
import type { JobWithDetails } from "@shared/schema";

export default function ManagerDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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
            <div className="flex items-center">
              <List className="h-6 w-6 mr-3" />
              <h1 className="text-xl font-semibold">Manager Dashboard</h1>
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
            <Button onClick={() => window.location.href = '/manager/manage-users'} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button onClick={() => window.location.href = '/manager/create-job'}>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first job to start managing field worker photo verification workflows.
              </p>
              <Button onClick={() => window.location.href = '/manager/create-job'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: JobWithDetails) => {
              const jobStatus = getJobStatus(job);
              const currentStep = getCurrentStep(job);
              
              return (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => window.location.href = `/manager/job/${job.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                      <Badge className={getStatusColor(jobStatus)}>
                        {getStatusIcon(jobStatus)}
                        <span className="ml-1 capitalize">
                          {jobStatus.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
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
                        <span>Step {currentStep} of {job.steps.length}</span>
                      </div>
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
      </main>
    </div>
  );
}
