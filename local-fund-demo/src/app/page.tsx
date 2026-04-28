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
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-mono">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="text-sm text-slate-400">
            Live demos · grounded by PDFs in <span className="text-slate-200">/public</span>
          </div>
        </div>

        <h1 className="mt-8 text-4xl md:text-5xl font-black tracking-tight text-slate-100">
          Show the process,
          <span className="text-emerald-400"> not just the result</span>.
        </h1>
        <p className="mt-5 text-slate-400 leading-relaxed max-w-2xl">
          Each live demo uses a different language PDF (KO/EN/ZH) to show the same “grounded pipeline” story: extract evidence → build a graph → run a simulation → generate a report.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMOS.map(demo => (
            <div key={demo.lang} className="rounded-2xl border border-slate-800 bg-[#121214] p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Live demo</div>
                <div className="text-xs px-2 py-1 rounded-lg border border-slate-800 bg-[#0a0a0a] text-slate-300">
                  {demo.label}
                </div>
              </div>
              <div className="mt-3 text-lg font-bold text-slate-100">{demo.summary}</div>
              <div className="mt-2 text-sm text-slate-400 break-words">{demo.pdfFile}</div>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href={demo.route}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                >
                  Open console <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={encodeURI(`/${demo.pdfFile}`)}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-200 font-bold transition-colors"
                >
                  View PDF <FileText className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#121214] p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Purpose</div>
            <div className="mt-2 font-semibold">Live narrative demo</div>
            <div className="mt-2 text-sm text-slate-400 leading-relaxed">
              Make the pipeline understandable in 30 seconds for stakeholders.
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#121214] p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Grounding</div>
            <div className="mt-2 font-semibold">Evidence-first</div>
            <div className="mt-2 text-sm text-slate-400 leading-relaxed">
              PDF is always one click away during the run.
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#121214] p-5">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Mode</div>
            <div className="mt-2 font-semibold">Static only</div>
            <div className="mt-2 text-sm text-slate-400 leading-relaxed">
              No external APIs. The “agent” responses are preset for demo reliability.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
