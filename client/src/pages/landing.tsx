import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, Clock, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 mr-3" />
              <h1 className="text-xl font-semibold">Photo Verification System</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">About</h2>
          <h3 className="text-4xl font-bold text-foreground mb-4">
            Streamline Your Field Work Documentation
          </h3>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ensure quality and compliance with our AI-powered photo verification system. 
            Sequential workflows, real-time approvals, and seamless collaboration between managers and field workers.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Separate interfaces for managers and workers with appropriate permissions and workflows.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Sequential Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Guided step-by-step process ensures workers complete tasks in the correct order.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Real-Time Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Instant photo review and approval system with feedback for continuous improvement.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-muted/50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <Badge variant="outline" className="mr-2">Manager</Badge>
                Dashboard
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Create jobs with sequential photo requirements</li>
                <li>• Monitor worker progress in real-time</li>
                <li>• Review and approve/reject photo submissions</li>
                <li>• Provide feedback for rejected photos</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <Badge variant="outline" className="mr-2">Worker</Badge>
                Mobile Interface
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• View current step and detailed instructions</li>
                <li>• Upload photos with built-in camera integration</li>
                <li>• Receive instant approval/rejection notifications</li>
                <li>• Progress automatically to next step upon approval</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Get Started Today
          </Button>
        </div>
      </main>
    </div>
  );
}
