-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "clarifyingQaBank" JSONB NOT NULL,
    "frameworkGuidance" TEXT NOT NULL,
    "exhibits" JSONB NOT NULL,
    "mathSteps" JSONB NOT NULL,
    "modelAnswer" TEXT NOT NULL,
    "gradingRubric" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "parseConfidence" REAL,
    "parseNotes" TEXT,
    "rawSourceText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'strict',
    "phase" TEXT NOT NULL DEFAULT 'clarifying',
    "transcript" JSONB NOT NULL DEFAULT [],
    "revealedExhibits" JSONB NOT NULL DEFAULT [],
    "structureScore" INTEGER,
    "mathScore" INTEGER,
    "synthesisScore" INTEGER,
    "structureCritique" TEXT,
    "mathCritique" TEXT,
    "synthesisCritique" TEXT,
    "overallFeedback" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
