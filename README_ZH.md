<p align="center">
  <img src="static/image/mirollama.png" width="480" alt="mirollama" />
</p>

# mirollama

<p align="center">
  <a href="https://github.com/oswarld/mirollama/stargazers"><img src="https://img.shields.io/github/stars/oswarld/mirollama?style=flat-square&color=yellow" alt="stars" /></a>
  <a href="https://github.com/oswarld/mirollama/watchers"><img src="https://img.shields.io/github/watchers/oswarld/mirollama?style=flat-square&color=blue" alt="watchers" /></a>
  <a href="https://github.com/oswarld/mirollama/network/members"><img src="https://img.shields.io/github/forks/oswarld/mirollama?style=flat-square&color=blue" alt="forks" /></a>
  <img src="https://img.shields.io/badge/Docker-Build-blue?style=flat-square&logo=docker" alt="docker" />
</p>

<p align="center">
  <a href="https://x.com/oswarld_oz"><img src="https://img.shields.io/badge/X-Follow-black?style=flat-square&logo=x" alt="X" /></a>
  <a href="https://linkedin.com/in/oswarld"><img src="https://img.shields.io/badge/LinkedIn-Follow-blue?style=flat-square&logo=linkedin" alt="LinkedIn" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_ZH.md">中文文档</a> | <a href="README_KO.md">한국어 가이드</a>
</p>

**本地优先的 AI 智能体情景仿真工作台。**
mirollama 是一个本地优先（Local-first）的 AI 智能体仿真工作台，把你的文档转化为基于场景的仿真。
上传文档，描述一个情境，让本地 LLM 驱动的智能体仿真不同利益相关方可能的反应。

> mirollama 不是聊天机器人。
> 它是一个情景实验室（Scenario Lab）。

---

## 在线体验

我们提供基于本地固定 PDF 的静态演示，无需安装 Ollama 即可走完整条流水线（图谱构建 → 角色生成 → 仿真 → 报告）。每种语言对应不同的场景文档与角色画像：

