
import { useState } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);

  const initializeRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved!', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          toast({
            title: "reCAPTCHA Expired",
            description: "Please try again.",
            variant: "destructive"
          });
        }
      });
    }
  };

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      
      // Format phone number (ensure it starts with +)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Initialize reCAPTCHA
      initializeRecaptcha();
      
      // Render reCAPTCHA
      await window.recaptchaVerifier.render();
      
      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        window.recaptchaVerifier
      );
      
      window.confirmationResult = confirmationResult;
      setStep('code');
      
      toast({
        title: "Code Sent",
        description: "Please check your phone for the verification code.",
      });
      
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.code === 'auth/invalid-app-credential') {
        errorMessage = 'reCAPTCHA verification failed. Please try again';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined as any;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setLoading(true);
      
      if (!window.confirmationResult) {
        throw new Error('No confirmation result available');
      }
      
      const result = await window.confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      console.log('Phone authentication successful:', user);
      
      toast({
        title: "Success",
        description: "Phone number verified successfully!",
      });
      
      // Here you would typically redirect to your app or update auth state
      
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      let errorMessage = 'Invalid verification code';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new code';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    
    // Clean up reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined as any;
    }
    
    if (window.confirmationResult) {
      window.confirmationResult = undefined as any;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Phone Authentication</CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : 'Enter the verification code sent to your phone'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            <Button 
              onClick={sendVerificationCode} 
              disabled={!phoneNumber || loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={loading}
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
            <div className="flex space-x-2">
              <Button 
                onClick={verifyCode} 
                disabled={verificationCode.length !== 6 || loading}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
              <Button 
                onClick={resetFlow}
                variant="outline"
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </>
        )}
        
        {/* reCAPTCHA container - required for phone auth */}
        <div id="recaptcha-container"></div>
      </CardContent>
    </Card>
  );
}
