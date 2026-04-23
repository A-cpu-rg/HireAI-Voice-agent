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
      candidate_name: 'Abhishek Meena',
      role: 'Full-Stack Engineer',
      experience: '4 years'
    }
  })
});

const { call_id } = await response.json();
console.log('Call initiated:', call_id);`;

 return (
  <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">
    <Header title="AI Agent" subtitle="Bolna Voice AI agent configuration and setup guide" />

    <div className="pt-16 p-6 space-y-6">

      {/* OVERVIEW */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-4 items-start">
        <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center text-white flex-shrink-0">
          <Mic2 className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-1">
            Aria — AI Recruitment Screener
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Conduct structured AI screening calls and extract candidate insights.
          </p>

          <div className="flex gap-3 flex-wrap">
            <a
              href="https://platform.bolna.ai"
              target="_blank"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Open Platform
            </a>

            <a
              href="https://www.bolna.ai/docs/introduction"
              target="_blank"
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
            >
              Docs
            </a>
          </div>
        </div>

        <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full">
          Active
        </span>
      </div>

      {/* ARCHITECTURE */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4">System Flow</h3>

        <div className="flex gap-3 overflow-x-auto">
          {[
            "Web App",
            "Bolna API",
            "Voice AI",
            "Candidate",
            "Webhook",
            "Backend",
            "Dashboard",
          ].map((step, i) => (
            <div
              key={i}
              className="px-3 py-2 bg-gray-100 rounded-lg text-xs whitespace-nowrap"
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* PROMPT */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <span className="text-sm font-semibold">Agent Prompt</span>

          <button
            onClick={() => handleCopy(BOLNA_AGENT_PROMPT, "prompt")}
            className="text-xs text-gray-500"
          >
            {copied === "prompt" ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="p-5 bg-gray-50">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {BOLNA_AGENT_PROMPT}
          </pre>
        </div>
      </div>

      {/* CODE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b">
            <span className="text-sm font-semibold">Create Agent</span>

            <button
              onClick={() => handleCopy(agentPayload, "agent")}
              className="text-xs text-gray-500"
            >
              {copied === "agent" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700">{agentPayload}</pre>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b">
            <span className="text-sm font-semibold">Make Call</span>

            <button
              onClick={() => handleCopy(callPayload, "call")}
              className="text-xs text-gray-500"
            >
              {copied === "call" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-700">{callPayload}</pre>
          </div>
        </div>
      </div>

      {/* WEBHOOK */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <span className="text-sm font-semibold">Webhook Handler</span>

          <button
            onClick={() => handleCopy(webhookPayload, "webhook")}
            className="text-xs text-gray-500"
          >
            {copied === "webhook" ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="p-4 bg-gray-50">
          <pre className="text-xs text-gray-700">{webhookPayload}</pre>
        </div>
      </div>

    </div>
  </div>
);
}
