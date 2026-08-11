# CyberSave — Architecture

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Citizen mobile app | **React Native (Expo)** | Matches existing team skill; single codebase for iOS/Android |
| Admin dashboard + Operator portal | **React (Vite) web app** | Screens are clearly desktop/sidebar layouts, not mobile |
| Backend | **Node.js + Express**, split into microservices | Matches team skill; Render supports it natively |
| Database | **MongoDB Atlas** (one logical DB per service, or shared cluster with separate DBs) | Team already knows Mongoose/MERN |
| File/document storage | **Cloudflare R2 or Supabase Storage** (S3-compatible), never local disk | See §6 — KYC docs, cost, and compliance reasons |
| Cache / queues | **Redis** (Upstash free tier works on Render) + **BullMQ** for background jobs (payment reconciliation, notification sending, SLA breach checks) | Async work must not block API requests |
| Auth | **JWT** (access + refresh token), phone-OTP based for citizens, email+password for operators/admin | Matches the login screens exactly |
| Payments | **Razorpay** (or Cashfree) sandbox | Best India-first UPI/card/netbanking support |
| Notifications | **Firebase Cloud Messaging** (push) + an SMS/email provider (MSG91 / SendGrid) | Matches "Send Notification" admin feature |
| Deployment | **Render** — one Web Service per microservice + Static Site for admin web + Background Worker for BullMQ jobs | Per user's stated requirement |
| API Gateway | Lightweight **Express gateway service** (or Render's own routing + a single BFF) | Keeps mobile/web clients talking to one base URL |

## 2. Why microservices (and how many is sane for this team size)
The Figma reveals natural service boundaries already (Aadhaar, PAN, Certificates, Wallet, Support, Operators, Admin/Analytics). But **don't over-split for a small team** — start with these 7, not 15:

1. **auth-service** — registration, OTP, login, JWT issuance, role management (citizen/operator/admin)
2. **user-service** — citizen profiles, addresses, documents vault, operator profiles
3. **application-service** — the core: service catalog, application wizard state, status pipeline, SLA tracking (this is the heart of the product)
4. **document-service** — pre-signed upload/download URLs, virus-scan hook, document metadata (never the raw bytes — those live in object storage)
5. **payment-service** — wallet balance, top-ups, payment gateway webhook handling, transactions, refunds
6. **notification-service** — push/SMS/email dispatch, in-app notification center, admin broadcast
7. **support-service** — tickets, FAQ, chatbot (chatbot can start as a simple rules-based intent matcher against the FAQ content before any LLM is added)

The **admin dashboard reads from all services** through the gateway — it does not need its own service, it's a client, like the mobile app.

```
                        ┌──────────────────────┐
                        │   API Gateway (BFF)   │
                        └──────────┬────────────┘
        ┌──────────────┬───────────┼───────────┬──────────────┬─────────────┐
        ▼              ▼           ▼           ▼              ▼             ▼
   auth-service   user-service  application- document-   payment-    notification-
                                  service     service      service      service
                                     │                        │
                                     └────────► support-service
```

Each service:
- Owns its own MongoDB database (no cross-service direct DB reads — call the other service's API, or publish/consume an event).
- Talks to others **only** via REST calls through the gateway, or async events via Redis pub/sub (e.g., `application.status_changed` → notification-service sends push).
- Is independently deployable on Render as its own Web Service.

## 3. Core data models (simplified)

```
User (citizen)
  _id, phone, name, dob, gender, aadhaarMasked, panMasked, address[], role, isVerified

Operator
  _id, userId, employeeId, department, status(active/pending/suspended), permissions[]

Service (catalog, admin-configured)
  _id, name, category, department, govtFee, convenienceFee, slaHours,
  requiredDocuments: [{ name, mandatory, acceptedFormats }]

Application
  _id, applicationRefNo, citizenId, serviceId, status(submitted|under_review|processing|approved|completed|rejected),
  formData: {...}, documents: [documentId], assignedOperatorId, slaDeadline,
  timeline: [{ event, actorId, timestamp }], rejectionReason?

Document
  _id, ownerId, applicationId?, storageKey, originalName, mimeType, sizeBytes,
  category(id_proof/address_proof/other), verifiedStatus, expiresAt?

Wallet
  _id, citizenId, balance, linkedAccounts: [...]

Transaction
  _id, walletId, applicationId?, type(credit/debit/refund), amount, gatewayRef, status

Ticket
  _id, citizenId, subject, description, category, priority, status, thread: [{ senderId, message, timestamp }]

Notification
  _id, recipientId, type, title, body, read, createdAt
```

## 4. The application wizard — state handling
This is the highest-value flow in the product (screens 2–6). Recommended approach:
- Treat the 5-step wizard as **one draft `Application` document with `status: "draft"`**, saved incrementally (matches the "Save Draft" button in screen-3).
- Each step `PATCH`es the same draft (`/applications/:id`) rather than holding all state client-side until the end — this avoids losing 20 minutes of a citizen's work if the app crashes.
- Only on the payment success webhook does status flip `draft → submitted`, and the SLA clock (`slaDeadline`) starts.

## 5. Folder structure

### Backend (monorepo, one folder per service — simplest for a small team on Render)
```
cybersave-backend/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   ├── validators/       (zod schemas)
│   │   │   ├── config/
│   │   │   └── app.js
│   │   ├── .env.example
│   │   └── package.json
│   ├── application-service/  (same structure)
│   ├── document-service/
│   ├── payment-service/
│   ├── notification-service/
│   ├── support-service/
│   └── user-service/
├── gateway/
│   └── src/ (route proxying, auth middleware, rate limiting)
├── shared/
│   └── (shared TS types / zod schemas / constants published as a local package)
└── render.yaml
```

### Mobile app (Expo, feature-based)
```
cybersave-app/
├── app/                     (expo-router file-based routes)
│   ├── (auth)/login, otp, register...
│   ├── (tabs)/home, services, applications, wallet, profile
│   └── (application)/[serviceId]/step-1..5
├── src/
│   ├── components/          (shared UI: Button, Card, StatusBadge, Stepper, UploadTile)
│   ├── features/
│   │   ├── services/
│   │   ├── applications/
│   │   ├── wallet/
│   │   └── support/
│   ├── api/                 (one file per backend service, axios/fetch clients + React Query hooks)
│   ├── store/                (Zustand — auth state, draft application state)
│   ├── theme/                (colors, spacing, typography tokens — see design.md)
│   └── utils/
├── app.json
└── package.json
```

### Admin/Operator web (React + Vite)
```
cybersave-admin/
├── src/
│   ├── pages/ (Dashboard, Applications, Citizens, Services, Operators, Tickets, Analytics, AuditLog, Settings)
│   ├── components/
│   ├── api/
│   ├── store/
│   └── theme/
```

## 6. Document storage plan (KYC files)
Full detail already discussed, summarized here as the binding decision:
- Object storage (Cloudflare R2 to start — S3-compatible, no egress fees), private bucket, encryption at rest on.
- Upload flow: client requests a pre-signed PUT URL from `document-service` → uploads directly to bucket → `document-service` stores only the key + metadata in Mongo.
- Download/view flow: pre-signed GET URL, expires in minutes, generated on demand after an auth check.
- Images get resized/compressed server-side (or client-side before upload) to cap typical uploads around 300–500KB.
- Retention: auto-archive/delete documents N days after an application reaches `completed`/`rejected` (N = business decision, see prd.md §8).

## 7. Auth & RBAC
- Citizen: phone + OTP → JWT with `role: citizen`.
- Operator/Admin: email + password (+ optionally 2FA, as shown in `settings-screen.pdf`) → JWT with `role: operator | admin | super_admin`.
- Gateway middleware checks role per route group (`/citizen/*`, `/operator/*`, `/admin/*`).
- Operator `permissions[]` (seen in `operator-permissions.pdf`) drives fine-grained UI/action gating within the operator role — but **only build the permission categories that are actually about CyberSave** (application verification, document audit) — ignore the fleet/dispatch/telematics permissions, they're template leftovers (flag to manager).

## 8. Deployment on Render
- One **Web Service** per backend microservice (auto-deploy from its folder via `render.yaml` with `rootDir`).
- One **Background Worker** for BullMQ (notification dispatch, SLA-breach checker cron, document retention cleanup).
- One **Static Site** for the admin React build.
- Mobile app is not deployed to Render — it's built via **EAS Build** and shipped to TestFlight/Play Console (or run via Expo Go during development).
- Shared **Environment Group** on Render for secrets common to all services (JWT secret, Mongo URI base, Redis URL); per-service groups for the rest.
- MongoDB Atlas and Redis (Upstash) are external managed services, not on Render itself.

## 9. Third-party integrations checklist (to confirm with manager)
- [ ] Payment gateway sandbox account (Razorpay/Cashfree) - razorpay
- [ ] SMS/OTP provider (MSG91, Twilio Verify, or Firebase Phone Auth)  - whichever is free
- [ ] Object storage account (R2/Supabase) - supabase
- [ ] Push notification setup (FCM project) - fcm