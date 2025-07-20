import {
  users,
  jobs,
  steps,
  uploads,
  reviews,
  documentSets,
  documents,
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
  type DocumentSet,
  type InsertDocumentSet,
  type Document,
  type InsertDocument,
  type DocumentSetWithDetails,
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
  deleteJob(id: number): Promise<void>;
  
  // Step operations
  createStep(step: InsertStep): Promise<Step>;
  getStepsByJob(jobId: number): Promise<StepWithDetails[]>;
  getStep(id: number): Promise<StepWithDetails | undefined>;
  updateStepStatus(id: number, status: string): Promise<void>;
  deleteStep(id: number): Promise<void>;
  
  // Upload operations
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUploadsByStep(stepId: number): Promise<Upload[]>;
  getUpload(id: number): Promise<Upload | undefined>;
  
  // Review operations
  createReview(review: InsertReview & { managerId: string }): Promise<Review>;
  getReviewsByUpload(uploadId: number): Promise<Review[]>;
  
  // Dashboard operations
  getWorkerCurrentStep(workerId: string): Promise<StepWithDetails | undefined>;
  
  // Document operations
  createDocumentSet(documentSet: InsertDocumentSet & { managerId: string }): Promise<DocumentSet>;
  getDocumentSet(id: number): Promise<DocumentSetWithDetails | undefined>;
  getDocumentSetsByManager(managerId: string): Promise<DocumentSetWithDetails[]>;
  deleteDocumentSet(id: number): Promise<void>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentsBySet(documentSetId: number): Promise<Document[]>;
  deleteDocument(id: number): Promise<void>;
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

  async deleteJob(id: number): Promise<void> {
    // Delete related data first due to foreign key constraints
    const jobSteps = await db.select().from(steps).where(eq(steps.jobId, id));
    for (const step of jobSteps) {
      const stepUploads = await db.select().from(uploads).where(eq(uploads.stepId, step.id));
      for (const upload of stepUploads) {
        // Delete reviews
        await db.delete(reviews).where(eq(reviews.uploadId, upload.id));
      }
      // Delete uploads
      await db.delete(uploads).where(eq(uploads.stepId, step.id));
    }
    // Delete steps
    await db.delete(steps).where(eq(steps.jobId, id));
    // Finally delete the job
    await db.delete(jobs).where(eq(jobs.id, id));
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

  async deleteStep(id: number): Promise<void> {
    // Delete related uploads and reviews first
    const stepUploads = await db.select().from(uploads).where(eq(uploads.stepId, id));
    for (const upload of stepUploads) {
      // Delete reviews
      await db.delete(reviews).where(eq(reviews.uploadId, upload.id));
    }
    // Delete uploads
    await db.delete(uploads).where(eq(uploads.stepId, id));
    // Finally delete the step
    await db.delete(steps).where(eq(steps.id, id));
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
  async createReview(review: InsertReview & { managerId: string }): Promise<Review> {
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

  // Document Set operations
  async createDocumentSet(documentSet: InsertDocumentSet & { managerId: string }): Promise<DocumentSet> {
    const [newDocumentSet] = await db.insert(documentSets).values(documentSet).returning();
    return newDocumentSet;
  }

  async getDocumentSet(id: number): Promise<DocumentSetWithDetails | undefined> {
    const result = await db.query.documentSets.findFirst({
      where: eq(documentSets.id, id),
      with: {
        manager: true,
        documents: {
          orderBy: asc(documents.order),
        },
      },
    });
    return result as DocumentSetWithDetails | undefined;
  }

  async getDocumentSetsByManager(managerId: string): Promise<DocumentSetWithDetails[]> {
    const result = await db.query.documentSets.findMany({
      where: eq(documentSets.managerId, managerId),
      with: {
        manager: true,
        documents: {
          orderBy: asc(documents.order),
        },
      },
      orderBy: desc(documentSets.createdAt),
    });
    return result as DocumentSetWithDetails[];
  }

  async deleteDocumentSet(id: number): Promise<void> {
    // Delete all documents in the set first
    await db.delete(documents).where(eq(documents.documentSetId, id));
    // Then delete the document set
    await db.delete(documentSets).where(eq(documentSets.id, id));
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocumentsBySet(documentSetId: number): Promise<Document[]> {
    return await db.select()
      .from(documents)
      .where(eq(documents.documentSetId, documentSetId))
      .orderBy(asc(documents.order));
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();
