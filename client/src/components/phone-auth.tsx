
import { useState } from "react";
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Phone, Shield, Loader2 } from "lucide-react";

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verification">("phone");
  const { toast } = useToast();

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          // Response expired
        }
      });
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setStep("verification");
      toast({
        title: "Code Sent",
        description: "Verification code sent to your phone",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error sending code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || !confirmationResult) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      toast({
        title: "Success",
        description: "Phone number verified successfully!",
        variant: "default",
      });
      // User is now authenticated, Firebase auth state will update automatically
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("phone");
    setPhoneNumber("");
    setVerificationCode("");
    setConfirmationResult(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === "phone" ? (
              <Phone className="h-12 w-12 text-primary" />
            ) : (
              <Shield className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {step === "phone" ? "Phone Authentication" : "Verify Your Phone"}
          </CardTitle>
          <p className="text-muted-foreground">
            {step === "phone" 
              ? "Enter your phone number to receive a verification code"
              : "Enter the 6-digit code sent to your phone"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
              <Button 
                onClick={sendVerificationCode} 
                disabled={loading || !phoneNumber}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button 
                  onClick={verifyCode} 
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
                <Button 
                  onClick={resetFlow} 
                  variant="outline"
                  className="w-full"
                >
                  Change Phone Number
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
