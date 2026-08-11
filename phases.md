# CyberSave — Delivery Phases

Assumption: this is scoped for one developer (you) unless the manager confirms a team split (see prd.md §8, question 2). If it's a team, phases 2–4 can run in parallel by persona instead of sequentially.

## Phase 0 — Alignment & setup (before writing app code)
**Goal:** don't build the wrong thing.
- Get answers to prd.md §8 open questions from the manager.
- Set up: monorepo/multi-repo structure, Render project + environment groups, MongoDB Atlas cluster, Expo project, admin React project.
- Extract design tokens from Figma (colors, spacing, type scale) into `design.md` / a shared theme file.
- Stand up `auth-service` skeleton + gateway skeleton, deploy "hello world" to Render to validate the deployment pipeline early (cheap to catch Render config issues now, expensive later).

## Phase 1 — Citizen app core (MVP walking skeleton)
**Goal:** one full service, start to finish, works for a real citizen.
**Screens covered:** splash, onboarding 1-3, login, OTP, register, home, services-hub, one service hub (Certificates), screen-2 through screen-6, screen-success, screen-applications-all/details, screen-error, screen-no-internet, screen-loading-skeleton, screen-applications-empty.
- Auth: phone + OTP registration/login.
- Home + services hub navigation (static service list is fine here, config-driven comes in Phase 2).
- Application wizard for **one** service end-to-end (recommend Birth Certificate — it's the one with the most complete Figma reference: screens 2–6).
- Application status tracking (submitted → ...).
- Payment integration in sandbox mode (Razorpay test keys) — this unblocks the whole revenue-facing flow early.
- Document upload wired to real object storage (not local disk) from day one.

**Exit criteria:** a real person can register, apply for a birth certificate, upload real documents, pay a test transaction, and see it in "My Applications."

## Phase 2 — Service catalog + more services
**Goal:** the app stops being hardcoded to one service.
**Screens covered:** screen-aadhaar-hub, screen-pan-hub, screen-gov-schemes, services-main-categories (admin), add-new-service (admin).
- Build `application-service`'s service catalog (admin-configurable name, fee, SLA, required-document list) — from PRD §9's researched document lists.
- Citizen-side service detail + wizard becomes **data-driven** from this catalog instead of hardcoded fields.
- Add 2–3 more services this way (Aadhaar Address Update, PAN New Application) to prove the config-driven approach actually works before assuming it for all 30+.

**Exit criteria:** adding a new service (with its own document checklist) requires no app-code changes, only an admin-side config entry.

## Phase 3 — Wallet & profile
**Screens covered:** wallet-home, add-money, transaction-history, transaction-details, refund-details, Personal information, My Address, My documents, settings-screen, Frame/Frame-1 (settings & privacy), screen-about, screen-language, notifications-screen, screen-notifications-empty.
- Full wallet: top-up, linked accounts, transaction history, refund tracking.
- Profile: personal info, address book, personal document vault, settings, privacy/consent screen.
- Push + in-app notification center.

## Phase 4 — Operator portal
**Screens covered:** application-detail (as operator working view), operator-profile, operator-permissions (CyberSave-relevant subset only), operator-documents.
- Operator login (email/password, not phone OTP).
- **Build the missing "my queue" screen** (flagged as a gap in prd.md) — list of applications assigned to this operator, sorted by SLA urgency.
- Document verification action (approve/reject individual documents), application status transitions, escalation.
- Operator's own compliance document upload (their ID, certifications).

## Phase 5 — Super Admin dashboard
**Screens covered:** cybersave-admin-dashboard, applications-management, citizen-management, citizen-detail-profile, operator-screen (as admin directory view), Send Notification Modal, analytics-screen, audit-log-screen.
- Main dashboard with the KPI cards + charts (revenue, applications, service share, collections, operator activity log) — can start with real aggregation queries, doesn't need to be real-time/websocket for v1.
- Citizen management: search/filter/verify/block, per-citizen detail view.
- Operator management: directory, manage access, suspend.
- Targeted + broadcast notifications.
- Audit log (should already have data flowing in from Phase 1 onward if you log actions correctly from day one — don't leave this to the end).

## Phase 6 — Support system
**Screens covered:** screen-help-support, screen-faq, screen-live-chat, screen-raise-ticket, cyberbot-chat, screen-feedback, support-tickets-screen (admin), support-ticket-detail, support-ticket-resolution.
- FAQ (static content is fine for v1).
- Raise-ticket flow (citizen) → ticket queue (admin) → resolution flow with the citizen-facing status update.
- Chatbot: start as a simple rules/intent-matching bot against FAQ content (the Figma's example exchanges — "How do I update my address" → canned helpful answer + quick-reply chips) before considering any LLM integration. This is enough to match the designed screens.
- Live chat can be de-scoped to "Phase 7 / stretch" if time is tight — it needs a real-time layer (Socket.io) that nothing else in the product requires, so it's the best candidate to cut if the deadline is tight.

## Phase 7 — Hardening & polish
- Security pass against `rules.md` §3 (rate limits, audit logging coverage, encryption verification).
- Load-check the paginated list endpoints with realistic data volumes (don't wait until 48,392 fake citizens exist to discover an unpaginated query).
- Document retention job actually running, not just designed.
- Empty/error/no-internet states verified on every screen that fetches data, not just the ones explicitly designed for it.
- Final Figma-vs-build visual QA pass.
