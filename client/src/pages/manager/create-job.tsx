import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, Save, Calendar } from "lucide-react";

interface JobFormData {
  title: string;
  description: string;
  workerId: string;
  hasJobDeadline: boolean;
  jobDeadline: string;
  steps: {
    title: string;
    description: string;
    instructions: string;
    hasDeadline: boolean;
    deadline: string;
  }[];
}

export default function CreateJob() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"],
  });

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      title: "",
      description: "",
      workerId: "",
      hasJobDeadline: false,
      jobDeadline: "",
      steps: [{ title: "", description: "", instructions: "", hasDeadline: false, deadline: "" }]
    }
  });

  const watchHasJobDeadline = watch("hasJobDeadline");
  const watchSteps = watch("steps");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps"
  });

  const createJob = useMutation({
    mutationFn: async (data: JobFormData) => {
      return await apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setLocation("/manager");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    // Process the form data to handle deadline logic
    const processedData = {
      ...data,
      steps: data.steps.map(step => ({
        title: step.title,
        description: step.description,
        instructions: step.instructions,
        hasDeadline: step.hasDeadline,
        deadline: step.hasDeadline ? step.deadline : undefined
      })),
      jobDeadline: data.hasJobDeadline ? data.jobDeadline : undefined
    };
    
    createJob.mutate(processedData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                onClick={() => setLocation('/manager')}
                variant="ghost"
                size="sm"
                className="mr-3 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Create New Job</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Job title is required" })}
                  placeholder="Enter job title"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter job description"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="worker">Assign to Worker *</Label>
                <Select onValueChange={(value) => setValue("workerId", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker: any) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName} ({worker.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workerId && (
                  <p className="text-sm text-destructive mt-1">Please select a worker</p>
                )}
              </div>

              {/* Job Deadline Toggle */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={watchHasJobDeadline}
                    onCheckedChange={(checked) => setValue("hasJobDeadline", checked)}
                  />
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="hasJobDeadline">Set job deadline</Label>
                  </div>
                </div>
                
                {watchHasJobDeadline && (
                  <div>
                    <Label htmlFor="jobDeadline">Job Deadline *</Label>
                    <Input
                      id="jobDeadline"
                      type="datetime-local"
                      {...register("jobDeadline", { 
                        required: watchHasJobDeadline ? "Job deadline is required when enabled" : false 
                      })}
                      className="mt-1"
                    />
                    {errors.jobDeadline && (
                      <p className="text-sm text-destructive mt-1">{errors.jobDeadline.message}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Job Steps</CardTitle>
                <Button
                  type="button"
                  onClick={() => append({ title: "", description: "", instructions: "", hasDeadline: false, deadline: "" })}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Step {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`steps.${index}.title`}>Step Title *</Label>
                        <Input
                          {...register(`steps.${index}.title`, { required: "Step title is required" })}
                          placeholder="Enter step title"
                          className="mt-1"
                        />
                        {errors.steps?.[index]?.title && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.steps[index]?.title?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`steps.${index}.description`}>Description</Label>
                        <Input
                          {...register(`steps.${index}.description`)}
                          placeholder="Brief description"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor={`steps.${index}.instructions`}>Instructions</Label>
                      <Textarea
                        {...register(`steps.${index}.instructions`)}
                        placeholder="Detailed instructions for the worker"
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    {/* Step Deadline Toggle */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={watchSteps[index]?.hasDeadline || false}
                          onCheckedChange={(checked) => setValue(`steps.${index}.hasDeadline`, checked)}
                        />
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor={`steps.${index}.hasDeadline`}>Set step deadline</Label>
                        </div>
                      </div>
                      
                      {watchSteps[index]?.hasDeadline && (
                        <div>
                          <Label htmlFor={`steps.${index}.deadline`}>Step Deadline *</Label>
                          <Input
                            id={`steps.${index}.deadline`}
                            type="datetime-local"
                            {...register(`steps.${index}.deadline`, { 
                              required: watchSteps[index]?.hasDeadline ? "Step deadline is required when enabled" : false 
                            })}
                            className="mt-1"
                          />
                          {errors.steps?.[index]?.deadline && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.steps[index]?.deadline?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/manager')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createJob.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createJob.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}