# StellarID — Complete Implementation Prompts (P0 → P3)

**Stack:** Next.js 14 App Router + TypeScript + Tailwind (Frontend) | Node.js + Express + TypeScript (Backend) | PostgreSQL + Redis | Stellar + Soroban | Circom + snarkjs | IPFS via Pinata | JWT Auth | Freighter Wallet

**Already Built:** ZK Proofs, GitHub OAuth, Wallet Auth

**Repos:** Separate (frontend / backend / contracts)

---

# 🔴 P0 — MUST BUILD FIRST

---

## P0-A: Claim Credential Email Flow

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

I am building StellarID — a decentralized identity platform on Stellar + Soroban.

My stack:
- Backend: Node.js + Express + TypeScript (separate repo)
- Database: PostgreSQL
- Cache: Redis
- Storage: IPFS via Pinata
- Auth: JWT + Stellar wallet (already built)
- Email: NOT SET UP YET — use Resend
- ZK Proofs: Circom + snarkjs (already built)
- GitHub OAuth: already built

FEATURE TO BUILD: "Claim Credential Email Flow"

CONTEXT:
When a hackathon organizer issues a credential to a participant, the participant
may not have a StellarID account yet. The credential should find the user via
email — pull onboarding. User clicks a link, connects wallet, credential is theirs.

EXACT FLOW:
1. Organizer issues credential → provides recipient email + wallet address (optional)
2. Backend creates a "pending credential" record in DB
3. Backend sends email with unique claim link: stellarid.io/claim/{unique_token}
4. Recipient clicks link → claim page opens
5. If wallet exists → connect Freighter → credential assigned to wallet
6. If no wallet → collect email, create placeholder account (Web3Auth later)
7. Credential moves from "pending" to "claimed"
8. Confirmation email sent after successful claim

BUILD THE FOLLOWING:

1. PostgreSQL schema:
   - pending_credentials table:
     id UUID PRIMARY KEY
     issuer_id UUID NOT NULL
     recipient_email VARCHAR(255) NOT NULL
     recipient_wallet VARCHAR(100) (nullable)
     credential_data JSONB NOT NULL
     claim_token UUID UNIQUE NOT NULL
     status ENUM('pending', 'claimed', 'expired') DEFAULT 'pending'
     claim_attempts INTEGER DEFAULT 0
     expires_at TIMESTAMP NOT NULL
     claimed_at TIMESTAMP (nullable)
     created_at TIMESTAMP DEFAULT NOW()
   - Full migration SQL

2. Email setup using Resend:
   - npm install resend
   - Resend client configuration with env variable
   - HTML email template for claim invitation:
     * Credential name + issuer name prominently displayed
     * Big CTA button "Claim Your Credential"
     * Credential preview details
     * Expiry notice
     * Mobile-friendly, dark theme preferred
   - HTML email template for confirmation after claim:
     * "Your credential is now on-chain"
     * Transaction hash display
     * Link to view full profile

3. API Endpoints:

   POST /api/credentials/issue-with-email
   Body: { issuer_id, recipient_email, recipient_wallet?, credential_data }
   Logic:
   - Validate issuer exists and is active
   - Create pending_credential record
   - Generate UUID v4 claim_token
   - Set expires_at = NOW() + 7 days
   - Send claim invitation email
   - Return: { success, pending_credential_id, claim_token }

   GET /api/credentials/claim/:token
   Logic:
   - Find pending_credential by claim_token
   - If not found → 404
   - If status = 'claimed' → return { status: 'already_claimed' }
   - If expires_at < NOW() → update status to 'expired', return { status: 'expired' }
   - Return: { credential_data, issuer_info, recipient_email, status: 'valid', expires_at }

   POST /api/credentials/claim/:token
   Body: { wallet_address }
   Logic:
   - Validate token (not expired, not claimed, attempts < 3)
   - Increment claim_attempts
   - Validate Stellar wallet address format
   - Check wallet not already used for this credential
   - Assign credential to wallet
   - Update status to 'claimed', set claimed_at = NOW()
   - Trigger on-chain Soroban credential issuance (async, with retry)
   - Send confirmation email
   - Return: { success, credential_id, transaction_hash }

4. Token security:
   - UUID v4 only (no sequential IDs)
   - 7 day expiry enforced at DB level (expires_at) AND application level
   - One-time use: status changes to 'claimed' immediately on success
   - Rate limit: max 3 claim attempts per token (claim_attempts column)
   - Redis rate limit: max 5 claim page views per IP per hour

5. Error handling for ALL edge cases:
   - Token not found: 404 with clear message
   - Token expired: 410 Gone with "contact your issuer" message
   - Token already used: 409 Conflict
   - Invalid Stellar wallet address: 400 with format hint
   - Wallet already claimed a credential from same issuer: 409
   - Soroban transaction failure: log error, mark credential as pending_chain,
     retry with exponential backoff (3 attempts), alert admin if all fail
   - Email send failure: log error, return success anyway, queue for retry via Redis

6. Environment variables:
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=noreply@stellarid.io
   CLAIM_BASE_URL=https://stellarid.io/claim
   CLAIM_TOKEN_EXPIRY_DAYS=7
   MAX_CLAIM_ATTEMPTS=3

