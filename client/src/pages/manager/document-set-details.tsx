import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Calendar, User } from "lucide-react";
import { useLocation } from "wouter";
import type { DocumentSetWithDetails } from "@shared/schema";

export default function DocumentSetDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const documentSetId = parseInt(params.id as string);

  const { data: documentSet, isLoading } = useQuery<DocumentSetWithDetails>({
    queryKey: ["/api/document-sets", documentSetId],
    queryFn: async () => {
      const response = await fetch(`/api/document-sets/${documentSetId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch document set");
      return response.json();
    },
    enabled: !!documentSetId,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document set...</p>
        </div>
      </div>
    );
  }

  if (!documentSet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Document set not found</p>
            <Button onClick={() => setLocation("/manager")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
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
              <Button
                onClick={() => setLocation("/manager")}
                variant="ghost"
                size="sm"
                className="mr-3 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Document Set Details</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Set Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{documentSet.title}</CardTitle>
              <Badge variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {documentSet.documents.length} documents
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {documentSet.description && (
              <p className="text-muted-foreground mb-4">{documentSet.description}</p>
            )}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Created: {new Date((documentSet as any).createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>By: {documentSet.manager.firstName} {documentSet.manager.lastName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          {documentSet.documents.map((doc, index) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.title || doc.originalName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Document {index + 1} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`/api/uploads/${doc.filename}`, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              {doc.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}