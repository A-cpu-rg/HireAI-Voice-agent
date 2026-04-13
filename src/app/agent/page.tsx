"use client";

import { Mic2, Code, Copy, CheckCircle, ExternalLink, Zap, BookOpen } from "lucide-react";
import Header from "@/components/Layout/Header";
import { useState } from "react";
// No mock data

export default function AgentConfig() {
  const [copied, setCopied] = useState<string | null>(null);

  const BOLNA_AGENT_PROMPT = `You are Aria, an AI recruitment screening assistant for Bolna — a Voice AI startup. 
Your job is to conduct professional, friendly phone screenings for engineering and product roles.

SCREENING OBJECTIVES:
1. Verify the candidate's current tech stack and experience level
2. Ask about a recent challenging technical problem
3. Evaluate communication clarity and enthusiasm`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const agentPayload = `{
  "agent_config": {
    "agent_name": "Aria - HireAI Recruiter",
    "agent_welcome_message": "Hi {candidate_name}! I'm Aria, an AI recruitment assistant at Bolna. Thanks so much for applying for the {role} position. I'd love to learn more about you. Could you give me a quick overview of your current work?",
    "webhook_url": "https://your-app.com/api/webhook/bolna",
    "tasks": [
      {
        "task_type": "conversation",
        "task_config": {
          "model": "gpt-4o-mini",
          "max_tokens": 4096
        },
        "tools_config": {
          "synthesizer": {
            "provider": "elevenlabs",
            "voice": "Rachel"
          },
          "transcriber": {
            "provider": "deepgram",
            "language": "en"
          },
          "llm_agent": {
            "max_retries": 3,
            "system_prompt": "${BOLNA_AGENT_PROMPT.slice(0, 100)}..."
          }
        }
      }
    ]
  },
  "agent_prompts": {
    "task_1": {
      "system_prompt": "..."
    }
  }
}`;

  const webhookPayload = `// Webhook handler (Node.js/Express)
app.post('/api/webhook/bolna', async (req, res) => {
  const { call_id, status, data } = req.body;
  
  if (status === 'completed') {
    // Extract structured data from AI
    const { 
      tech_stack, 
      notice_period,
      salary_expectation,
      technical_depth_score,
      communication_score,
      recommendation
    } = data.extracted_data;
    
    // Update candidate in your DB
    await updateCandidate(call_id, {
      score: calculateOverallScore(data),
      screeningResult: data,
      status: recommendation === 'Shortlist' ? 'shortlisted' : 'completed'
    });
    
    // Notify recruiter
    await sendSlackNotification(data);
  }
  
  res.json({ received: true });
});`;

  const callPayload = `// Make a call via Bolna API
const response = await fetch('https://api.bolna.ai/call', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_BOLNA_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_id: 'YOUR_AGENT_ID',
    recipient_phone_number: '+919876543210',
    user_data: {
      candidate_name: 'Priya Sharma',
      role: 'Full-Stack Engineer',
      experience: '4 years'
    }
  })
});

const { call_id } = await response.json();
console.log('Call initiated:', call_id);`;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AI Agent" subtitle="Bolna Voice AI agent configuration and setup guide" />

      <div className="pt-16 p-6 space-y-6">
        {/* Agent Overview */}
        <div className="bg-gradient-to-br from-indigo-600/15 to-violet-600/15 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <Mic2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">Aria — AI Recruitment Screener</h2>
              <p className="text-sm text-white/50 leading-relaxed mb-4">
                Aria is a Bolna Voice AI agent trained to conduct structured 5-minute candidate screening calls.
                She extracts key data (tech stack, availability, salary) and scores candidates on 4 dimensions.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://platform.bolna.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Bolna Platform
                </a>
                <a
                  href="https://www.bolna.ai/docs/introduction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/10"
                >
                  <BookOpen className="w-4 h-4" />
                  Read Docs
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Agent Active
            </div>
          </div>
        </div>

        {/* Architecture Flow */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Full System Architecture
          </h3>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {[
              { label: "HireAI Web App", sub: "React Frontend", color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" },
              { arrow: "→", label: "POST /call", sub: "Bolna API", color: "" },
              { label: "Bolna Platform", sub: "Voice AI Engine", color: "bg-violet-500/20 border-violet-500/30 text-violet-300" },
              { arrow: "→", label: "Phone Call", sub: "Candidate", color: "" },
              { label: "Candidate", sub: "Real person", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" },
              { arrow: "→", label: "Webhook", sub: "Results", color: "" },
              { label: "Backend API", sub: "Process & Store", color: "bg-amber-500/20 border-amber-500/30 text-amber-300" },
              { arrow: "→", label: "Update", sub: "Realtime", color: "" },
              { label: "Dashboard", sub: "Recruiter View", color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300" },
            ].map((step, i) => (
              step.arrow ? (
                <div key={i} className="flex flex-col items-center text-white/30 flex-shrink-0">
                  <span className="text-lg">{step.arrow}</span>
                  <span className="text-[9px] whitespace-nowrap">{step.label}</span>
                  <span className="text-[9px] text-white/20 whitespace-nowrap">{step.sub}</span>
                </div>
              ) : (
                <div key={i} className={`flex-shrink-0 px-3 py-2.5 rounded-xl border text-center min-w-[90px] ${step.color}`}>
                  <p className="text-[11px] font-semibold">{step.label}</p>
                  <p className="text-[9px] opacity-60 mt-0.5">{step.sub}</p>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Agent Prompt */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white">Agent System Prompt</span>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">aria-prompt-v1</span>
            </div>
            <button
              onClick={() => handleCopy(BOLNA_AGENT_PROMPT, "prompt")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              {copied === "prompt" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "prompt" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-5 bg-[#0b0b14]">
            <pre className="text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">{BOLNA_AGENT_PROMPT}</pre>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="grid grid-cols-2 gap-4">
          {/* Create Agent */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <span className="text-sm font-semibold text-white">Create Agent (Bolna API)</span>
              <button
                onClick={() => handleCopy(agentPayload, "agent")}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
              >
                {copied === "agent" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "agent" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 bg-[#0b0b14] max-h-64 overflow-y-auto">
              <pre className="text-[11px] text-indigo-300 font-mono leading-relaxed">{agentPayload}</pre>
            </div>
          </div>

          {/* Make Call */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <span className="text-sm font-semibold text-white">Make a Call</span>
              <button
                onClick={() => handleCopy(callPayload, "call")}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
              >
                {copied === "call" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "call" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 bg-[#0b0b14] max-h-64 overflow-y-auto">
              <pre className="text-[11px] text-violet-300 font-mono leading-relaxed">{callPayload}</pre>
            </div>
          </div>
        </div>

        {/* Webhook Handler */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <span className="text-sm font-semibold text-white">Webhook Handler (Node.js)</span>
            <button
              onClick={() => handleCopy(webhookPayload, "webhook")}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              {copied === "webhook" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "webhook" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4 bg-[#0b0b14]">
            <pre className="text-[11px] text-amber-300 font-mono leading-relaxed">{webhookPayload}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
