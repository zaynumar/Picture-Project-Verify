import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (feedback: string) => void;
  stepTitle: string;
  isLoading?: boolean;
}

export function RejectionModal({ 
  isOpen, 
  onClose, 
  onReject, 
  stepTitle, 
  isLoading = false 
}: RejectionModalProps) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      onReject(feedback);
      setFeedback("");
    }
  };

  const handleClose = () => {
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            Reject Photo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              You are rejecting the photo for <strong>{stepTitle}</strong>. 
              Please provide feedback to help the worker improve their submission.
            </p>
            
            <Label htmlFor="feedback" className="text-sm font-medium">
              Feedback (required)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain why this photo doesn't meet requirements..."
              className="mt-2 min-h-[100px]"
              required
            />
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!feedback.trim() || isLoading}
            >
              {isLoading ? "Sending..." : "Send Rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
