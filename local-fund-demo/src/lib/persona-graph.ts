/**
 * Builds the static persona graph (nodes + edges) used by PersonaGraph.tsx.
 * Each pair of personas yields at most ONE edge, prioritized:
 *   1. SAME_REGION_AS    — same province (strongest cluster signal)
 *   2. SAME_SECTOR_AS    — same occupation sector
 *   3. SAME_GENERATION_AS — same generation (fallback)
 */

export type SupportedLang = 'ko' | 'en' | 'zh';

export interface Persona {
  id: string;
  persona: string;
  age: number;
  generation: string;
  sex: string;
  occupation: string;
  district: string;
  province: string;
  education: string;
  professional: string;
  hobbies: string;
  skills: string[];
  interests: string[];
}

export type Sector =
  | 'legal'
  | 'finance'
  | 'executive'
  | 'government'
  | 'education'
  | 'media'
  | 'tech'
  | 'industry'
  | 'service'
  | 'healthcare'
  | 'retired'
  | 'citizen'
  | 'other';

export type EdgeType = 'SAME_REGION_AS' | 'SAME_SECTOR_AS' | 'SAME_GENERATION_AS';

export interface GraphNode {
  id: string;
  persona: Persona;
  province: string;
  generation: string;
  sector: Sector;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
}

export interface PersonaGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function classifySector(persona: Persona, lang: SupportedLang): Sector {
  const occ = persona.occupation;
  if (lang === 'ko') return classifyKo(occ);
  if (lang === 'zh') return classifyZh(occ);
  return classifyEn(occ);
}

function classifyKo(occ: string): Sector {
  if (/변호사|법무|판사|검사|법관|법학/.test(occ)) return 'legal';
  if (/은행|금융|투자|회계|증권|보험|감사|신용/.test(occ)) return 'finance';
  if (/임원|부총|총괄|사장|대표|이사|CEO|CFO|CIO/.test(occ)) return 'executive';
  if (/공무|시청|구청|행정|관|규제|감독|군청/.test(occ)) return 'government';
  if (/교사|교수|강사|학원|보육|교육/.test(occ)) return 'education';
  if (/기자|편집|아나|블로|평론|미디어|작가|PD|방송|기획자/.test(occ)) return 'media';
  if (/개발|엔지니어|IT|보안|데이터|플랫폼|프로그래/.test(occ)) return 'tech';
  if (/간호|의사|치과|약사|돌봄|보건|병원/.test(occ)) return 'healthcare';
  if (/공장|기사|운전|운영|작업|기계|건설|용접|하역|적재|시설|조작원|기능공/.test(occ)) return 'industry';
  if (/판매|미용|배달|배송|서비스|식당|요리|조리|경비|청소|집배|상담원|보조원|비서/.test(occ)) return 'service';
  if (/은퇴|퇴직/.test(occ)) return 'retired';
  if (/무직|주부|학생|구직/.test(occ)) return 'citizen';
  return 'other';
}

function classifyZh(occ: string): Sector {
  if (/律师|法务|司法|法官|法院|破产管理人|清算|合规/.test(occ)) return 'legal';
  if (/银行|金融|投资|信贷|证券|担保|评级|会计|审计|资产管理|分析师|CFO/.test(occ)) return 'finance';
  if (/总裁|总经理|董事|创始|合伙|VP|总监|CEO|经理|主管|老板/.test(occ)) return 'executive';
  if (/政府|监管|证监|行政|官员|镇政府/.test(occ)) return 'government';
  if (/教师|教授|讲师|大学|教育/.test(occ)) return 'education';
  if (/记者|编辑|主编|播客|博主|媒体|评论/.test(occ)) return 'media';
  if (/工程师|IT|架构|安全|数据|开发|程序/.test(occ)) return 'tech';
  if (/医生|护士|医院|健康/.test(occ)) return 'healthcare';
  if (/工厂|车间|班组|物流|运输|建筑|生产|印刷/.test(occ)) return 'industry';
  if (/客服|物业|前台|保安|餐饮|服务/.test(occ)) return 'service';
  if (/退休/.test(occ)) return 'retired';
  if (/学生|在读/.test(occ)) return 'citizen';
  return 'other';
}

