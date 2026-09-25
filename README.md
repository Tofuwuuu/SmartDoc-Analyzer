# SmartDoc Analyzer

Upload a PDF or scan and get the extracted text, OCR for images, named entities and keywords, and rule-based contract risk flags.

The public demo runs entirely in the browser on Vercel. The file is not uploaded. The FastAPI backend is for local use only and is not deployed.

## Live demo (Vercel)

The static Vite app does the work:

- PDF text with pdf.js. A page with almost no text layer is rendered and read with OCR.
- Image OCR with tesseract.js (the OCR engine and English language data are loaded in the browser).
- Named entities and keywords with compromise.
- Contract risk flags with a TypeScript port of `backend/app/services/compliance.py`.

There is no account, database, or API in this build. "Try a sample document" loads a short bundled contract. Uploads are limited to 5 MB and 10 pages.

### Deploy

Import this repository in Vercel. Do not set a custom root unless you intend to use `frontend/` as the project root.

- Repository root: `vercel.json` installs and builds `frontend/`, and publishes `frontend/dist`.
- Project root `frontend/`: `frontend/vercel.json` builds the Vite app the same way.

No Vercel environment variables are required. Do not set `VITE_API_URL`. If that variable is present at build time, the frontend calls the FastAPI backend instead of analyzing in the browser, and the live demo would depend on a server that is not deployed.

`backend/railway.json` has been removed. This project is not deployed to Railway, Render, Fly, or any container host.

## What the browser build does differently from the local API

The contract rules match the Python service. `frontend/src/analysis/compliance.test.ts` compares the TypeScript port to output from `backend/app/services/compliance.py`.

These parts are not the same engine, so their output can differ:

- Entities and keywords come from compromise, not spaCy `en_core_web_sm`. Labels are `PERSON`, `ORG`, and `PLACE`. The keyword list is noun terms, not spaCy lemmas.
- Sentence counts use compromise's sentence splitter.
- The overview sentence uses the same shape as the Python summary (word count, sentence count, top entities), but the entity names inside it follow compromise.
- PDF text comes from pdf.js, not PyMuPDF, so spacing can differ.
- OCR comes from tesseract.js, not the Tesseract binary used by the API, so a scan can read slightly differently.

## Run the browser demo locally

```bash
cd frontend
npm install
npm test
npm run dev
```

Open http://localhost:5173. Leave `VITE_API_URL` unset.

To check the production build the way Vercel will:

```bash
cd frontend
npm run build
npm run preview
```

`npm run preview` serves `dist` with no API. Try the sample contract, then upload `frontend/public/samples/sample-scan.png`.

## Run the FastAPI backend locally

The API still extracts text with PyMuPDF and Tesseract, runs spaCy, stores documents in Postgres, and caches by file hash in Redis. Upload, list, and every per-document route require a signed-in user, and a document is returned only to its owner. `JWT_SECRET` has no default and rejects `change-me-in-production`.

Docker Compose builds the frontend with `VITE_API_URL`, so that image talks to the local API. It is not the Vercel demo.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend (API mode): http://localhost:5173
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

The API container runs `alembic upgrade head` before Uvicorn. Sign up in the UI, then upload. Anonymous upload and the shared document list are no longer available.

### API without Docker

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Postgres, Redis, and the `tesseract-ocr` binary must already be running. Set `JWT_SECRET` in `backend/.env` before starting. Point a frontend at it with `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000/api/v1
```

Then `npm run dev` in `frontend/`.

## Environment variables

### Vercel

None.

### Frontend (`frontend/.env`, local API mode only)

| Variable | Description |
|---|---|
| `VITE_API_URL` | FastAPI base URL, including `/api/v1`. Unset means in-browser analysis. |

### Backend (`backend/.env`, local API only)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://smartdoc:smartdoc@localhost:5432/smartdoc` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `JWT_SECRET` | Required signing secret, at least 16 characters | none |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Access token lifetime in minutes | `10080` (7 days) |
| `SPACY_MODEL` | spaCy model name | `en_core_web_sm` |
| `UPLOAD_DIR` | Local upload directory | `uploads` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size for the local API | `25` |
| `CACHE_TTL_SECONDS` | Redis cache TTL | `86400` |
| `CORS_ORIGINS` | Allowed origins (JSON array or comma-separated) | `http://localhost:5173,http://localhost:3000` |
| `DEBUG` | Include exception details in 500 responses | `false` |

### Root (`.env`, Docker Compose)

| Variable | Description |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres credentials for the `db` service |
| `VITE_API_URL` | Build arg for the Docker frontend image only |

## Local API

All routes are under `/api/v1`. Errors return `{"detail": "message"}`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/documents/upload` | Required | Upload a PDF or image. Processing is synchronous. |
| `GET` | `/documents` | Required | List documents owned by the current user. |
| `GET` | `/documents/{id}` | Required | Metadata and extracted text. 404 if it is not owned by the caller. |
| `GET` | `/documents/{id}/insights` | Required | Entities, overview, and risk flags. 404 if it is not owned by the caller. |
| `POST` | `/auth/register` | None | Create a user (`email`, `password`). |
| `POST` | `/auth/login` | None | Exchange credentials for a JWT. |
| `GET` | `/health` | None | API, database, and Redis status. |

Contract flags (missing clauses, auto-renewal, long or upfront payment terms, conflicting governing law) are keyword and regex rules. They are a review aid, not legal advice. The overview is word and sentence counts plus top entities, not generated prose.

## Project structure

```
frontend/          Vite app. This is what Vercel builds.
  public/samples/  Bundled contract PDF and a sample scan
  src/analysis/    pdf.js, tesseract.js, compromise, contract rules, tests
backend/           FastAPI app for localhost / Docker only
vercel.json        Static build for a Vercel project at the repo root
docker-compose.yml Local API stack
```

Regenerate the sample PDF, sample scan, and compliance fixture (from the repo root, with Pillow installed):

```bash
python3 frontend/scripts/generate_samples.py
```

## License

[MIT](LICENSE).
