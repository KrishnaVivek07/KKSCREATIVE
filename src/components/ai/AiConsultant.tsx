import React, { useState, useEffect } from 'react';
import type { Project, ComponentItem } from '../../types';
import {
  Bot,
  Send,
  Sparkles,
  Cpu,
  Code2,
  HelpCircle,
  Calculator,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface AiConsultantProps {
  projects: Project[];
  catalogComponents: ComponentItem[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function AiConsultant({ projects, catalogComponents }: AiConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your KKS Creative Hub Engineering Copilot powered by Google Gemini.

I can help you with:
• **Firmware & Code Generation**: ESP32, Arduino C++, FreeRTOS, Raspberry Pi Python, STM32 HAL.
• **Circuit Troubleshooting**: I2C bus address collisions, noisy ADC readings, power supply ripple, level shifting.
• **Hardware Calculations**: Ohm's Law, LED series resistors, battery runtime, motor driver heat dissipation.
• **Project Roadmapping**: Architecture reviews, component compatibility, and testing procedures.

How can I assist your workshop bench today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || prompt).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          projectContext: selectedProject
            ? {
                name: selectedProject.name,
                projectType: selectedProject.projectType,
                description: selectedProject.description,
                status: selectedProject.status,
              }
            : undefined,
          conversationHistory: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || 'No response returned from Gemini API.';

      const botMessage: Message = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Gemini error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Error contacting Gemini AI: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="ai-consultant-container" className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Gemini Engineering Assistant
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hardware calculations, firmware code synthesis, and circuit diagnosis
            </p>
          </div>
        </div>

        {/* Project Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Attach Project Context:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="">-- None (General Engineering) --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Engineering Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          'Write ESP32 Arduino code to read analog sensor with moving average filter',
          'Calculate voltage divider resistor values to scale 12V input down to 3.3V',
          'How do I debounce noisy tactile pushbuttons in software vs hardware RC?',
          'Generate FreeRTOS two-task telemetry boilerplate for ESP32',
          'Best practices for protecting microcontrollers against inductive motor kickback',
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => handleSend(item)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[560px] overflow-hidden">
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 whitespace-pre-wrap rounded-bl-xs border border-slate-200/50 dark:border-slate-700/50 font-sans'
                }`}
              >
                {m.text}

                {m.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(m.text, m.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                    title="Copy to clipboard"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 p-2">
              <Bot className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Synthesizing engineering response with Gemini 3.8 Flash...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex gap-2"
        >
          <input
            id="ai-consultant-input"
            type="text"
            placeholder="Type your engineering, circuit, pinout, or firmware question..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
