# CyberSave — Design Reference

> Extracted by visual inspection of the Figma export. Treat colors as **approximate starting values** — pull exact hex codes from the Figma file itself (Inspect panel) before finalizing a theme file; don't ship guessed values to production.

## 1. Visual language
- Primary brand color: **deep blue → mid blue gradient** (splash screen, home header, admin sidebar accents, primary buttons). Approx `#0B3D91` → `#2563EB`.
- Background: white/off-white cards on a very light gray app background (`#F5F7FA`-ish).
- Rounded corners throughout (cards ~16-20px radius, buttons ~12px, pill badges fully rounded).
- Card-based layout everywhere — almost no raw lists without a card container.
- Government/trust cues used deliberately: tricolor accent chip ("Digital India"), shield/lock iconography, "Secured by Cybersave Digital Trust" microcopy on financial screens.

## 2. Status color system (must be consistent across citizen app, operator, and admin)
| Status | Color family | Used in |
|---|---|---|
| Completed / Verified / Active / Success | Green | applications, documents, operator status, payments |
| Pending / In Review / Awaiting | Amber/Orange | applications, documents, tickets |
| Rejected / Suspended / Failed / Error | Red | applications, operator status, errors |
| In Progress / Processing | Blue | applications, tickets |
| Neutral/Info | Gray/blue-gray | secondary text, metadata |

Build this as a single `statusColors` token map shared by both the mobile theme and the admin web theme — every screen in the Figma reuses the same 4-color status vocabulary, so the component (e.g. `<StatusBadge status="pending" />`) should be built once.

## 3. Typography
- Clean sans-serif (looks like Inter/SF Pro/system default) — no need for a custom font, system font stack is fine and keeps bundle size down.
- Clear hierarchy: bold large numerals for KPI cards (admin dashboard), medium-weight section headers, regular body text, muted small text for metadata/timestamps.

## 4. Navigation structure
**Citizen app** — persistent bottom tab bar (5 items): `Home | Services | Applications | Wallet | Profile`. Matches `Container.pdf`. Keep this exact order and exact 5 items — it's referenced consistently across nearly every citizen screen.

**Admin/Operator web** — persistent left sidebar: `Dashboard, User Management, Applications, Services, Operators, Transactions, Notifications, Support Tickets, Analytics, Audit Logs, Settings`, collapsible. Top bar has global search, language selector, notification bell with count badge, admin profile chip.

## 5. Core reusable components to build once
| Component | Notes |
|---|---|
| `Button` | Primary (filled blue), secondary (outline), destructive (red) |
| `StatusBadge` | Pill-shaped, uses the 4-color system from §2 |
| `Card` | Base container, used for everything from a service tile to a KPI stat |
| `Stepper` | Horizontal "Step X/5" progress header for the application wizard |
| `DocumentUploadTile` | Shows filename + size once uploaded, drag/drop + browse on web, camera/file picker on mobile, with a delete action |
| `KPIStatCard` | Big number + label + trend delta (admin dashboard, uses ~6 times per screen) |
| `EmptyState` | Icon + heading + subtext + single CTA — reused across applications-empty, notifications-empty |
| `Timeline` | Vertical stepped timeline with timestamp — used in application-detail and refund-details |
| `SearchBar` | Consistent placeholder pattern: "Search [things] by [criteria]..." |
| `DataTable` | Sortable/filterable table with pagination footer — admin screens (applications, citizens, audit log, tickets) all use the same pattern |

## 6. Screen inventory by section (from the Figma's own `Frame` grouping)
The Figma file itself groups screens into labeled frames — use this as the canonical section list:
1. **Onboarding** — splash, onboarding-1/2/3, login, register, OTP, forgot-password, biometric, language
2. **Home screens** — screen-home
3. **Services screens** — services-hub, aadhaar-hub, pan-hub, certificates, gov-schemes
4. **Application screens** — screen-2 through screen-6, screen-success, applications-all/in-progress/rejected-detail/details/download/empty
5. **Wallet** — wallet-home, add-money, transaction-history/details, refund-details
6. **Profile screens** — personal information, my address, my documents, settings, privacy/security, about, notifications
7. **Empty and other states** — screen-error, screen-no-internet, screen-loading-skeleton, notifications-empty, applications-empty
8. **Admin Panel** — everything under the admin sidebar (dashboard, applications, citizens, services, operators, transactions, notifications, tickets, analytics, audit log, settings)

Build/track progress against this exact grouping in `phases.md` so nothing gets missed.

## 7. States every data screen needs (not optional)
For any screen that loads data (list or detail), design/build all four states, not just the happy path:
1. Loading (skeleton, matches `screen-loading-skeleton.pdf`)
2. Populated (the main design)
3. Empty (matches the dedicated empty-state screens where they exist; use the generic `EmptyState` component elsewhere)
4. Error (matches `screen-error.pdf` / `screen-no-internet.pdf` patterns — retry action always present)

## 8. Known inconsistencies to resolve, not silently "fix"
- `operator-permissions.pdf` uses fleet/logistics language (vehicles, dispatch, telematics) that doesn't match the rest of the product's domain (citizen document services). Don't silently reinterpret it — flag to the manager (see prd.md §8) and get an explicit replacement permission set for CyberSave (e.g. "Verify Documents," "Approve Applications," "Escalate to Admin," "Access Citizen PII").
- `screen-gov-schemes-1.pdf` is mislabeled in the export — it's actually the **Profile** screen, not a second gov-schemes screen. Don't build a duplicate schemes screen from it.