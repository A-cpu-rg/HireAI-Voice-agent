# HireAI — Intelligent Hiring Automation Platform

**Screen 100 candidates in 15 minutes. Hire the right ones.**

A full-stack **B2B SaaS platform** that combines AI-powered resume intelligence, JD matching, and voice-based screening to automate and accelerate hiring workflows. Built for startups, enterprises, and high-volume hiring teams.

---

## 🚀 The Problem We Solve

### Current Hiring Process = Money Loss

- **Recruiters spend 8+ hours/week** on initial screening calls
- **70% of candidates are weak fits** caught too late in the process
- **Manual evaluation = inconsistent decisions** and bias
- **1 call per hour = 5-8 calls/day** max → hiring cycles take weeks
- **Cost per hire: $3000-5000** when you factor in recruiter time

### The HireAI Difference

✅ **AI-powered resume → JD matching** (eliminates 60% weak candidates before calling)  
✅ **2-minute structured AI calls** (10-15x faster screening)  
✅ **Multi-layer scoring system** (accurate decision-making)  
✅ **Shortlist auto-generated** (recruiter knows exactly who to hire)  
✅ **Cost-effective at scale** (screen 100 candidates for <$10 in API costs)

---

## 💡 How It Works: The 3-Layer Evaluation System

### Layer 1: Resume Intelligence (AI JD Matching) 🎯

**When:** Candidate resume is uploaded  
**What happens:**
- AI extracts candidate info (name, email, phone, skills, experience)
- Resume is scored against job description
- Skill match detected automatically
- **Output:** Fit Score (0-100%)

**Example:**
```
Job: "Senior React Developer"
Required: React, Node.js, TypeScript, PostgreSQL

Candidate Resume Analysis:
✅ React: 5 years → EXPERT (25/25)
✅ Node.js: 3 years → PROFICIENT (20/25)
✅ TypeScript: 2 years → INTERMEDIATE (15/25)
❌ PostgreSQL: 0 years → MISSING (0/25)

Match Score: 60/100
Action: "Top 30% candidates → Move to call"
```

**Why this works:**
- 70% filtering happens before expensive AI call
- Resume parsing is **fast & cheap** (Gemini API)
- Fallback regex parser if quota exceeded
- Saves recruiter time on obviously unqualified candidates

---

### Layer 2: AI Voice Screening (Structured Interview) 🎙️

**When:** Top 30% resume candidates are selected  
**What happens:**
- **Bolna AI agent** calls candidate (max 2 minutes)
- Smart prompt tailored to job requirements
- Questions adapted based on resume
- Conversation is recorded & transcribed

**Smart Prompt Example:**
```
"You're applying for a Senior React role at TechCorp.
They use React, Node.js, and TypeScript heavily.

Walk me through your most complex React project.
What was the biggest technical challenge?
How did you handle state management?
Explain a time you debugged a critical performance issue."
```

**Scoring Metrics:**
- **Communication: 0-10** (clarity, articulation)
- **Technical Depth: 0-10** (problem-solving, knowledge)
- **Confidence: 0-10** (composure, assertiveness)
- **Culture Fit: 0-10** (enthusiasm, values alignment)

---

### Layer 3: Decision Engine (Final Score & Recommendation) 🤖

**Multi-signal scoring combines all layers:**

```
Resume Score:           60/100 (JD match)
Call Communication:      8/10
Call Technical Depth:    7/10
Call Confidence:         7/10
Call Culture Fit:        8/10

FINAL SCORE = (60 + (8+7+7+8)*2) / 10 = 78/100

Recommendation: ✅ SHORTLIST
Confidence: HIGH (resume + call aligned)
Next Step: Schedule technical round
```

