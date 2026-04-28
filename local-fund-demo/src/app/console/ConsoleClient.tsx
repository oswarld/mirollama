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
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-mono selection:bg-emerald-500/30">
      <header className="border-b border-slate-800 bg-[#0f0f11] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded flex items-center justify-center border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-bold text-slate-100 tracking-tight">
              {config.headline} <span className="font-light text-slate-500">{config.label}</span>
            </div>
            <div className="text-xs text-slate-500">
              {config.subline} · <Link className="text-slate-400 hover:text-slate-200" href={pdfUrl} target="_blank">source PDF</Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', isRunning ? 'bg-amber-400' : 'bg-emerald-400')} />
              <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', isRunning ? 'bg-amber-500' : 'bg-emerald-500')} />
            </span>
            <span className={isRunning ? 'text-amber-400' : 'text-emerald-400'}>
              {isRunning ? 'System Running' : runState === 'done' ? 'Run Completed' : 'System Ready'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Engine: LocalFund-V0.1</span>
        </div>
      </header>

      <div className="border-b border-slate-800 bg-[#0c0c0e] px-6 py-3 sticky top-[73px] z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('console')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                tab === 'console'
                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700',
              )}
            >
              Console
            </button>
            <button
              type="button"
              onClick={() => setTab('source')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-2',
                tab === 'source'
                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700',
              )}
            >
              Source <span className="text-[10px] text-slate-500">PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 mr-2">
              <Gauge className="w-4 h-4" />
              Speed
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.25}
              value={speed}
              onChange={e => setSpeed(clampSpeed(Number(e.target.value)))}
              className="w-32 accent-emerald-500"
              disabled={runState === 'idle'}
            />
            <div className="w-10 text-right text-xs text-slate-400 tabular-nums">{speed.toFixed(2)}x</div>

            {runState === 'idle' ? (
              <button
                type="button"
                onClick={handleStart}
                className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2"
                disabled={!prompt.trim()}
              >
                <Play className="w-4 h-4 fill-current" />
                Start
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className={cn(
                    'ml-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2',
                    isPaused
                      ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-slate-600'
                      : 'bg-transparent border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100',
                  )}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-73px-58px)]">
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <div className="bg-[#121214] border border-slate-800 rounded-xl p-5 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-100 font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-blue-400" />
                Input Parameters
              </h2>
              <div className="text-xs text-slate-500 tabular-nums">{progress}%</div>
            </div>

            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isRunning}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none h-28 disabled:opacity-50"
              placeholder="What do you want to simulate?"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {config.presets.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPrompt(p)}
                  disabled={isRunning}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                    p === prompt
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700',
                    isRunning && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Step</div>
                <div className="mt-1 text-lg font-bold text-slate-100 tabular-nums">{currentStep}/5</div>
              </div>
              <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Logs</div>
                <div className="mt-1 text-lg font-bold text-slate-100 tabular-nums">{logs.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-slate-800 rounded-xl p-5 flex-1 overflow-y-auto">
            <h2 className="text-slate-100 font-semibold mb-6 text-sm uppercase tracking-wider">
              Simulation Pipeline
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              {config.pipeline.map(step => {
                const isPast = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = STEP_ICONS[step.id];
                return (
                  <div key={step.id} className="relative flex items-start gap-4">
                    <div
                      className={cn(
                        'relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 bg-[#121214]',
                        isPast
                          ? 'border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(5,150,105,0.3)]'
                          : isCurrent
                            ? 'border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                            : 'border-slate-800 text-slate-600',
                      )}
                    >
                      {isPast ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div
                        className={cn(
                          'font-bold text-sm tracking-wide transition-colors duration-300 flex items-center gap-2',
                          isPast || isCurrent ? 'text-slate-200' : 'text-slate-600',
                        )}
                      >
                        <span className="text-xs font-mono opacity-50">0{step.id}</span>
                        {step.title}
                      </div>
                      <p
                        className={cn(
                          'text-xs mt-1.5 leading-relaxed transition-colors duration-300',
                          isPast || isCurrent ? 'text-slate-400' : 'text-slate-700',
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
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl flex flex-col h-1/2 relative overflow-hidden shadow-inner">
            <div className="bg-[#121214] border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Execution Logs
                </span>
              </div>
              <div className="text-xs text-slate-500 tabular-nums">{nowTs()}</div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1.5">
              {logs.length === 0 && runState === 'idle' && (
                <div className="text-slate-600 italic">Waiting for simulation to start...</div>
              )}

              {logs.map(line => (
                <div key={line.id} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">[{line.ts}]</span>
                  <span
                    className={cn(
                      line.text.includes('[Report]') ? 'text-emerald-400' : '',
                      line.text.includes('[Simulation]') ? 'text-blue-400' : '',
                      line.text.includes('[Graph Build]') ? 'text-purple-400' : '',
                      line.text.includes('[Env Setup]') ? 'text-sky-300' : '',
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

          <div className="bg-[#121214] border border-slate-800 rounded-xl flex-1 flex flex-col relative overflow-hidden">
            {tab === 'source' ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-5">
                <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-800 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-slate-100 font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      {config.pdfFile}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                    >
                      Open <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-slate-400 leading-relaxed">
                    <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{config.sourceSummary.keyClaimTitle}</div>
                      <div className="mt-2 text-slate-200">
                        {config.sourceSummary.keyClaim}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {config.sourceSummary.cards.map(card => (
                        <div key={card.title} className="bg-[#0a0a0a] border border-slate-800 rounded-lg p-4">
                          <div className="text-xs text-slate-500 uppercase tracking-wider">{card.title}</div>
                          <div className="mt-2 text-slate-100 font-bold">{card.value}</div>
                          <div className="text-xs text-slate-500 mt-1">{card.note}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#0a0a0a] border border-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{config.sourceSummary.examplesTitle}</div>
                      <ul className="mt-2 space-y-1 text-slate-300 text-sm">
                        {config.sourceSummary.examples.map(item => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-[#0a0a0a] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-90 mix-blend-screen">
                    <GraphAnimation />
                  </div>
                  <div className="relative z-10 h-full p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-slate-200 text-lg font-bold">Grounding View</div>
                    <div className="mt-2 text-slate-400 text-sm max-w-md">
                      This tab keeps the source PDF one click away while the console runs. Use it in demos to justify every step with evidence.
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Static demo only. Deep interaction is not connected to an LLM.
                    </div>
                  </div>
                </div>
              </div>
            ) : currentStep < 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-[#121214]/50 backdrop-blur-[1px]">
                <Cpu className="w-12 h-12 mb-4 opacity-20" />
                <p>Run the pipeline to see the world build and the report appear.</p>
              </div>
            ) : currentStep < 4 ? (
              <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0a0a]">
                <div className="absolute inset-0 opacity-90 mix-blend-screen">
                  <GraphAnimation />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/20 to-[#0a0a0a]" />

                <div className="relative z-10 flex-1 flex flex-col p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      World build status
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2',
                        currentStep === 1 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15' : 'border-slate-800 bg-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700',
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      View source PDF
                    </button>
                  </div>

                  {currentStep === 1 && (
                    <div className="mt-4 bg-[#121214]/70 backdrop-blur-sm border border-slate-800 rounded-xl p-4 shadow-2xl max-w-3xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-emerald-300 font-semibold flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          {config.evidenceTitle}
                        </div>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          Open in new tab <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="bg-[#0a0a0a] rounded p-3 text-xs text-slate-400 border border-slate-800 h-36 overflow-y-auto">
                        <div className="text-slate-200 font-bold">{config.evidenceTitle}</div>
                        <div className="mt-2 space-y-1">
                          {config.evidenceBullets.map(line => (
                            <div key={line}>- {line}</div>
                          ))}
                        </div>
                        <div className="mt-3 text-emerald-400">Graph build running…</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto self-center bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full px-6 py-3 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-sm text-emerald-100">
                      {currentStep === 1 && 'Building knowledge graph from source…'}
                      {currentStep === 2 && 'Injecting regional personas…'}
                      {currentStep === 3 && 'Running parallel simulation…'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-700">
                <div className="border-b border-slate-800 p-4 bg-emerald-950/20 flex items-center justify-between">
                  <div className="text-emerald-300 font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Report generated
                  </div>
                  <div className="text-xs text-slate-500">
                    Source: <a className="hover:text-slate-200" href={pdfUrl} target="_blank" rel="noopener noreferrer">{config.pdfFile}</a>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {config.reportCards.map(card => (
                      <div key={card.title} className="border border-slate-800 bg-[#0a0a0a] p-4 rounded-lg">
                        <div className="text-slate-500 text-xs mb-1">{card.title}</div>
                        <div
                          className={cn(
                            'text-xl md:text-2xl font-bold text-slate-100',
                            card.accent === 'emerald' && 'text-emerald-300',
                            card.accent === 'blue' && 'text-blue-300',
                            card.accent === 'amber' && 'text-amber-300',
                          )}
                        >
                          {card.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">{card.note}</div>
                      </div>
                    ))}
                  </div>

                  {currentStep === 5 && (
                    <div className="border-t border-slate-800 pt-6 mt-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">
                        Deep Interaction Session
                      </h4>

                      <div className="space-y-4 mb-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-800/50">
                            <Send className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="bg-[#0a0a0a] border border-slate-800 p-3 rounded-lg rounded-tl-none text-sm text-slate-300">
                            Why did housing and childcare programs score higher than facility construction?
                          </div>
                        </div>

                        <div className="flex gap-3 flex-row-reverse">
                          <div className="w-8 h-8 rounded bg-emerald-900/50 flex items-center justify-center shrink-0 border border-emerald-800/50">
                            <Activity className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg rounded-tr-none text-sm text-emerald-200/90 max-w-[80%]">
                            [ReportAgent] These programs directly change settlement incentives and daily life friction. That is observable as retention and inflow. Facilities without a program layer do not guarantee population outcomes under the 2026 criteria.
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          disabled
                          placeholder="Ask ReportAgent anything about the simulation..."
                          className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-sm text-slate-300 focus:outline-none disabled:opacity-50"
                        />
                        <button disabled className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#121214] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                {config.pdfFile}
              </div>
              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-colors"
              >
                Close
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

      <footer className="fixed bottom-0 w-full bg-amber-500/10 border-t border-amber-500/20 py-2 px-6 flex items-center justify-center gap-2 z-50 backdrop-blur-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <p className="text-xs text-amber-500/90 font-medium">
          This page is a static demo only. Deep interaction with Agents is not connected to an LLM.
        </p>
      </footer>
    </div>
  );
}