Give me:
- Complete TypeScript code for all routes
- Prisma schema OR raw SQL migration (recommend Prisma, explain why)
- Full HTML email templates (inline CSS, mobile-friendly)
- Express middleware for rate limiting using express-rate-limit + Redis store
- Error handler middleware
- TypeScript interfaces for all request/response types
- Jest unit test structure for the claim flow (happy path + all error cases)
```

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript + Tailwind CSS developer.

I am building StellarID — a decentralized identity platform.

My stack:
- Frontend: Next.js 14, App Router, TypeScript, Tailwind CSS (separate repo)
- Wallet: Freighter (Stellar wallet) — already integrated
- Auth: JWT — already implemented
- Backend: separate Express server at NEXT_PUBLIC_API_URL

FEATURE TO BUILD: Claim Credential Page

BUILD:

1. File: app/claim/[token]/page.tsx
   - Server component that fetches token data via GET /api/credentials/claim/:token
   - Pass data to client component for interactivity

2. File: app/claim/[token]/ClaimClient.tsx (client component)
   States to handle:
   - loading: skeleton UI with pulse animation
   - valid: show full claim UI (see below)
   - already_claimed: show message + link to explore
   - expired: show message + "contact your issuer"
   - error: generic error state with retry

3. Valid state UI:
   - Credential preview card:
     * Credential name (large, prominent)
     * Issuer name + verification badge (green checkmark if verified)
     * Issue date + expiry date
     * Credential description
     * "Issued to: {recipient_email}" in subtle text
   - Two CTA buttons:
     * Primary: "Connect Freighter Wallet" → trigger Freighter connection flow
     * Secondary: "I don't have a wallet yet" → toggle to email form (placeholder)
   - After Freighter connects:
     * Show connected wallet address (truncated: G1234...5678)
     * "Confirm & Claim" button → POST /api/credentials/claim/:token
     * Loading spinner during claim

4. Success state (after claim):
   - Full page celebration:
     * canvas-confetti animation on mount (use canvas-confetti npm package)
     * Large checkmark animation (CSS or Framer Motion)
     * "Your credential is now on-chain! 🎉" heading
     * Beautiful credential card (same design as preview but with "CLAIMED" badge)
     * Transaction hash displayed (truncated, clickable → Stellar Expert explorer)
   - Two action buttons:
     * "View my StellarID Profile" → link to /profile
     * "Share this achievement" → Twitter Web Intent:
       https://twitter.com/intent/tweet?text=I+just+earned+a+verified+credential+on+@StellarID+🎉&url=...

5. Design requirements:
   - Dark theme: bg-gray-950 / bg-gray-900 cards
   - Accent color: purple/violet (violet-500, violet-600)
   - Mobile-first (works perfectly on iPhone screen)
   - Smooth Framer Motion transitions between all states
   - No full page reloads — all state changes in-page
   - Glassmorphism card style for credential preview:
     backdrop-blur, border border-white/10, bg-white/5

6. TypeScript types (create types/claim.ts):
   interface PendingCredential {
     id: string
     credential_data: {
       name: string
       description: string
       issuer_name: string
       issuer_verified: boolean
       issued_at: string
       expires_at: string | null
       metadata: Record<string, unknown>
     }
     recipient_email: string
     status: 'pending' | 'claimed' | 'expired'
     expires_at: string
   }

   type ClaimStatus = 'loading' | 'valid' | 'already_claimed' | 'expired' | 'success' | 'error'

   interface ClaimResponse {
     success: boolean
     credential_id?: string
     transaction_hash?: string
     error?: string
   }

Give me:
- Complete page.tsx (server component)
- Complete ClaimClient.tsx with all state handling
- CredentialPreviewCard component
- ClaimSuccess component with confetti
- ExpiredState and AlreadyClaimed components
- All Tailwind classes only (no inline styles, no CSS modules)
- Framer Motion AnimatePresence for state transitions
- canvas-confetti TypeScript integration
- All TypeScript types in separate file
```

---

## P0-B: StellarID Card + One-Click Share

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

I am building StellarID — a decentralized identity platform on Stellar + Soroban.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis | JWT Auth

FEATURE TO BUILD: StellarID Card Generation API

CONTEXT:
Every user needs a beautiful, shareable visual card — like a GitHub contribution
graph but for their verified builder identity. This card is the core viral loop.
When users share it, "Powered by StellarID" drives new signups.

BUILD:

1. Card data endpoint:
   GET /api/profile/:wallet_address/card-data
   Logic:
   - Fetch all claimed credentials for wallet
   - Calculate reputation score (basic formula for now):
     score = sum of (credential_weight * issuer_trust_score)
     where credential_weight = 10 (base) + recency_bonus (0-5)
     and issuer_trust_score = 0.1 to 1.0 based on issuer tier
   - Determine builder tier:
     0-199: Verified
     200-499: Proven
     500+: Elite Builder
   - Return structured card data:
     {
       wallet_address: string (truncated display)
       display_name: string (from profile or GitHub username)
       avatar_url: string (GitHub avatar if OAuth connected)
       reputation_score: number
       tier: 'Verified' | 'Proven' | 'Elite Builder'
       credential_count: number
       top_credentials: array of top 3 credentials (name, issuer, date)
       badges: string[] (earned badges)
       member_since: string
       stellar_network: 'Mainnet' | 'Testnet'
     }

