# mirollama

Local-first multi-agent simulation and prediction engine.

## Project Origin

This project is a derivative work of:

- Upstream: `https://github.com/666ghj/MiroFish.git`
- Target repository: `https://github.com/oswarld/mirollama`

This repository is tuned for the easiest onboarding path:

- Run a local Ollama model
- Clone the repo
- Install dependencies
- Start both services

No paid API key is required for the default local setup.

## What You Get

- Frontend UI (Vite + Vue) for graph build, simulation, report, and interaction
- Flask backend APIs for simulation workflows
- Local-first LLM execution through Ollama's OpenAI-compatible endpoint
- Optional search providers (`none`, `searxng`, `zep`)

## Architecture

- Frontend: `frontend` (Vite dev server, default port `3000`)
- Backend: `backend` (Flask API, default port `5001`)
- Root scripts: install and run frontend/backend together
- Shared env file: root `.env` (loaded by backend)

## Prerequisites

Install these first:

- Node.js `>=18`
- Python `>=3.11`
- `uv` (Python package/dependency runner)
- Ollama (running locally)

Quick checks:

```bash
node -v
python --version
uv --version
ollama --version
```

## Fastest Onboarding (Recommended)

### 1) Clone

```bash
git clone https://github.com/oswarld/mirollama.git mirollama
cd mirollama
```

### 2) Start Ollama And Pull A Model

Use one model that exists in `.env.example`:

- `gpt-oss:120b`
- `gpt-oss:20b`
- `gemma4:31b`
- `gemma4:26b`

Example:

```bash
ollama pull gpt-oss:20b
```

Ollama endpoint expected by default:

- `http://localhost:11434/v1`

### 3) Configure `.env`

Copy defaults:

```bash
cp .env.example .env
```

Default mode is fully local/offline-friendly:

- `LLM_BASE_URL=http://localhost:11434/v1`
- `SEARCH_PROVIDER=none`
- `LLM_API_KEY` can stay unset for local Ollama

Only change `LLM_MODEL_NAME` if you pulled a different model tag.

### 4) Install Dependencies

One command:

```bash
npm run setup:all
```

Equivalent step-by-step:

```bash
npm run setup
npm run setup:backend
```

### 5) Run

```bash
npm run dev
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`
- Health check: `http://localhost:5001/health`

## Optional Modes

### Use SearXNG For Web Search

Set in `.env`:

```env
SEARCH_PROVIDER=searxng
SEARXNG_BASE_URL=http://localhost:8080
WEB_SEARCH_LANGUAGE=ko-KR
WEB_SEARCH_LIMIT=10
```

### Use Zep Cloud

Set in `.env`:

```env
SEARCH_PROVIDER=zep
ZEP_API_KEY=your_zep_api_key_here
```

`ZEP_API_KEY` is required only when `SEARCH_PROVIDER=zep`.

### Run Services Separately

```bash
npm run backend
npm run frontend
```

## Docker

The repository includes `docker-compose.yml`:

```bash
cp .env.example .env
docker compose up -d
```

Published ports:

- `3000` (frontend)
- `5001` (backend)

## Troubleshooting

### `uv: command not found`

Install `uv`, then rerun:

```bash
npm run setup:backend
```

### Backend fails with `LLM_API_KEY is not configured`

You are likely using a non-local LLM endpoint.

- For Ollama: keep `LLM_BASE_URL` as `http://localhost:11434/v1`
- For cloud endpoint: set `LLM_API_KEY` in `.env`

### Backend starts but generation fails

Usually model tag mismatch.

- Check your pulled models: `ollama list`
- Ensure `.env` `LLM_MODEL_NAME` matches exactly

### Port already in use

Free ports `3000` / `5001`, or override:

- Backend: `FLASK_PORT=<new_port>`
- Frontend API target: `VITE_API_BASE_URL=http://localhost:<backend_port>`

## Tech Stack

- Frontend: Vue 3, Vite, Vue Router, Vue i18n, Axios, D3
- Backend: Flask, OpenAI SDK-compatible client, CAMEL/OASIS dependencies
- Runtime model provider: Ollama (default), or any OpenAI-compatible API

## License And Attribution

- This project is licensed under the MIT License (see `LICENSE`).
- This repository is a derivative work based on `666ghj/MiroFish`.
- Upstream repository: `https://github.com/666ghj/MiroFish.git`
- Current repository: `https://github.com/oswarld/mirollama`
- Derivative notices and attribution details: `NOTICE`

## Notes For Contributors

- Keep root `.env` as the single source for runtime config
- Preserve local-first defaults unless explicitly changing product direction
- If you change setup scripts or env keys, update this README in the same PR
