import Link from 'next/link';
import { ArrowRight, FileText, Terminal } from 'lucide-react';

const DEMOS = [
  {
    lang: 'ko',
    label: '한국어',
    route: '/live-demo/ko',
    pdfFile: '2026년 지방소멸대응기금 1조, 시설이 아닌 ‘사람 중심’으로 쓰입니다.pdf',
    summary: '지방소멸대응기금 평가/배분 파이프라인 데모',
  },
  {
    lang: 'en',
    label: 'English',
    route: '/live-demo/en',
    pdfFile: 'Requirements for classification and grading of civil aviation data.pdf',
    summary: 'Classification & grading requirements extraction demo',
  },
  {
    lang: 'zh',
    label: '中文',
    route: '/live-demo/zh',
    pdfFile: '召开第一次债权人会议公告.pdf',
    summary: 'Meeting notice extraction + stakeholder questions demo',
  },
] as const;

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#121214]/80 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">Live Grounded Pipeline Demos</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Show the process,
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              not just the result.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Each live demo uses a different language PDF (KO/EN/ZH) to show the same narrative: 
            <span className="text-slate-300 font-semibold"> extract evidence → build a graph → run a simulation → generate a report.</span>
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          {DEMOS.map((demo, idx) => (
            <div 
              key={demo.lang} 
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.04] hover:border-emerald-500/30 hover:shadow-[0_20px_40px_-15px_rgba(52,211,153,0.15)] overflow-hidden"
              style={{ animationDelay: `${400 + idx * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500 group-hover:bg-emerald-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 group-hover:border-emerald-500/30 group-hover:text-emerald-300 transition-colors">
                    {demo.label}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3 leading-snug group-hover:text-white transition-colors">{demo.summary}</h3>
                <div className="flex items-start gap-2 text-sm text-slate-400">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                  <span className="line-clamp-2 leading-relaxed">{demo.pdfFile}</span>
                </div>
              </div>

              <div className="relative z-10 mt-8 flex flex-col gap-3">
                <Link
                  href={demo.route}
                  className="relative inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-white text-black font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 group-hover/btn:text-white transition-colors">Open console</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover/btn:text-white transition-colors group-hover/btn:translate-x-1" />
                </Link>
                <Link
                  href={encodeURI(`/${demo.pdfFile}`)}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-semibold transition-all hover:text-white"
                >
                  View PDF <FileText className="w-4 h-4 opacity-70" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          {[
            { tag: 'Purpose', title: 'Live narrative demo', desc: 'Make the pipeline understandable in 30 seconds for stakeholders.' },
            { tag: 'Grounding', title: 'Evidence-first', desc: 'PDF is always one click away during the run for verifiable claims.' },
            { tag: 'Mode', title: 'Static only', desc: 'No external APIs. The “agent” responses are preset for demo reliability.' }
          ].map((feat, i) => (
            <div key={i} className="group relative p-6 rounded-3xl border border-white/5 bg-[#121214]/50 hover:bg-[#16161a] transition-colors">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{feat.tag}</div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-emerald-400 transition-colors">{feat.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
