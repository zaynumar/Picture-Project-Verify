import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("worker"), // 'manager' or 'worker'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  managerId: varchar("manager_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Steps table
export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  order: integer("order").notNull(),
  status: varchar("status").notNull().default("pending"), // 'pending', 'awaiting_upload', 'awaiting_review', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photo uploads table
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  stepId: integer("step_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id").notNull(),
  managerId: varchar("manager_id").notNull(),
  status: varchar("status").notNull(), // 'approved', 'rejected'
  feedback: text("feedback"),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedJobs: many(jobs, { relationName: "manager" }),
  workerJobs: many(jobs, { relationName: "worker" }),
  uploads: many(uploads),
  reviews: many(reviews),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  manager: one(users, {
    fields: [jobs.managerId],
    references: [users.id],
    relationName: "manager",
  }),
  worker: one(users, {
    fields: [jobs.workerId],
    references: [users.id],
    relationName: "worker",
  }),
  steps: many(steps),
}));

export const stepsRelations = relations(steps, ({ one, many }) => ({
  job: one(jobs, {
    fields: [steps.jobId],
    references: [jobs.id],
  }),
  uploads: many(uploads),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
  step: one(steps, {
    fields: [uploads.stepId],
    references: [steps.id],
  }),
  worker: one(users, {
    fields: [uploads.workerId],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  upload: one(uploads, {
    fields: [reviews.uploadId],
    references: [uploads.id],
  }),
  manager: one(users, {
    fields: [reviews.managerId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStepSchema = createInsertSchema(steps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  uploadedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  reviewedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Step = typeof steps.$inferSelect;
export type InsertStep = z.infer<typeof insertStepSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Job with relations
export type JobWithDetails = Job & {
  manager: User;
  worker: User;
  steps: (Step & {
    uploads: (Upload & {
      reviews: Review[];
    })[];
  })[];
};

// Step with relations
export type StepWithDetails = Step & {
  uploads: (Upload & {
    reviews: Review[];
  })[];
};
