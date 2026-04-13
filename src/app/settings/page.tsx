"use client";

import { useState } from "react";
import { Key, Webhook, Bot, Save, Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";

export default function Settings() {
  const { bolnaConfig, setBolnaConfig, isConfigured } = useApp();
  const [form, setForm] = useState({
    apiKey: bolnaConfig.apiKey || "",
    agentId: bolnaConfig.agentId || "",
    webhookUrl: bolnaConfig.webhookUrl || "",
  });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBolnaConfig(form);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`https://api.bolna.ai/v2/agent/${form.agentId}`, {
        headers: { Authorization: `Bearer ${form.apiKey}` },
      });
      setTestResult(res.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Settings" subtitle="Configure Bolna API integration and preferences" />

      <div className="pt-16 p-6 space-y-6 max-w-3xl">
        {/* Status Banner */}
        <div className={cn(
          "flex items-center gap-3 rounded-2xl p-4 border",
          isConfigured
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-amber-500/10 border-amber-500/20"
        )}>
          {isConfigured
            ? <CheckCircle className="w-5 h-5 text-emerald-400" />
            : <AlertCircle className="w-5 h-5 text-amber-400" />}
          <div>
            <p className={cn("text-sm font-semibold", isConfigured ? "text-emerald-300" : "text-amber-300")}>
              {isConfigured ? "Bolna API Connected" : "Running in Demo Mode"}
            </p>
            <p className={cn("text-xs mt-0.5", isConfigured ? "text-emerald-400/60" : "text-amber-400/60")}>
              {isConfigured
                ? "Real AI screening calls are enabled. Candidates will receive actual phone calls."
                : "Enter your Bolna API credentials below to enable real AI screening calls."}
            </p>
          </div>
        </div>

        {/* API Configuration */}
        <form onSubmit={handleSave} className="bg-[#13131f] border border-white/5 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Bolna API Configuration</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              API Key <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="bolna_sk_..."
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-4 pr-12 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1.5">
              Get your API key from{" "}
              <a href="https://platform.bolna.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                platform.bolna.ai → Developers
              </a>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Agent ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.agentId}
              onChange={(e) => setForm({ ...form, agentId: e.target.value })}
              placeholder="123e4567-e89b-12d3-a456-426655440000"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono"
            />
            <p className="text-xs text-white/30 mt-1.5">Create an agent on the Bolna platform and paste its UUID here</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5" />
              Webhook URL (optional)
            </label>
            <input
              type="url"
              value={form.webhookUrl}
              onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
              placeholder="https://your-backend.com/api/webhook/bolna"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
            />
            <p className="text-xs text-white/30 mt-1.5">Bolna will POST call results to this URL when screening is complete</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            {form.apiKey && form.agentId && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium px-5 py-2.5 rounded-xl border border-white/10 transition-all"
              >
                {testing ? <span className="animate-spin">⟳</span> : <Zap className="w-4 h-4" />}
                {testing ? "Testing..." : "Test Connection"}
              </button>
            )}
            {testResult && (
              <div className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                testResult === "success" ? "text-emerald-400" : "text-rose-400"
              )}>
                {testResult === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult === "success" ? "Connected!" : "Connection failed"}
              </div>
            )}
          </div>
        </form>

        {/* Quick Setup Guide */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" />
            Quick Setup Guide
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: 1,
                title: "Create a Bolna Account",
                desc: "Sign up at platform.bolna.ai and complete your profile",
                link: "https://platform.bolna.ai/login",
                linkText: "Go to Bolna →"
              },
              {
                step: 2,
                title: "Generate API Key",
                desc: 'Navigate to Developers tab → Click "Generate a new API Key" → Save it securely',
                link: "https://www.bolna.ai/docs/api-reference/introduction",
                linkText: "View API Docs →"
              },
              {
                step: 3,
                title: "Create the Aria Agent",
                desc: "Create a new voice agent using the system prompt from the AI Agent page. Configure ElevenLabs TTS for natural voice.",
                link: null,
                linkText: null
              },
              {
                step: 4,
                title: "Configure Webhook",
                desc: "Set your webhook URL to receive real-time call results and candidate scores",
                link: "https://www.bolna.ai/docs/polling-call-status-webhooks",
                linkText: "Webhook Docs →"
              },
              {
                step: 5,
                title: "Enter Credentials Above",
                desc: "Paste your API Key and Agent ID above and save. You're ready to screen candidates!",
                link: null,
                linkText: null
              },
            ].map((s) => (
              <li key={s.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{s.desc}</p>
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
                    >
                      {s.linkText}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* About */}
        <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2">📋 About this Assignment</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            <strong className="text-white/70">Use Case:</strong> AI-powered candidate recruitment screening for enterprise HR teams.<br />
            <strong className="text-white/70">Problem:</strong> Manual phone screening is slow (3+ hrs/candidate), expensive (₹450/call), and inconsistent.<br />
            <strong className="text-white/70">Solution:</strong> Bolna Voice AI agent "Aria" conducts 5-min structured calls, extracts scores, and outputs actionable hiring recommendations.<br />
            <strong className="text-white/70">Outcome Metric:</strong> 37× faster screening, 97% cost reduction, 95% call completion rate.
          </p>
        </div>
      </div>
    </div>
  );
}
