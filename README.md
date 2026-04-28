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

**Local-first scenario simulation with AI agents.**
mirollama is a local-first AI agent simulation workbench that turns your documents into scenario-based simulations.
Upload documents, describe a situation, and let local LLM-powered agents simulate how different stakeholders may react.
> mirollama is not a chatbot.  
> It is a scenario lab.
---
## Quickstart

### Prerequisites
- Node.js >= 18 (recommended: 20+)
- Python (for the backend) and `uv` installed

### Run (dev)
```bash
npm run setup:all
npm run dev
```

### Run (frontend only)
```bash
npm run setup
npm run frontend
```

## Repository layout
- `backend/`: Python backend (run via `uv`)
- `frontend/`: main web app UI
- `local-fund-demo/`: static Next.js demo console grounded by `local_100M.pdf`
- `persona-dashboard/`: supporting UI tooling (if applicable)

## Demos

### Local fund demo (static)
The `local-fund-demo/` package is a self-contained static demo to showcase the end-to-end “pipeline narrative” (graph build → personas → simulation → report) using a fixed source PDF.

```bash
cd local-fund-demo
npm install
npm run dev
```

Open:
- `http://localhost:3000/` (landing)
- `http://localhost:3000/console` (live console)
- `http://localhost:3000/local_100M.pdf` (source document)

## What is mirollama?
mirollama helps you explore possible reactions, narratives, conflicts, and stakeholder dynamics before they happen.
Instead of asking one AI model for a single answer, mirollama creates multiple AI agents from your documents and lets them interact inside a simulated environment.
You can use mirollama to explore questions like:
- How might customers react to a new product launch?
- How might students, professors, and administrators respond to a new university policy?
- How might different communities react to a controversial announcement?
- How might internal teams interpret a strategic memo?
- How might public opinion evolve around a market, policy, or social issue?
mirollama is designed for people who want to test scenarios, not just generate text.
---
## Core idea
Most AI tools answer a question.
mirollama helps you simulate a situation.
The basic workflow is simple:
```text
Documents + Scenario
        ↓
Ontology generation
        ↓
Agent profile generation
        ↓
Multi-agent simulation
        ↓
Report and insights
```

You provide the context. mirollama builds the simulation environment.

---

## How it works

1. Upload documents  
   Upload PDFs, Markdown files, or plain text documents.

   These documents may include:
   - Policy drafts
   - Market reports
   - Product briefs
   - Research notes
   - Meeting summaries
   - Community posts
   - News articles
   - Internal strategy documents

2. Describe the simulation scenario  
   Tell mirollama what you want to simulate.

   Example:
   - Simulate how students, professors, administrators, and media might react if a university introduces a strict AI usage policy.

3. Generate ontology  
   mirollama analyzes the uploaded documents and extracts important entity types, stakeholder types, and relationships.

   For example:
   - Entity types:
     - Student
     - Professor
     - Administrator
     - Journalist
     - Parent
     - Online community member
   - Relationship types:
     - supports
     - criticizes
     - influences
     - reports_on
     - reacts_to

4. Create agent profiles  
   mirollama turns extracted entities and stakeholder types into AI agent profiles.

   Each agent can have:
   - Role
   - Background
   - Motivation
   - Beliefs
   - Memory
   - Behavioral tendency

5. Run simulation  
   Agents interact in a social-media-like environment inspired by Twitter and Reddit dynamics.

   They may:
   - Create posts
   - Comment
   - Like or dislike
   - Repost
   - Follow
   - React to other agents
   - Shift opinions over time

6. Generate report  
   mirollama summarizes what happened during the simulation.

   The report may include:
   - Key narratives
   - Emerging conflicts
   - Stakeholder reactions
   - Risk signals
   - Possible opportunities
   - Summary insights

---

## Why local-first?
Many scenario simulations involve sensitive information.

You may want to test ideas using:
- Internal documents
- Unreleased strategies
- Research materials
- Client data
- Policy drafts
- Private notes

mirollama is designed to work with local LLMs through Ollama by default.

This means:
- No mandatory cloud LLM API
- Better privacy for sensitive documents
- Local experimentation
- OpenAI-compatible local endpoint support
- Optional integration with external graph/search tools

---

## Recommended models
mirollama works best with larger and more capable local models.

We currently recommend the following Ollama models for best performance:
- `gpt-oss:120b`
- `gpt-oss:20b`
- `gemma4:31b`
- `gemma4:26b`

