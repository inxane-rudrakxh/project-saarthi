import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '@/lib/DataContext';
import { generateMinisterialBrief } from '@/lib/assistantEngine';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Printer, Loader2, FileText, CheckCircle2 } from 'lucide-react';

export default function MinisterialBrief() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loading: dataLoading } = useData();
  
  const [briefText, setBriefText] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id],
  );

  useEffect(() => {
    if (!project || briefText || generating || error) return;
    
    async function fetchBrief() {
      setGenerating(true);
      try {
        const text = await generateMinisterialBrief(project!);
        setBriefText(text);
      } catch (err: any) {
        setError(err.message || 'Failed to generate briefing.');
      } finally {
        setGenerating(false);
      }
    }
    
    fetchBrief();
  }, [project, briefText, generating, error]);

  if (dataLoading || (generating && !briefText)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#0f4c5c] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Generating Official Briefing...</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">
          The AI is currently analyzing risk factors, cost overruns, and schedule variances to draft a highly formal executive summary for the Ministry.
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <div className="p-12 text-center border border-gray-200 rounded-lg bg-white">
          <p className="text-sm font-bold text-gray-500">Project not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full print:p-0 print:bg-white bg-gray-100 min-h-screen">
      {/* Controls - Hidden when printing */}
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-6 print:hidden gap-4">
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </button>
        
        <div className="flex gap-2">
          {briefText && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f4c5c] text-white text-sm font-medium rounded-md shadow-sm hover:bg-[#0c3e4b] transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Official Brief
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-bold">Error Generating Brief</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : (
        /* The "A4 Paper" Container */
        <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-lg rounded-sm print:shadow-none print:border-none print:m-0">
          
          {/* Official Letterhead */}
          <div className="border-b-4 border-[#0f4c5c] px-10 pt-12 pb-6 text-center relative">
            <div className="absolute left-10 top-12">
              <FileText className="w-12 h-12 text-gray-300" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-widest text-[#0f4c5c]">Government of India</h1>
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mt-1">Ministry of Statistics & Programme Implementation</h2>
            <div className="w-16 h-px bg-gray-300 mx-auto my-4" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confidential · AI Generated Executive Brief</p>
          </div>

          {/* Content Area */}
          <div className="px-10 py-12">
            <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject Project</p>
                <h3 className="text-lg font-black text-gray-900">{project.name}</h3>
                <p className="text-sm font-semibold text-gray-600 mt-1">ID: {project.id} · Sector: {project.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date Generated</p>
                <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Generated Markdown */}
            <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-[#0f4c5c] prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-strong:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
              {briefText ? (
                <ReactMarkdown>{briefText}</ReactMarkdown>
              ) : null}
            </div>
            
            {/* Footer Signature Area */}
            <div className="mt-16 pt-12 border-t border-gray-200 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-1.5 text-green-600 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Verified</span>
                </div>
                <p className="text-xs text-gray-500 max-w-xs">
                  This brief was generated by the ProjectSaarthi AI Monitoring Engine based on live PAIMANA/CUF data records.
                </p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-gray-400 h-10 mb-2" />
                <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Authorized By</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
