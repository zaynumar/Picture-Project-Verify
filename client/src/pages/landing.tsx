
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, Clock, Users, X, Moon, Sun, Phone, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneAuth } from "@/components/phone-auth";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [authMethod, setAuthMethod] = useState<'choose' | 'phone' | 'replit'>('choose');
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // User is authenticated with Firebase, redirect to manager dashboard for now
    window.location.href = '/manager';
    return null;
  }

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
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleDarkMode}
                variant="secondary"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    About
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">About Photo Verification System</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-8">
                    {/* Main Description */}
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold text-foreground mb-4">
                        Streamline Your Field Work Documentation
                      </h3>
                      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Ensure quality and compliance with our AI-powered photo verification system. 
                        Sequential workflows, real-time approvals, and seamless collaboration between managers and field workers.
                      </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-center mb-6">How It Works</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    {/* CTA in modal */}
                    <div className="text-center">
                      <Button 
                        onClick={() => {
                          setIsAboutOpen(false);
                          setAuthMethod('choose');
                        }}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Get Started Today
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Phone Authentication Component */}
      <PhoneAuth />
    </div>
  );
}