Best quality:
```bash
ollama pull gpt-oss:120b
```

Balanced option:
```bash
ollama pull gpt-oss:20b
```

Alternative models:
```bash
ollama pull gemma4:31b
ollama pull gemma4:26b
```

---

## System requirements

### Minimum & Recommended Specifications

**macOS**
* **Minimum:** Apple Silicon (M1/M2/M3) with 16GB Unified Memory or Intel Mac with 32GB RAM.
* **Recommended:** Apple Silicon (M1/M2/M3 Max/Ultra) with 32GB+ Unified Memory for larger models (e.g., 30B+).
* **Note:** Apple Silicon can run local models via Metal. NVIDIA VRAM guidance below mainly applies to Windows/Linux.

**Windows**
* **Minimum:** Windows 10/11, Intel i5 / AMD Ryzen 5, 16GB RAM, NVIDIA GPU with 8GB VRAM (RTX 3060 or equivalent).
* **Recommended:** Windows 11, Intel i7 / AMD Ryzen 7, 32GB+ RAM, NVIDIA GPU with 16GB+ VRAM (RTX 4080/4090 or equivalent) for optimal local LLM performance.

**Linux**
* **Minimum:** Ubuntu 20.04+, 16GB RAM, NVIDIA GPU with 8GB VRAM.
* **Recommended:** Ubuntu 22.04+, 32GB+ RAM, NVIDIA GPU with 16GB+ VRAM, CUDA toolkit installed.
* **Note:** CPU-only works for small models but ontology + multi-agent simulation quality improves significantly with more VRAM.

### Software Prerequisites:

* Node.js 18+
* Python 3.11+
* uv
* Ollama
* Sufficient RAM/VRAM for the selected model

Model requirements vary depending on the model size.

For smaller local machines, start with:
`gpt-oss:20b`

For stronger workstations or servers, use:
`gpt-oss:120b`

---

## Quick start (detailed)

1. Install Ollama  
   Install Ollama from: https://ollama.com

   Pull a recommended model:
   ```bash
   ollama pull gpt-oss:20b
   ```

   Make sure Ollama is running:
   ```bash
   ollama serve
   ```

   Default OpenAI-compatible endpoint:
   - `http://localhost:11434/v1`

2. Clone the repository
   ```bash
   git clone https://github.com/oswarld/mirollama.git
   cd mirollama
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   ```

   Example `.env` configuration:
   ```dotenv
   # Local-first defaults
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_MODEL_NAME=gpt-oss:20b

   # Search provider
   # none: offline local mode
   # searxng: self-hosted web search
   SEARCH_PROVIDER=none
   SEARXNG_BASE_URL=
   WEB_SEARCH_LANGUAGE=ko-KR
   WEB_SEARCH_LIMIT=10
   ```

4. Install dependencies
   ```bash
   npm run setup:all
   ```

5. Run mirollama
   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5001`
   - Health check: `http://localhost:5001/health`

---

## Available scripts
 - `npm run setup`: Install root and frontend dependencies.
 - `npm run setup:backend`: Install backend dependencies with `uv`.
 - `npm run setup:all`: Install all dependencies.
 - `npm run dev`: Run frontend and backend together.
 - `npm run backend`: Run backend only.
 - `npm run frontend`: Run frontend only.
 - `npm run build`: Build frontend for production.

---

## Modes
mirollama supports multiple operating modes.

### Local mode
Local mode is the default mode.

```dotenv
SEARCH_PROVIDER=none
```

In local mode, mirollama uses your uploaded documents and local LLM to generate simulation artifacts.

Use local mode when you want:

* Simple setup
* Local-first experimentation
* No external graph memory
* No cloud dependency
* Private document-based simulation

This is the recommended starting point.

---

### SearXNG mode

```dotenv
SEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://localhost:8080
```

Use SearXNG mode when you want to connect mirollama with a self-hosted search engine.

This can help simulations incorporate external search results while still avoiding commercial search APIs.

---

## Example use cases

### 1. Product launch simulation

Upload:

* Product brief
* Customer research
* Pricing document
* Competitor analysis

Scenario:

Simulate how early adopters, enterprise buyers, competitors, and influencers might react to a new AI productivity tool launch.

Possible output:

* Customer excitement and objections
* Pricing sensitivity
* Competitor narrative
* Risk signals
* Go-to-market insights

---

### 2. Policy reaction simulation

Upload:

* Policy draft
* Public survey
* News articles
* Stakeholder statements

Scenario:

