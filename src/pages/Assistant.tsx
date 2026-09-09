import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, ArrowRight, User } from 'lucide-react';
import { useData } from '@/lib/DataContext';
import { answerQuery, SUGGESTED_QUESTIONS } from '@/lib/assistantEngine';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactECharts from 'echarts-for-react';

export default function Assistant() {
  const { projects, alerts, loading, chatMessages, setChatMessages } = useData();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const processedQuery = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !loading && projects.length > 0 && !isTyping) {
      if (processedQuery.current !== q) {
        processedQuery.current = q;
        setSearchParams({});
        handleSend(q);
      }
    }
  }, [searchParams, loading, projects, isTyping, setSearchParams]);

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
      <div className="px-8 pt-8 pb-4 border-b border-[#dde3ef]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#1B2B5E] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#F5A623]" strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold text-[#0D1B3E]">Saarthi Assistant</h1>
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
              <div className="w-14 h-14 rounded-2xl bg-[#1B2B5E]/8 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-[#1B2B5E]" strokeWidth={1.8} />
              </div>
              <h2 className="text-base font-semibold text-gray-700 mb-1">Ask me anything about your projects</h2>
              <p className="text-sm text-gray-400 mb-6">I ground every answer in real project data</p>

              <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left px-4 py-3 rounded-lg border border-[#dde3ef] hover:border-[#F5A623] hover:bg-[#fef3d8] transition-all text-sm text-gray-600 hover:text-[#1B2B5E] flex items-center justify-between group"
                  >
                    {q}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#F5A623] transition-colors" />
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
                    ? 'bg-[#e8ecf7]'
                    : 'bg-[#1B2B5E]'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-[#1B2B5E]" strokeWidth={2} />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#F5A623]" strokeWidth={2} />
                )}
              </div>

              {/* Message bubble */}
              <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`inline-block max-w-full rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#1B2B5E] text-white'
                      : 'bg-white border border-[#dde3ef] text-gray-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#e8ecf7] prose-pre:text-gray-800 prose-a:text-[#1565C0]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code(props: any) {
                            const {children, className, node, ...rest} = props;
                            const match = /language-(\w+)/.exec(className || '');
                            const isJson = match && match[1] === 'json';

                            if (isJson) {
                              try {
                                const config = JSON.parse(String(children).replace(/\n$/, ''));
                                if (config.type && config.labels && config.datasets) {
                                  let option = {};
                                  if (config.type === 'bar') {
                                    option = {
                                      title: { text: config.title, textStyle: { fontSize: 13, color: '#0D1B3E' } },
                                      tooltip: { trigger: 'axis', axisPointer: { type: 'none' } },
                                      xAxis: { type: 'category', data: config.labels, axisLabel: { interval: 0, rotate: 30, fontSize: 10 } },
                                      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
                                      series: config.datasets.map((d: any, i: number) => ({
                                        name: d.label,
                                        type: 'bar',
                                        data: d.data,
                                        itemStyle: { color: i === 0 ? '#1B2B5E' : '#F5A623', borderRadius: [4, 4, 0, 0] }
                                      })),
                                      grid: { top: 40, right: 10, bottom: 40, left: 40 }
                                    };
                                  } else if (config.type === 'line') {
                                    option = {
                                      title: { text: config.title, textStyle: { fontSize: 13, color: '#0D1B3E' } },
                                      tooltip: { trigger: 'axis' },
                                      xAxis: { type: 'category', data: config.labels, axisLabel: { fontSize: 10 } },
                                      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
                                      series: config.datasets.map((d: any, i: number) => ({
                                        name: d.label,
                                        type: 'line',
                                        data: d.data,
                                        smooth: true,
                                        itemStyle: { color: i === 0 ? '#1B2B5E' : '#F5A623' }
                                      })),
                                      grid: { top: 40, right: 10, bottom: 30, left: 40 }
                                    };
                                  } else if (config.type === 'pie') {
                                    option = {
                                      title: { text: config.title, textStyle: { fontSize: 13, color: '#0D1B3E' } },
                                      tooltip: { trigger: 'item' },
                                      series: [
                                        {
                                          type: 'pie',
                                          radius: '60%',
                                          data: config.labels.map((l: string, i: number) => ({
                                            name: l,
                                            value: config.datasets[0].data[i]
                                          })),
                                          itemStyle: {
                                            borderRadius: 4,
                                            borderColor: '#fff',
                                            borderWidth: 2
                                          }
                                        }
                                      ]
                                    };
                                  }

                                  return (
                                    <div className="my-4 p-4 rounded-xl border border-[#dde3ef] bg-white shadow-sm overflow-hidden" style={{ minWidth: 300 }}>
                                      <ReactECharts option={option} style={{ height: 260, width: '100%' }} />
                                    </div>
                                  );
                                }
                              } catch (e) {
                                // Fallback to normal code block
                              }
                            }
                            return <code className={className} {...rest}>{children}</code>;
                          }
                        }}
                      >
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
                          className={`flex items-center gap-1.5 text-xs ${msg.role === 'user' ? 'text-white/80 hover:text-white' : 'text-[#1565C0] hover:underline'}`}
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
              <div className="w-8 h-8 rounded-lg bg-[#1B2B5E] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#F5A623] animate-pulse" strokeWidth={2} />
              </div>
              <div className="flex-1 flex justify-start">
                <div className="inline-block rounded-xl px-4 py-3 bg-white border border-[#dde3ef]">
                  <div className="flex space-x-1.5 items-center h-5">
                    <div className="w-1.5 h-1.5 bg-[#1B2B5E]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#1B2B5E]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#1B2B5E]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-8 py-4 border-t border-[#dde3ef] bg-white">
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