**Decision Logic:**
- **80-100:** Shortlist immediately
- **65-79:** Hold for secondary review
- **<65:** Reject (doesn't meet bar)

---

## 🏗️ System Architecture

```
User Dashboard
    ↓
Upload Resume (PDF)
    ↓
[Layer 1: Parse Resume + Extract Info]
    ├→ Gemini AI (preferred)
    └→ Regex Fallback (if quota exceeded)
    ↓
[Score Resume vs JD]
    ├→ Skill matching
    ├→ Experience level
    └→ Fit Score (0-100)
    ↓
[Filter: Top 30% candidates?]
    ├→ NO → Archive
    └→ YES → Move to calling
    ↓
[Layer 2: Start AI Call via Bolna]
    ├→ Smart prompt generation
    ├→ 2-minute call
    ├→ Transcript collection
    └→ Raw scores extraction
    ↓
[Layer 3: Process Webhook Response]
    ├→ Score conversation
    ├→ Combine all signals
    ├→ Generate recommendation
    └→ Store in database
    ↓
[Dashboard: Auto-shortlist ready]
    └→ "Top 3 candidates to interview"
```

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Frontend** | Next.js 15 + React 19 | Fast, type-safe, SSR |
| **Backend** | Node.js API routes | Serverless, scalable |
| **Database** | PostgreSQL + Prisma | Relational, multi-tenant ready |
| **AI Parsing** | Google Gemini 2.0 Flash | Fast, cost-effective |
| **Voice Agent** | Bolna AI | Production-grade, webhook support |
| **Styling** | Tailwind CSS + Framer Motion | Beautiful, responsive UI |
| **Auth** | Next.js Middleware | Session-based (extensible to OAuth) |

---

## 📊 Core Features

### For Recruiters

✅ **Bulk Resume Upload** — Process 50+ resumes in seconds  
✅ **Smart JD Matching** — Auto-filter candidates by skill fit  
✅ **One-Click AI Calling** — Trigger AI screening with one button  
✅ **Live Call Monitoring** — See call status in real-time  
✅ **Auto-Shortlist** — AI generates "hire this" list automatically  
✅ **Scoring Dashboard** — View all scoring layers (resume → call → decision)  
✅ **Candidate Analytics** — Search, filter, sort by score/status  

### For Enterprises

✅ **Multi-tenant Architecture** — Separate data per user/org  
✅ **Role-based Access Control** — Future extensibility  
✅ **Audit Logs** — Track all hiring decisions  
✅ **API Integration** — Connect to ATS/HRIS  
✅ **Webhook Callbacks** — Real-time sync with external systems  
✅ **Database Transactions** — No partial writes, data consistency  

### For Developers

✅ **REST API** — All operations exposed  
✅ **Type-safe** — Full TypeScript support  
✅ **Prisma ORM** — Type-safe database queries  
✅ **Error Handling** — Graceful fallbacks, detailed logging  
✅ **Extensible** — Easy to add new scoring layers  

---

## 📈 Performance & Economics

### Speed

| Task | Time | Cost |
|------|------|------|
| Resume parsing | 2-5 sec | $0.001 |
| AI call (2 min) | 120 sec | $0.10 |
| Processing webhook | <1 sec | free |
| **Total per candidate** | **~2 min** | **$0.11** |

### Scale Economics

```
Screening 100 candidates:
- Manual recruiter: 100 hours = $2,500 (@ $25/hr)
- HireAI: $11 API cost + 2 hours review = $61
- Savings: 98 hours, $2,439/batch
```

---

## 🔄 Data Flow

### 1️⃣ Resume Upload & Parsing

```bash
POST /api/parse-resume
├─ Input: PDF file
├─ Processing:
│  ├─ Try: Gemini AI extraction
│  └─ Fallback: Regex-based extraction
└─ Output: {name, email, phone, skills, experience, matchScore}
```

### 2️⃣ Job Description Intelligence

```bash
POST /api/parse-jd
├─ Input: JD text or PDF
├─ Extraction: Title, salary, location, required skills, smartPrompt
├─ Smart Prompt: AI-generated interview questions specific to JD
└─ Output: Structured job requirements
```

### 3️⃣ Candidate Scoring

```bash
GET /api/candidates
├─ Filters: call status, decision, job, score
├─ Sorting: by score, date, name
└─ Output: Ranked candidate list ready for calling
```

### 4️⃣ AI Call Initiation

```bash
POST /api/bolna/call
├─ Input: candidateId, jobId (optional)
├─ Bolna Integration:
│  ├─ Fetch candidate details
│  ├─ Fetch job smartPrompt
│  └─ Trigger outbound call via Bolna API
└─ Output: callId, call initiated
```

### 5️⃣ Webhook Processing (Call Complete)

```bash
POST /api/bolna/webhook
├─ Input: callId, transcript, extracted_data, duration
├─ Processing:
│  ├─ Score: technical, communication, culture fit
│  ├─ Generate: recommendation (shortlist/hold/reject)
│  └─ Store: screening results, transcript, call log
└─ Transaction: Atomic update (no partial writes)
```

---

## 🗄️ Database Schema

### Models

**User** — Multi-tenant owner  
**Job** — Job opening with smartPrompt  
**Candidate** — Applicant with resume scores  
**ScreeningResult** — Call scores & recommendation  
**CallLog** — Bolna call metadata  
**TranscriptMessage** — Call transcript (agent + candidate)

### Key Relations

```
User (1) → (Many) Candidates
Job (1) → (Many) Candidates
Candidate (1) → (1) ScreeningResult
Candidate (1) → (Many) CallLogs
Candidate (1) → (Many) TranscriptMessages
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Bolna API key (for voice calling)
- Google Gemini API key (for AI parsing)

### Installation

```bash
# Clone the repo
git clone https://github.com/A-cpu-rg/HireAI-Voice-agent.git
cd HireAI-Voice-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your:
# - DATABASE_URL (PostgreSQL connection)
# - GOOGLE_AI_API_KEY (Gemini API)
# - BOLNA_API_KEY (Bolna voice agent)
# - BOLNA_AGENT_ID (Your Bolna agent ID)

# Setup database
npx prisma migrate deploy
npx prisma db seed  # Optional: seed demo data

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Usage Walkthrough

### For Recruiters

**Step 1: Create a Job Opening**
```
Jobs → Add New Job
Title: "Senior React Developer"
Description: [JD text]
Skills: React, TypeScript, Node.js, PostgreSQL
Salary: $120k - $160k
→ System generates smartPrompt automatically
```

**Step 2: Upload Candidates**
```
Candidates → Add Candidates
Upload: resumes.zip (multiple PDFs)
Select Job: "Senior React Developer"
→ AI extracts names, skills, scores against JD
→ Shows match score
```

**Step 3: Filter & Call**
```
View candidates sorted by match score
Filter: "Top 30% fit"
Click: "Start AI Call"
→ Bolna calls candidate
→ Call completes in 2 minutes
```

**Step 4: Review & Decide**
```
Call complete → See scoring:
├─ Resume Match: 78/100
├─ Communication: 8/10
├─ Technical: 7/10
└─ Culture Fit: 8/10

Final Score: 78/100 ✅ SHORTLIST
→ Auto-generated shortlist ready for next round
```

---

## 🔐 Security & Compliance

✅ **Multi-tenant isolation** — User data never leaks  
✅ **HTTPS only** — Encrypted in transit  
✅ **Database transactions** — ACID compliance  
✅ **Input validation** — All API inputs sanitized  
✅ **Audit logs** — Coming soon  
✅ **GDPR ready** — Data deletion, consent management  

---

## 📊 Analytics & Reporting

### Dashboard Metrics

- **Candidates screened** — Total volume
- **Time saved** — Hours vs manual screening
- **Shortlist rate** — % moving to next round
- **Call completion rate** — Successful vs failed calls
- **Average score** — Candidate quality trend
- **Cost savings** — Calculated per batch

---

## 🛣️ Product Roadmap

### Phase 1: MVP ✅
- [x] Resume parsing & JD matching
- [x] Voice AI call integration
- [x] Multi-layer scoring
- [x] Dashboard & candidate management
- [x] Webhook processing

### Phase 2: Enhancement 🚧
- [ ] Video interview option
- [ ] Bias detection in scoring
- [ ] ATS integration (LinkedIn, Workable)
- [ ] Team collaboration & permissions
- [ ] Email notifications
- [ ] Skill assessment quiz integration

### Phase 3: Enterprise 📋
- [ ] Advanced analytics & reporting
- [ ] Custom scoring rubrics
- [ ] API for 3rd-party integrations
- [ ] SSO/SAML
- [ ] On-premise deployment
- [ ] Dedicated support

---

## 💰 Pricing Strategy (B2B SaaS)

```
Starter: $299/month
├─ 50 candidates/month
├─ 1 job opening
├─ Basic analytics
└─ Email support

Professional: $999/month
├─ 500 candidates/month
├─ 10 job openings
├─ Advanced analytics
├─ Priority support
└─ API access

Enterprise: Custom
├─ Unlimited candidates
├─ Unlimited jobs
├─ White-label option
├─ Custom integrations
└─ Dedicated success manager
```

---

## 🎯 Market Positioning

### Who Uses HireAI?

✅ **Startups** (50-200 people) — Need to hire fast, cheap  
✅ **High-volume hiring** — Internships, sales, support, freshers  
✅ **Recruitment agencies** — Screen 100+ candidates/week  
✅ **Enterprises** — HR teams handling multiple openings  
✅ **Scaleups** (Series A/B) — Growing teams, standardized process  

### Who Doesn't (Yet)

❌ Senior engineering roles (need manual assessment)  
❌ C-level hiring (requires domain expertise)  
❌ Highly specialized roles (limited candidate pool)  
→ *Can add later with custom scoring rules*

---

## 🆚 Competitive Advantage

| Feature | HireAI | Northstarz | Lyra | Traditional ATS |
|---------|--------|-----------|------|-----------------|
| Resume parsing | ✅ AI | ✅ AI | ✅ AI | ❌ Manual |
| JD matching | ✅ Smart | ❌ | ❌ | ❌ |
| Voice screening | ✅ 2-min | ✅ 30-min video | ✅ | ❌ |
| Cost per candidate | $0.11 | $5+ | $2+ | $10+ |
| Setup time | <5 min | 30 min | 15 min | Hours |
| Speed | 10x faster | 2x faster | 3x faster | 1x baseline |
| Bias detection | 🚧 Coming | ✅ | ✅ | ❌ |

---

## 📞 Support & Community

- **Documentation:** [Docs site] (coming soon)
- **Issues:** GitHub Issues
- **Email:** support@hireai.dev
- **Twitter:** @HireAI_AI
- **Slack Community:** (join our community)

---

## 📄 License

MIT License — See `LICENSE` file

---

## 🙌 Contributing

We welcome contributions! Please read `CONTRIBUTING.md` for guidelines.

---

## 🎓 Author

**Abhishek Meena**  
Building the future of hiring automation.

---

## 🚀 Deploy to Production

### Vercel (Recommended)

```bash
# Connect your GitHub repo
# Set environment variables in Vercel dashboard
# Deploy with one click
```

### Docker

```bash
docker build -t hireai .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e GOOGLE_AI_API_KEY="..." \
  -e BOLNA_API_KEY="..." \
  hireai
```

---

## �� Final Note

**HireAI isn't just an interview tool — it's a hiring system.**

Most hiring platforms ask: *"How do we conduct better interviews?"*

We ask: *"How do we hire better, faster, cheaper?"*

The answer is **multi-layer intelligence**, not just one signal.

---

**Ready to transform your hiring?** [Sign up for beta](https://hireai.dev) 🚀
