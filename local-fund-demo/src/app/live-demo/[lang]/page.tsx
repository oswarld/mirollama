import { notFound } from 'next/navigation';
import ConsoleClient from '../../console/ConsoleClient';

import type { LiveDemoConfig, SupportedLang } from '../../console/ConsoleClient';

interface Params {
  lang: string;
}

interface PageProps {
  params: Promise<Params>;
}

const PDF_FILES: Record<SupportedLang, string> = {
  ko: '2026년 지방소멸대응기금 1조, 시설이 아닌 ‘사람 중심’으로 쓰입니다.pdf',
  en: 'Requirements for classification and grading of civil aviation data.pdf',
  zh: '召开第一次债权人会议公告.pdf',
};

export function generateStaticParams(): Array<{ lang: SupportedLang }> {
  return [{ lang: 'ko' }, { lang: 'en' }, { lang: 'zh' }];
}

function buildConfig(lang: SupportedLang): LiveDemoConfig {
  if (lang === 'ko') {
    return {
      lang,
      label: '한국어',
      headline: 'Live demo console',
      subline: 'Grounded by a local PDF in /public',
      pdfFile: PDF_FILES.ko,
      presets: [
        '이 PDF에서 “시설 중심 → 사람 중심” 전환 근거를 뽑아내고, 평가 파이프라인을 요약해 주세요.',
        '평가 등급(우수/S/A/B)과 배분 구조를 “증거 기반”으로 설명해 주세요.',
        '인구유입/정주/돌봄/청년 키워드를 중심으로 어떤 사업이 상향 평가되는지 정리해 주세요.',
        '심사위원 관점(리스크/성과/지속가능성)으로 질문 5개를 만들어 주세요.',
      ],
      logs: [
        '[System] Booting engine: LiveDemo-Simulator-V0.1',
        "[Graph Build] Loading source: '2026 fund press release (KR).pdf'",
        '[Graph Build] Extracting facts: evaluation, tiers, allocation, incentives',
        '[Graph Build] Building grounded graph: regions, programs, outcomes, metrics',
        '[Env Setup] Injecting personas: 89 depopulation regions + committee roles',
        "[Simulation] Scoring shift detected: 'facilities' → 'people-first outcomes'",
        '[Report] Compiling grades and allocation snapshot with evidence pointers',
        '[System] Entering Deep Interaction mode',
      ],
      evidenceTitle: 'Evidence extraction',
      evidenceBullets: [
        'Extract press-release claims into a grounded graph',
        'Prefer outcome metrics (inflow/retention) over facilities',
        'Produce a static, demo-safe report output',
      ],
      pipeline: [
        { id: 1, title: 'Graph Build', desc: '보도자료에서 사실/조건을 추출해 근거 그래프 구성' },
        { id: 2, title: 'Env Setup', desc: '지자체 페르소나 + 평가위원 역할을 시뮬레이션에 주입' },
        { id: 3, title: 'Start Simulation', desc: '“사람 중심 성과” 기준으로 다층 평가를 실행' },
        { id: 4, title: 'Report Generation', desc: '등급/배분 요약과 근거 포인터를 리포트로 생성' },
        { id: 5, title: 'Deep Interaction', desc: '리포트에 대한 후속 질문(정적 데모)' },
      ],
      sourceSummary: {
        keyClaimTitle: '핵심 요지',
        keyClaim: '2026년 지방소멸대응기금은 시설 조성보다 “사람 중심 성과(인구유입)” 사업을 우선 평가합니다.',
        cards: [
          { title: '우수', value: '120억', note: '우수지역 인센티브' },
          { title: '등급', value: '우수 / S / A / B', note: '다층 평가/배분 구조' },
        ],
        examplesTitle: '예시 추출',
        examples: ['주거/돌봄 프로그램', '청년 일·정주 유도', '성과지표(유입/정착) 중심 평가'],
      },
      reportCards: [
        { title: 'Allocation', value: '120억', note: 'Incentive tier', accent: 'emerald' },
        { title: 'Scoring', value: 'People-first', note: 'Outcome > facilities', accent: 'blue' },
        { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
      ],
    };
  }

  if (lang === 'zh') {
    return {
      lang,
      label: '中文',
      headline: 'Live demo console',
      subline: 'Grounded by a local PDF in /public',
      pdfFile: PDF_FILES.zh,
      presets: [
        '从公告中提取关键事实（会议时间/地点/对象/程序），并形成结构化摘要。',
        '把公告内容转成“实体-关系”列表（机构、债权人、会议、通知义务等）。',
        '生成 5 个债权人/管理人/法院视角的追问问题，用于后续互动演示。',
        '列出需要进一步核验的要点（缺失信息/时间敏感事项/合规风险）。',
      ],
      logs: [
        '[System] Booting engine: LiveDemo-Simulator-V0.1',
        "[Graph Build] Loading source: 'Creditors meeting notice (ZH).pdf'",
        '[Graph Build] Extracting entities: court, administrator, creditors, meeting',
        '[Graph Build] Building grounded graph: dates, obligations, procedures',
        '[Env Setup] Injecting personas: creditor / administrator / observer',
        '[Simulation] Running stakeholder reaction simulation (notice compliance)',
        '[Report] Producing structured summary + evidence map',
        '[System] Entering Deep Interaction mode',
      ],
      evidenceTitle: 'Evidence extraction',
      evidenceBullets: [
        'Extract meeting facts and procedural obligations',
        'Link each extracted item back to the PDF',
        'Produce a static demo report for reliable playback',
      ],
      pipeline: [
        { id: 1, title: 'Graph Build', desc: '从公告提取事实并构建可追溯的知识图谱' },
        { id: 2, title: 'Env Setup', desc: '注入不同角色视角（债权人/管理人/观察者）' },
        { id: 3, title: 'Start Simulation', desc: '模拟关切点与追问（合规/流程/风险）' },
        { id: 4, title: 'Report Generation', desc: '生成结构化摘要与证据映射' },
        { id: 5, title: 'Deep Interaction', desc: '对报告进行追问（静态演示）' },
      ],
      sourceSummary: {
        keyClaimTitle: '要点',
        keyClaim: '该公告用于通知并组织第一次债权人会议，包含关键时间、程序与义务信息。',
        cards: [
          { title: 'Focus', value: 'Procedure', note: 'Meeting logistics + obligations' },
          { title: 'Output', value: 'Summary', note: 'Evidence-linked extraction' },
        ],
        examplesTitle: '示例抽取',
        examples: ['会议要素（时间/地点/议题）', '通知义务与流程', '需核验的缺失信息'],
      },
      reportCards: [
        { title: 'Output', value: 'Structured brief', note: 'Key facts + evidence', accent: 'emerald' },
        { title: 'Lens', value: 'Stakeholders', note: 'Creditor/Admin', accent: 'blue' },
        { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
      ],
    };
  }

  return {
    lang,
    label: 'English',
    headline: 'Live demo console',
    subline: 'Grounded by a local PDF in /public',
    pdfFile: PDF_FILES.en,
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
      examples: ['Data category definitions', 'Grading criteria and thresholds', 'Access and compliance constraints'],
    },
    reportCards: [
      { title: 'Report output', value: 'Tier summary', note: 'Evidence-backed', accent: 'emerald' },
      { title: 'Reasoning', value: 'Step-by-step', note: 'Deterministic demo', accent: 'blue' },
      { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
    ],
  };
}

export default async function Page({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = rawLang as SupportedLang;
  if (lang !== 'ko' && lang !== 'en' && lang !== 'zh') notFound();
  const config = buildConfig(lang);
  return <ConsoleClient config={config} />;
}
