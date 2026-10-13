import React, { useState, useRef, useEffect } from 'react';
import { TrainedModel } from '../utils/mlEngine';
import { ChatMessage, SUGGESTED_QUESTIONS, askAssistant } from '../utils/aiAssistant';
import { Send, Bot, User, Copy, Check, Sparkles, ShieldAlert, RotateCcw } from 'lucide-react';

// Simple clean formatter for assistant response
function formatMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, lIdx) => {
    // Header 3 or 4
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      const headerText = line.replace(/^#{3,4}\s+/, '');
      return (
        <h4 key={lIdx} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1">
          {renderInlineFormatting(headerText)}
        </h4>
      );
    }
    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <div key={lIdx} className="border-l-2 border-amber-500 pl-3 py-1 my-1.5 text-slate-600 dark:text-slate-300 italic bg-amber-500/5 rounded-r">
          {renderInlineFormatting(line.slice(2))}
        </div>
      );
    }
    // Bullet item
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const bulletText = line.trim().replace(/^[\*\-•]\s+/, '');
      return (
        <div key={lIdx} className="flex items-start gap-1.5 my-0.5">
          <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
          <span className="flex-1">{renderInlineFormatting(bulletText)}</span>
        </div>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={lIdx} className="h-1.5" />;
    }
    // Normal paragraph
    return (
      <p key={lIdx} className="my-0.5">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

function renderInlineFormatting(text: string) {
  // Split on bold **
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface AiAssistantTabProps {
  activeModel: TrainedModel | null;
  isDark?: boolean;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({ activeModel, isDark }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am the **Axiom Civil Engineering & Materials Specialist**.

I am grounded in:
1. **Concrete Technology Standards:** IS 456:2000 (Plain & Reinforced Concrete), IS 10262:2019 (Mix Proportioning Guidelines), and IS 516 (Methods of Tests for Strength).
2. **Hydration & Durability Principles:** Abrams’ water-cement ratio law, Gel-Space ratio, C-S-H formation kinetics, pozzolanic reactions of fly ash & slag, and polycarboxylate superplasticizers.
3. **Machine Learning Diagnostics:** Training/test evaluation metrics (R², MAE, RMSE), bias-variance tradeoffs, and feature importance rankings.
${
  activeModel
    ? `\n*Active Trained Model: **${activeModel.name}** (Test R²: ${activeModel.metrics.r2}, MAE: ${activeModel.metrics.mae} MPa)*`
    : `\n*Note: Train a model in the Model Lab to enable live mix optimization queries!*`
}

Ask any concrete design or data analytics query below, or click one of the preset prompts.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await askAssistant(query, activeModel, messages);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error responding: ${err.message || 'Unknown issue'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat session reset. I am ready for your civil engineering queries!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Civil Engineering Assistant</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Powered by server-side Gemini 3.8 Flash with full offline civil engineering domain fallback
          </p>
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* 2. Quick Prompt Chips */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="text-xs font-semibold text-slate-500 mb-2.5">Suggested Technical Queries:</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-left text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 transition-all leading-snug"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Messages Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="font-sans space-y-1">{formatMarkdown(msg.content)}</div>
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 font-mono ${isUser ? 'justify-end' : ''}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></span>
                <span className="font-mono text-[11px] ml-1">Analyzing civil engineering domain standards...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask e.g., 'What is the minimum cement for extreme exposure under IS 456?' or 'How much water for 40 MPa?'"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline ml-1.5">Send</span>
            </button>
          </form>

          <div className="mt-2 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>AI responses are decision-support guidance only; laboratory verification per IS 516 is legally mandatory.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
