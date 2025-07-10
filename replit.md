# Photo Verification System

## Overview

This is a full-stack web application for AI-powered photo verification workflows. The system enables managers to create sequential photo verification tasks and workers to complete them through a structured, ordered process. The application uses a modern stack with React frontend, Express backend, PostgreSQL database, and Replit authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for handling image uploads
- **API Design**: RESTful endpoints with proper error handling

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users**: Stores user information with roles (manager/worker)
- **Jobs**: Represents work assignments with status tracking
- **Steps**: Sequential tasks within jobs that require photo verification
- **Uploads**: Photo submissions linked to steps
- **Reviews**: Manager feedback on uploaded photos
- **Sessions**: Authentication session storage

## Key Components

### Authentication System
- Uses Replit's OpenID Connect authentication
- Role-based access control (managers vs workers)
- Session persistence with PostgreSQL storage
- Automatic redirection for unauthorized access

### Job Management
- Managers create jobs with sequential steps
- Each step requires photo verification before proceeding
- Workers can only progress through steps in order
- Status tracking throughout the workflow

### Photo Upload System
- Drag-and-drop file upload interface
- Image preview and validation
- File size and type restrictions
- Mobile-friendly camera integration

### Review System
- Managers can approve or reject submitted photos
- Feedback mechanism for rejections
- Real-time status updates
- Notification system for status changes

## Data Flow

1. **Manager Creates Job**: Manager defines job with sequential steps
2. **Worker Assignment**: Jobs are assigned to specific workers
3. **Sequential Execution**: Workers complete steps in order, uploading photos
4. **Review Process**: Managers review each photo submission
5. **Feedback Loop**: Rejected photos return to workers with feedback
6. **Progress Tracking**: System tracks completion status throughout

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **Connection Pooling**: Efficient database connections

### Authentication
- **Replit Auth**: OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions
- **Passport.js**: Authentication middleware

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Comprehensive icon library

### File Handling
- **Multer**: Multipart form data handling
- **Image Processing**: Client-side preview generation
- **File Validation**: Type and size restrictions

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Database Migrations**: Drizzle Kit for schema management
- **Environment Variables**: Database URL and session secrets
- **TypeScript**: Full type safety across the stack

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code
- **Database**: Migrations applied via Drizzle Kit
- **Static Serving**: Express serves built frontend assets

### Configuration
- **TypeScript**: Unified configuration across client/server
- **Path Aliases**: Simplified import paths
- **Build Scripts**: Automated development and production workflows

The architecture supports scalability through its modular design, proper separation of concerns, and efficient database queries. The system can easily accommodate additional features like multi-step workflows, batch processing, and enhanced notification systems.

## Recent Changes: Latest modifications with dates

### July 9, 2025 - Photo Verification System Complete & Bug Fixes
- Removed real-time status updates requirement as requested
- Built complete dual web application system with:
  - Role-based authentication (managers/workers)
  - Manager dashboard for job oversight and photo review
  - Worker dashboard for step-by-step photo upload
  - Photo upload with drag-and-drop and camera integration
  - Review system with approval/rejection and feedback
  - PostgreSQL database with full schema implementation
  - Sequential workflow enforcement
  - File storage and serving capabilities

#### Bug Fixes Applied:
- Fixed step numbering inconsistency (was showing "Step 0" instead of "Step 1")
- Enhanced progress indicator to show step titles for all steps (including locked ones)
- Fixed navigation issues by replacing window.location.href with proper React routing
- Improved approve/reject workflow logic with proper step advancement
- Added debugging logs for review creation and step transitions
- Fixed step order display to use actual step.order instead of array index

### July 9, 2025 - Manager Dashboard Enhancements & Worker Multi-Job Support
- Removed non-functional checklist icon button from manager dashboard header
- Added download image functionality for managers to save worker photos to their device
- Fixed issue where rejected image feedback wasn't visible to workers - now shows manager's comments
- Resolved multiple image approval bug - now only latest upload shows approve/reject buttons
- Previous uploads are shown in a compact history view with download option
- Completely rebuilt worker dashboard to support multiple job assignments
- Workers can now view and work on multiple jobs simultaneously
- Each job shows as a card with progress, current step details, and upload functionality
- Added delete step functionality for managers in job details page