- 🇨🇳 **中文** — 第一次债权人会议公告：[https://mirollama-local-fund-demo.vercel.app/live-demo/zh](https://mirollama-local-fund-demo.vercel.app/live-demo/zh)
- 🇺🇸 **English** — FAA AI 认证研究计划：[https://mirollama-local-fund-demo.vercel.app/live-demo/en](https://mirollama-local-fund-demo.vercel.app/live-demo/en)
- 🇰🇷 **한국어** — 2026 地方消亡应对基金：[https://mirollama-local-fund-demo.vercel.app/live-demo/ko](https://mirollama-local-fund-demo.vercel.app/live-demo/ko)

演示是有意保持静态的。要使用自己的文档运行真正的多智能体仿真，请按下方本地部署步骤操作。

---

## 5 分钟本地启动

```bash
# 1. 安装 Ollama 并下载最低基线模型（约 19GB）
ollama pull gemma4:31b
ollama serve   # 在 http://localhost:11434/v1 暴露 OpenAI 兼容 API

# 2. 克隆仓库与配置
git clone https://github.com/oswarld/mirollama.git
cd mirollama
cp .env.example .env

# 3. 安装全部依赖（root + frontend + backend）
npm run setup:all

# 4. 同时启动前后端
npm run dev
```

打开 `http://localhost:3000` 进入 UI，访问 `http://localhost:5001/health` 确认后端。

> mirollama 以 **`gemma4:31b` 为最低基线模型**。更小的模型（7B–20B）虽然能跑，但本体抽取、角色生成与多智能体叙事质量会显著下降。最低基线对应的硬件要求见下方[系统要求](#系统要求)。

---

## 仓库结构
- `backend/` — Python（Flask）后端，通过 `uv` 启动
- `frontend/` — 主 Web UI（Vue 3 + Vite）
- `local-fund-demo/` — 上方在线体验所部署的静态 Next.js 控制台
- `persona-dashboard/` — 辅助 UI 工具（可选）

---

## mirollama 想解决什么

大多数 AI 工具回答**一个问题，给一个答案**。
mirollama 仿真的是**"在这种情境下，人们会怎么反应"**。

可以探索的问题示例：
- 新产品上线时，客户、竞品、媒体可能怎么反应？
- 大学若推出严格的 AI 使用政策，学生、教授、行政如何反应？
- 政府发布新监管，民众、产业、媒体如何反应？
- 公司内部战略备忘录在不同部门会被如何解读？
- 围绕某个市场、政策或社会议题，舆论会如何随时间演变？

核心工作流：
```text
文档 + 情境
        ↓
本体生成（实体 / 关系抽取）
        ↓
智能体角色生成
        ↓
多智能体仿真
        ↓
报告与洞察
```

---

## 为什么本地优先

情景仿真常涉及敏感信息，例如：
- 内部文档
- 未公开的战略
- 研究材料
- 客户数据
- 政策草案
- 私人备忘

mirollama 默认通过 **Ollama** 调用本地 LLM，意味着：
- 不强制使用云端 LLM API
- 敏感文档不外流
- 离线环境也可运行
- 支持 OpenAI 兼容的本地端点
- 外部图谱/搜索工具按需可选接入

---

## 推荐模型

mirollama 在更强的本地模型上效果更好。最低基线是 **`gemma4:31b`** —— 比它更小的模型（7B / 13B / 20B / 26B）能运行，但本体、角色与多智能体叙事的质量会明显变薄。

| 模型 | 适用场景 | 磁盘大小 | 运行内存 |
|-------|------|-----|------|
| `gemma4:31b` | **最低基线 — 从这里开始** | ~19 GB (q4_K_M) | ~22–24 GB 统一内存 / VRAM |
| `gpt-oss:120b` | 高质量、复杂多方仿真 | ~70 GB (q4) | ~80 GB 统一内存 / VRAM |
| `gpt-oss:20b` | 资源受限 — 能跑但推理偏弱 | ~12 GB | ~14–16 GB |

```bash
# 最低基线（推荐起点）
ollama pull gemma4:31b

# 高质量（需工作站/服务器级 GPU）
ollama pull gpt-oss:120b
```

低于基线的模型（`gemma4:26b`、`gpt-oss:20b`、`llama3:8b` 等）可用于早期本地试用，但官方不保证完整仿真流水线效果。

---

## 系统要求

下方最低配置以 **`gemma4:31b`** 为准。运行 `gpt-oss:120b` 等 70B+ 模型，请按约 4 倍内存预估。

### macOS（Apple Silicon）
| | 最低（gemma4:31b） | 推荐 | 备注 |
|---|---|---|---|
| 芯片 | M1 Max / M2 Pro / M3 Pro | M2 Max / M3 Max / M4 Pro+ | 通过 Metal 推理，无需 CUDA |
| 统一内存 | **24 GB** | 32 GB+ | 16 GB Mac 无法把 31B 模型装入内存 |
| 磁盘 | 30 GB 可用 | 多模型部署 100 GB+ | |

### Windows / Linux（NVIDIA）
| | 最低（gemma4:31b） | 推荐 | 备注 |
|---|---|---|---|
| GPU | RTX 3090 / 4090 / A5000 | RTX 6000 Ada / A6000 / 双 3090 | **VRAM 24 GB** 是 31B 实用下限 |
| 系统内存 | 32 GB | 64 GB+ | 后端 + 前端 + Ollama + 浏览器 |
| CPU | 现代 6 核 | 现代 8 核 | |
| 操作系统 | Windows 11 / Ubuntu 22.04+ | 同左 | 安装 CUDA 工具链 |
| 磁盘 | 30 GB 可用 | 100 GB+ | |

### CPU-only / Intel Mac
理论上 64 GB+ RAM 可用，但 `gemma4:31b` 在多数消费级 CPU 上响应低于每秒 1 token，仅适合离线批处理实验。

### 软件先决条件
- Node.js 20+（18 也可，建议 20+）
- Python 3.11+
- [`uv`](https://github.com/astral-sh/uv)（后端 Python 包管理器）
- [Ollama](https://ollama.com) 已在本地运行
- 已下载模型（最低 `gemma4:31b`）

---

## 本地部署（详细）

### 1. 安装 Ollama 并下载基线模型
从 [https://ollama.com](https://ollama.com) 安装 Ollama 后：

```bash
# 19 GB 下载 — 请确认磁盘与内存足够
ollama pull gemma4:31b

# 在 http://localhost:11434/v1 启动 OpenAI 兼容 API
ollama serve
```

验证连通性：
```bash
curl http://localhost:11434/v1/models
```

### 2. 克隆仓库
```bash
git clone https://github.com/oswarld/mirollama.git
cd mirollama
```

### 3. 配置环境
```bash
cp .env.example .env
```

最低本地基线 `.env`：
```dotenv
# Ollama OpenAI 兼容端点
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_NAME=gemma4:31b

# 本地 Ollama 不强制要求 LLM_API_KEY。仅当代理或自托管网关需要
# 鉴权时再取消注释。
# LLM_API_KEY=ollama

# 搜索提供方
# none：纯本地（不联网搜索）
# searxng：自托管 SearXNG
SEARCH_PROVIDER=none
SEARXNG_BASE_URL=
WEB_SEARCH_LANGUAGE=zh-CN
WEB_SEARCH_LIMIT=10
```

### 4. 安装依赖
```bash
npm run setup:all   # 安装 root + frontend + backend(uv sync)
```

只装某一端：
```bash
npm run setup           # root + frontend
npm run setup:backend   # backend (uv sync)
```

### 5. 启动 mirollama
```bash
npm run dev
```

- 前端：`http://localhost:3000`
- 后端：`http://localhost:5001`
- 健康检查：`http://localhost:5001/health`

### 6. 端到端验证
1. 把一个短 PDF 或 Markdown 文件拖到上传区
2. 输入一句话情境（例如：*"仿真该政策若下月通过，三个城市群体可能怎么反应"*）
3. 观察流水线：本体 → 角色 → 仿真 → 报告
4. 若卡在"图谱构建"或角色生成，多半是模型过小或显存/统一内存不足 —— 把模型升到 `gemma4:31b`，并关掉占用 GPU/Metal 的其他程序

---

## npm 脚本
- `npm run setup` — 安装 root + frontend 依赖
- `npm run setup:backend` — 用 `uv` 安装后端依赖
- `npm run setup:all` — 安装全部依赖
- `npm run dev` — 同时运行前后端
- `npm run backend` — 仅后端
- `npm run frontend` — 仅前端
- `npm run build` — 构建前端生产包

---

## 工作原理

1. **上传文档** — PDF / Markdown / 纯文本
   常见类型：政策草案 / 市场报告 / 产品简报 / 研究笔记 / 会议纪要 / 社区帖 / 新闻 / 内部战略文档

2. **描述情境** — 告诉 mirollama 仿真什么
   示例：*"仿真大学推出严格 AI 政策时，学生、教授、行政与媒体的反应"*

3. **生成本体** — 自动从文档抽取实体类型、利益相关方类型、关系
   - 实体类型：`Student`、`Professor`、`Administrator`、`Journalist`、`Parent`、`OnlineCommunityMember` …
   - 关系类型：`supports`、`criticizes`、`influences`、`reports_on`、`reacts_to` …

4. **生成智能体画像** — 把抽取出的实体与利益相关方变成 AI 智能体
   每个智能体具备：角色 / 背景 / 动机 / 信念 / 记忆 / 行为倾向

5. **运行仿真** — 智能体在类似 Twitter / Reddit 的社交媒体环境中互动
   行为：发帖 / 评论 / 点赞·点踩 / 转发 / 关注 / 回应他人 / 观点随时间漂移

6. **生成报告** — 总结仿真过程
   关键叙事 / 涌现的冲突 / 利益相关方反应 / 风险信号 / 潜在机会 / 综合洞察

---

## 模式

### 本地模式（默认）
```dotenv
SEARCH_PROVIDER=none
```
- 配置最简单
- 无外部图谱记忆
- 无云依赖
- 私密文档仿真
- **推荐起点**

### SearXNG 模式
```dotenv
SEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://localhost:8080
```
让仿真融入外部搜索结果，同时避开商业搜索 API。

---

## 应用案例

### 1. 产品发布仿真
**上传**：产品简报、用户调研、定价表、竞品分析
**情境**：*若以高于预期的价格发布，早期采用者 / 企业买家 / 竞品 / KOL 会怎么反应*
**输出**：客户兴趣与异议、价格敏感度、竞品叙事、风险信号、上市策略洞察

### 2. 政策反应仿真
**上传**：政策草案、公众调查、新闻、利益方声明
**情境**：新 AI 监管政策的公众反应
**输出**：支持者叙事、批评者关切、媒体框架、社区反应、政治社会风险

### 3. 大学 AI 政策仿真
**上传**：AI 使用政策、学生调查、教务会议纪要、学术诚信指南
**情境**：严格作业政策下，学生、教授、助教、行政如何反应
**输出**：学生公平性担忧、教师分歧、行政风险管理、舆情风险、沟通策略建议

### 4. 市场叙事仿真
**上传**：分析师报告、公司公告、行业新闻、社区讨论
**情境**：重大战略发布后投资者、分析师、散户、媒体的反应
**输出**：多空叙事、误读风险、信息缺口、叙事时间演变

---

## Docker

仓库自带 Docker Compose 配置：
```bash
docker compose up -d
```
默认端口：前端 `3000`、后端 `5001`。上传与生成产物挂载到 `./backend/uploads`。

> 当前镜像配置可能仍指向上游 MiroFish 镜像。如直接基于 mirollama 开发，建议从源码运行。

---

## API 概览
- 健康检查：`GET /health`
- 生成本体：`POST /api/graph/ontology/generate`
- 构建图谱：`POST /api/graph/build`
- 创建仿真：`POST /api/simulation/create`
- 准备仿真：`POST /api/simulation/prepare`
- 生成报告：`POST /api/report`

---

## 优化仿真效果的建议

### 情境要具体
不佳：*"分析这个文档"*
更好：*"仿真该产品若以高于预期的价格发布，客户、竞品与媒体会怎么反应"*

### 上传上下文丰富的文档
更好的仿真来自更好的上下文：
- 背景信息
- 利益相关方描述
- 对立观点
- 既往事件
- 市场或社会背景

### 复杂仿真请用更大模型
- 复杂文档 / 微妙情境：`gpt-oss:120b`
- 一般本地测试（最低基线）：`gemma4:31b`

### 国家专属角色数据集（可选）
如需国家特化角色，可从 Hugging Face 下载到本地：
- 韩国：[https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)

推荐本地路径：`Nemotron-Personas-Korea/`

⚠️ 不要把 `.arrow` 文件提交到 Git。大数据集请仅保留在本地缓存/存储中。

---

## 安全说明

mirollama 设计用于**本地优先实验**。若把后端暴露到公网，请务必配置：
- 鉴权
- CORS
- Secret key
- 上传大小限制
- 文件校验
- 网络限制

不要把敏感文档放在无鉴权的公开部署中。

---

## License
MIT

---

## 致谢

mirollama 是 [666ghj](https://github.com/666ghj) 的 [MiroFish](https://github.com/666ghj/MiroFish) 的衍生作品。