Simulate public reaction to a new government AI regulation policy.

Possible output:

* Supporter narratives
* Critic concerns
* Media framing
* Online community reactions
* Political and social risks

---

### 3. University AI policy simulation

Upload:

* AI usage policy
* Student survey
* Faculty meeting notes
* Academic integrity guidelines

Scenario:

Simulate how students, professors, teaching assistants, and administrators might react to a strict AI assignment policy.

Possible output:

* Student fairness concerns
* Faculty disagreement
* Administrative risk management
* Media controversy potential
* Suggested communication strategy

---

### 4. Market narrative simulation

Upload:

* Analyst reports
* Company announcement
* Industry news
* Community discussions

Scenario:

Simulate how investors, analysts, retail traders, and media might react to a major strategic announcement.

Possible output:

* Bullish and bearish narratives
* Misinterpretation risks
* Information gaps
* Narrative shift over time

---

## Project structure

```text
mirollama
├── backend
│   ├── app
│   │   ├── api
│   │   ├── models
│   │   ├── services
│   │   └── utils
│   ├── scripts
│   ├── uploads
│   └── run.py
│
├── frontend
│   ├── src
│   │   ├── views
│   │   ├── router
│   │   ├── components
│   │   └── services
│   └── package.json
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Backend overview

The backend is built with Flask.

Core API groups:
```text
/api/graph
/api/simulation
/api/report
```

Main responsibilities:

* File upload
* Text extraction
* Ontology generation
* Graph construction
* Agent profile generation
* Simulation preparation
* Simulation execution
* Report generation

---

## Frontend overview

The frontend is built with Vue 3 and Vite.

Main views include:

* Home
* Process
* Simulation
* Simulation Run
* Report
* Interaction

The frontend is designed as a workflow interface for moving from documents to simulation results.

---

## Docker

A Docker Compose configuration is included.
```bash
docker compose up -d
```

Default ports:
- Frontend: `3000`
- Backend: `5001`

Uploaded files and generated artifacts are mounted to:

./backend/uploads

Note: depending on the current image configuration, Docker may use the upstream MiroFish image. If you are developing mirollama directly, running from source is recommended.

---

## API overview
- Health check: `GET /health`
- Generate ontology: `POST /api/graph/ontology/generate`
- Build graph: `POST /api/graph/build`
- Create simulation: `POST /api/simulation/create`
- Prepare simulation: `POST /api/simulation/prepare`
- Generate report: `POST /api/report`

---

## Recommended first test

If this is your first time running mirollama, try the following setup:
```dotenv
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_NAME=gpt-oss:20b
SEARCH_PROVIDER=none
WEB_SEARCH_LANGUAGE=ko-KR
```

Then upload a short Markdown or text file and use a simple scenario such as:

Simulate how different stakeholders might react to this announcement.

For best results, include documents that clearly describe:

* The situation
* The stakeholders
* The conflict or decision
* The expected environment
* The purpose of the simulation
 
---

## Tips for better simulations

### Use specific scenarios
Less effective:
```text
Analyze this document.
```

More effective:
```text
Simulate how customers, competitors, and media might react if this product launches at a higher price than expected.
```

### Upload context-rich documents
Better simulations come from better context. Good documents include:
- Background information
- Stakeholder descriptions
- Conflicting opinions
- Prior events
- Market or social context

### Use stronger models for complex simulations
- Complex documents / nuanced scenarios: `gpt-oss:120b`
- General local testing: `gpt-oss:20b`

### Optional persona datasets by country
If you need country-specific persona datasets, download them from Hugging Face and keep them local.

Example:
- Korea: https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea

Recommended local path:
- `Nemotron-Personas-Korea/`

Important:
- Do not commit `.arrow` files to Git.
- Keep large dataset files in local cache/storage only.

---

## Roadmap

Planned improvements:

* Live demo page
* Better local-only entity extraction
* More example simulation templates
* Improved report visualization
* Better Korean-language simulation examples
* Built-in demo datasets
* More simulation environments
* Cleaner Docker image under the mirollama namespace
* Exportable reports
* Scenario comparison mode

---

## Security note

mirollama is designed for local-first experimentation.

If you expose the backend to the public internet, make sure to configure:

* Authentication
* CORS
* Secret key
* Upload limits
* File validation
* Network restrictions

Do not expose sensitive documents through an unsecured public deployment.

---

## License
MIT

---

## Credits

mirollama is a derivative work based on MiroFish by 666ghj.
