-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "verificationTokenHash" TEXT,
    "verificationTokenExpiresAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "callStatus" TEXT NOT NULL DEFAULT 'pending',
    "decisionStatus" TEXT NOT NULL DEFAULT 'undecided',
    "score" INTEGER,
    "matchScore" INTEGER,
    "callId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resumeUrl" TEXT,
    "location" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarColor" TEXT NOT NULL,
    "tags" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "technicalScore" INTEGER NOT NULL,
    "communicationScore" INTEGER NOT NULL,
    "problemSolvingScore" INTEGER NOT NULL,
    "cultureFitScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "concerns" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keySkills" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "salaryExpectation" TEXT NOT NULL,

    CONSTRAINT "ScreeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptMessage" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "TranscriptMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "openings" INTEGER NOT NULL,
    "applicants" INTEGER NOT NULL DEFAULT 0,
    "screened" INTEGER NOT NULL DEFAULT 0,
    "shortlisted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "salaryRange" TEXT NOT NULL,
    "smartPrompt" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '0m 0s',
    "status" TEXT NOT NULL DEFAULT 'calling',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_userId_key" ON "Candidate"("email", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningResult_candidateId_key" ON "ScreeningResult"("candidateId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptMessage" ADD CONSTRAINT "TranscriptMessage_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

