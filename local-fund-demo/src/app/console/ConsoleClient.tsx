"use client";

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Cpu,
  FileText,
  Gauge,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Send,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GraphAnimation from '../GraphAnimation';

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type RunState = 'idle' | 'running' | 'paused' | 'done';
type TabKey = 'console' | 'source';
export type SupportedLang = 'ko' | 'en' | 'zh';
export type PipelineId = 1 | 2 | 3 | 4 | 5;

export interface SourceSummary {
  keyClaimTitle: string;
  keyClaim: string;
  cards: Array<{
    title: string;
    value: string;
    note: string;
  }>;
  examplesTitle: string;
  examples: string[];
}

export interface ReportCard {
  title: string;
  value: string;
  note: string;
  accent: 'emerald' | 'blue' | 'amber';
}

export interface LiveDemoConfig {
  lang: SupportedLang;
  label: string;
  headline: string;
  subline: string;
  pdfFile: string;
  presets: string[];
  logs: string[];
  evidenceTitle: string;
  evidenceBullets: string[];
  pipeline: Array<{ id: PipelineId; title: string; desc: string }>;
  sourceSummary: SourceSummary;
  reportCards: ReportCard[];
}

interface PipelineStep {
  id: PipelineId;
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
}

interface LogLine {
  id: string;
  ts: string;
  text: string;
}

const STEP_ICONS: Record<PipelineId, PipelineStep['icon']> = {
  1: BookOpen,
  2: Cpu,
  3: Activity,
  4: FileText,
  5: Terminal,
};

const DEFAULT_CONFIG: LiveDemoConfig = {
  lang: 'en',
  label: 'English',
  headline: 'Live demo console',
  subline: 'Grounded by a local PDF in /public',
  pdfFile: 'Requirements for classification and grading of civil aviation data.pdf',
  presets: [
    'Summarize the document into a simulation-ready ontology and grading tiers.',
    'Extract key entities, labels, and relationships that can be used for agent roles.',
    'What would a “high risk” vs “low risk” classification look like, based on the text?',
    'List the evidence lines that justify each extracted requirement.',
  ],
  logs: [
    '[System] Booting engine: LiveDemo-Simulator-V0.1',
    "[Graph Build] Loading source: 'Requirements for classification and grading of civil aviation data.pdf'",
    '[Graph Build] Extracting entities: datasets, attributes, access levels, compliance',
    '[Graph Build] Building grounded graph: terms, definitions, requirements',
    '[Env Setup] Preparing reviewer personas (compliance / ops / data owner)',
    '[Simulation] Running classification + grading reasoning',
    '[Report] Compiling tier summary and evidence map',
    '[System] Entering Deep Interaction mode',
  ],
  evidenceTitle: 'Evidence extraction',
  evidenceBullets: [
    'Requirements are extracted as verifiable claims',
    'Each claim is linked back to the PDF',
    'The report is a static demo output (no LLM)',
  ],
  pipeline: [
    { id: 1, title: 'Graph Build', desc: 'Extract facts and build a grounded knowledge graph' },
    { id: 2, title: 'Env Setup', desc: 'Inject personas and evaluation roles into the world' },
    { id: 3, title: 'Start Simulation', desc: 'Run the reasoning process with step-by-step logs' },
    { id: 4, title: 'Report Generation', desc: 'Compile a readable brief with evidence pointers' },
    { id: 5, title: 'Deep Interaction', desc: 'Ask follow-ups to a static ReportAgent (demo)' },
  ],
  sourceSummary: {
    keyClaimTitle: 'Key claim',
    keyClaim: 'The document defines requirements and tiers for classifying and grading civil aviation data.',
    cards: [
      { title: 'Focus', value: 'Classification', note: 'Definitions and tiering logic' },
      { title: 'Output', value: 'Grades', note: 'Evidence-backed summary' },
    ],
    examplesTitle: 'Example extractions',
    examples: [
      'Data category definitions',
      'Grading criteria and thresholds',
      'Access and compliance constraints',
    ],
  },
  reportCards: [
    { title: 'Report output', value: 'Tier summary', note: 'Evidence-backed', accent: 'emerald' },
    { title: 'Reasoning', value: 'Step-by-step', note: 'Deterministic demo', accent: 'blue' },
    { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
  ],
};

function nowTs() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function makeLogLine(text: string): LogLine {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: nowTs(),
    text,
  };
}

function stepForLogIndex(index: number, total: number): Step {
  if (total <= 0) return 0;
  const t = (index + 1) / total;
  if (t <= 0.15) return 1;
  if (t <= 0.35) return 2;
  if (t <= 0.65) return 3;
  if (t <= 0.85) return 4;
  return 5;
}

