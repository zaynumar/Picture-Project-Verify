import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useReplitAuth } from "@/hooks/useReplitAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ManagerDashboard from "@/pages/manager/dashboard";
import JobDetails from "@/pages/manager/job-details";
import CreateJob from "@/pages/manager/create-job";
import ManageUsers from "@/pages/manager/manage-users";
import UploadDocuments from "@/pages/manager/upload-documents";
import DocumentSetDetails from "@/pages/manager/document-set-details";
import WorkerDashboard from "@/pages/worker/dashboard";

function Router() {
  const firebaseAuth = useAuth();
  const replitAuth = useReplitAuth();

  // Show loading if either auth method is still loading
  if (firebaseAuth.isLoading || replitAuth.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated via Firebase (phone auth)
  if (firebaseAuth.isAuthenticated && firebaseAuth.user) {
    // For Firebase users, redirect to manager for now (you can add role logic here later)
    return (
      <Switch>
        <Route path="/" component={ManagerDashboard} />
        <Route path="/manager" component={ManagerDashboard} />
        <Route path="/manager/job/:id" component={JobDetails} />
        <Route path="/manager/create-job" component={CreateJob} />
        <Route path="/manager/manage-users" component={ManageUsers} />
        <Route path="/manager/upload-documents" component={UploadDocuments} />
        <Route path="/manager/document-set/:id" component={DocumentSetDetails} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Check if user is authenticated via Replit Auth
  if (replitAuth.isAuthenticated && replitAuth.user) {
    const user = replitAuth.user;
    return (
      <Switch>
        {((user as any)?.role === "manager" || (user as any)?.role === "manager_view_only") ? (
          <>
            <Route path="/" component={ManagerDashboard} />
            <Route path="/manager" component={ManagerDashboard} />
            <Route path="/manager/job/:id" component={JobDetails} />
            <Route path="/manager/create-job" component={CreateJob} />
            <Route path="/manager/manage-users" component={ManageUsers} />
            <Route path="/manager/upload-documents" component={UploadDocuments} />
            <Route path="/manager/document-set/:id" component={DocumentSetDetails} />
          </>
        ) : (
          <>
            <Route path="/" component={WorkerDashboard} />
            <Route path="/worker" component={WorkerDashboard} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Neither auth method has a user, show landing page
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
