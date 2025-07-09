import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  isUploading = false, 
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  className 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {preview ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                onClick={clearFile}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <FileImage className="h-4 w-4 mr-2" />
                <span>{selectedFile?.name}</span>
              </div>
              <div className="mt-1">
                Size: {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0'}MB
              </div>
            </div>
            {isUploading && (
              <div className="mt-3 text-center">
                <div className="text-sm text-muted-foreground">Uploading...</div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">Upload Photo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Drop your image here or click to browse
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={isUploading}
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
