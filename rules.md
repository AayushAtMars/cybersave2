# CyberSave — Engineering Rules

Purpose: a short, opinionated list so decisions don't get re-litigated every PR. When in doubt, prefer boring and consistent over clever.

## 1. Use
- **TypeScript** everywhere it's practical (backend services, admin web). For the Expo app, at minimum type the API layer and shared models even if some UI files stay JS during rapid prototyping.
- **Zod** for request validation on every backend route, and to define the shared "shape of truth" for models — reuse the same schema on frontend forms where possible.
- **Zustand** for RN client state (auth, draft application) — matches existing team experience, avoid introducing Redux.
- **React Query** for all server data fetching/caching on both mobile and admin web — do not hand-roll `useEffect` + `fetch` data loading.
- **Feature-based folders**, not type-based (`features/wallet/` not scattered `screens/`, `hooks/`, `api/` at the root for every feature).
- **Pre-signed URLs** for all file upload/download — client never sends file bytes through your API server, and your server never serves a public permanent file link.
- **Environment variables** for every secret and every base URL — `.env.example` committed, `.env` gitignored, per-service.
- **Idempotency keys** on payment-related endpoints (so a retried request doesn't double-charge or double-credit a wallet).
- **Pagination** (cursor or page-based) on every list endpoint that can grow large (applications, citizens, transactions, audit log) — the admin screens all show large counts (12,847 applications, 48,392 citizens); an unpaginated endpoint will fall over.
- **Structured status enums** for application/ticket state (not free-text strings) — the whole product is a state machine, treat it like one.
- **Optimistic UI + draft-save** on the application wizard (see architecture.md §4) so a citizen never loses form progress.

## 2. Avoid
- **Never store uploaded files on local/server disk.** No `multer` disk storage in production. This is the #1 rule — Render's filesystem is ephemeral and wipes on redeploy.
- **Never call another microservice's database directly.** Cross-service data access goes through that service's API or an event, never a shared Mongoose model imported across service boundaries.
- **Never hardcode a government-fee or document-requirement list in frontend code.** It must come from `application-service`'s service catalog (admin-configurable), because these already vary by state/service and will change.
- **Never build a real UIDAI/NSDL/DigiLocker API integration without written manager + legal sign-off.** Default assumption is the CSC/operator-mediated model (see prd.md) — mock these integrations until told otherwise.
- **Avoid over-splitting microservices.** 7 is enough for this team size (see architecture.md §2). Don't spin up a new service per screen.
- **Avoid putting business logic in controllers.** Controllers parse/validate input and call a service/model layer; keep controllers thin and testable.
- **Avoid logging PII** (Aadhaar numbers, phone numbers, document contents) in plaintext — mask before logging (`XXXX-XXXX-4521` pattern already used in the UI, reuse it in logs too).
- **Avoid skipping the empty/error/loading states.** They're designed on purpose (`screen-error`, `screen-no-internet`, `screen-applications-empty`, `screen-loading-skeleton`) — build them alongside the happy path, not as an afterthought.
- **Avoid copy-pasting the fleet/logistics-sounding fields** from `operator-permissions.pdf` (Fleet Management, Dispatch, Telematics) without confirming they're real requirements — see prd.md §8.
- **Avoid committing secrets, `.env` files, or Postman collections with real tokens** to the repo.

## 3. Security baseline (non-negotiable for a KYC-document product)
- HTTPS only, `helmet` on every Express service, strict CORS allow-list (no `*`).
- Rate-limit auth and OTP endpoints specifically (brute-force target).
- Encrypt object storage at rest (enable on the bucket, don't rely on defaults being right — verify).
- Access to any citizen's document requires an auth check tied to that citizen's ID or an operator/admin role with an audit-logged action (the `audit-log-screen.pdf` design implies this is already an expected feature, not optional).
- Document retention: implement the auto-cleanup job from day one, even with a placeholder retention period, so it's not bolted on later under compliance pressure.

## 4. API conventions
- REST, resource-based paths: `/applications/:id`, not `/getApplicationById`.
- Consistent response envelope: `{ success, data, error }`.
- Version the gateway routes from day one: `/api/v1/...` — cheap now, painful to retrofit later.
- Every error response includes a stable `errorCode` string (not just an HTTP status) so the frontend can branch on it reliably (e.g. `DOCUMENT_TOO_LARGE`, `SLA_BREACHED`).

## 5. Git & process
- Branch naming: `feature/<service>-<short-desc>`, `fix/<short-desc>`.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`) — keeps a changelog possible later without extra work.
- No direct pushes to `main`; PR + at least a self-review checklist (does it handle the empty/error state? does it validate input? does it avoid storing files on disk?).
- Keep `phases.md` up to date as the actual source of truth for "what's done" — don't let it drift from reality.