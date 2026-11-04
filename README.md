# SmartDoc Analyzer

Drop in a PDF or a scan. You get the text back, OCR for images, names and keywords, and flags for risky contract terms.

The [live demo](https://smartdoc-analyzer.vercel.app) runs entirely in your browser, so nothing gets uploaded. "Try a sample document" loads a short contract. Limits are 5 MB and 10 pages.

The Python backend in this repo does the same job with spaCy, which finds more kinds of entities, and stores documents per user.

## Run the full app

```bash
cp .env.example .env
docker compose up --build
docker compose exec api alembic upgrade head
docker compose exec api python -m app.seed
```

The API container already runs `alembic upgrade head` before it starts, so the third line is a safety net. The seed creates `demo@example.com` / `smartdoc-demo`, or you can sign up in the app. The `.env` is optional; without it Compose uses local defaults, including a dev-only `JWT_SECRET`.

Open http://localhost:5173. API docs are at http://localhost:8000/docs and health at http://localhost:8000/api/v1/health. Stop with `docker compose down`.

Upload `samples/sample-contract.pdf` to see every rule fire. It's a made-up contract; its text is in `samples/sample-contract.txt`. Rebuild it with `python3 backend/scripts/make_sample_contract.py` (needs PyMuPDF).

## Run just the browser version

```bash
cd frontend && npm install && npm test && npm run dev
```

Leave `VITE_API_URL` unset. If it's set, the frontend calls the API instead of doing the work itself. `npm run build && npm run preview` serves the production build with no API.

## Browser vs. API

Both read contract rules from `shared/contract-rules.json`, and `frontend/src/analysis/compliance.test.ts` checks the TypeScript checker against that file and against output from `compliance.py`. The rest is different code, so results can differ:

- Browser: pdf.js for text, tesseract.js for scans, compromise for entities (`PERSON`, `ORG`, `PLACE`), noun keywords, and sentence splitting.
- API: PyMuPDF, the Tesseract binary, spaCy `en_core_web_sm` with lemmas. It stores documents in Postgres and caches by file hash in Redis.

The overview line is word count, sentence count and top entities in both. It isn't generated text.

Contract flags cover missing clauses, auto-renewal, long or upfront payment terms and conflicting governing law. They're keyword and regex rules, a review aid and not legal advice.

## API without Docker

You need Postgres, Redis and `tesseract-ocr` running.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env   # set JWT_SECRET
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Then put `VITE_API_URL=http://localhost:8000/api/v1` in `frontend/.env` and run `npm run dev` there.

`JWT_SECRET` has no default outside Docker. It needs 16+ characters, and the API refuses `change-me-in-production`, `secret`, `changeme`, and the old values from `backend/.env.example`.

Everything except register, login and health needs a signed-in user, and you only ever see your own documents.

| Method | Path | |
|---|---|---|
| `POST` | `/api/v1/documents/upload` | PDF or image, processed synchronously |
| `GET` | `/api/v1/documents` | Your documents |
| `GET` | `/api/v1/documents/{id}` | Metadata and text, 404 if not yours |
| `GET` | `/api/v1/documents/{id}/insights` | Entities, overview, risk flags |
| `POST` | `/api/v1/auth/register` | `email`, `password` |
| `POST` | `/api/v1/auth/login` | Returns a JWT |
| `GET` | `/api/v1/health` | API, database and Redis status |

Errors look like `{"detail": "message"}`.

Backend settings (`backend/.env`): `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_ALGORITHM` (`HS256`), `JWT_EXPIRE_MINUTES` (`10080`), `SPACY_MODEL`, `UPLOAD_DIR` (`uploads`), `MAX_UPLOAD_SIZE_MB` (`25`), `CACHE_TTL_SECONDS` (`86400`), `CORS_ORIGINS`, `DEBUG`. Root `.env` for Compose: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `VITE_API_URL`.

## Deploying

Import the repo into Vercel. The root `vercel.json` builds `frontend/` and publishes `frontend/dist`, or set the project root to `frontend/` and its own `vercel.json` does the same. No env vars, and don't set `VITE_API_URL`. The backend isn't deployed anywhere.

## Layout

```
frontend/          Vite app, what Vercel builds
  public/samples/  sample contract PDF and scan
  src/analysis/    pdf.js, tesseract.js, compromise, rule checker
shared/            contract-rules.json
backend/           FastAPI, local and Docker only
samples/           sample contract for the API
```

`python3 frontend/scripts/generate_samples.py` regenerates the sample PDF, scan and compliance fixture (needs Pillow).

MIT. See [LICENSE](LICENSE).
