# CyberSave — Product Requirements Document (PRD)

> Derived from full Figma export analysis (86 screens, 3 personas). Status: **Draft — pending manager sign-off on the open questions in §8.**

## 1. One-line pitch
CyberSave is a CSC (Common Service Centre) style digital platform where citizens submit government-service requests (Aadhaar, PAN, certificates, schemes) with documents through a mobile app; internal **operators** process those requests through the actual government portals on the citizen's behalf; and a **Super Admin** back office runs the whole operation (revenue, SLAs, operator management, support).

## 2. Problem statement
Applying for basic government documents in India today typically means: finding the right portal, understanding which documents are needed, standing in queues at a CSC/govt office, and tracking status manually. CyberSave's job is to **remove the queue and the guesswork** — the citizen just uploads documents and pays a small convenience fee; a trained human operator does the actual filing.

## 3. Business model (confirmed from screen evidence, not yet confirmed by manager — see §8)
- Every service has a **Government Fee** (fixed, set by the actual department) + a **Convenience Fee** (CyberSave's margin for doing the legwork), e.g. Birth Certificate: ₹50 govt fee + ₹5 convenience fee.
- This is the digitized version of the real-world **CSC / VLE (Village Level Entrepreneur)** model — a recognized, licensed network in India where an agent files paperwork on a citizen's behalf.
- **This means CyberSave itself does not need to be a UIDAI AUA/KUA.** A human operator interacts with the government portal directly (with their own authorized access, or the citizen's consent), so the platform's job is document intake, workflow, and status tracking — not government API integration. *(Confirm this reading with the manager — it's the single biggest assumption in this PRD.)*

## 4. Personas

| Persona | Who | Primary surface | Core need |
|---|---|---|---|
| **Citizen** | General public applying for services | Mobile app (React Native/Expo) | Apply for a service in minutes, without knowing govt portal quirks |
| **Operator / VLE** | Field agent or back-office staff who actually files the paperwork | Operator portal (web, or mobile later) | A clear queue of assigned applications, document checklist, SLA countdown |
| **Super Admin** | Platform/ops owner (internal Agumentik/CyberSave staff) | Admin web dashboard | Oversight of revenue, SLA compliance, operator performance, citizens, support |

## 5. Goals for v1
- A citizen can register, browse services, apply for **at least one full service end-to-end** (fill form → upload docs → review → pay → track status → download certificate).
- An operator can see assigned applications, verify documents, and change application status.
- A super admin can see a live dashboard, manage services/operators/citizens, and view analytics.
- Wallet exists for storing balance and paying fees; supports UPI/card/netbanking (via a real payment gateway sandbox, e.g. Razorpay).
- Support: FAQ + raise-ticket flow (chatbot and live-agent chat can be a later phase — see `phases.md`).

## 6. Non-goals for v1 (explicitly out of scope unless the manager says otherwise)
- Direct integration with UIDAI/NSDL/DigiLocker government APIs.
- Biometric authentication (fingerprint/Face ID) — UI can exist, backend can stub it.
- Multi-language runtime translation (design supports it; only English needs to actually work in v1).
- Real operator field/GPS/fleet features seen in `operator-permissions.pdf` (that screen appears to be a reused template from a logistics/fleet product — flag this to the manager, see §8).

## 7. Feature breakdown by module (mapped to the Figma screens)

### 7.1 Citizen App (React Native / Expo)
| Feature | Screens | Notes |
|---|---|---|
| Onboarding & auth | splash, onboarding 1-3, login, register, OTP, forgot-password, biometric, language | Mobile OTP is the primary login method |
| Home | screen-home | Quick actions, categories, popular services, scheme banner, recent applications |
| Services hub | screen-services-hub, screen-aadhaar-hub, screen-pan-hub, screen-certificates, screen-gov-schemes | Category → sub-service list → service detail |
| Application wizard | screen-2 through screen-6, screen-success | 5-step flow: Fill → Upload → Review → Pay → Success. **This is the single most important flow to get right.** |
| Applications tracker | screen-applications-all/in-progress/rejected-detail/details/download/empty | Status states: Submitted → Under Review → Processing → Approved → Completed / Rejected |
| Wallet | wallet-home, add-money, transaction-history, transaction-details, refund-details | Balance, top-up, linked bank account, refund journey |
| Support | screen-help-support, screen-faq, screen-live-chat, screen-raise-ticket, cyberbot-chat, screen-feedback | Chatbot + human handoff |
| Profile | Peersonal information, My Address, My documents, settings-screen, Frame(settings)/Frame-1(privacy), screen-about, screen-language | Includes a personal document vault |
| System states | screen-error, screen-no-internet, screen-loading-skeleton, screen-notifications-empty, screen-applications-empty | Must be built, not skipped — they're in the design for a reason |

### 7.2 Operator Portal
| Feature | Screens | Notes |
|---|---|---|
| Operator queue/dashboard | operator-screen | List/grid of operators (this looks like an admin-side "manage operators" view more than the operator's own working queue — clarify with manager, see §8) |
| Operator profile | operator-profile-screen, operator-permissions, operator-documents | Personal info, RBAC permissions, compliance documents |
| Application processing | application-detail (admin-side detail, reusable pattern) | Assign / Escalate / Reject / Approve, document verification, timeline log |

> **Gap identified:** the Figma set does not clearly include a citizen-facing "operator working queue" screen (i.e., what an operator sees when they log in to process today's assigned applications). `operator-screen.pdf` is an admin-style operator *directory*, not a task queue. Flag this gap to the manager — you likely need to design/build this screen yourselves.

### 7.3 Super Admin Dashboard (Web)
| Feature | Screens | Notes |
|---|---|---|
| Main dashboard | cybersave-admin-dashboard | Revenue, applications today, service share, collections, operator activity log |
| Applications management | applications-management, application-detail | Full pipeline view + per-application detail with approve/reject/escalate |
| Citizen management | citizen-management, citizen-detail-profile | Search/filter citizens, verify, block, per-citizen detail with services/docs/transactions |
| Services config | services-main-categories, add-new-service | Define services, SLA, fee, required-document checklist per service — **this is what should drive the citizen-side service detail screens dynamically** |
| Operators | operator-screen, operator-profile-screen, operator-permissions, operator-documents | Manage access, compliance, performance |
| Transactions | (wallet/transaction screens shared logically) | Revenue reconciliation |
| Notifications | notifications-screen, Send Notification Modal | Broadcast + targeted notification to citizens |
| Support tickets | support-tickets-screen, support-ticket-detail, support-ticket-resolution | Full ticket lifecycle with resolution + CSAT survey email preview |
| Analytics | analytics-screen | Document upload/verification trends |
| Audit log | audit-log-screen | Security/compliance event trail |
| Settings | settings-screen | Admin's own profile/security prefs |

## 8. Open questions for the next manager meeting
These directly change scope and architecture — get answers before building:
1. **Confirm the operating model**: does CyberSave ever call a real government API, or is it 100% human-operator-mediated (as this PRD assumes)?
2. Is this a **solo build or a team split** across the three personas?
3. Is the **operator's working queue** (the actual "my assigned tasks today" screen) missing from the Figma intentionally, or should we design it? -- yes
4. Some screens (`operator-permissions.pdf` — "Fleet Management," "Dispatch Operations," "Telematics Rules") look like they were copy-pasted from a **logistics/fleet-management product template**, not written for CyberSave. Confirm which fields are real requirements vs. template leftovers.
5. Storage/retention policy for uploaded KYC documents (see architecture.md §6 for the technical plan — need a business answer: how long do we keep documents after an application closes?).
6. Payment gateway account — do we have a Razorpay/Cashfree sandbox already, or do we need to set one up?
7. Priority order — which service (Aadhaar update / PAN / Birth Certificate) should be the first fully working end-to-end flow for a demo?

## 9. Real-world service catalog reference (researched, for building accurate forms)
The Figma's document lists per service are close to reality but not exhaustive. Use this as the source of truth when building the dynamic "required documents" checklist per service (Admin → Services → configure documents):

| Service | Real-world required documents (as of 2026) | Typical fee / SLA |
|---|---|---|
| **PAN — New Application** | Aadhaar card **+ one additional DOB proof** (birth certificate, Class 10 certificate, passport, voter ID, or affidavit) — this became mandatory from 1 April 2026, Aadhaar alone is no longer sufficient. Name/DOB/address must exactly match Aadhaar. | ₹91 (Indian address) via Protean/UTIITSL/IT e-filing portal; e-PAN in a few days |
| **PAN — Correction/Update** | Same as above + proof of the specific field being changed (e.g. marriage certificate for name change) | Similar fee, few days |
| **Aadhaar — Address Update** | One address proof: utility bill, rent agreement, bank statement, passport, ration card | Free/nominal via UIDAI; near-instant to a few days |
| **Aadhaar — Mobile/Name/DOB Update** | Requires biometric or OTP verification at a Seva Kendra for mobile update; ID proof for name; birth certificate/10th marksheet for DOB correction | Nominal fee, days |
| **Birth Certificate** | Hospital birth proof/discharge slip, parents' ID proof (Aadhaar/PAN), parents' marriage certificate, address proof | ~₹50, 7–15 days (matches Figma) |
| **Death Certificate** | Hospital/medical death proof, deceased's ID proof, informant's ID proof, address proof | ~₹50, 5–7 days |
| **Income Certificate** | Age proof (birth cert/school leaving cert/PAN), address proof (ration card/voter ID/utility bill), photo, proof of income (Form 16/ITR/salary slips) | ~₹30, 7–10 days |
| **Caste Certificate** | Application form, residence proof, birth certificate, ration card, income certificate, voter ID/Aadhaar, photograph, self-declaration affidavit, often a family/relative's existing caste certificate | ~₹30, 10–12 days |
| **Domicile/Residence Certificate** | Identity proof (Aadhaar/voter ID/PAN/passport), address proof (electricity/water bill, ration card, bank passbook), photograph, self-declaration | ~₹30, 7–10 days |

> Document requirements vary by state — the Services config screen (`add-new-service.pdf`) already anticipates this with a per-service "Required Documents" checklist builder, which is the right design. Build the citizen-side forms to read this config rather than hardcoding fields per service.

## 10. Success metrics (suggested — confirm with manager)
- % of applications completed within stated SLA
- Application drop-off rate at each wizard step (fill → upload → review → pay)
- Average operator turnaround time per service type
- Support ticket volume vs. total applications (lower is better — indicates a self-explanatory flow)