2. OG Image generation endpoint:
   GET /api/profile/:wallet_address/og-image
   Logic:
   - Fetch card data (reuse above logic)
   - Generate PNG image using @vercel/og or sharp + node-canvas
   - Image dimensions: 1200x630px (Twitter/LinkedIn OG standard)
   - Cache generated image in Redis for 1 hour (key: og_image_{wallet})
   - Set headers: Content-Type: image/png, Cache-Control: public, max-age=3600
   - Return PNG buffer

   Card design elements to render:
   - Dark background (gradient: from #0a0a0f to #1a0a3e)
   - "StellarID" logo text top-left + "Powered by StellarID" bottom-right (subtle)
   - User avatar (circular, 80px) + display name + truncated wallet address
   - Reputation score (large, prominent number)
   - Tier badge with color coding:
     Verified: gray, Proven: blue, Elite Builder: purple/gold gradient
   - Top 3 credentials as pills/chips
   - Badge icons row
   - Stellar logo watermark (subtle, bottom-right)
   - Thin purple border/glow effect

3. Share URL generation:
   GET /api/profile/:wallet_address/share-url
   Returns:
   {
     profile_url: "https://stellarid.io/p/{wallet}",
     twitter_intent: "https://twitter.com/intent/tweet?text=...&url=...&hashtags=StellarID,Web3,Builder",
     linkedin_share: "https://www.linkedin.com/sharing/share-offsite/?url=...",
     og_image_url: "https://stellarid.io/api/profile/{wallet}/og-image"
   }
   Twitter text: "Just leveled up my builder identity on @StellarID ✨
   Reputation Score: {score} | {tier} Builder
   {credential_count} verified credentials on @Stellar 🚀
   Verify yours → "

4. Redis caching strategy:
   - Cache card-data for 5 minutes: card_data_{wallet}
   - Cache og-image for 1 hour: og_image_{wallet}
   - Invalidate both when new credential is claimed

5. Environment variables:
   OG_IMAGE_BASE_URL=https://stellarid.io
   CARD_CACHE_TTL=300
   OG_IMAGE_CACHE_TTL=3600

Give me:
- Complete TypeScript route handlers
- Reputation score calculation function (separate utility file: utils/reputation.ts)
- OG image generation with @vercel/og OR sharp + canvas (recommend which for Express)
- Redis caching middleware (reusable)
- TypeScript interfaces for all card data types
- Unit tests for reputation score calculation
```

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript + Tailwind CSS developer.

Stack: Next.js 14 App Router | TypeScript | Tailwind CSS | Framer Motion

FEATURE TO BUILD: StellarID Profile Page + Card Share UI

BUILD:

1. File: app/p/[wallet]/page.tsx
   - Public profile page (no auth required to view)
   - Dynamic OG meta tags for Twitter/LinkedIn previews:
     export async function generateMetadata({ params }):
       title: "{name}'s StellarID Profile"
       description: "{tier} Builder | {score} Reputation Score | {n} Verified Credentials"
       openGraph.images: [{ url: `/api/profile/${wallet}/og-image` }]
       twitter.card: 'summary_large_image'

2. Profile page sections:
   a. Hero section:
      - Avatar (GitHub profile pic or default generated avatar)
      - Display name + wallet address (truncated, copy-to-clipboard button)
      - Reputation score (large, animated counter on load)
      - Tier badge (color coded)
      - "Share Profile" button → opens ShareModal
      - If viewing own profile: "Edit Profile" button

   b. Credentials section:
      - Grid of credential cards (2 col mobile, 3 col desktop)
      - Each card:
        * Credential name
        * Issuer name + verification badge
        * Issue date
        * "Verify Proof" button → ZK verification flow
        * Status badge (Active / Expired / Revoked)
      - "Load more" pagination

   c. Badges section:
      - Horizontal scrollable row of earned badges
      - Each badge: icon + name + unlock date tooltip

   d. Activity section:
      - Simple timeline of credential events (issued, claimed, verified)

3. ShareModal component:
   Opens as bottom sheet on mobile, centered modal on desktop
   Contains:
   - Preview of the generated OG card image (fetch from /api/profile/:wallet/og-image)
   - "Download Card" button (downloads the PNG)
   - Share buttons:
     * Twitter: big blue button → opens twitter intent in new tab
     * LinkedIn: blue button → opens linkedin share in new tab
     * Copy Link: copies profile URL to clipboard → shows "Copied!" toast
   - "Powered by StellarID" text at bottom of modal

4. StellarIDCard component (also used on dashboard):
   - Standalone card component that renders the card design in HTML/CSS
   - Mirrors the OG image design but as interactive React component
   - Props: { cardData: CardData, size: 'sm' | 'md' | 'lg' }
   - Animate reputation score counting up on mount (useCountUp hook or Framer Motion)
   - Glassmorphism style: bg-gradient-to-br from-gray-950 to-violet-950

5. Design tokens to use throughout:
   Background: bg-gray-950
   Cards: bg-gray-900 border border-white/10
   Accent: violet-500 / violet-600
   Score color: from-violet-400 to-cyan-400 (gradient text)
   Tier colors:
     Verified: text-gray-400 bg-gray-800
     Proven: text-blue-400 bg-blue-900/30
     Elite Builder: text-violet-400 bg-violet-900/30

6. Animations:
   - Score counter: animate from 0 to actual score over 1.5s (easeOut)
   - Credential cards: stagger-fade-in on scroll
   - Share modal: slide up on mobile, scale-in on desktop

Give me:
- Complete app/p/[wallet]/page.tsx with generateMetadata
- ShareModal component (Radix Dialog or Headless UI)
- StellarIDCard component
- useCountUp custom hook
- All sub-components (CredentialCard, BadgeChip, ActivityTimeline)
- TypeScript types for all data structures
- Tailwind only, no external CSS
```

---

## P0-C: Bulk Credential Issuance

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis | Stellar + Soroban | Resend email

FEATURE TO BUILD: Bulk Credential Issuance for Hackathon Organizers

CONTEXT:
After a hackathon, an organizer needs to issue credentials to 50-500 participants
at once. Manual one-by-one issuance is impossible. Build a bulk issuance system
that accepts a CSV of recipients and handles everything asynchronously.

BUILD:

1. PostgreSQL schema additions:
   bulk_issuance_jobs table:
     id UUID PRIMARY KEY
     issuer_id UUID NOT NULL
     job_name VARCHAR(255) (e.g. "ETHIndia 2024 Participants")
     credential_template JSONB NOT NULL
     total_recipients INTEGER NOT NULL
     processed_count INTEGER DEFAULT 0
     success_count INTEGER DEFAULT 0
     failed_count INTEGER DEFAULT 0
     status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued'
     csv_ipfs_hash VARCHAR(255) (store original CSV on IPFS)
     error_log JSONB (array of failed entries with reasons)
     created_at TIMESTAMP DEFAULT NOW()
     completed_at TIMESTAMP

   bulk_issuance_recipients table:
     id UUID PRIMARY KEY
     job_id UUID REFERENCES bulk_issuance_jobs(id)
     recipient_email VARCHAR(255) NOT NULL
     recipient_wallet VARCHAR(100)
     custom_fields JSONB (per-recipient overrides like name, score, rank)
     pending_credential_id UUID (FK to pending_credentials after processing)
     status ENUM('queued', 'sent', 'failed') DEFAULT 'queued'
     error_message TEXT
     processed_at TIMESTAMP

2. CSV format specification:
   Required columns: email
   Optional columns: wallet_address, name, rank, score, notes
   Example:
   email,wallet_address,name,rank
   alice@example.com,GABC...,Alice Kumar,1st Place
   bob@example.com,,Bob Singh,Participant

3. API Endpoints:

   POST /api/bulk/upload
   Content-Type: multipart/form-data
   Body: { csv: File, job_name: string, credential_template: JSON }
   Logic:
   - Validate CSV (required columns, email format, max 1000 rows)
   - Upload CSV to IPFS via Pinata (for audit trail)
   - Create bulk_issuance_job record
   - Create bulk_issuance_recipient records for each row
   - Enqueue job to Redis queue (Bull or BullMQ)
   - Return: { job_id, total_recipients, estimated_completion_minutes }

   GET /api/bulk/jobs/:job_id/status
   Returns:
   {
     job_id, job_name, status,
     progress: { total, processed, success, failed },
     estimated_remaining_minutes: number,
     error_log: failed entries array,
     created_at, completed_at
   }

   GET /api/bulk/jobs
   Returns: paginated list of all bulk jobs for authenticated issuer

   POST /api/bulk/jobs/:job_id/retry-failed
   Logic: Re-queue only the failed recipients from a completed job

4. Background job processor (Bull/BullMQ worker):
   Process each recipient in the job:
   - Create pending_credential (reuse P0-A logic)
   - Send claim email (reuse P0-A email template)
   - Update recipient status
   - Update job progress counters
   - Rate limit email sending: max 10 emails/second (avoid Resend limits)
   - On completion: send summary email to organizer:
     "{success_count} credentials issued, {failed_count} failed"
     + download link for error report CSV

5. CSV validation rules:
   - Max 1000 recipients per job
   - Email must be valid format
   - wallet_address must be valid Stellar address if provided
   - File size max: 5MB
   - Duplicate emails within same job: skip with warning (don't fail)

6. Error handling:
   - Invalid CSV format: return 400 with column-level error details
   - Partial failures: job continues, failed recipients logged
   - Complete job failure: status = 'failed', organizer notified
   - Queue failure: dead letter queue, admin alert

7. Environment variables:
   REDIS_URL=
   BULL_CONCURRENCY=5
   EMAIL_RATE_LIMIT_PER_SECOND=10
   MAX_BULK_RECIPIENTS=1000

Give me:
- Complete TypeScript route handlers
- BullMQ worker code (separate worker.ts file)
- CSV parsing with papaparse or csv-parser (recommend which)
- Multer configuration for CSV upload
- Redis Bull queue setup
- Progress tracking with real-time updates (SSE endpoint for job progress)
- Error report CSV generation
- All TypeScript interfaces
- Unit tests for CSV validation logic
```

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript + Tailwind CSS developer.

Stack: Next.js 14 App Router | TypeScript | Tailwind CSS | Framer Motion

FEATURE TO BUILD: Bulk Issuance Dashboard for Organizers

BUILD:

1. Page: app/dashboard/bulk-issue/page.tsx
   Protected route (requires issuer auth)

2. Step 1 — Upload Form:
   - Drag-and-drop CSV upload zone:
     * Dashed border, accepts .csv only
     * Drag over state: border glows violet
     * File selected state: shows filename + row count preview
   - Credential template form:
     * Job name input
     * Credential name input
     * Credential description textarea
     * Expiry date picker (optional)
     * Custom fields (key-value pairs, add/remove dynamically)
   - "Preview CSV" button → shows first 5 rows in table
   - CSV format helper: collapsible section showing required/optional columns
   - "Issue to All" submit button → POST /api/bulk/upload

3. Step 2 — Progress tracking:
   After upload, show real-time progress:
   - Progress bar (processed / total)
   - Live counters: ✅ Success: {n} | ❌ Failed: {n} | ⏳ Remaining: {n}
   - Real-time updates via SSE (EventSource) polling /api/bulk/jobs/:id/status
   - Estimated time remaining
   - Cancel button (if job still processing)

4. Step 3 — Completion:
   - Summary card: "{success_count} credentials issued successfully"
   - Failed recipients table (if any):
     * Email | Reason | Retry button per row
   - "Retry All Failed" button
   - "Download Error Report" button (CSV download)
   - "Issue Another Batch" button

5. Jobs History page: app/dashboard/bulk-issue/history/page.tsx
   - Table of all past bulk jobs:
     * Job name | Date | Total | Success | Failed | Status | Actions
   - Status badges (color coded)
   - "View Details" → expands to show recipient-level breakdown
   - "Retry Failed" action for completed jobs with failures

6. Design:
   - Consistent with profile page (dark theme, violet accents)
   - Stepper UI (Step 1 → 2 → 3) at top of page
   - Mobile responsive (upload works on mobile too)
   - Optimistic UI: show progress immediately after upload

Give me:
- Complete bulk-issue/page.tsx with all 3 steps
- CSV drag-and-drop component (no external library, vanilla Tailwind)
- Real-time progress component using EventSource
- Jobs history page
- All TypeScript types
- Form validation (client-side before submit)
```

---

# 🟠 P1 — BUILD AFTER P0 IS LIVE

---

## P1-A: Reputation Score System

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis

FEATURE TO BUILD: Composite Reputation Score System

CONTEXT:
The reputation score is the core retention engine. It's a single number (0-1000)
that represents a builder's verified credibility. Weighted by issuer trust,
not just credential count.

BUILD:

1. PostgreSQL schema:

   issuer_trust_scores table:
     issuer_id UUID PRIMARY KEY
     base_score DECIMAL(3,2) DEFAULT 0.10
     community_endorsements INTEGER DEFAULT 0
     official_verified BOOLEAN DEFAULT FALSE
     credentials_issued INTEGER DEFAULT 0
     credentials_revoked INTEGER DEFAULT 0
     revocation_rate DECIMAL(4,3)
     trust_score DECIMAL(3,2) (computed: 0.10 to 1.00)
     last_calculated TIMESTAMP

   user_reputation table:
     wallet_address VARCHAR(100) PRIMARY KEY
     total_score INTEGER DEFAULT 0
     tier VARCHAR(20) DEFAULT 'Verified'
     credential_count INTEGER DEFAULT 0
     last_calculated TIMESTAMP
     score_breakdown JSONB (detailed breakdown per credential)
     season_scores JSONB (quarterly snapshots)

2. Reputation calculation algorithm:

   utils/reputation.ts:

   SCORING FORMULA:
   For each claimed credential:
     base_points = 10
     recency_bonus = max(0, 5 - floor(months_since_issue / 3))
     issuer_multiplier = issuer.trust_score (0.10 to 1.00)
     credential_score = (base_points + recency_bonus) * issuer_multiplier * 100

   SPECIAL BONUSES:
   - GitHub OAuth verified: +50 points
   - Credential from Official Verified issuer: +20 extra points
   - 5+ credentials from different issuers (diversity bonus): +100 points
   - Streak active (credential in last 30 days): +25 points

   TIER THRESHOLDS:
   0-199: Verified
   200-499: Proven
   500+: Elite Builder

   Return: {
     total_score: number,
     tier: string,
     breakdown: [{
       credential_id, credential_name, issuer_name,
       base_points, recency_bonus, issuer_multiplier, final_points
     }],
     bonuses: [{ type, points, description }],
     next_tier_points_needed: number
   }

3. Issuer trust score calculation:
   trust_score = base_score + verification_bonus + history_bonus - penalty
   where:
     base_score = 0.10 (all new issuers)
     verification_bonus = official_verified ? 0.40 : community_verified ? 0.20 : 0
     history_bonus = min(0.30, credentials_issued / 1000 * 0.30)
     penalty = revocation_rate > 0.1 ? (revocation_rate * 0.5) : 0
   Clamp final score: min(1.00, max(0.10, trust_score))

4. API Endpoints:

   GET /api/reputation/:wallet_address
   Returns full reputation data + breakdown
   Cache in Redis for 5 minutes

   POST /api/reputation/:wallet_address/recalculate
   Force recalculation (called after new credential claimed)
   Invalidate Redis cache
   Update user_reputation table

   GET /api/reputation/leaderboard?filter=global|city|college&limit=100
   Returns top builders (public data only)
   Cache 15 minutes

   GET /api/reputation/:wallet_address/history
   Returns score over time (for chart display)

5. Scheduled jobs:
   - Nightly: recalculate all reputation scores (expired credentials lose points)
   - Weekly: generate "Builder Season" snapshots
   - On credential claim: trigger immediate recalculation for that wallet

Give me:
- Complete reputation calculation utility (utils/reputation.ts)
- All API route handlers
- Issuer trust score calculation
- PostgreSQL schema with indexes
- Redis caching with proper invalidation
- Cron job setup (node-cron)
- Full TypeScript types
- Unit tests for all scoring edge cases (zero credentials, all expired, max score)
```

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript + Tailwind CSS developer.

FEATURE TO BUILD: Reputation Score Display Components

BUILD:

1. ReputationScoreCard component:
   Props: { wallet_address: string, compact?: boolean }
   - Animated score counter (0 → actual score, 1.5s easeOut)
   - Circular progress ring (SVG, fills based on tier threshold)
   - Tier badge with icon and color
   - "Next tier: X points away" progress bar
   - Breakdown toggle: click to see per-credential score breakdown

2. ScoreBreakdown component:
   - Table/list of each credential's contribution
   - Columns: Credential | Issuer | Points | Multiplier | Final
   - Bonus section at bottom (GitHub verified, diversity bonus, etc.)
   - Totals row

3. ReputationHistory chart:
   - Line chart showing score over time
   - Use recharts (already common in Next.js projects)
   - X-axis: months, Y-axis: score
   - Tier threshold lines (199, 499) as dashed horizontal lines
   - Hover tooltip with score + date

4. TierProgressBar component:
   - Shows: [Verified] -------- [Proven] -------- [Elite Builder]
   - Current position highlighted
   - Points to next tier displayed

5. LeaderboardWidget component:
   - Compact: top 5 with rank, avatar, name, score
   - Full page version with filters (global / city / college)
   - Current user's rank highlighted
   - Pagination

All components: dark theme, violet accents, Framer Motion animations,
Tailwind only, full TypeScript.
```

---

## P1-B: Issuer Verification Tiers

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis | Resend email

FEATURE TO BUILD: Issuer Verification Tier System

CONTEXT:
Anyone can create an issuer account and name themselves "MIT University".
We need a verification system so users can trust credential sources.

TWO TIERS:
- Community Verified: 5+ existing verified issuers have endorsed this issuer
- Official Verified: Team has manually verified via DNS/email domain ownership

BUILD:

1. PostgreSQL schema:

   issuers table (additions):
     verification_status ENUM('unverified', 'community_verified', 'official_verified')
     verification_date TIMESTAMP
     verified_by UUID (admin user if official)
     domain VARCHAR(255) (claimed domain)
     domain_verified BOOLEAN DEFAULT FALSE
     domain_verification_token VARCHAR(100)
     domain_verified_at TIMESTAMP
     endorsement_count INTEGER DEFAULT 0

   issuer_endorsements table:
     id UUID PRIMARY KEY
     endorser_issuer_id UUID (the endorsing issuer)
     endorsed_issuer_id UUID (the issuer being endorsed)
     created_at TIMESTAMP
     UNIQUE(endorser_issuer_id, endorsed_issuer_id)

2. Domain verification flow:
   Step 1: POST /api/issuers/:id/request-domain-verification
   Body: { domain: "iitbombay.ac.in" }
   - Generate unique token: stellarid-verify-{uuid}
   - Store in issuer record
   - Return: { token, instructions: "Add TXT record: stellarid-verify-{token} to your DNS" }

   Step 2: POST /api/issuers/:id/confirm-domain-verification
   - Perform DNS TXT lookup for the claimed domain
   - Check if stellarid-verify-{token} exists in TXT records
   - If yes: set domain_verified = true, domain_verified_at = NOW()
   - Also accept email verification:
     Send email to admin@{domain} with verification link as fallback

3. Endorsement flow:
   POST /api/issuers/:id/endorse
   Auth: requires verified issuer JWT
   - Check endorser is community_verified or official_verified
   - Check endorser hasn't already endorsed this issuer
   - Create endorsement record
   - Increment endorsement_count
   - If endorsement_count >= 5: upgrade to community_verified
   - Notify endorsed issuer via email

   GET /api/issuers/:id/endorsements
   Returns list of issuers who have endorsed this issuer

4. Admin endpoints (protected by admin role):
   POST /api/admin/issuers/:id/verify-official
   - Override to official_verified status
   - Requires admin JWT

   POST /api/admin/issuers/:id/revoke-verification
   - Downgrade verification status with reason
   - Notify issuer via email

5. Public issuer profile:
   GET /api/issuers/:id/public
   Returns:
   {
     id, name, description, domain,
     verification_status, verification_date,
     endorsement_count,
     credentials_issued_count,
     trust_score,
     logo_url
   }

6. Display logic for frontends:
   Return verification_badge_type:
   'official': gold checkmark
   'community': blue checkmark
   'unverified': gray warning icon

Give me:
- Complete TypeScript routes
- DNS TXT lookup implementation (using dns.promises module)
- Email verification fallback
- Endorsement validation logic
- All schema migrations
- Admin middleware
- Email templates for verification notifications
```

---

## P1-C: REST API Endpoints (Public API)

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis

FEATURE TO BUILD: Public REST API for Developer Ecosystem

CONTEXT:
This is StellarID's B2B product. Developers and platforms integrate this API
to verify builder credentials. This is how hackathon platforms, DAOs, and
hiring tools use StellarID programmatically.

BUILD:

1. API Key system:
   api_keys table:
     id UUID PRIMARY KEY
     issuer_id UUID
     key_hash VARCHAR(255) (bcrypt hash of actual key)
     key_prefix VARCHAR(10) (first 8 chars, for display: "sid_live_ab12...")
     name VARCHAR(100) (e.g. "Production Key")
     permissions TEXT[] (e.g. ['verify', 'issue', 'read_profile'])
     rate_limit_per_hour INTEGER DEFAULT 1000
     last_used_at TIMESTAMP
     created_at TIMESTAMP
     revoked_at TIMESTAMP

   API key format: sid_live_{32 random chars} (similar to Stripe)

   POST /api/developer/keys
   - Generate new API key
   - Return FULL key ONCE (never again), store only hash
   - Return: { key: "sid_live_...", prefix: "sid_live_ab12", id }

   GET /api/developer/keys
   - List all keys (prefix only, never full key)

   DELETE /api/developer/keys/:id
   - Revoke key

2. API Authentication middleware:
   - Accept key in header: X-StellarID-Key: sid_live_...
   - Also accept: Authorization: Bearer sid_live_...
   - Hash incoming key, compare with stored hash
   - Check not revoked, check permissions
   - Attach issuer context to request

3. Public API Endpoints (require API key):

   GET /v1/verify/:wallet_address
   Returns:
   {
     wallet_address: string,
     reputation_score: number,
     tier: string,
     credential_count: number,
     verified: boolean,
     credentials: [{
       id, name, issuer_name, issuer_verified,
       issued_at, expires_at, status
     }],
     last_updated: string
   }
   Rate limit: 1000/hour per key
   Cache: 5 minutes per wallet

   POST /v1/credentials/issue
   Body: {
     recipient_email: string,
     recipient_wallet?: string,
     credential: {
       name: string,
       description: string,
       expires_at?: string,
       metadata?: object
     }
   }
   - Requires 'issue' permission
   - Creates pending credential + sends claim email
   - Returns: { pending_credential_id, claim_url, claim_token }

   GET /v1/credentials/:credential_id
   Returns full credential data + current status + ZK proof availability

   GET /v1/proof/:credential_id
   Returns ZK proof data for selective disclosure verification
   Returns: { proof, public_signals, verification_key, valid_until }

   POST /v1/embed/badge
   Body: { wallet_address, style?: 'light' | 'dark', size?: 'sm' | 'md' | 'lg' }
   Returns: { html: "<script src=...></script>", iframe_url: "..." }

4. Rate limiting per API key:
   - Use Redis sliding window rate limiter
   - Key: rate_limit_{api_key_prefix}_{hour_bucket}
   - Return headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

5. API usage tracking:
   api_usage_logs table:
     id UUID, api_key_id UUID, endpoint VARCHAR, method VARCHAR,
     response_status INTEGER, response_time_ms INTEGER,
     created_at TIMESTAMP
   - Log every API call (async, don't block response)
   - Dashboard: GET /api/developer/usage/stats → calls per day, per endpoint, errors

6. API versioning:
   - All public endpoints under /v1/
   - Version header: API-Version: 2024-01

7. OpenAPI spec:
   - Generate openapi.json at GET /api/docs/openapi.json
   - Swagger UI at GET /api/docs

Give me:
- Complete route handlers for all endpoints
- API key generation (crypto.randomBytes, bcrypt hashing)
- Redis sliding window rate limiter middleware
- Usage logging (async, fire-and-forget)
- OpenAPI spec (openapi.json)
- TypeScript interfaces for all request/response types
- Integration test examples for each endpoint
```

---

# 🟡 P2 — BUILD AFTER P1 IS STABLE

---

## P2-A: JavaScript SDK + npm Package

### Prompt

```
You are an expert TypeScript library developer.

FEATURE TO BUILD: StellarID JavaScript/TypeScript SDK for npm

CONTEXT:
Any developer should be able to add StellarID verification to their app
with 3 lines of code. This is the developer adoption flywheel.

TARGET: npm install stellarid-sdk

BUILD:

1. Package structure:
   stellarid-sdk/
   ├── src/
   │   ├── index.ts (main exports)
   │   ├── client.ts (StellarIDClient class)
   │   ├── types.ts (all TypeScript types)
   │   ├── verify.ts (verification methods)
   │   ├── issue.ts (credential issuance methods)
   │   └── utils.ts (helpers)
   ├── package.json
   ├── tsconfig.json
   ├── rollup.config.js (build: CJS + ESM)
   └── README.md

2. Main API:

   import { StellarID } from 'stellarid-sdk'

   const client = new StellarID({
     apiKey: 'sid_live_...',
     network: 'mainnet' // or 'testnet'
   })

   // Verify a wallet
   const result = await client.verify('G1234...')
   // Returns: { score, tier, credentials, verified }

   // Issue a credential
   const pending = await client.issue({
     recipientEmail: 'user@example.com',
     credential: { name: 'Hackathon Winner', description: '...' }
   })
   // Returns: { pendingCredentialId, claimUrl }

   // Get ZK proof
   const proof = await client.getProof('credential_id_123')
   // Returns: { proof, publicSignals, verificationKey }

   // Embed badge (returns HTML string)
   const badge = await client.getBadge('G1234...', { style: 'dark' })

3. React hooks package (stellarid-react):
   import { useStellarIDProfile, useVerifyCredential } from 'stellarid-react'

   const { profile, loading, error } = useStellarIDProfile('G1234...')
   const { verify, result } = useVerifyCredential()

4. Build configuration:
   - Output: CJS (dist/index.js) + ESM (dist/index.mjs) + types (dist/index.d.ts)
   - Rollup or tsup (recommend tsup — simpler)
   - Tree-shakeable exports
   - Zero dependencies except node-fetch for Node.js environments
   - Browser compatible (use globalThis.fetch)

5. Package.json configuration:
   {
     "name": "stellarid-sdk",
     "version": "0.1.0",
     "main": "dist/index.js",
     "module": "dist/index.mjs",
     "types": "dist/index.d.ts",
     "exports": { ... }
   }

6. README.md:
   - Quick start (5 lines of code example)
   - Full API reference
   - TypeScript examples
   - React hooks example
   - Link to full docs

Give me:
- Complete SDK source code (all files)
- tsup build configuration
- package.json with correct exports
- Full TypeScript types
- README.md
- Jest test suite for all SDK methods (with mocked API responses)
- GitHub Actions workflow to publish to npm on tag push
```

---

## P2-B: Email Wallet via Privy

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript developer.

Stack: Next.js 14 App Router | TypeScript | Tailwind CSS | Privy

FEATURE TO BUILD: Email-based Wallet Creation (Non-crypto user onboarding)

CONTEXT:
Currently users need Freighter (Stellar wallet extension) to use StellarID.
This blocks all non-crypto users. Privy lets users sign up with email/Google
and creates a wallet under the hood. User never sees a seed phrase.

BUILD:

1. Privy setup:
   npm install @privy-io/react-auth
   - Configure PrivyProvider in app/layout.tsx
   - Set Privy app ID from env: NEXT_PUBLIC_PRIVY_APP_ID
   - Configure: loginMethods: ['email', 'google', 'wallet']
   - Configure: embeddedWallets: { createOnLogin: 'users-without-wallets' }

2. Auth flow:
   - Existing Freighter users: unchanged (keep existing flow)
   - New users via email/Google:
     * Privy handles email OTP or Google OAuth
     * Privy creates embedded wallet automatically
     * Extract wallet address from Privy user object
     * Send wallet address + Privy user ID to backend for JWT generation
     * Backend: create user account, link Privy ID to wallet address

3. Modified login page (app/login/page.tsx):
   Two clear options:
   Option A: "I have a Stellar Wallet" → Freighter connect (existing)
   Option B: "Sign in with Email" → Privy email/Google flow

   After Option B login:
   - Show "Your Stellar wallet was created automatically"
   - Display wallet address (abbreviated)
   - "View your wallet" → link to Privy dashboard
   - Continue to profile/onboarding

4. Backend changes needed:
   POST /api/auth/privy-login
   Body: { privy_user_id, privy_token, wallet_address }
   - Verify Privy token with Privy API
   - Create or find user by wallet_address
   - Link privy_user_id to user record
   - Return StellarID JWT

5. Claim page modification:
   The "I don't have a wallet" button on claim page:
   - Trigger Privy email login
   - After login, wallet_address auto-populated
   - Proceed with claim automatically

6. Environment variables:
   NEXT_PUBLIC_PRIVY_APP_ID=
   PRIVY_APP_SECRET= (backend only)

Give me:
- PrivyProvider setup in layout.tsx
- Modified login page with both options
- usePrivyAuth custom hook (wraps Privy + StellarID JWT logic)
- Backend auth endpoint for Privy users
- Modified claim page with Privy fallback
- TypeScript types for Privy user + StellarID user merge
```

---

## P2-C: Leaderboard + Badges

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis

FEATURE TO BUILD: Leaderboard + Badge System

BUILD:

1. Badge definitions (hardcoded config, not DB):
   src/config/badges.ts

   const BADGES = [
     { id: 'first_credential', name: 'First Step', description: 'Claimed your first credential', icon: '🏅', check: (stats) => stats.total_credentials >= 1 },
     { id: 'ten_credentials', name: 'Collector', description: '10 verified credentials', icon: '🏆', check: (stats) => stats.total_credentials >= 10 },
     { id: 'elite_builder', name: 'Elite Builder', description: 'Reached Elite tier', icon: '⚡', check: (stats) => stats.tier === 'Elite Builder' },
     { id: 'stellar_contributor', name: 'Stellar Contributor', description: 'Contributed to Stellar OSS', icon: '🌟', check: (stats) => stats.has_stellar_credential },
     { id: 'hackathon_winner', name: 'Hackathon Winner', description: 'Won a verified hackathon', icon: '🥇', check: (stats) => stats.has_win_credential },
     { id: 'streak_30', name: 'Consistent Builder', description: '30-day activity streak', icon: '🔥', check: (stats) => stats.streak_days >= 30 },
     { id: 'github_verified', name: 'Open Source Dev', description: 'GitHub account verified', icon: '💻', check: (stats) => stats.github_verified },
     { id: 'early_adopter', name: 'Early Adopter', description: 'Joined StellarID in first 100 users', icon: '🚀', check: (stats) => stats.user_number <= 100 },
   ]

2. Badge calculation:
   POST /api/badges/:wallet_address/calculate
   - Fetch user stats
   - Run each badge's check() function
   - Store newly earned badges in user_badges table
   - Return: { newly_earned: Badge[], all_badges: Badge[] }
   Called automatically after each credential claim

   user_badges table:
     wallet_address VARCHAR(100)
     badge_id VARCHAR(50)
     earned_at TIMESTAMP
     PRIMARY KEY (wallet_address, badge_id)

3. Leaderboard endpoints:

   GET /api/leaderboard?scope=global&limit=100&offset=0
   GET /api/leaderboard?scope=city&city=Mumbai&limit=50
   GET /api/leaderboard?scope=college&college=SRMIST&limit=50

   Returns: [{
     rank: number,
     wallet_address: string,
     display_name: string,
     avatar_url: string,
     reputation_score: number,
     tier: string,
     credential_count: number,
     top_badge: Badge
   }]

   Cache in Redis: 15 minutes
   Use Redis Sorted Set for real-time leaderboard:
     Key: leaderboard:global
     ZADD with score = reputation_score

   GET /api/leaderboard/my-rank?wallet=G1234...
   Returns: { rank: number, score: number, percentile: number }

4. Streak tracking:
   user_activity table:
     wallet_address VARCHAR(100)
     activity_date DATE
     activity_type VARCHAR(50)
     PRIMARY KEY (wallet_address, activity_date)

   Calculate streak: consecutive days with any activity
   Reset at midnight UTC if no activity

   GET /api/users/:wallet/streak
   Returns: { current_streak: number, longest_streak: number, last_active: date }

Give me:
- Badge config file with all badge definitions
- Badge calculation logic
- Leaderboard Redis sorted set implementation
- All API routes
- Streak calculation algorithm
- Schema migrations
- Unit tests for badge unlock conditions
```

---

# 🟢 P3 — BUILD WHEN TRACTION EXISTS

---

## P3-A: AI Credential Summarizer

### Frontend Prompt

```
You are an expert Next.js 14 App Router + TypeScript developer with Anthropic API knowledge.

Stack: Next.js 14 App Router | TypeScript | Tailwind CSS | Anthropic Claude API

FEATURE TO BUILD: AI-powered Credential Summarizer

CONTEXT:
User pastes their StellarID profile wallet address → AI reads their verified
credentials → generates a professional bio paragraph they can use on resume/LinkedIn.

BUILD:

1. Page/modal: /profile/ai-summary (or modal on profile page)

2. Flow:
   Step 1: User clicks "Generate AI Bio" button on their profile
   Step 2: Loading state (streaming response)
   Step 3: Display generated bio with copy button

3. API Route: app/api/ai-summary/route.ts (Next.js API route)
   - Fetch user's credential data from StellarID backend
   - Call Anthropic Claude API with credentials as context
   - Stream response back to client

   System prompt:
   "You are a professional bio writer specializing in developer and builder profiles.
   Given a list of verified blockchain credentials, write a concise, impressive
   professional bio (2-3 sentences) suitable for a LinkedIn profile or resume.
   Focus on the verified achievements, avoid mentioning blockchain unless relevant.
   Write in first person. Be specific about accomplishments."

   User prompt:
   "Here are my verified credentials from StellarID:
   {credentials_list}
   My GitHub: {github_username if available}
   Reputation tier: {tier}
   Write my professional bio."

4. Streaming UI:
   - Use ReadableStream to stream AI response
   - Show text appearing character by character (typewriter effect)
   - "Generating your bio..." loading state
   - Copy to clipboard button after generation
   - "Regenerate" button

5. Output options:
   - LinkedIn Bio format (2-3 sentences, professional)
   - Twitter Bio format (160 chars max)
   - Resume Summary format (4-5 sentences, detailed)
   Toggle between formats (regenerates each time)

6. Environment variables:
   ANTHROPIC_API_KEY= (backend/API route only, never expose to client)

Give me:
- Next.js API route with streaming Anthropic API call
- Frontend component with streaming text display
- Three output format prompts
- Copy to clipboard functionality
- Typewriter animation effect
- Tailwind styling consistent with dark theme
```

---

## P3-B: Discord Bot

### Prompt

```
You are an expert Discord bot developer using discord.js v14 + TypeScript.

FEATURE TO BUILD: StellarID Discord Bot

CONTEXT:
DAOs and builder communities use Discord. This bot lets community managers
gate channels by reputation score and lets members verify their builder identity.

BUILD:

1. Bot setup:
   - discord.js v14 with slash commands
   - TypeScript
   - Separate Node.js project (not part of main repos)
   - Deploy to Railway or Fly.io

2. Slash commands:

   /verify wallet:G1234...
   - Calls StellarID API: GET /v1/verify/{wallet}
   - Replies with embed showing:
     * Reputation Score + Tier badge
     * Top 3 credentials
     * Verification badge (official/community/unverified)
   - Assigns Discord role based on tier:
     Verified → "StellarID Verified" role
     Proven → "Proven Builder" role
     Elite Builder → "Elite Builder" role

   /leaderboard
   - Shows top 10 builders in this Discord server
   - (Only users who have used /verify in this server)
   - Embed with ranked list

   /profile wallet:G1234...
   - Full profile embed:
     * All credentials listed
     * Badges earned
     * Reputation score + tier
     * Link to full StellarID profile

   /gate channel:#channel-name min-tier:Proven
   - Admin only command
   - Sets minimum tier requirement for a channel
   - Bot auto-removes users below tier from channel
   - Stores gate config in SQLite (bot's own DB)

3. Embed design:
   - Dark purple color scheme (#7C3AED)
   - StellarID logo as thumbnail
   - Tier color coding:
     Verified: gray, Proven: blue, Elite: purple
   - "Powered by StellarID" footer

4. Role management:
   - Bot requires Manage Roles permission
   - Creates StellarID roles on /setup command if they don't exist
   - Role hierarchy: Elite Builder > Proven Builder > StellarID Verified

5. /setup command (admin only):
   - Creates the three tier roles
   - Configures bot for this server
   - Stores guild config

6. Environment variables:
   DISCORD_TOKEN=
   DISCORD_CLIENT_ID=
   STELLARID_API_KEY=
   STELLARID_API_URL=

Give me:
- Complete discord.js v14 bot with all slash commands
- Role management logic
- Embed builders for each command
- SQLite setup for guild config storage
- Deployment configuration (Dockerfile)
- README with invite link setup instructions
```

---

## P3-C: Monetization Tier Infrastructure

### Backend Prompt

```
You are an expert Node.js + Express + TypeScript backend developer.

Stack: Node.js + Express + TypeScript | PostgreSQL | Redis | Stripe

FEATURE TO BUILD: Issuer Monetization Tier System

CONTEXT:
StellarID monetizes issuers (hackathon organizers, companies), not end users.
Three tiers: Free, Pro ($49/mo), Enterprise ($500+/mo).

BUILD:

1. Tier definitions (config file):
   FREE:
     credentials_per_month: 100
     bulk_issuance: false
     custom_branding: false
     analytics: false
     api_calls_per_hour: 100
     support: 'community'

   PRO ($49/month):
     credentials_per_month: unlimited
     bulk_issuance: true
     custom_branding: true
     analytics: true
     api_calls_per_hour: 5000
     support: 'email'
     price_id: 'price_...' (Stripe)

   ENTERPRISE ($500+/month):
     credentials_per_month: unlimited
     bulk_issuance: true
     custom_branding: true
     analytics: true
     api_calls_per_hour: 50000
     white_label: true
     custom_contracts: true
     support: 'dedicated'
     price_id: 'price_...' (Stripe, custom)

2. PostgreSQL additions:
   issuer_subscriptions table:
     issuer_id UUID PRIMARY KEY
     tier ENUM('free', 'pro', 'enterprise') DEFAULT 'free'
     stripe_customer_id VARCHAR(100)
     stripe_subscription_id VARCHAR(100)
     current_period_end TIMESTAMP
     credentials_used_this_month INTEGER DEFAULT 0
     last_reset_date DATE
     created_at TIMESTAMP

3. Stripe integration:
   npm install stripe

   POST /api/billing/create-checkout
   Body: { tier: 'pro' | 'enterprise' }
   - Create Stripe Checkout Session
   - Return: { checkout_url }

   POST /api/billing/webhook (Stripe webhook)
   Events to handle:
   - checkout.session.completed → upgrade tier
   - invoice.payment_succeeded → reset monthly usage
   - customer.subscription.deleted → downgrade to free
   - invoice.payment_failed → send warning email

   GET /api/billing/portal
   - Return Stripe Customer Portal URL (manage subscription, cancel, invoices)

   GET /api/billing/usage
   Returns: {
     tier, credentials_used, credentials_limit,
     api_calls_used, api_calls_limit,
     period_end, next_reset
   }

4. Usage enforcement middleware:
   checkCredentialLimit middleware:
   - Before issuing credential: check credentials_used_this_month < limit
   - If over limit: 429 with upgrade prompt
   - Increment counter after successful issuance

   checkAPILimit middleware:
   - Already handled by Redis rate limiter
   - Tier-based limits from subscription record

5. Monthly reset:
   Cron job: runs 1st of each month
   - Reset credentials_used_this_month to 0 for all issuers
   - Update last_reset_date

6. Upgrade prompts:
   When free issuer hits limit:
   Return header: X-Upgrade-Required: true
   Response body includes: { upgrade_url: '/billing/upgrade', current_tier: 'free' }

Give me:
- Complete Stripe integration
- Webhook handler with signature verification
- Usage tracking middleware
- Tier enforcement logic
- Billing portal endpoint
- Cron job for monthly reset
- TypeScript types for all billing structures
- Stripe test mode setup instructions
```

---

# IMPLEMENTATION ORDER SUMMARY

```
Week 1-2:  P0-A (Email Flow) + P0-C (Bulk Issuance)
Week 3:    P0-B (StellarID Card + Share)
Week 4-5:  P1-A (Reputation Score)
Week 6:    P1-B (Issuer Verification Tiers)
Week 7:    P1-C (REST API Endpoints)
Week 8-9:  P2-A (JS SDK) + P2-B (Privy Email Wallet)
Week 10:   P2-C (Leaderboard + Badges)
Week 11+:  P3 features (post-traction)
```

---

# ENV VARIABLES MASTER LIST

```env
# Backend
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=
JWT_EXPIRY=7d

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@stellarid.io

# Stellar
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=
SOROBAN_CONTRACT_ID=

# IPFS
PINATA_API_KEY=
PINATA_SECRET_KEY=

# Claim Flow
CLAIM_BASE_URL=https://stellarid.io/claim
CLAIM_TOKEN_EXPIRY_DAYS=7

# Stripe (P3)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# Frontend
NEXT_PUBLIC_API_URL=https://api.stellarid.io
NEXT_PUBLIC_STELLAR_NETWORK=testnet

# Privy (P2)
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# AI (P3)
ANTHROPIC_API_KEY=

# Discord Bot (P3)
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
STELLARID_API_KEY=
```

---

*StellarID Implementation Prompts — P0 through P3*
*Use each prompt block with your preferred AI coding assistant (Claude, Cursor, Copilot)*
*Always implement and test P0 before moving to P1*
