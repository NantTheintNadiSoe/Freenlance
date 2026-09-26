PRAGMA foreign_keys=ON;

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "headline" TEXT,
  "location" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Yangon',
  "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  "role" TEXT NOT NULL DEFAULT 'FREELANCER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "hourlyRateMinor" INTEGER,
  "availability" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "ratingAverage" REAL NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "revokedAt" DATETIME,
  "deviceName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Skill" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE
);

CREATE TABLE "UserSkill" (
  "userId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "proficiency" TEXT,
  PRIMARY KEY ("userId", "skillId"),
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PortfolioItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "projectUrl" TEXT,
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Job" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "budgetType" TEXT NOT NULL DEFAULT 'FIXED',
  "budgetMinMinor" INTEGER NOT NULL,
  "budgetMaxMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "experienceLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
  "locationMode" TEXT NOT NULL DEFAULT 'REMOTE',
  "location" TEXT,
  "deadline" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "JobSkill" (
  "jobId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  PRIMARY KEY ("jobId", "skillId"),
  FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Proposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "coverLetter" TEXT NOT NULL,
  "proposedAmountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "estimatedDays" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("jobId", "freelancerId")
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT NOT NULL UNIQUE,
  "proposalId" TEXT NOT NULL UNIQUE,
  "clientId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "agreedAmountMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "startDate" DATETIME,
  "endDate" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" TEXT,
  "contractId" TEXT,
  "clientId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("contractId", "authorId")
);

CREATE TABLE "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reporterId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Session_userId_revokedAt_idx" ON "Session" ("userId", "revokedAt");
CREATE INDEX "PortfolioItem_userId_sortOrder_idx" ON "PortfolioItem" ("userId", "sortOrder");
CREATE INDEX "Job_status_createdAt_idx" ON "Job" ("status", "createdAt");
CREATE INDEX "Job_clientId_status_idx" ON "Job" ("clientId", "status");
CREATE INDEX "Job_currency_status_idx" ON "Job" ("currency", "status");
CREATE INDEX "Proposal_freelancerId_status_idx" ON "Proposal" ("freelancerId", "status");
CREATE INDEX "Contract_clientId_status_idx" ON "Contract" ("clientId", "status");
CREATE INDEX "Contract_freelancerId_status_idx" ON "Contract" ("freelancerId", "status");
CREATE INDEX "Conversation_clientId_updatedAt_idx" ON "Conversation" ("clientId", "updatedAt");
CREATE INDEX "Conversation_freelancerId_updatedAt_idx" ON "Conversation" ("freelancerId", "updatedAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message" ("conversationId", "createdAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification" ("userId", "readAt", "createdAt");
CREATE INDEX "Review_recipientId_createdAt_idx" ON "Review" ("recipientId", "createdAt");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report" ("targetType", "targetId");
CREATE INDEX "AuditEvent_resourceType_resourceId_createdAt_idx" ON "AuditEvent" ("resourceType", "resourceId", "createdAt");