function clampSpeed(value: number) {
  if (Number.isNaN(value)) return 1;
  if (value < 0.5) return 0.5;
  if (value > 2) return 2;
  return value;
}

export default function ConsoleClient({ config = DEFAULT_CONFIG }: { config?: LiveDemoConfig }) {
  const [tab, setTab] = useState<TabKey>('console');
  const [runState, setRunState] = useState<RunState>('idle');
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [prompt, setPrompt] = useState(config.presets[0] ?? '');
  const [speed, setSpeed] = useState<number>(1);
  const [cursor, setCursor] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const progress = useMemo(() => {
    if (config.logs.length === 0) return 0;
    return Math.min(100, Math.round((cursor / config.logs.length) * 100));
  }, [config.logs.length, cursor]);

  const pdfUrl = useMemo(() => encodeURI(`/${config.pdfFile}`), [config.pdfFile]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (runState !== 'running') return;
    if (cursor >= config.logs.length) return;

    const nextText = config.logs[cursor];
    const nextStep = stepForLogIndex(cursor, config.logs.length);
    const tickMs = Math.round(800 / clampSpeed(speed));

    const timer = window.setTimeout(() => {
      setLogs(prev => [...prev, makeLogLine(nextText)]);
      setCurrentStep(nextStep);
      const nextCursor = cursor + 1;
      setCursor(nextCursor);
      if (nextCursor >= config.logs.length) setRunState('done');
    }, tickMs);

    return () => window.clearTimeout(timer);
  }, [config.logs, cursor, runState, speed]);

  const handleStart = () => {
    if (!prompt.trim()) return;
    setTab('console');
    setLogs([]);
    setCursor(0);
    setCurrentStep(0);
    setRunState('running');
  };

  const handlePauseToggle = () => {
    if (runState === 'running') setRunState('paused');
    if (runState === 'paused') setRunState('running');
  };

  const handleReset = () => {
    setRunState('idle');
    setCurrentStep(0);
    setCursor(0);
    setLogs([]);
    setPrompt(config.presets[0] ?? '');
  };

  const isRunning = runState === 'running';
  const isPaused = runState === 'paused';

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay" />
      </div>

      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
            <Activity className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              {config.headline} 
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-slate-400 tracking-wider uppercase">
                {config.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              {config.subline}
              <span className="text-slate-700">&middot;</span>
              <Link className="text-emerald-400/80 hover:text-emerald-400 flex items-center gap-1 transition-colors" href={pdfUrl} target="_blank">
                <FileText className="w-3 h-3" /> source PDF
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', isRunning ? 'bg-amber-400' : 'bg-emerald-400')} />
              <span className={cn('relative inline-flex rounded-full h-2 w-2', isRunning ? 'bg-amber-500' : 'bg-emerald-500')} />
            </span>
            <span className={isRunning ? 'text-amber-400' : 'text-emerald-400'}>
              {isRunning ? 'System Running' : runState === 'done' ? 'Run Completed' : 'System Ready'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-500 px-3 py-1.5 rounded-full border border-white/5">
            <Cpu className="w-3.5 h-3.5" /> Engine: LocalFund-V0.1
          </div>
        </div>
      </header>

      <div className="border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-md px-6 py-3 sticky top-[73px] z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('console')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                tab === 'console'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
              )}
            >
              Console View
            </button>
            <button
              type="button"
              onClick={() => setTab('source')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                tab === 'source'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
              )}
            >
              Source PDF
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                Speed
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={e => setSpeed(clampSpeed(Number(e.target.value)))}
                className="w-24 accent-emerald-500 cursor-pointer"
                disabled={runState === 'idle'}
              />
              <div className="w-10 text-right text-xs font-mono font-bold text-slate-300">{speed.toFixed(2)}x</div>
            </div>

            <div className="flex items-center gap-2">
              {runState === 'idle' ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  disabled={!prompt.trim()}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Initialize Run
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePauseToggle}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border',
                      isPaused
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-73px-58px)] relative z-10">
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col shrink-0 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-slate-200 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Input Parameters
              </h2>
              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">{progress}%</div>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isRunning}
              className="w-full bg-[#050505]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none h-28 disabled:opacity-50 transition-all placeholder:text-slate-600 relative z-10 shadow-inner"
              placeholder="What do you want to simulate?"
            />

            <div className="mt-4 flex flex-wrap gap-2 relative z-10">
              {config.presets.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPrompt(p)}
                  disabled={isRunning}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all text-left max-w-full truncate',
                    p === prompt
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                      : 'bg-[#050505]/50 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10 hover:bg-white/5',
                    isRunning && 'opacity-50 cursor-not-allowed',
                  )}
                  title={p}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-[#050505]/80 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step</div>
                <div className="mt-1 text-2xl font-black text-slate-200 font-mono">
                  <span className="text-emerald-400">{currentStep}</span><span className="text-slate-600">/5</span>
                </div>
              </div>
              <div className="bg-[#050505]/80 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center shadow-inner">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logs</div>
                <div className="mt-1 text-2xl font-black text-slate-200 font-mono">{logs.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-1 overflow-y-auto shadow-xl relative">
            <h2 className="text-slate-200 font-bold mb-8 text-sm uppercase tracking-wider">
              Simulation Pipeline
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/50 before:via-white/10 before:to-transparent">
              {config.pipeline.map(step => {
                const isPast = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = STEP_ICONS[step.id];
                return (
                  <div key={step.id} className="relative flex items-start gap-5 group">
                    <div
                      className={cn(
                        'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-700',
                        isPast
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] rotate-3'
                          : isCurrent
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110'
                            : 'bg-[#0a0a0a] border-white/10 text-slate-600',
                      )}
                    >
                      {isPast ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div
                        className={cn(
                          'font-bold text-sm tracking-wide transition-colors duration-500 flex items-center gap-2',
                          isPast ? 'text-emerald-300' : isCurrent ? 'text-blue-300' : 'text-slate-400',
                        )}
                      >
                        <span className="text-[10px] font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5 opacity-80">0{step.id}</span>
                        {step.title}
                      </div>
                      <p
                        className={cn(
                          'text-xs mt-2 leading-relaxed transition-colors duration-500',
                          isPast || isCurrent ? 'text-slate-300' : 'text-slate-600',
                        )}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-1/2 relative overflow-hidden shadow-xl">
            <div className="bg-[#050505]/50 border-b border-white/5 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Execution Logs
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500">{nowTs()}</div>
              </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] space-y-2 relative z-10 scroll-smooth">
              {logs.length === 0 && runState === 'idle' && (
                <div className="text-slate-500 italic flex items-center justify-center h-full">Waiting for simulation to initialize...</div>
              )}

              {logs.map((line, idx) => (
                <div key={line.id} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300" style={{ animationFillMode: 'both' }}>
                  <span className="text-slate-600 shrink-0 select-none">[{line.ts}]</span>
                  <span
                    className={cn(
                      'leading-relaxed break-words',
                      line.text.includes('[Report]') ? 'text-emerald-400 font-medium' : '',
                      line.text.includes('[Simulation]') ? 'text-blue-400 font-medium' : '',
                      line.text.includes('[Graph Build]') ? 'text-purple-400 font-medium' : '',
                      line.text.includes('[Env Setup]') ? 'text-cyan-400 font-medium' : '',
                      (!line.text.includes('[') || line.text.includes('[System]')) ? 'text-slate-300' : '',
                    )}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex-1 flex flex-col relative overflow-hidden shadow-xl">
            {tab === 'source' ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-5">
                <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-white/5 p-6 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-200 font-bold flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="truncate max-w-[200px]">{config.pdfFile}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-4 text-sm text-slate-400 leading-relaxed">
                    <div className="bg-[#050505]/50 border border-white/5 rounded-xl p-4 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{config.sourceSummary.keyClaimTitle}</div>
                      <div className="mt-2 text-slate-200 font-medium leading-snug">
                        {config.sourceSummary.keyClaim}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {config.sourceSummary.cards.map(card => (
                        <div key={card.title} className="bg-[#050505]/50 border border-white/5 rounded-xl p-4 shadow-inner flex flex-col justify-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.title}</div>
                          <div className="mt-1 text-slate-200 font-bold">{card.value}</div>
                          <div className="text-[10px] text-slate-500 mt-1 leading-tight">{card.note}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#050505]/50 border border-white/5 rounded-xl p-4 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{config.sourceSummary.examplesTitle}</div>
                      <ul className="mt-2 space-y-1.5 text-slate-300 text-xs">
                        {config.sourceSummary.examples.map(item => (
                          <li key={item} className="flex gap-2"><span className="text-emerald-500/50">&bull;</span> {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-[#050505] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-70 mix-blend-screen pointer-events-none">
                    <GraphAnimation />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
                  <div className="relative z-10 h-full p-8 flex flex-col items-center justify-center text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-slate-100 text-xl font-bold tracking-tight">Grounding View</div>
                    <div className="mt-3 text-slate-400 text-sm max-w-md leading-relaxed">
                      This tab keeps the source PDF one click away while the console runs. Use it in demos to justify every step with evidence.
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-xs font-medium text-amber-500/80 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4" />
                      Static demo only. Deep interaction is not connected to an LLM.
                    </div>
                  </div>
                </div>
              </div>
            ) : currentStep < 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#050505]/50 relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
                <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 mb-6 shadow-2xl">
                    <Cpu className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium">Run the pipeline to see the world build and the report appear.</p>
                </div>
              </div>
            ) : currentStep < 4 ? (
              <div className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
                <div className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none">
                  <GraphAnimation />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-[#050505]/40 to-[#050505] pointer-events-none" />

                <div className="relative z-10 flex-1 flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      World build status
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 font-bold shadow-sm',
                        currentStep === 1 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10',
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      View source PDF
                    </button>
                  </div>

                  {currentStep === 1 && (
                    <div className="mt-6 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl max-w-3xl animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-emerald-400 font-bold flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {config.evidenceTitle}
                        </div>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                        >
                          Open in new tab <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="bg-[#050505] rounded-xl p-4 text-xs text-slate-300 border border-white/5 h-40 overflow-y-auto shadow-inner">
                        <div className="text-slate-100 font-bold mb-3">{config.evidenceTitle}</div>
                        <div className="space-y-2">
                          {config.evidenceBullets.map(line => (
                            <div key={line} className="flex gap-2"><span className="text-emerald-500/50">&bull;</span> {line}</div>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-emerald-400 font-mono">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Graph build running…
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto self-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl animate-fade-in-up">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-sm font-medium text-slate-200">
                      {currentStep === 1 && 'Building knowledge graph from source…'}
                      {currentStep === 2 && 'Injecting regional personas…'}
                      {currentStep === 3 && 'Running parallel simulation…'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-1000">
                <div className="border-b border-emerald-500/20 p-5 bg-emerald-500/5 flex items-center justify-between">
                  <div className="text-emerald-400 font-bold flex items-center gap-2 text-lg tracking-tight">
                    <FileText className="w-5 h-5" />
                    Report generated
                  </div>
                  <div className="text-xs font-medium text-emerald-500/70 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Source: <a className="hover:text-emerald-300 transition-colors" href={pdfUrl} target="_blank" rel="noopener noreferrer">{config.pdfFile}</a>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {config.reportCards.map(card => (
                      <div key={card.title} className="border border-white/5 bg-[#050505]/50 p-5 rounded-2xl shadow-inner relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity", 
                          card.accent === 'emerald' ? 'bg-emerald-500' : card.accent === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
                        )} />
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">{card.title}</div>
                        <div
                          className={cn(
                            'text-2xl md:text-3xl font-black tracking-tight',
                            card.accent === 'emerald' && 'text-emerald-400',
                            card.accent === 'blue' && 'text-blue-400',
                            card.accent === 'amber' && 'text-amber-400',
                          )}
                        >
                          {card.value}
                        </div>
                        <div className="text-xs text-slate-400 mt-2 font-medium">{card.note}</div>
                      </div>
                    ))}
                  </div>

                  {currentStep === 5 && (
                    <div className="border-t border-white/10 pt-8 mt-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        Deep Interaction Session
                      </h4>

                      <div className="space-y-6 mb-6">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                            <Send className="w-4 h-4 text-blue-400 ml-[-2px]" />
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-sm">
                            Why did housing and childcare programs score higher than facility construction?
                          </div>
                        </div>

                        <div className="flex gap-4 flex-row-reverse">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                            <Activity className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl rounded-tr-none text-sm text-emerald-100/90 max-w-[85%] leading-relaxed shadow-sm">
                            <span className="font-bold text-emerald-400 block mb-1.5 text-xs tracking-wider uppercase">ReportAgent</span>
                            These programs directly change settlement incentives and daily life friction. That is observable as retention and inflow. Facilities without a program layer do not guarantee population outcomes under the 2026 criteria.
                          </div>
                        </div>
                      </div>

                      <div className="relative mt-8">
                        <input
                          type="text"
                          disabled
                          placeholder="Ask ReportAgent anything about the simulation..."
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-5 pr-12 py-4 text-sm text-slate-300 focus:outline-none disabled:opacity-50 shadow-inner"
                        />
                        <button disabled className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {pdfOpen && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl h-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="bg-[#050505]/80 border-b border-white/10 px-5 py-4 flex items-center justify-between backdrop-blur-xl">
              <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                {config.pdfFile}
              </div>
              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/5 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Close PDF
              </button>
            </div>
            <iframe
              title={config.pdfFile}
              src={pdfUrl}
              className="w-full flex-1 bg-white"
            />
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 w-full bg-amber-500/10 border-t border-amber-500/20 py-2.5 px-6 flex items-center justify-center gap-2 z-50 backdrop-blur-md">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <p className="text-[11px] uppercase tracking-widest text-amber-400/90 font-bold">
          This page is a static demo only. Deep interaction with Agents is not connected to an LLM.
        </p>
      </footer>
    </div>
  );
}
