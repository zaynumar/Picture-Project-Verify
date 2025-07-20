import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, FileText, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface DocumentDetail {
  title: string;
  description: string;
  file: File | null;
}

export default function UploadDocuments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [documentSetTitle, setDocumentSetTitle] = useState("");
  const [documentSetDescription, setDocumentSetDescription] = useState("");
  const [documents, setDocuments] = useState<DocumentDetail[]>([
    { title: "", description: "", file: null }
  ]);

  const uploadDocumentSet = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("POST", "/api/document-sets", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/document-sets"] });
      toast({
        title: "Success",
        description: "Document set created successfully!",
      });
      setLocation("/manager");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document set",
        variant: "destructive",
      });
    },
  });

  const addDocument = () => {
    setDocuments([...documents, { title: "", description: "", file: null }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: keyof DocumentDetail, value: any) => {
    const newDocuments = [...documents];
    newDocuments[index] = { ...newDocuments[index], [field]: value };
    setDocuments(newDocuments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!documentSetTitle.trim()) {
      toast({
        title: "Error",
        description: "Document set title is required",
        variant: "destructive",
      });
      return;
    }

    const validDocuments = documents.filter(doc => doc.file !== null);
    if (validDocuments.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one document",
        variant: "destructive",
      });
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append("title", documentSetTitle);
    formData.append("description", documentSetDescription);
    
    // Add document details as JSON
    const documentDetails = validDocuments.map(doc => ({
      title: doc.title || doc.file?.name || "Untitled",
      description: doc.description
    }));
    formData.append("documents", JSON.stringify(documentDetails));
    
    // Add files
    validDocuments.forEach(doc => {
      if (doc.file) {
        formData.append("documents", doc.file);
      }
    });

    uploadDocumentSet.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                onClick={() => setLocation("/manager")}
                variant="ghost"
                size="sm"
                className="mr-3 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Upload Documents</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Set Details */}
          <Card>
            <CardHeader>
              <CardTitle>Document Set Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={documentSetTitle}
                  onChange={(e) => setDocumentSetTitle(e.target.value)}
                  placeholder="Enter document set title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={documentSetDescription}
                  onChange={(e) => setDocumentSetDescription(e.target.value)}
                  placeholder="Enter document set description"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button
                  type="button"
                  onClick={addDocument}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Document {index + 1}</h4>
                    {documents.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeDocument(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Upload PDF *</Label>
                    <div className="mt-1">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          updateDocument(index, "file", file);
                        }}
                        className="hidden"
                        id={`file-${index}`}
                      />
                      <label
                        htmlFor={`file-${index}`}
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                      >
                        {doc.file ? (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm">{doc.file.name}</span>
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                updateDocument(index, "file", null);
                              }}
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload PDF
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Document Title</Label>
                    <Input
                      value={doc.title}
                      onChange={(e) => updateDocument(index, "title", e.target.value)}
                      placeholder={doc.file?.name || "Enter document title"}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Document Description</Label>
                    <Textarea
                      value={doc.description}
                      onChange={(e) => updateDocument(index, "description", e.target.value)}
                      placeholder="Enter document description"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/manager")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadDocumentSet.isPending}
            >
              {uploadDocumentSet.isPending ? "Creating..." : "Create Document Set"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}