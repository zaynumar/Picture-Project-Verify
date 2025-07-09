import {
  users,
  jobs,
  steps,
  uploads,
  reviews,
  type User,
  type UpsertUser,
  type Job,
  type InsertJob,
  type Step,
  type InsertStep,
  type Upload,
  type InsertUpload,
  type Review,
  type InsertReview,
  type JobWithDetails,
  type StepWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<void>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<JobWithDetails | undefined>;
  getJobsByManager(managerId: string): Promise<JobWithDetails[]>;
  getJobsByWorker(workerId: string): Promise<JobWithDetails[]>;
  updateJobStatus(id: number, status: string): Promise<void>;
  
  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStepsByJob(jobId: number): Promise<StepWithDetails[]>;
  getStep(id: number): Promise<StepWithDetails | undefined>;
  updateStepStatus(id: number, status: string): Promise<void>;
  
  // Upload operations
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUploadsByStep(stepId: number): Promise<Upload[]>;
  getUpload(id: number): Promise<Upload | undefined>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByUpload(uploadId: number): Promise<Review[]>;
  
  // Dashboard operations
  getWorkerCurrentStep(workerId: string): Promise<StepWithDetails | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJob(id: number): Promise<JobWithDetails | undefined> {
    const result = await db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        manager: true,
        worker: true,
        steps: {
          orderBy: asc(steps.order),
          with: {
            uploads: {
              with: {
                reviews: true,
              },
            },
          },
        },
      },
    });
    return result as JobWithDetails | undefined;
  }

  async getJobsByManager(managerId: string): Promise<JobWithDetails[]> {
    const result = await db.query.jobs.findMany({
      where: eq(jobs.managerId, managerId),
      with: {
        manager: true,
        worker: true,
        steps: {
          orderBy: asc(steps.order),
          with: {
            uploads: {
              with: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: desc(jobs.createdAt),
    });
    return result as JobWithDetails[];
  }

  async getJobsByWorker(workerId: string): Promise<JobWithDetails[]> {
    const result = await db.query.jobs.findMany({
      where: eq(jobs.workerId, workerId),
      with: {
        manager: true,
        worker: true,
        steps: {
          orderBy: asc(steps.order),
          with: {
            uploads: {
              with: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: desc(jobs.createdAt),
    });
    return result as JobWithDetails[];
  }

  async updateJobStatus(id: number, status: string): Promise<void> {
    await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, id));
  }

  // Step operations
  async createStep(step: InsertStep): Promise<Step> {
    const [newStep] = await db.insert(steps).values(step).returning();
    return newStep;
  }

  async getStepsByJob(jobId: number): Promise<StepWithDetails[]> {
    const result = await db.query.steps.findMany({
      where: eq(steps.jobId, jobId),
      with: {
        uploads: {
          with: {
            reviews: true,
          },
        },
      },
      orderBy: asc(steps.order),
    });
    return result as StepWithDetails[];
  }

  async getStep(id: number): Promise<StepWithDetails | undefined> {
    const result = await db.query.steps.findFirst({
      where: eq(steps.id, id),
      with: {
        uploads: {
          with: {
            reviews: true,
          },
        },
      },
    });
    return result as StepWithDetails | undefined;
  }

  async updateStepStatus(id: number, status: string): Promise<void> {
    await db.update(steps).set({ status, updatedAt: new Date() }).where(eq(steps.id, id));
  }

  // Upload operations
  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [newUpload] = await db.insert(uploads).values(upload).returning();
    return newUpload;
  }

  async getUploadsByStep(stepId: number): Promise<Upload[]> {
    return await db.select().from(uploads).where(eq(uploads.stepId, stepId));
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviewsByUpload(uploadId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.uploadId, uploadId));
  }

  // Dashboard operations
  async getWorkerCurrentStep(workerId: string): Promise<StepWithDetails | undefined> {
    // Get the worker's active job
    const activeJob = await db.query.jobs.findFirst({
      where: and(eq(jobs.workerId, workerId), eq(jobs.status, "in_progress")),
    });

    if (!activeJob) return undefined;

    // Get the first step that's not approved
    const result = await db.query.steps.findFirst({
      where: and(
        eq(steps.jobId, activeJob.id),
        ne(steps.status, "approved")
      ),
      with: {
        uploads: {
          with: {
            reviews: true,
          },
        },
      },
      orderBy: asc(steps.order),
    });

    return result as StepWithDetails | undefined;
  }
}

export const storage = new DatabaseStorage();
