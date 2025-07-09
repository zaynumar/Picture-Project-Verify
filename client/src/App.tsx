import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ManagerDashboard from "@/pages/manager/dashboard";
import JobDetails from "@/pages/manager/job-details";
import CreateJob from "@/pages/manager/create-job";
import ManageUsers from "@/pages/manager/manage-users";
import WorkerDashboard from "@/pages/worker/dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {(user as any)?.role === "manager" ? (
            <>
              <Route path="/" component={ManagerDashboard} />
              <Route path="/manager" component={ManagerDashboard} />
              <Route path="/manager/job/:id" component={JobDetails} />
              <Route path="/manager/create-job" component={CreateJob} />
              <Route path="/manager/manage-users" component={ManageUsers} />
            </>
          ) : (
            <>
              <Route path="/" component={WorkerDashboard} />
              <Route path="/worker" component={WorkerDashboard} />
            </>
          )}
        </>
      )}
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
