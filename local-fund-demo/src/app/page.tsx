"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Database, 
  Cpu, 
  Activity, 
  FileText, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GraphAnimation from './GraphAnimation';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const PIPELINE_STEPS = [
  { id: 1, title: 'Graph Build', desc: '정책 보도자료 지식 추출 & 지역 데이터 GraphRAG 구성', icon: Database },
  { id: 2, title: 'Env Setup', desc: '89개 인구감소지역 페르소나 및 평가위원회 에이전트 주입', icon: Cpu },
  { id: 3, title: 'Start Simulation', desc: '투자계획(시설 vs 사람) 다층 평가 및 인구유입 병렬 시뮬레이션', icon: Activity },
  { id: 4, title: 'Report Generation', desc: '2026년 기금 배분액(우수 120억 등) 및 성과 리포트 생성', icon: FileText },
  { id: 5, title: 'Deep Interaction', desc: '평가위원장 및 선정 지자체 에이전트와 심층 질의응답', icon: MessageSquare },
];

const MOCK_LOGS = [
  "[System] Initializing Engine: LocalFund-Simulator-V0.1",
  "[Graph Build] Reading source 'local_100M.pdf'...",
  "[Graph Build] Extracted reality seeds: 89 인구감소지역, 18 관심지역",
  "[Graph Build] Constructing GraphRAG with 2026 funding criteria...",
  "[Env Setup] Generating personas for local governments...",
  "[Env Setup] Injecting specific agents: 하동군(청년/마을), 화순군(주거/돌봄), 영월군(로컬창업)...",
  "[Env Setup] Evaluation Committee Agent deployed.",
  "[Simulation] Starting dual-platform parallel simulation...",
  "[Simulation] Evaluating paradigm shift: '시설 조성' -> '사람 중심(인구유입)'",
  "[Simulation] '화순군 24시 어린이 돌봄시스템' - High impact on population influx detected.",
  "[Simulation] '하동군 청년협력가 양성' - Sustainable local ecosystem verified.",
  "[Simulation] Filtering out low-performance hardware-only projects...",
  "[Report Generation] Compiling final evaluation grades (S, A, B, 우수)...",
  "[Report Generation] Allocating budget: 우수지역 120억 (8개소) 확정.",
  "[Report Generation] Report generated successfully.",
  "[System] Transitioning to Deep Interaction mode...",
];