function classifyEn(occ: string): Sector {
  const o = occ.toLowerCase();
  if (/(lawyer|attorney|legal|paralegal|judge|counsel|law)/.test(o)) return 'legal';
  if (/(banking|financ|invest|audit|account|cfo|controller|treasur|insur|underwrit)/.test(o)) return 'finance';
  if (/(ceo|cio|cto|cdo|coo|cso|ciso|cco|cpo|chief|founder|president|vp|vice president|director|managing|program manager)/.test(o)) return 'executive';
  if (/(faa|tsa|dot|cisa|federal|government|inspector|regulat|policy|congressional|senator)/.test(o)) return 'government';
  if (/(professor|fellow|researcher|scientist|academic|university|teach|phd student|adjunct)/.test(o)) return 'education';
  if (/(report|journalist|editor|podcast|media|blogger|writer)/.test(o)) return 'media';
  if (/(engineer|architect|developer|security|data|machine learning|cybersec|soc analyst|tech lead|cloud)/.test(o)) return 'tech';
  if (/(doctor|nurse|epidemiolog|health|clinic|medic)/.test(o)) return 'healthcare';
  if (/(maintenance|technician|operator|pilot|controller|crew|ramp|ground|driver|construction|manufactur)/.test(o)) return 'industry';
  if (/(service|retail|hospitality|customer|union steward|procurement)/.test(o)) return 'service';
  if (/(retired)/.test(o)) return 'retired';
  if (/(student|apprentice|intern)/.test(o)) return 'citizen';
  return 'other';
}

export function buildPersonaGraph(
  personas: Persona[],
  lang: SupportedLang,
): PersonaGraph {
  const nodes: GraphNode[] = personas.map((p) => ({
    id: p.id,
    persona: p,
    province: p.province,
    generation: p.generation,
    sector: classifySector(p, lang),
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let edge: GraphEdge | null = null;
      if (a.province === b.province) {
        edge = { source: a.id, target: b.id, type: 'SAME_REGION_AS', weight: 1.0 };
      } else if (a.sector === b.sector && a.sector !== 'other') {
        edge = { source: a.id, target: b.id, type: 'SAME_SECTOR_AS', weight: 0.7 };
      } else if (a.generation === b.generation) {
        edge = { source: a.id, target: b.id, type: 'SAME_GENERATION_AS', weight: 0.4 };
      }
      if (edge) edges.push(edge);
    }
  }

  return { nodes, edges };
}

const GENERATION_ORDER = ['20s', '30s', '40s', '50s', '60s', '70s+'];
const PROVINCE_HUES: Record<string, number> = {};
let nextHue = 0;

export function provinceColor(province: string, generation: string): string {
  if (PROVINCE_HUES[province] === undefined) {
    PROVINCE_HUES[province] = (nextHue * 47) % 360;
    nextHue += 1;
  }
  const hue = PROVINCE_HUES[province];
  const genIdx = Math.max(0, GENERATION_ORDER.indexOf(generation));
  const lightness = 70 - genIdx * 7;
  return `hsl(${hue}, 70%, ${lightness}%)`;
}

export function extractName(persona: Persona, lang: SupportedLang): string {
  const p = persona.persona;
  if (lang === 'ko') {
    const m = p.match(/^(\S+?)\s*씨/);
    return m ? m[1] : p.slice(0, 6);
  }
  if (lang === 'zh') {
    const m = p.match(/^(.+?)(先生|女士|老师|博士|教授)/);
    return m ? m[1] : p.slice(0, 4);
  }
  const m = p.match(/^(?:Captain |Dr\. |Mr\. |Ms\. )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  return m ? m[1] : p.slice(0, 18);
}

export function edgeColor(type: EdgeType): string {
  switch (type) {
    case 'SAME_REGION_AS':
      return 'rgba(16, 185, 129, 0.55)';
    case 'SAME_SECTOR_AS':
      return 'rgba(99, 102, 241, 0.40)';
    case 'SAME_GENERATION_AS':
      return 'rgba(148, 163, 184, 0.25)';
  }
}
