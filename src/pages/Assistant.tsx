import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, ArrowRight, User } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { answerQuery, SUGGESTED_QUESTIONS, type AssistantAnswer } from '@/lib/assistantEngine';
import type { Citation } from '@/lib/assistantEngine';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Assistant() {
  const { projects, alerts, loading, chatMessages, setChatMessages } = useData();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSend = async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || loading || projects.length === 0 || isTyping) return;

    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: q, citations: [] },
    ]);
    setInput('');
    setIsTyping(true);

    const answer = await answerQuery(q, projects, alerts);

    setChatMessages((prev) => [
      ...prev,
      { role: 'assistant', text: answer.text, citations: answer.citations },
    ]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-200/80">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#0f4c5c] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Saarthi Assistant</h1>
          </div>
          <p className="text-sm text-gray-500 ml-11">
            Ask questions about project risks, cost overruns, delays, and sector performance
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#0f4c5c]/5 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-[#0f4c5c]" strokeWidth={1.8} />
              </div>
              <h2 className="text-base font-semibold text-gray-700 mb-1">Ask me anything about your projects</h2>
              <p className="text-sm text-gray-400 mb-6">I ground every answer in real project data</p>

              <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-[#0f4c5c] hover:bg-[#0f4c5c]/5 transition-all text-sm text-gray-600 hover:text-[#0f4c5c] flex items-center justify-between group"
                  >
                    {q}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0f4c5c] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gray-200'
                    : 'bg-[#0f4c5c]'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-gray-500" strokeWidth={2} />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                )}
              </div>

              {/* Message bubble */}
              <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`inline-block max-w-full rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#0f4c5c] text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-a:text-[#0f4c5c]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100/50 space-y-1.5">
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                        Sources
                      </p>
                      {msg.citations.map((cit, j) => (
                        <Link
                          key={j}
                          to={`/projects/${cit.projectId}`}
                          className={`flex items-center gap-1.5 text-xs ${msg.role === 'user' ? 'text-white/80 hover:text-white' : 'text-[#0f4c5c] hover:underline'}`}
                        >
                          <ArrowRight className="w-3 h-3" />
                          {cit.projectName}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0f4c5c] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white animate-pulse" strokeWidth={2} />
              </div>
              <div className="flex-1 flex justify-start">
                <div className="inline-block rounded-xl px-4 py-3 bg-white border border-gray-200">
                  <div className="flex space-x-1.5 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-gray-200/80 bg-white">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about project risks, overruns, alerts..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
