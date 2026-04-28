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
      headline: '라이브 데모 콘솔',
      subline: '/public의 로컬 PDF로 근거를 고정합니다',
      pdfFile: PDF_FILES.ko,
      hypotheses: [
        {
          id: 'people-first',
          title: '사람 중심 전환',
          hypothesis: '이 문서의 평가 기준은 시설 조성보다 인구유입/정주/돌봄/청년 성과에 직접 연결된 사업을 상향 평가한다.',
          logs: [
            '[Graph Build] 온톨로지 생성 및 엔티티/관계 추출...',
            '[Graph Build] 지식 그래프 구성 완료 (nodes: 142, edges: 351)',
            '[Env Setup] 지역/청년/돌봄 페르소나 생성 및 파라미터 설정...',
            '[Simulation] 다중 에이전트 평가 시나리오 실행...',
            '[Simulation] 성과지표(유입/정착/돌봄/청년)를 가중치로 적용...',
            '[Report] 결과 집계 및 리포트 생성...',
            '[System] 심층 질의응답 모드 진입',
          ],
          reportCards: [
            { title: 'Scoring lens', value: 'People-first', note: 'Outcomes > facilities', accent: 'emerald' },
            { title: 'Top signals', value: 'Inflow/Retention', note: 'Measurable KPIs', accent: 'blue' },
            { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
          ],
          qa: [
            {
              id: 'why-people-first',
              question: '왜 “사람 중심”이 시설보다 상향 평가되나요?',
              answer: '문서 내 평가 기준이 “성과(인구유입/정착 등) 검증 가능성”에 무게를 두기 때문입니다. 시설은 운영·프로그램이 결합되지 않으면 성과로 연결된다는 증거를 만들기 어렵습니다.',
              keywords: ['사람', '시설', '왜', '평가', '상향'],
            },
            {
              id: 'what-evidence',
              question: '근거는 어떤 형태로 잡히나요?',
              answer: '정적 데모에서는 PDF에서 추출된 요구사항을 “키워드/성과지표/평가항목”으로 연결해 근거를 구성했다고 가정합니다(실제 추출은 연결하지 않음).',
              keywords: ['근거', '증거', '키워드', '성과지표'],
            },
          ],
        },
        {
          id: 'tier-allocation',
          title: '등급·배분 가설',
          hypothesis: '우수/S/A/B 등급은 사업 성과의 “검증 가능성”과 “지속가능성”에 의해 안정적으로 구분된다.',
          logs: [
            '[Graph Build] 평가 등급 정의 및 배분 규칙 후보 추출...',
            '[Graph Build] 등급-근거 관계 그래프 연결...',
            '[Env Setup] 심사위원/집행기관 페르소나 생성...',
            '[Simulation] 배분/등급 시나리오를 병렬 실행...',
            '[Simulation] 리스크(지속성/운영) vs 성과(유입/정착) 트레이드오프 평가...',
            '[Report] 등급별 배분 결과 및 근거 요약...',
            '[System] 심층 질의응답 모드 진입',
          ],
          reportCards: [
            { title: 'Allocation', value: 'Tiered', note: 'Incentives by grade', accent: 'emerald' },
            { title: 'Separator', value: 'Verifiability', note: 'Evidence density', accent: 'blue' },
            { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
          ],
          qa: [
            {
              id: 'how-grade',
              question: '우수/S/A/B를 가르는 기준은 뭐예요?',
              answer: '정적 데모에서는 (1) 성과지표 정의의 명확성, (2) 실행·운영 계획의 지속가능성, (3) 리스크 관리 항목 충족 여부를 종합해 등급을 분리한다고 가정합니다.',
              keywords: ['우수', '등급', 'S', 'A', 'B', '기준'],
            },
            {
              id: 'allocation-logic',
              question: '배분 구조는 어떻게 설명하나요?',
              answer: '우수 등급은 인센티브가 붙고, 하위 등급은 기본 배분으로 가정합니다. 핵심은 “왜 그 등급인지”를 근거(요구사항/지표 연결)로 설명하는 것입니다.',
              keywords: ['배분', '구조', '인센티브'],
            },
          ],
        },
        {
          id: 'keyword-upweight',
          title: '키워드 상향',
          hypothesis: '인구유입/정주/돌봄/청년 키워드가 명확히 연결된 사업은 동일 예산 대비 상향 평가될 가능성이 높다.',
          logs: [
            '[Graph Build] 핵심 키워드(유입/정주/돌봄/청년) 스팬 추출...',
            '[Graph Build] 키워드-사업유형-성과지표 매핑 구성...',
            '[Env Setup] 정책평가/현장운영 페르소나 생성...',
            '[Simulation] 키워드 기반 사업 포트폴리오 비교 시나리오 실행...',
            '[Report] 상향 평가 가능 사업 유형 및 근거 정리...',
            '[System] 심층 질의응답 모드 진입',
          ],
          reportCards: [
            { title: 'Upweighted', value: 'Programs', note: 'Lifecycle + services', accent: 'emerald' },
            { title: 'Evidence', value: 'Keyword links', note: 'Graph-grounded', accent: 'blue' },
            { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
          ],
          qa: [
            {
              id: 'which-programs',
              question: '어떤 사업이 상향 평가되나요?',
              answer: '정적 데모에서는 주거·돌봄·청년 일자리처럼 “인구유입/정주” 지표로 바로 측정 가능한 프로그램형 사업이 상향 평가된다고 가정합니다.',
              keywords: ['어떤', '사업', '상향', '프로그램'],
            },
            {
              id: 'keywords-role',
              question: '키워드는 왜 중요한가요?',
              answer: '키워드는 문서의 평가항목과 사업 설계를 연결하는 “근거 링크”로 쓰입니다. 링크가 촘촘할수록 설명 가능성과 검증 가능성이 올라갑니다.',
              keywords: ['키워드', '중요', '링크'],
            },
          ],
        },
      ],
      evidenceTitle: '가설 & 근거',
      evidenceBullets: [
        '기존 시설 중심에서 사람 중심 성과로 평가 기준 가설 수립',
        'PDF 내 핵심 요구사항을 지식 그래프(GraphRAG)로 추출 및 연결',
        '다중 페르소나 시뮬레이션을 통한 객관적 결과 도출',
      ],
      pipeline: [
        { id: 1, title: '온톨로지 & 그래프 구축', desc: '문서 기반 온톨로지 생성 및 지식 그래프 구축' },
        { id: 2, title: '환경 설정', desc: '시뮬레이션 초기화 및 에이전트 페르소나 생성' },
        { id: 3, title: '시뮬레이션 실행', desc: '다중 에이전트 병렬 시나리오 실행' },
        { id: 4, title: '리포트 생성', desc: '평가 결과 도출 및 최종 리포트 생성' },
        { id: 5, title: '심층 질의응답', desc: '생성된 리포트에 대한 심층 질의응답' },
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
    };
  }

  if (lang === 'zh') {
    return {
      lang,
      label: '中文',
      headline: 'Live demo console',
      subline: 'Grounded by a local PDF in /public',
      pdfFile: PDF_FILES.zh,
      hypotheses: [
        {
          id: 'procedure-compliance',
          title: '程序合规',
          hypothesis: '如果严格按公告的程序义务执行，则风险点主要集中在通知要素缺失与时间节点不明确。',
          logs: [
            '[GraphRAG Build] Extracting entities and relationships from PDF...',
            '[GraphRAG Build] Constructing grounded knowledge graph (nodes: 142, edges: 351)',
            '[Env Setup] Generating creditor, administrator, and court personas...',
            '[Simulation] Running parallel evaluation scenarios...',
            '[Simulation] Stress-testing deadlines, obligations, and missing fields...',
            '[Report] Producing structured brief with evidence links...',
            '[System] Entering Deep Interaction mode',
          ],
          reportCards: [
            { title: 'Focus', value: 'Procedure', note: 'Compliance lens', accent: 'emerald' },
            { title: 'Risk drivers', value: 'Deadlines', note: 'Time-sensitive items', accent: 'blue' },
            { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
          ],
          qa: [
            {
              id: 'what-missing',
              question: '最常见的风险点是什么？',
              answer: '静态演示中，风险点聚焦在：时间节点不明确、通知对象/范围不完整、会议要素缺失等会影响程序合规的要素。',
              keywords: ['风险', '缺失', '时间', '通知'],
            },
            {
              id: 'how-verify',
              question: '如何做一致性核验？',
              answer: '把公告要素结构化为“实体-关系-义务”，然后用检查清单核对每一项是否齐全（静态规则匹配）。',
              keywords: ['核验', '一致性', '检查', '清单'],
            },
          ],
        },
        {
          id: 'stakeholder-obligations',
          title: '主体义务',
          hypothesis: '公告文本中对债权人、管理人、法院的义务分配是可结构化抽取且可用于一致性核验的。',
          logs: [
            '[GraphRAG Build] Extracting stakeholder entities and obligations...',
            '[GraphRAG Build] Linking obligations to actors and required actions...',
            '[Env Setup] Generating stakeholder personas...',
            '[Simulation] Running obligation-consistency scenarios...',
            '[Report] Producing obligation map and verification checklist...',
            '[System] Entering Deep Interaction mode',
          ],
          reportCards: [
            { title: 'Output', value: 'Obligation map', note: 'Actor → duty', accent: 'emerald' },
            { title: 'Use', value: 'Verification', note: 'Checklist-ready', accent: 'blue' },
            { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
          ],
          qa: [
            {
              id: 'who-does-what',
              question: '如何把“谁做什么”抽出来？',
              answer: '静态演示将句子拆成：主体(债权人/管理人/法院) → 动作(通知/提交/出席) → 条件/期限，并形成义务映射表。',
              keywords: ['谁', '主体', '义务', '动作'],
            },
            {
              id: 'output-format',
              question: '输出是什么格式？',
              answer: '输出为结构化摘要 + 义务映射 + 需核验清单，便于后续演示使用。',
              keywords: ['输出', '格式', '摘要', '清单'],
            },
          ],
        },
      ],
      evidenceTitle: 'Hypothesis & Evidence',
      evidenceBullets: [
        '基于文档构建合规性假设与程序评估标准',
        '将核心要素提取为结构化的知识图谱 (GraphRAG)',
        '通过多角色模拟得出客观评估结果与总结',
      ],
      pipeline: [
        { id: 1, title: 'Ontology & Graph Build', desc: '生成本体并构建知识图谱' },
        { id: 2, title: 'Environment Setup', desc: '初始化模拟环境并生成代理人画像' },
        { id: 3, title: 'Run Simulation', desc: '执行多代理人并行模拟场景' },
        { id: 4, title: 'Report Generation', desc: '生成最终评估分数与结构化报告' },
        { id: 5, title: 'Deep Interaction', desc: '针对报告结果进行深度问答' },
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
    };
  }

  return {
    lang,
    label: 'English',
    headline: 'Live demo console',
    subline: 'Grounded by a local PDF in /public',
    pdfFile: PDF_FILES.en,
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
            question: 'Why is something classified as "High Risk"?',
            answer: 'In this static demo, "High Risk" is triggered when requirements imply stricter controls, higher sensitivity, or broader impact. The answer is selected by keyword rules.',
            keywords: ['high risk', 'classified', 'tier', 'risk'],
          },
          {
            id: 'evidence-linking',
            question: 'How do you link evidence to a tier?',
            answer: 'We assume each tier decision is backed by extracted requirement statements mapped to controls and constraints (static, pre-authored).',
            keywords: ['evidence', 'link', 'mapped', 'requirement'],
          },
        ],
      },
      {
        id: 'access-constraints',
        title: 'Access constraints',
        hypothesis: 'Access and compliance constraints in the text impose a predictable minimum control set for each tier.',
        logs: [
          '[GraphRAG Build] Extracting access-control requirements...',
          '[GraphRAG Build] Mapping constraints to tiers and conditions...',
          '[Env Setup] Generating security and compliance personas...',
          '[Simulation] Running control-set validation scenarios...',
          '[Report] Producing tier→control summary with evidence links...',
          '[System] Entering Deep Interaction mode',
        ],
        reportCards: [
          { title: 'Output', value: 'Control set', note: 'Tier-specific', accent: 'emerald' },
          { title: 'Driver', value: 'Constraints', note: 'Evidence-linked', accent: 'blue' },
          { title: 'Mode', value: 'Static', note: 'No external APIs', accent: 'amber' },
        ],
        qa: [
          {
            id: 'minimum-controls',
            question: 'What does "minimum control set" mean here?',
            answer: 'A deterministic list of controls (access, audit, handling) that must hold for a given tier, inferred from constraints (static rules).',
            keywords: ['minimum', 'control', 'set', 'controls'],
          },
          {
            id: 'compliance',
            question: 'Where does compliance show up in the result?',
            answer: 'In this demo, compliance appears as constraints that increase required controls and move data into stricter tiers.',
            keywords: ['compliance', 'constraint', 'result'],
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
      examples: ['Data category definitions', 'Grading criteria and thresholds', 'Access and compliance constraints'],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = rawLang as SupportedLang;
  if (lang !== 'ko' && lang !== 'en' && lang !== 'zh') notFound();
  const config = buildConfig(lang);
  return <ConsoleClient config={config} />;
}
