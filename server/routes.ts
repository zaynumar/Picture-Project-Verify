import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertJobSchema, insertStepSchema, insertReviewSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG and PNG are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all workers (for managers to assign jobs)
  app.get("/api/workers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can view workers" });
      }

      const allUsers = await storage.getAllUsers();
      const workers = allUsers.filter(u => u.role === "worker");
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  // Get all users (for managers to manage roles)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can view users" });
      }

      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role
  app.patch("/api/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can update user roles" });
      }

      const { role } = req.body;
      const targetUserId = req.params.id;
      
      if (!["manager", "worker"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(targetUserId, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Job routes
  app.post("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can create jobs" });
      }

      const { title, description, workerId, steps } = req.body;
      
      if (!title || !workerId || !steps || steps.length === 0) {
        return res.status(400).json({ 
          message: "Title, worker ID, and at least one step are required"
        });
      }

      // Create the job
      const job = await storage.createJob({
        title,
        description,
        workerId,
        managerId: userId,
        status: "in_progress"
      });

      // Create the steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await storage.createStep({
          jobId: job.id,
          title: step.title,
          description: step.description,
          instructions: step.instructions,
          order: i + 1,
          status: i === 0 ? "awaiting_upload" : "pending"
        });
      }

      const fullJob = await storage.getJob(job.id);
      res.json(fullJob);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.get("/api/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let jobs;
      if (user.role === "manager") {
        jobs = await storage.getJobsByManager(userId);
      } else {
        jobs = await storage.getJobsByWorker(userId);
      }

      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if user has access to this job
      if (job.managerId !== userId && job.workerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Step routes
  app.post("/api/steps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can create steps" });
      }

      const validation = insertStepSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).toString()
        });
      }

      const step = await storage.createStep(validation.data);
      res.json(step);
    } catch (error) {
      console.error("Error creating step:", error);
      res.status(500).json({ message: "Failed to create step" });
    }
  });

  // Upload routes
  app.post("/api/uploads", isAuthenticated, upload.single("photo"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "worker") {
        return res.status(403).json({ message: "Only workers can upload photos" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const stepId = parseInt(req.body.stepId);
      if (!stepId) {
        return res.status(400).json({ message: "Step ID is required" });
      }

      const step = await storage.getStep(stepId);
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }

      const upload = await storage.createUpload({
        stepId,
        workerId: userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      // Update step status to awaiting review
      await storage.updateStepStatus(stepId, "awaiting_review");

      res.json(upload);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can review uploads" });
      }

      const validation = insertReviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).toString()
        });
      }

      const review = await storage.createReview({
        ...validation.data,
        managerId: userId,
      });

      // Update step status based on review
      const upload = await storage.getUpload(validation.data.uploadId);
      if (upload) {
        // Don't update step status here, we'll do it after the workflow logic
        console.log(`Creating review for upload ${upload.id}, status: ${validation.data.status}`);
        
        // Update step status and handle workflow
        if (validation.data.status === "approved") {
          await storage.updateStepStatus(upload.stepId, "approved");
          
          // Find and activate next step
          const step = await storage.getStep(upload.stepId);
          if (step) {
            const allSteps = await storage.getStepsByJob(step.jobId);
            const sortedSteps = allSteps.sort((a, b) => a.order - b.order);
            
            // Find the next step to activate
            const nextStep = sortedSteps.find(s => s.order > step.order && s.status === "pending");
            if (nextStep) {
              await storage.updateStepStatus(nextStep.id, "awaiting_upload");
              console.log(`Activated next step ${nextStep.id}`);
            } else {
              // Check if all steps are completed
              const allApproved = sortedSteps.every(s => s.order <= step.order ? true : s.status === "approved");
              if (allApproved) {
                await storage.updateJobStatus(step.jobId, "completed");
                console.log(`Job ${step.jobId} completed`);
              }
            }
          }
        } else if (validation.data.status === "rejected") {
          await storage.updateStepStatus(upload.stepId, "awaiting_upload");
          console.log(`Step ${upload.stepId} rejected, reset to awaiting_upload`);
        }
      }

      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Delete job route
  app.delete("/api/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can delete jobs" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.managerId !== userId) {
        return res.status(403).json({ message: "You can only delete your own jobs" });
      }

      await storage.deleteJob(jobId);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Delete step route
  app.delete("/api/steps/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "manager") {
        return res.status(403).json({ message: "Only managers can delete steps" });
      }

      const stepId = parseInt(req.params.id);
      const step = await storage.getStep(stepId);
      
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }

      // Check if the manager owns this job
      const job = await storage.getJob(step.jobId);
      if (!job || job.managerId !== userId) {
        return res.status(403).json({ message: "You can only delete steps from your own jobs" });
      }

      await storage.deleteStep(stepId);
      res.json({ message: "Step deleted successfully" });
    } catch (error) {
      console.error("Error deleting step:", error);
      res.status(500).json({ message: "Failed to delete step" });
    }
  });

  // Worker current step route
  app.get("/api/worker/current-step", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "worker") {
        return res.status(403).json({ message: "Only workers can access this endpoint" });
      }

      const currentStep = await storage.getWorkerCurrentStep(userId);
      res.json(currentStep);
    } catch (error) {
      console.error("Error fetching current step:", error);
      res.status(500).json({ message: "Failed to fetch current step" });
    }
  });

  // Serve uploaded files
  app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

  const httpServer = createServer(app);
  return httpServer;
}