export default function MirofishConsoleDemo() {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("지방소멸대응기금을 '단순 시설 조성'에서 '사람/소프트웨어 중심'으로 개편했을 때, 지자체별 평가 등급(우수, S, A, B)과 예산 배분액(120억 등)의 결과는 어떻게 도출되는가?");
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (!isRunning) return;

    let logIndex = 0;
    setLogs([]);

    const logInterval = setInterval(() => {
      if (logIndex < MOCK_LOGS.length) {
        setLogs(prev => [...prev, MOCK_LOGS[logIndex]]);
        
        // Update steps based on logs progress to sync animation
        if (logIndex === 1) setCurrentStep(1);
        if (logIndex === 4) setCurrentStep(2);
        if (logIndex === 7) setCurrentStep(3);
        if (logIndex === 12) setCurrentStep(4);
        if (logIndex === 15) setCurrentStep(5);
        
        logIndex++;
      } else {
        clearInterval(logInterval);
        setIsRunning(false);
      }
    }, 800); // 0.8s per log line

    return () => clearInterval(logInterval);
  }, [isRunning]);

  const handleStart = () => {
    if (isRunning) return;
    setCurrentStep(0);
    setIsRunning(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-mono selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f0f11] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded flex items-center justify-center border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">LocalFund <span className="font-light text-slate-500">Predict Anything</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isRunning ? "bg-amber-400" : "bg-emerald-400")}></span>
              <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isRunning ? "bg-amber-500" : "bg-emerald-500")}></span>
            </span>
            <span className={isRunning ? "text-amber-400" : "text-emerald-400"}>
              {isRunning ? "System Running" : "System Ready"}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Engine: LocalFund-V0.1</span>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-73px)]">
        
        {/* Left Column: Pipeline & Inputs */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          
          {/* Input Parameters */}
          <div className="bg-[#121214] border border-slate-800 rounded-xl p-5 flex flex-col shrink-0">
            <h2 className="text-slate-100 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-blue-400" />
              Input Parameters
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isRunning}
              className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none h-32 disabled:opacity-50"
              placeholder="What would public opinion look like if..."
            />
            <button
              onClick={handleStart}
              disabled={isRunning || !prompt.trim()}
              className={cn(
                "mt-4 w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all",
                isRunning 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:shadow-[0_0_20px_rgba(5,150,105,0.5)]"
              )}
            >
              {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              {isRunning ? "SIMULATING..." : "START SIMULATION"}
            </button>
          </div>

          {/* Pipeline Steps */}
          <div className="bg-[#121214] border border-slate-800 rounded-xl p-5 flex-1 overflow-y-auto">
            <h2 className="text-slate-100 font-semibold mb-6 text-sm uppercase tracking-wider">Simulation Pipeline</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              {PIPELINE_STEPS.map((step) => {
                const isPast = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative flex items-start gap-4">
                    <div className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 bg-[#121214]",
                      isPast ? "border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(5,150,105,0.3)]" : 
                      isCurrent ? "border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]" : 
                      "border-slate-800 text-slate-600"
                    )}>
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : 
                       isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                       <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className={cn(
                        "font-bold text-sm tracking-wide transition-colors duration-300 flex items-center gap-2",
                        isPast || isCurrent ? "text-slate-200" : "text-slate-600"
                      )}>
                        <span className="text-xs font-mono opacity-50">0{step.id}</span>
                        {step.title}
                      </div>
                      <p className={cn(
                        "text-xs mt-1.5 leading-relaxed transition-colors duration-300",
                        isPast || isCurrent ? "text-slate-400" : "text-slate-700"
                      )}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Console & Reports */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          
          {/* Console Output */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl flex flex-col h-1/2 relative overflow-hidden shadow-inner">
            <div className="bg-[#121214] border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Execution Logs</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1.5">
              {logs.length === 0 && !isRunning && (
                <div className="text-slate-600 italic">Waiting for simulation to start...</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">[{new Date().toISOString().substring(11, 19)}]</span>
                  <span className={cn(
                    log.includes('Report') ? "text-emerald-400" : 
                    log.includes('Simulation') ? "text-blue-400" : 
                    log.includes('Graph') ? "text-purple-400" : 
                    "text-slate-300"
                  )}>
                    {log}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Deep Interaction / Report Output */}
          <div className="bg-[#121214] border border-slate-800 rounded-xl flex-1 flex flex-col relative overflow-hidden">
            {currentStep < 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 relative z-10 bg-[#121214]/50 backdrop-blur-[1px]">
                <Cpu className="w-12 h-12 mb-4 opacity-20" />
                <p>Simulation data will appear here...</p>
              </div>
            ) : currentStep < 4 ? (
              <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Graph Animation Background */}
                <div className="absolute inset-0 bg-[#0a0a0a] overflow-hidden">
                  {currentStep >= 1 && <GraphAnimation />}
                </div>

                <div className="relative z-10 flex-1 flex flex-col p-6 pointer-events-none">
                  {/* View PDF Section during Graph Build */}
                  {currentStep === 1 && (
                    <div className="animate-in fade-in zoom-in duration-700 bg-[#121214]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-4 mb-4 shadow-2xl mx-auto w-full max-w-2xl pointer-events-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-emerald-400 font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Source Document Extracted
                        </h3>
                        <a 
                          href="/local_100M.pdf" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          View PDF <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="bg-[#0a0a0a] rounded p-3 text-xs text-slate-400 font-mono border border-slate-800 h-32 overflow-y-auto">
                        <p className="mb-2 text-slate-300 font-bold">[2026년 지방소멸대응기금 1조, 시설이 아닌 '사람 중심'으로 쓰입니다]</p>
                        <p className="mb-1">- 지역별 투자계획 평가를 거쳐 지방소멸대응기금 1조 원 배분계획 발표</p>
                        <p className="mb-1">- 시설 조성에서 인구유입 효과가 있는 사업 중심으로 기금 운용체제 개편</p>
                        <p className="mb-1">□ 행정안전부는 12월 3일 지역별 투자계획 평가를 거쳐 2026년도 지방소멸대응기금 배분금액을 확정했다고 밝혔다.</p>
                        <p className="mb-1 text-emerald-500">... GraphRAG Construction In Progress ...</p>
                      </div>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="mt-auto self-center bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full px-6 py-3 flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="font-mono text-sm text-emerald-100">
                      {currentStep === 1 && "Building Knowledge Graph from Source..."}
                      {currentStep === 2 && "Injecting 89 Regional Personas..."}
                      {currentStep === 3 && "Running Dual-Platform Parallel Simulation..."}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-700">
                {/* Report Header */}
                <div className="border-b border-slate-800 p-4 bg-emerald-950/20">
                  <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    2026 지방소멸대응기금 평가 리포트 생성 완료
                  </h3>
                </div>
                
                {/* Report Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-slate-800 bg-[#0a0a0a] p-4 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1">우수 지역 (120억 배분)</div>
                      <div className="text-2xl font-bold text-slate-100">8개 지자체</div>
                      <div className="text-xs text-emerald-500 mt-2">하동군, 화순군, 영월군, 완도군 등</div>
                    </div>
                    <div className="border border-slate-800 bg-[#0a0a0a] p-4 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1">평가 핵심 키워드</div>
                      <div className="text-lg font-bold text-blue-400">사람, 청년, 주거, 돌봄</div>
                      <div className="text-xs text-slate-500 mt-2">단순 하드웨어 중심에서 S/W 중심 전환</div>
                    </div>
                  </div>

                  {currentStep === 5 && (
                    <div className="border-t border-slate-800 pt-6 mt-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Deep Interaction Session</h4>
                      
                      {/* Fake Chat UI */}
                      <div className="space-y-4 mb-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-800/50">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="bg-[#0a0a0a] border border-slate-800 p-3 rounded-lg rounded-tl-none text-sm text-slate-300">
                            "화순군의 '만원 보금자리' 사업이 높은 점수를 받은 핵심 요인이 무엇인가요?"
                          </div>
                        </div>
                        <div className="flex gap-3 flex-row-reverse">
                          <div className="w-8 h-8 rounded bg-emerald-900/50 flex items-center justify-center shrink-0 border border-emerald-800/50">
                            <Activity className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg rounded-tr-none text-sm text-emerald-200/90 max-w-[80%]">
                            [ReportAgent]: 화순군의 경우 기존 주거 인프라(건물) 신축에 예산을 쓰지 않고, 
                            빈집과 기존 임대주택을 활용하여 '월 1만원'이라는 파격적인 정책(소프트웨어)으로 청년과 신혼부부의 실질적인 유입을 끌어냈습니다. 
                            이는 평가위원회의 '사람 중심' 패러다임에 완벽히 부합하여 S등급 이상의 우수 평가를 견인했습니다.
                          </div>
                        </div>
                      </div>

                      {/* Chat Input */}
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

      {/* Footer Warning */}
      <footer className="fixed bottom-0 w-full bg-amber-500/10 border-t border-amber-500/20 py-2 px-6 flex items-center justify-center gap-2 z-50 backdrop-blur-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <p className="text-xs text-amber-500/90 font-medium">
          ⚠ This page is a static demo only. Deep interaction with Agents is not connected to an LLM.
        </p>
      </footer>
    </div>
  );
}
