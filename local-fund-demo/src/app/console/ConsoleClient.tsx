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
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Send,
  Terminal,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PersonaGraph from '@/components/PersonaGraph';
import { buildPersonaGraph, type Persona } from '@/lib/persona-graph';
import personasKo from '@/data/personas.ko.json';
import personasZh from '@/data/personas.zh.json';
import personasEn from '@/data/personas.en.json';

const TOTAL_PERSONAS = 50;
const TOTAL_ROUNDS = 50;

const PERSONAS_BY_LANG: Record<SupportedLangKey, Persona[]> = {
  ko: personasKo as Persona[],
  zh: personasZh as Persona[],
  en: personasEn as Persona[],
};
type SupportedLangKey = 'ko' | 'en' | 'zh';

function ResponsivePersonaGraph({
  lang,
  revealCount,
}: {
  lang: SupportedLangKey;
  revealCount: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const personas = PERSONAS_BY_LANG[lang];

  return (
    <div ref={containerRef} className="absolute inset-0">
      {size.w > 0 && size.h > 0 && (
        <PersonaGraph
          personas={personas}
          lang={lang}
          width={size.w}
          height={size.h}
          revealCount={revealCount}
        />
      )}
    </div>
  );
}

function FinalReportPanel({
  lang,
  hypothesis,
  reportCards,
  ui,
}: {
  lang: SupportedLangKey;
  hypothesis: string;
  reportCards: ReportCard[];
  ui: ReturnType<typeof getUiText>;
}) {
  const personas = PERSONAS_BY_LANG[lang];
  const fullGraph = useMemo(() => buildPersonaGraph(personas, lang), [personas, lang]);
  const provinceCount = new Set(personas.map(p => p.province)).size;
  const sectorCount = new Set(fullGraph.nodes.map(n => n.sector)).size;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{ui.finalReportHeading}</div>
        <div className="text-lg font-bold text-slate-100 mt-1">{ui.finalReportSubtitle}</div>
      </div>

      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{ui.hypothesisLabel}</div>
        <div className="text-sm text-slate-200 leading-relaxed bg-[#050505]/60 border border-white/5 rounded-xl p-4">
          {hypothesis}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#050505]/60 border border-white/5 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ui.agentCohortLabel}</div>
          <div className="mt-1 text-xl font-black text-slate-100">
            {personas.length} <span className="text-xs font-medium text-slate-500">{ui.personasUnit}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {provinceCount} {ui.provincesUnit} · {sectorCount} {ui.sectorsUnit}
          </div>
        </div>
        <div className="bg-[#050505]/60 border border-white/5 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ui.simulationRoundsLabel}</div>
          <div className="mt-1 text-xl font-black text-slate-100">
            {TOTAL_ROUNDS} <span className="text-xs font-medium text-slate-500">{ui.roundsUnit}</span>
          </div>
        </div>
        <div className="bg-[#050505]/60 border border-white/5 rounded-xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ui.relationsLabel}</div>
          <div className="mt-1 text-xl font-black text-slate-100">
            {fullGraph.edges.length} <span className="text-xs font-medium text-slate-500">{ui.edgesUnit}</span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{ui.keyInsightsLabel}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reportCards.map(card => (
            <div
              key={card.title}
              className={cn(
                'rounded-xl border p-4 bg-[#050505]/60',
                card.accent === 'emerald' && 'border-emerald-500/20',
                card.accent === 'blue' && 'border-blue-500/20',
                card.accent === 'amber' && 'border-amber-500/20',
              )}
            >
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{card.title}</div>
              <div
                className={cn(
                  'text-base font-black tracking-tight',
                  card.accent === 'emerald' && 'text-emerald-400',
                  card.accent === 'blue' && 'text-blue-400',
                  card.accent === 'amber' && 'text-amber-400',
                )}
              >
                {card.value}
              </div>
              <div className="text-xs text-slate-400 mt-1">{card.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#050505]/60 p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-100">{ui.tryRealHeading}</div>
          <div className="text-xs text-slate-500 mt-1">{ui.tryRealNote}</div>
        </div>
        <a
          href="https://github.com/oswarld/mirollama"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl transition-colors"
        >
          {ui.viewOnGithub} →
        </a>
      </div>
    </div>
  );
}

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

export interface HypothesisQAPair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface HypothesisScenario {
  id: string;
  title: string;
  hypothesis: string;
  logs: string[];
  reportCards: ReportCard[];
  qa: HypothesisQAPair[];
}

export interface LiveDemoConfig {
  lang: SupportedLang;
  label: string;
  headline: string;
  subline: string;
  pdfFile: string;
  hypotheses: HypothesisScenario[];
  evidenceTitle: string;
  evidenceBullets: string[];
  pipeline: Array<{ id: PipelineId; title: string; desc: string }>;
  sourceSummary: SourceSummary;
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

type ChatRole = 'user' | 'agent';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

const STEP_ICONS: Record<PipelineId, PipelineStep['icon']> = {
  1: BookOpen,
  2: Cpu,
  3: Activity,
  4: FileText,
  5: Terminal,
};

type StageCopy = Record<Step, { title: string; desc: string }>;

function getStageCopy(lang: SupportedLang): StageCopy {
  if (lang === 'ko') {
    return {
      0: { title: '준비 완료', desc: '실행을 시작하면 단계별 페이지가 순서대로 표시됩니다.' },
      1: { title: '온톨로지 & 그래프 구축', desc: '문서에서 엔티티/관계를 추출해 지식 그래프를 구성합니다.' },
      2: { title: '환경 설정', desc: '에이전트 페르소나와 시뮬레이션 파라미터를 준비합니다.' },
      3: { title: '시뮬레이션 실행', desc: '가설/페르소나 기반으로 다중 에이전트 시나리오를 실행합니다.' },
      4: { title: '리포트 생성', desc: '시뮬레이션 결과를 집계해 구조화된 리포트를 만듭니다.' },
      5: { title: '심층 질의응답', desc: '리포트 근거를 바탕으로 후속 질문을 처리합니다.' },
    };
  }

  if (lang === 'zh') {
    return {
      0: { title: '就绪', desc: '开始运行后，将按步骤展示每个页面。' },
      1: { title: '本体与图谱构建', desc: '从文档抽取实体与关系并构建知识图谱。' },
      2: { title: '环境准备', desc: '生成代理画像与仿真参数。' },
      3: { title: '运行仿真', desc: '基于假设与角色并行执行多代理场景。' },
      4: { title: '生成报告', desc: '汇总仿真结果并生成结构化报告。' },
      5: { title: '深度交互', desc: '围绕报告证据进行追问与解释。' },
    };
  }

  return {
    0: { title: 'Ready to Run', desc: 'Initialize the run to progress through each stage.' },
    1: { title: 'Ontology & Graph Build', desc: 'Extract entities and relations from the source to build a graph.' },
    2: { title: 'Environment Setup', desc: 'Generate agent personas and simulation parameters.' },
    3: { title: 'Run Simulation', desc: 'Execute multi-agent scenarios based on the hypotheses.' },
    4: { title: 'Report Generation', desc: 'Aggregate simulation outcomes into a structured report.' },
    5: { title: 'Deep Interaction', desc: 'Follow-up questions and grounded explanations.' },
  };
}

function getUiText(lang: SupportedLang) {
  if (lang === 'ko') {
    return {
      consoleView: '콘솔',
      sourcePdf: '원문 PDF',
      sourcePdfShort: 'PDF',
      systemRunning: '실행 중',
      systemReady: '준비됨',
      runCompleted: '완료',
      engine: '엔진',
      inputParameters: '가설 입력',
      initializeRun: '실행 시작',
      pause: '일시정지',
      resume: '재개',
      reset: '초기화',
      simulationPipeline: '시뮬레이션 파이프라인',
      executionLogs: '실행 로그',
      waiting: '시뮬레이션을 시작하면 로그가 표시됩니다…',
      promptPlaceholder: '이 PDF 내용을 바탕으로 “검증 가능한 가설”을 입력하세요.',
      stage: '단계',
      viewSourcePdf: 'PDF 보기',
      reportGenerated: '리포트 생성 완료',
      deepInteractionSession: '심층 질의응답',
      openInNewTab: '새 탭에서 열기',
      stageLabel: '단계',
      qaQuestion: '왜 “시설 조성”보다 “사람 중심(정주/돌봄/청년)” 사업이 더 높은 평가를 받나요?',
      qaAnswer:
        '인구 유입/정착처럼 “사람” 지표에 직접 연결되는 프로그램은 효과를 관측·검증하기 쉽습니다. 반면 시설은 운영 프로그램과 결합되지 않으면 인구 성과로 이어진다는 보장이 약해 평가에서 불리할 수 있습니다.',
      askPlaceholder: '리포트 근거를 바탕으로 질문을 입력하세요…',
      staticDemoWarning: '이 페이지는 정적 데모입니다. 실제 LLM/에이전트 연동은 연결되어 있지 않습니다.',
      demoEndedHeading: '데모는 여기까지입니다',
      demoEndedNote: '이 정적 데모에서 보여드릴 수 있는 흐름은 여기까지예요. 자유로운 질의응답은 실제 mirollama 환경에서 가능합니다.',
      finalReportHeading: '최종 리포트',
      finalReportSubtitle: '다중 에이전트 시뮬레이션 결과 요약',
      hypothesisLabel: '검증한 가설',
      agentCohortLabel: '에이전트 코호트',
      personasUnit: '명',
      provincesUnit: '지역',
      sectorsUnit: '직업군',
      simulationRoundsLabel: '시뮬레이션',
      roundsUnit: '라운드',
      relationsLabel: '관계',
      edgesUnit: '엣지',
      keyInsightsLabel: '핵심 인사이트',
      tryRealHeading: '실제 환경에서 직접 시도',
      tryRealNote: '내 문서로 mirollama를 로컬에서 돌려보고 싶다면 GitHub에서 시작할 수 있어요.',
      viewOnGithub: 'GitHub에서 보기',
    };
  }

  if (lang === 'zh') {
    return {
      consoleView: '控制台',
      sourcePdf: '来源 PDF',
      sourcePdfShort: 'PDF',
      systemRunning: '运行中',
      systemReady: '就绪',
      runCompleted: '已完成',
      engine: '引擎',
      inputParameters: '假设输入',
      initializeRun: '开始运行',
      pause: '暂停',
      resume: '继续',
      reset: '重置',
      simulationPipeline: '仿真流程',
      executionLogs: '执行日志',
      waiting: '开始运行后将显示日志…',
      promptPlaceholder: '基于该 PDF 输入一个“可验证的假设”。',
      stage: '步骤',
      viewSourcePdf: '查看 PDF',
      reportGenerated: '报告已生成',
      deepInteractionSession: '深度交互',
      openInNewTab: '在新标签页打开',
      stageLabel: '步骤',
      qaQuestion: '为什么“以人为本（定居/照护/青年）”项目会比“设施建设”获得更高评分？',
      qaAnswer:
        '与人口流入/留存等“人”的指标直接相关的项目更容易观察与验证成效；而设施若缺少运营与项目机制，往往难以保证能转化为人口成效，因此可能更不利。',
      askPlaceholder: '基于报告证据输入问题…',
      staticDemoWarning: '此页面为静态演示，未连接真实的 LLM/代理交互。',
      demoEndedHeading: '演示到此结束',
      demoEndedNote: '本静态演示展示的流程到此结束。自由提问可在真实的 mirollama 环境中进行。',
      finalReportHeading: '最终报告',
      finalReportSubtitle: '多智能体仿真结果摘要',
      hypothesisLabel: '已验证的假设',
      agentCohortLabel: '智能体队列',
      personasUnit: '人',
      provincesUnit: '地区',
      sectorsUnit: '行业',
      simulationRoundsLabel: '仿真',
      roundsUnit: '轮',
      relationsLabel: '关系',
      edgesUnit: '边',
      keyInsightsLabel: '关键洞察',
      tryRealHeading: '在真实环境中亲自体验',
      tryRealNote: '想用自己的文档在本地运行 mirollama，请前往 GitHub 开始。',
      viewOnGithub: '在 GitHub 上查看',
    };
  }

  return {
    consoleView: 'Console View',
    sourcePdf: 'Source PDF',
    sourcePdfShort: 'PDF',
    systemRunning: 'System Running',
    systemReady: 'System Ready',
    runCompleted: 'Run Completed',
    engine: 'Engine',
    inputParameters: 'Hypothesis',
    initializeRun: 'Initialize Run',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    simulationPipeline: 'Simulation Pipeline',
    executionLogs: 'Execution Logs',
    waiting: 'Waiting for simulation to initialize...',
    promptPlaceholder: 'Enter a falsifiable hypothesis grounded in the PDF.',
    stage: 'Stage',
    viewSourcePdf: 'View source PDF',
    reportGenerated: 'Report generated',
    deepInteractionSession: 'Deep Interaction Session',
    openInNewTab: 'Open in new tab',
    stageLabel: 'Stage',
    qaQuestion: 'Why did housing and childcare programs score higher than facility construction?',
    qaAnswer:
      'These programs directly change settlement incentives and daily life friction. That is observable as retention and inflow. Facilities without a program layer do not guarantee population outcomes under the criteria.',
    askPlaceholder: 'Ask ReportAgent anything about the simulation...',
    staticDemoWarning: 'This page is a static demo only. Deep interaction with Agents is not connected to an LLM.',
    demoEndedHeading: 'Demo ends here',
    demoEndedNote: 'That is the full sequence this static demo can show. Free-form Q&A is available when you run mirollama for real.',
    finalReportHeading: 'Final Report',
    finalReportSubtitle: 'Summary of the multi-agent simulation run',
    hypothesisLabel: 'Hypothesis tested',
    agentCohortLabel: 'Agent cohort',
    personasUnit: 'personas',
    provincesUnit: 'regions',
    sectorsUnit: 'sectors',
    simulationRoundsLabel: 'Simulation',
    roundsUnit: 'rounds',
    relationsLabel: 'Relations',
    edgesUnit: 'edges',
    keyInsightsLabel: 'Key insights',
    tryRealHeading: 'Try it for real',
    tryRealNote: 'Want to run mirollama locally with your own documents? Start on GitHub.',
    viewOnGithub: 'View on GitHub',
  };
}

const DEFAULT_CONFIG: LiveDemoConfig = {
  lang: 'en',
  label: 'English',
  headline: 'Live demo console',
  subline: 'Grounded by a local PDF in /public',
  pdfFile: 'Requirements for classification and grading of civil aviation data.pdf',
  hypotheses: [
    {
      id: 'risk-tiering',
      title: 'Risk tiering',
      hypothesis: 'If the document requirements are applied strictly, some data types will be consistently classified as "High Risk" across independent reviewers.',
      logs: [
        '[GraphRAG Build] Extracting entities and relationships from PDF...',
        '[GraphRAG Build] Constructing grounded knowledge graph (nodes: 142, edges: 351)',
        '[Env Setup] Generating compliance and ops personas...',
        '[Simulation] Running parallel evaluation scenarios...',
        '[Result Generation] Aggregating classification votes and confidence...',
        '[Report] Producing tier summary with evidence links...',
        '[System] Entering Deep Interaction mode',
      ],
      reportCards: [
        { title: 'Report output', value: 'Tier summary', note: 'Evidence-backed', accent: 'emerald' },
        { title: 'Signal', value: 'High consensus', note: 'Across personas', accent: 'blue' },
        { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
      ],
      qa: [
        {
          id: 'why-high-risk',
          question: 'Why is this classified as "High Risk"?',
          answer: 'Because the extracted requirements imply stricter controls, broader impact, or higher sensitivity at that tier. This demo answers using the pre-authored scenario rules (static).',
          keywords: ['high risk', 'tier', 'classified', 'classification'],
        },
      ],
    },
  ],
  evidenceTitle: 'Hypothesis & Evidence',
  evidenceBullets: [
    'Formulating risk classification hypotheses based on source text',
    'Extracting document requirements into a connected GraphRAG',
    'Running multi-persona simulation to produce objective grading',
  ],
  pipeline: [
    { id: 1, title: 'Ontology & Graph Build', desc: 'Generate ontology and construct knowledge graph' },
    { id: 2, title: 'Environment Setup', desc: 'Initialize simulation and generate agent personas' },
    { id: 3, title: 'Run Simulation', desc: 'Execute parallel multi-agent scenarios' },
    { id: 4, title: 'Report Generation', desc: 'Compile simulation scores and final report' },
    { id: 5, title: 'Deep Interaction', desc: 'Follow-up Q&A on the static report output' },
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

function stepForLogText(text: string): Step | null {
  if (text.includes('[Source]') || text.includes('[Hypothesis]')) return 0;
  if (text.includes('Booting engine') || text.includes('엔진 부팅')) return 0;
  if (text.includes('[Graph Build]') || text.includes('[GraphRAG Build]')) return 1;
  if (text.includes('[Env Setup]')) return 2;
  if (text.includes('[Simulation]')) return 3;
  if (text.includes('[Report]') || text.includes('[Result')) return 4;
  if (text.includes('Deep Interaction') || text.includes('심층 질의응답') || text.includes('深度交互')) return 5;
  return null;
}

function stepForLogIndex(index: number, total: number): Step {
  if (total <= 0) return 0;
  if (index >= total - 1) return 5;
  const t = (index + 1) / total;
  if (t <= 0.25) return 1;
  if (t <= 0.5) return 2;
  if (t <= 0.8) return 3;
  return 4;
}

function makeChatMessage(role: ChatRole, text: string): ChatMessage {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text };
}

export default function ConsoleClient({ config = DEFAULT_CONFIG }: { config?: LiveDemoConfig }) {
  const [tab, setTab] = useState<TabKey>('console');
  const [runState, setRunState] = useState<RunState>('idle');
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>(config.hypotheses[0]?.id ?? '');
  const [hypothesis, setHypothesis] = useState<string>(config.hypotheses[0]?.hypothesis ?? '');
  const [cursor, setCursor] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [runPlan, setRunPlan] = useState<null | { logs: string[]; reportCards: ReportCard[] }>(null);
  const [chatDraft, setChatDraft] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [revealedNodes, setRevealedNodes] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const selectedScenario = useMemo(() => {
    const hit = config.hypotheses.find(h => h.id === selectedHypothesisId);
    return hit ?? config.hypotheses[0] ?? null;
  }, [config.hypotheses, selectedHypothesisId]);

  const activePlan = runPlan ?? (selectedScenario ? { logs: selectedScenario.logs, reportCards: selectedScenario.reportCards } : null);

  const progress = useMemo(() => {
    const total = activePlan?.logs.length ?? 0;
    if (total === 0) return 0;
    return Math.min(100, Math.round((cursor / total) * 100));
  }, [activePlan?.logs.length, cursor]);

  const pdfUrl = useMemo(() => encodeURI(`/${config.pdfFile}`), [config.pdfFile]);
  const ui = useMemo(() => getUiText(config.lang), [config.lang]);
  const stageCopy = useMemo(() => getStageCopy(config.lang), [config.lang]);

  useEffect(() => {
    if (currentStep > 0 && stepsContainerRef.current) {
      const activeCard = stepsContainerRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep]);

  const renderStepContent = (stepId: Step) => {
    if (stepId === 1) {
      return (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {config.evidenceTitle}
            </div>
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              {ui.viewSourcePdf} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-[#050505]/80 border border-white/5 rounded-2xl p-5 shadow-inner">
            <div className="space-y-2 text-sm text-slate-300">
              {config.evidenceBullets.map(line => (
                <div key={line} className="flex gap-2"><span className="text-emerald-500/50">&bull;</span> {line}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (stepId === 2) {
      return (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="bg-[#050505]/80 border border-white/5 rounded-2xl p-5 shadow-inner">
            <div className="text-sm text-slate-300">{stageCopy[2].desc}</div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Agents</div>
                <div className="mt-1 text-xl font-black text-slate-100">24</div>
                <div className="mt-1 text-xs text-slate-500">personas generated</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">World</div>
                <div className="mt-1 text-xl font-black text-slate-100">Parallel</div>
                <div className="mt-1 text-xs text-slate-500">twitter + reddit</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rounds</div>
                <div className="mt-1 text-xl font-black text-slate-100">{TOTAL_ROUNDS}</div>
                <div className="mt-1 text-xs text-slate-500">demo default · adjustable in product</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (stepId === 3) {
      const roundProgress = Math.round((currentRound / TOTAL_ROUNDS) * 100);
      return (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-[#050505]/80 border border-white/5 rounded-2xl p-5 text-sm text-slate-300">
            {stageCopy[3].desc}
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#050505]/80 p-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Simulation Round</div>
              <div className="font-mono text-xs text-slate-400">{roundProgress}%</div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-black text-emerald-400">{currentRound}</div>
              <div className="text-sm text-slate-500">/ {TOTAL_ROUNDS}</div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-emerald-500/70 transition-[width] duration-150"
                style={{ width: `${roundProgress}%` }}
              />
            </div>
          </div>
        </div>
      );
    }
    if (stepId === 4) {
      const reportCards = activePlan?.reportCards ?? [];
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reportCards.map(card => (
              <div key={card.title} className="border border-white/5 bg-[#050505]/50 p-5 rounded-2xl shadow-inner relative overflow-hidden group hover:border-white/10 transition-colors">
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                  card.accent === 'emerald' ? 'bg-emerald-500' : card.accent === 'blue' ? 'bg-blue-500' : 'bg-amber-500',
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
        </div>
      );
    }
    if (stepId === 5) {
      const qaEnabled = currentStep === 5 && runState !== 'done';
      const showEndedNotice = runState === 'done';
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="space-y-4">
            {chatMessages.map(m => (
              m.role === 'user' ? (
                <div key={m.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <Send className="w-4 h-4 text-blue-400 ml-[-2px]" />
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-sm">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl rounded-tr-none text-sm text-emerald-100/90 max-w-[85%] leading-relaxed shadow-sm">
                    <span className="font-bold text-emerald-400 block mb-1.5 text-xs tracking-wider uppercase">ReportAgent</span>
                    {m.text}
                  </div>
                </div>
              )
            ))}
            {chatMessages.length === 0 && (
              <div className="text-slate-500 text-sm">
                {ui.waiting}
              </div>
            )}
          </div>
          {showEndedNotice ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm text-emerald-100/90 leading-relaxed">
                <div className="font-bold text-emerald-300 mb-1">{ui.demoEndedHeading}</div>
                <div className="text-slate-300">{ui.demoEndedNote}</div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={chatDraft}
                onChange={e => setChatDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (!qaEnabled) return;
                  if (!chatDraft.trim()) return;
                  if (!selectedScenario) return;
                  const q = chatDraft.trim();
                  const normalized = q.toLowerCase();
                  const hit = selectedScenario.qa.find(pair =>
                    pair.keywords.some(k => normalized.includes(k.toLowerCase())),
                  );
                  const answer = hit?.answer ?? selectedScenario.qa[0]?.answer ?? ui.qaAnswer;
                  setChatMessages(prev => [
                    ...prev,
                    makeChatMessage('user', q),
                    makeChatMessage('agent', answer),
                  ]);
                  setChatDraft('');
                }}
                placeholder={ui.askPlaceholder}
                disabled={!qaEnabled}
                className="w-full bg-[#050505] border border-white/10 rounded-xl pl-5 pr-12 py-4 text-sm text-slate-300 focus:outline-none disabled:opacity-50 shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  if (!qaEnabled) return;
                  if (!chatDraft.trim()) return;
                  if (!selectedScenario) return;
                  const q = chatDraft.trim();
                  const normalized = q.toLowerCase();
                  const hit = selectedScenario.qa.find(pair =>
                    pair.keywords.some(k => normalized.includes(k.toLowerCase())),
                  );
                  const answer = hit?.answer ?? selectedScenario.qa[0]?.answer ?? ui.qaAnswer;
                  setChatMessages(prev => [
                    ...prev,
                    makeChatMessage('user', q),
                    makeChatMessage('agent', answer),
                  ]);
                  setChatDraft('');
                }}
                disabled={!qaEnabled || !chatDraft.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (runState !== 'running') return;
    const plan = runPlan;
    if (!plan) return;
    if (cursor >= plan.logs.length) return;

    const nextText = plan.logs[cursor];
    const nextStep = stepForLogText(nextText) ?? stepForLogIndex(cursor, plan.logs.length);

    // Hold log advance while the active phase's counter is still running so the
    // viewer actually sees every node appear (step 1) and every round tick (step 3).
    if (currentStep === 1 && nextStep > 1 && revealedNodes < TOTAL_PERSONAS) return;
    if (currentStep === 3 && nextStep > 3 && currentRound < TOTAL_ROUNDS) return;

    const tickMs = 1800;

    const timer = window.setTimeout(() => {
      setLogs(prev => [...prev, makeLogLine(nextText)]);
      setCurrentStep(nextStep);
      const nextCursor = cursor + 1;
      setCursor(nextCursor);
      if (nextCursor >= plan.logs.length) setRunState('done');
    }, tickMs);

    return () => window.clearTimeout(timer);
  }, [cursor, runPlan, runState, currentStep, revealedNodes, currentRound]);

  // Reveal persona nodes once the run starts: ~50 nodes over ~5 seconds.
  useEffect(() => {
    if (runState !== 'running') return;
    if (revealedNodes >= TOTAL_PERSONAS) return;
    const timer = window.setTimeout(() => {
      setRevealedNodes(prev => Math.min(TOTAL_PERSONAS, prev + 1));
    }, 100);
    return () => window.clearTimeout(timer);
  }, [revealedNodes, runState]);

  // Round counter starts ticking once the run reaches step 3 (Simulation).
  // ~50 rounds over ~4 seconds.
  useEffect(() => {
    if (runState !== 'running') return;
    if (currentStep < 3) return;
    if (currentRound >= TOTAL_ROUNDS) return;
    const timer = window.setTimeout(() => {
      setCurrentRound(prev => Math.min(TOTAL_ROUNDS, prev + 1));
    }, 80);
    return () => window.clearTimeout(timer);
  }, [currentStep, currentRound, runState]);

  const buildRunPlan = (scenario: HypothesisScenario, hypothesisText: string) => {
    const header = [
      '[System] Booting engine: LiveDemo-Simulator-V0.1',
      `[Source] '${config.pdfFile}'`,
      `[Hypothesis] ${hypothesisText.trim()}`,
    ];
    const tail = scenario.logs;
    const reportCards = scenario.reportCards;
    return { logs: [...header, ...tail], reportCards };
  };

  const handleStart = () => {
    if (!hypothesis.trim()) return;
    if (!selectedScenario) return;
    const seed = selectedScenario.qa[0];
    setChatMessages(seed
      ? [makeChatMessage('user', seed.question), makeChatMessage('agent', seed.answer)]
      : [makeChatMessage('user', ui.qaQuestion), makeChatMessage('agent', ui.qaAnswer)],
    );
    setChatDraft('');
    setTab('console');
    setLogs([]);
    setCursor(0);
    setCurrentStep(0);
    setRevealedNodes(0);
    setCurrentRound(0);
    setRunPlan(buildRunPlan(selectedScenario, hypothesis));
    setRunState('running');
  };

  const handlePauseToggle = () => {
    if (runState === 'running') setRunState('paused');
    if (runState === 'paused') setRunState('running');
  };

  const handleReset = () => {
    const first = config.hypotheses[0];
    setRunState('idle');
    setCurrentStep(0);
    setCursor(0);
    setLogs([]);
    setRunPlan(null);
    setChatDraft('');
    setChatMessages([]);
    setRevealedNodes(0);
    setCurrentRound(0);
    if (first) {
      setSelectedHypothesisId(first.id);
      setHypothesis(first.hypothesis);
    } else {
      setSelectedHypothesisId('');
      setHypothesis('');
    }
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
                <FileText className="w-3 h-3" /> {ui.sourcePdfShort}
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
              {isRunning ? ui.systemRunning : runState === 'done' ? ui.runCompleted : ui.systemReady}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-500 px-3 py-1.5 rounded-full border border-white/5">
            <Cpu className="w-3.5 h-3.5" /> {ui.engine}: LocalFund-V0.1
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-full">
            {([
              { code: 'ko', label: '한국어' },
              { code: 'zh', label: '中文' },
              { code: 'en', label: 'EN' },
            ] as const).map(({ code, label }) => (
              <Link
                key={code}
                href={`/live-demo/${code}`}
                prefetch={false}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-bold transition-all',
                  config.lang === code
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {label}
              </Link>
            ))}
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
              {ui.consoleView}
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
              {ui.sourcePdf}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {runState === 'idle' ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                  disabled={!hypothesis.trim()}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {ui.initializeRun}
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
                    {isPaused ? ui.resume : ui.pause}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {ui.reset}
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
                {ui.inputParameters}
              </h2>
              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">{progress}%</div>
            </div>

            <textarea
              value={hypothesis}
              onChange={e => setHypothesis(e.target.value)}
              disabled={isRunning}
              className="w-full bg-[#050505]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none h-28 disabled:opacity-50 transition-all placeholder:text-slate-600 relative z-10 shadow-inner"
              placeholder={ui.promptPlaceholder}
            />

            <div className="mt-4 flex flex-wrap gap-2 relative z-10">
              {config.hypotheses.map(h => (
                <button
                  type="button"
                  key={h.id}
                  onClick={() => {
                    setSelectedHypothesisId(h.id);
                    setHypothesis(h.hypothesis);
                    setChatDraft('');
                    setChatMessages([]);
                  }}
                  disabled={isRunning}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all text-left max-w-full truncate',
                    h.id === selectedHypothesisId
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.1)]'
                      : 'bg-[#050505]/50 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10 hover:bg-white/5',
                    isRunning && 'opacity-50 cursor-not-allowed',
                  )}
                  title={h.hypothesis}
                >
                  {h.title}
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
              {ui.simulationPipeline}
            </h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/10 before:via-white/5 before:to-transparent">
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
          {tab === 'source' ? (
            <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex-1 flex flex-col relative overflow-hidden shadow-xl">
              <div className="bg-[#050505]/80 border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  {config.pdfFile}
                </div>
              </div>
              <iframe
                title={config.pdfFile}
                src={pdfUrl}
                className="w-full flex-1 bg-white"
              />
            </div>
          ) : (
            <>
              <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-1/2 relative overflow-hidden shadow-xl">
                <div className="bg-[#050505]/50 border-b border-white/5 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {ui.executionLogs}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-500" suppressHydrationWarning>
                      {nowTs()}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] space-y-2 relative z-10 scroll-smooth">
                  {logs.length === 0 && runState === 'idle' && (
                    <div className="text-slate-500 italic flex items-center justify-center h-full">{ui.waiting}</div>
                  )}

                  {logs.map(line => (
                    <div key={line.id} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300" style={{ animationFillMode: 'both' }}>
                      <span className="text-slate-600 shrink-0 select-none">[{line.ts}]</span>
                      <span
                        className={cn(
                          'leading-relaxed break-words',
                          line.text.includes('[Report]') ? 'text-emerald-400 font-medium' : '',
                          line.text.includes('[Simulation]') ? 'text-blue-400 font-medium' : '',
                          line.text.includes('[Graph Build]') || line.text.includes('[GraphRAG Build]') ? 'text-purple-400 font-medium' : '',
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
                <div className="bg-[#050505]/70 border-b border-white/10 px-5 py-4 flex items-center justify-between z-10 relative shadow-sm">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    {ui.stageLabel}
                  </div>
                  {currentStep > 0 && (
                    <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      {currentStep}/5
                    </div>
                  )}
                </div>

                <div ref={stepsContainerRef} className="flex-1 p-5 overflow-y-auto space-y-4 scroll-smooth relative z-0">
                  {currentStep === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-in fade-in duration-500">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Cpu className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium">{stageCopy[0].desc}</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-[#050505] overflow-hidden h-[300px] sm:h-[340px] relative">
                        <ResponsivePersonaGraph lang={config.lang} revealCount={revealedNodes} />
                        <div className="pointer-events-none absolute left-4 top-4 z-10">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">GraphRAG</div>
                          <div className="mt-0.5 text-sm font-bold text-slate-200">{stageCopy[1].title}</div>
                        </div>
                        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                          {revealedNodes} / {TOTAL_PERSONAS} agents
                        </div>
                      </div>
                      {([1, 2, 3, 4, 5] as Step[]).map((stepId) => {
                      const isCurrent = currentStep === stepId;
                      const isCompleted = currentStep > stepId;
                      
                      return (
                        <div 
                          key={stepId}
                          data-step={stepId}
                          className={cn(
                            "rounded-2xl transition-all duration-700 border overflow-hidden",
                            isCurrent ? "bg-[#050505]/90 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]" :
                            isCompleted ? "bg-[#050505]/40 border-emerald-500/20 opacity-80 hover:opacity-100" :
                            "bg-[#050505]/20 border-white/5 opacity-40 grayscale"
                          )}
                        >
                          <div className={cn(
                            "px-5 py-4 flex items-center justify-between transition-colors duration-500",
                            isCurrent ? "bg-blue-500/5" : ""
                          )}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono border transition-all duration-500",
                                isCurrent ? "bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-inner" :
                                isCompleted ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                                "bg-white/5 border-white/10 text-slate-500"
                              )}>
                                {isCompleted ? <Check className="w-5 h-5" /> : `0${stepId}`}
                              </div>
                              <div>
                                <div className={cn(
                                  "text-sm font-bold tracking-wide transition-colors duration-500",
                                  isCurrent ? "text-blue-100" :
                                  isCompleted ? "text-emerald-100" :
                                  "text-slate-400"
                                )}>
                                  {stageCopy[stepId].title}
                                </div>
                                {!isCurrent && (
                                  <div className="text-xs text-slate-500 mt-1 max-w-xs sm:max-w-md truncate">{stageCopy[stepId].desc}</div>
                                )}
                              </div>
                            </div>
                            {isCurrent && runState !== 'done' && (
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                </span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hidden sm:block">Processing</span>
                              </div>
                            )}
                            {(isCompleted || (isCurrent && runState === 'done')) && (
                              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 hidden sm:flex">
                                <CheckCircle2 className="w-3 h-3" /> {ui.runCompleted}
                              </div>
                            )}
                          </div>

                          {isCurrent && (
                            <div className="p-6 bg-black/40 border-t border-white/5 relative">
                              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                              {renderStepContent(stepId)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                      {runState === 'done' && activePlan && (
                        <FinalReportPanel
                          lang={config.lang}
                          hypothesis={hypothesis.trim() || selectedScenario?.hypothesis || ''}
                          reportCards={activePlan.reportCards}
                          ui={ui}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
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
          {ui.staticDemoWarning}
        </p>
      </footer>
    </div>
  );
}
