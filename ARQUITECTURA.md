# Modelo del Software y Arquitectura — USA Latino Prime Utah

> **Versión:** 1.0
> **Fecha:** 2 de mayo de 2026
> **Documento complementario:** `C:\Users\mauri\Documents\Trabajos\usalatinoprimeutah\REQUERIMIENTOS.md` (requerimientos regulatorios)
> **Tipo:** Documento de arquitectura, modelo de software y flujo de negocio

---

## 0. Contexto

Este documento define **cómo** se construye el software, mientras que `REQUERIMIENTOS.md` define **qué** debe cumplir regulatoriamente bajo el Utah Legal Sandbox Phase 2.

El proyecto se diseña desde cero aplicando lecciones del proyecto existente `UsaLatinoPrime` (form-filling migratorio):
- ✅ Reutilizar: workflow definitions, zod schemas, PDF field mappings, autosave hook, Shadcn UI, textos legales.
- ❌ Evitar: god components (>300 líneas), god APIs (>200 líneas), estado ad-hoc, secrets en .env.local, RLS inconsistente, 0 tests.

**Diferencias críticas vs proyecto migratorio anterior**:
1. NO inmigración (prohibido por sandbox).
2. Áreas: Familiares + Vivienda + Empresariales.
3. Compliance-first (audit log obligatorio).
4. Multi-casos por cliente (incluyendo casos del mismo servicio con beneficiarios distintos).
5. Workflow declarativo con state machine validado.
6. Tests obligatorios desde día 1.

---

## 1. Resumen Arquitectural

### 1.1 Estilo: Clean Architecture en capas

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│  Next.js App Router + React Server Components           │
│  shadcn/ui + Tailwind + Zustand (UI state) +           │
│  TanStack Query (server state) + React Hook Form        │
└─────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│  Server Actions + API Routes (thin controllers)         │
│  Use Cases (business orchestration)                      │
│  Compliance Wrapper (audit log + risk check)             │
└─────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                         │
│  Entities (Case, Client, Contract, Payment...)          │
│  Value Objects (CaseNumber, Money, UtahAddress...)      │
│  Domain Services (state machines, business rules)        │
│  Zod Schemas (validation)                                │
└─────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                      │
│  Supabase Repositories + RLS                             │
│  External Adapters (Stripe, Gemini, Dropbox Sign,       │
│    Resend, Stripe Identity)                              │
│  Storage (Supabase Storage encriptado)                   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Principios rectores
- **SOLID** — especialmente Single Responsibility y Dependency Inversion.
- **Composition over inheritance**.
- **Inmutabilidad** en domain layer.
- **Pure functions** para business rules.
- **Side effects** confinados a infrastructure layer.
- **Type safety** end-to-end (DB → API → UI).
- **Test-first** para domain y application layers.
- **Convention over configuration** — naming consistente.

### 1.3 Stack técnico definitivo

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Framework | Next.js | 15.x | App Router maduro, RSC, Server Actions |
| UI | React | 19.x | Stable, Suspense, Actions |
| Lenguaje | TypeScript | 5.x | strict mode obligatorio |
| Estilos | Tailwind CSS | 4.x | Atomic, performante |
| Componentes | shadcn/ui + Radix | latest | Composables, accesibles |
| Estado UI | Zustand | 5.x | Simple, sin boilerplate |
| Estado servidor | TanStack Query | 5.x | Caching, deduplication, optimistic updates |
| Forms | React Hook Form + Zod | latest | Validación schema-based |
| DB + Auth + Storage | Supabase | latest | Postgres + RLS + Auth + Storage en uno |
| Pagos | **Manual (sin pasarela)** | — | Efectivo, Zelle, transferencia, cheque, money order — registrados y verificados por admin |
| Verificación identidad | **Upload manual** | — | Cliente sube foto driver license; admin verifica manualmente |
| E-signature | Dropbox Sign | latest | 3x más barato que DocuSign |
| IA | Google Gemini Vertex AI | 2.5 Pro/Flash | Multimodal + BAA + structured output |
| Email | Resend | latest | DX excelente, API limpia |
| SMS | Twilio | latest | Recordatorios opcionales |
| Job queue | Upstash QStash | 2.x | Cron, recordatorios, webhooks |
| i18n | next-intl | latest | Routing localizado ES/EN |
| Logging | Pino + Axiom | latest | Structured logs |
| Errors | Sentry | latest | Production error tracking |
| Analytics | PostHog | latest | Privacy-first, masking PII |
| Tests | Vitest + Playwright | latest | Unit + E2E |
| Lint/Format | Biome | latest | Más rápido que ESLint+Prettier |

---

## 2. Estructura de Carpetas

### 2.1 Layout general

```
usalatinoprimeutah/
├── src/
│   ├── app/                          # Next.js routes (PRESENTATION)
│   │   ├── (marketing)/              # Landing público
│   │   ├── (auth)/                   # Login, register, forgot password
│   │   ├── (client)/                 # Portal del cliente
│   │   │   ├── dashboard/
│   │   │   ├── cases/[caseId]/
│   │   │   ├── billing/
│   │   │   ├── documents/
│   │   │   ├── messages/
│   │   │   └── settings/
│   │   ├── (admin)/                  # Portal admin (único portal interno)
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   ├── clients/
│   │   │   ├── payments/             # Verificación de pagos manuales
│   │   │   ├── identity-verifications/ # Verificación residencia Utah
│   │   │   ├── qa-reviews/           # Revisiones QA antes de finalizar
│   │   │   ├── lawyers/              # Directorio abogados aliados (público)
│   │   │   ├── compliance/           # Sandbox reporting
│   │   │   ├── catalog/              # Service catalog editor
│   │   │   └── settings/
│   │   ├── api/                      # API routes (thin)
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   ├── dropbox-sign/
│   │   │   │   └── twilio/
│   │   │   └── cron/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── features/                     # FEATURE MODULES (vertical slices)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/                  # Client-side API wrappers (TanStack Query)
│   │   │   └── types.ts
│   │   ├── onboarding/
│   │   ├── cases/
│   │   ├── wizard/                   # Form wizard engine (genérico)
│   │   ├── ai-assistant/
│   │   ├── contracts/
│   │   ├── billing/
│   │   ├── documents/
│   │   ├── e-signature/
│   │   ├── complaints/
│   │   ├── audit-log/
│   │   ├── dashboard-client/
│   │   ├── dashboard-admin/
│   │   ├── messaging/
│   │   └── lawyer-directory/
│   │
│   ├── server/                       # SERVER-ONLY code
│   │   ├── services/                 # Use cases (application layer)
│   │   │   ├── case-service.ts       # createCase, updateCase, transitionStatus
│   │   │   ├── contract-service.ts   # generateContract, sendForSignature
│   │   │   ├── billing-service.ts
│   │   │   ├── compliance-service.ts # auditLog, complaintHandling
│   │   │   ├── ai-service.ts         # gemini wrapper + guardrails
│   │   │   └── notification-service.ts
│   │   ├── repositories/             # Data access (infrastructure)
│   │   │   ├── case-repository.ts
│   │   │   ├── client-repository.ts
│   │   │   ├── contract-repository.ts
│   │   │   └── audit-log-repository.ts
│   │   ├── integrations/             # External adapters
│   │   │   ├── stripe/
│   │   │   ├── gemini/
│   │   │   ├── dropbox-sign/
│   │   │   ├── resend/
│   │   │   └── twilio/
│   │   ├── workflows/                # State machines + workflow definitions
│   │   │   ├── uncontested-divorce.ts
│   │   │   ├── child-custody.ts
│   │   │   ├── name-change.ts
│   │   │   ├── guardianship.ts
│   │   │   ├── eviction-defense.ts
│   │   │   ├── llc-formation.ts
│   │   │   ├── dba.ts
│   │   │   ├── operating-agreement.ts
│   │   │   └── _engine.ts            # workflow engine genérico
│   │   ├── compliance/               # Compliance layer transversal
│   │   │   ├── audit-log.ts
│   │   │   ├── risk-check.ts
│   │   │   ├── pii-encryption.ts
│   │   │   └── sandbox-reporting.ts
│   │   ├── auth/                     # Server-side auth helpers
│   │   ├── permissions.ts            # RBAC matrix
│   │   └── env.ts                    # Validated env vars (zod)
│   │
│   ├── shared/                       # Shared across client + server
│   │   ├── domain/                   # DOMAIN LAYER (entities, VOs)
│   │   │   ├── case.ts
│   │   │   ├── client.ts
│   │   │   ├── contract.ts
│   │   │   ├── money.ts
│   │   │   ├── case-number.ts
│   │   │   └── value-objects/
│   │   ├── schemas/                  # Zod schemas (validation)
│   │   │   ├── case-schemas.ts
│   │   │   ├── form-schemas/
│   │   │   │   ├── divorce-schema.ts
│   │   │   │   ├── llc-schema.ts
│   │   │   │   └── ...
│   │   │   └── shared-schemas.ts
│   │   ├── constants/
│   │   ├── utils/
│   │   └── types/
│   │       └── database.ts           # Supabase generated types
│   │
│   ├── components/                   # SHARED UI components only
│   │   ├── ui/                       # shadcn primitives
│   │   ├── layout/                   # AppShell, Sidebar, etc.
│   │   ├── forms/                    # Generic form components
│   │   └── feedback/                 # Toasts, alerts, dialogs
│   │
│   ├── lib/                          # Cross-cutting utilities
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server-side client
│   │   │   └── middleware.ts         # Cookie management
│   │   ├── analytics.ts              # PostHog wrapper
│   │   ├── logger.ts                 # Pino wrapper
│   │   └── i18n/
│   │
│   └── middleware.ts                 # Next.js middleware
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── supabase/
│   ├── migrations/                   # SQL migrations
│   ├── seed.sql
│   └── functions/                    # Edge functions
│
├── public/
│   └── forms/                        # PDF templates Utah Courts
│
├── messages/                         # i18n translations
│   ├── es.json
│   └── en.json
│
├── docs/
│   ├── adr/                          # Architecture Decision Records
│   │   ├── 0001-clean-architecture.md
│   │   ├── 0002-supabase-stack.md
│   │   ├── 0003-zustand-tanstack-query.md
│   │   └── ...
│   ├── DATA_MODEL.md
│   ├── API_CONVENTIONS.md
│   ├── SECURITY.md
│   └── ONBOARDING.md
│
├── biome.json
├── tsconfig.json
├── next.config.ts
├── package.json
├── REQUERIMIENTOS.md                 # Requerimientos regulatorios sandbox
└── ARQUITECTURA.md                   # Este documento (copia del plan)
```

### 2.2 Reglas de organización
1. **Feature modules son verticales**: cada `features/<feature>/` contiene SU UI + hooks + API client. NO hay folder global de componentes específicos de feature.
2. **`server/` solo en server**: nunca importable desde client components. Verificado por convención + linter rule.
3. **`shared/` accesible en ambos** pero sin side effects.
4. **`components/` solo UI compartida realmente** (botones, formularios genéricos), NO específicos de feature.
5. **Tamaño máximo por archivo**: 300 líneas. Si excede → refactorizar.
6. **Tamaño máximo de función**: 50 líneas. Si excede → extraer.

---

## 3. Modelo de Datos

### 3.1 Entidades principales

```sql
-- ============================================================
-- IDENTITY & AUTH
-- ============================================================

-- profiles (1:1 con auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  utah_residency_verified BOOLEAN DEFAULT false,
  utah_residency_verified_at TIMESTAMPTZ,
  utah_residency_method TEXT,
  stripe_customer_id TEXT UNIQUE,
  consents JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- user_roles (RBAC simplificado: solo client y admin)
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'admin')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  PRIMARY KEY (user_id, role)
);
-- Nota: el abogado supervisor del sandbox (requisito de Moderate Innovation)
-- se modela como colaborador externo o como un admin más del sistema.
-- No se modela como rol técnico separado para mantener simplicidad.

-- ============================================================
-- SERVICE CATALOG
-- ============================================================

-- service_categories (Familia / Vivienda / Empresarial)
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_es TEXT,
  description_en TEXT,
  icon TEXT,                          -- Lucide icon name
  color_hex TEXT NOT NULL,            -- color coding del dashboard
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- services (catálogo de servicios)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES service_categories(id),
  slug TEXT UNIQUE NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  short_description_es TEXT NOT NULL,
  short_description_en TEXT NOT NULL,
  long_description_es TEXT,
  long_description_en TEXT,
  what_it_includes_es JSONB,          -- bullet list
  what_it_includes_en JSONB,
  what_it_does_not_include_es JSONB,
  what_it_does_not_include_en JSONB,
  base_price_cents INT NOT NULL,      -- Money en centavos
  estimated_duration_minutes INT,
  workflow_slug TEXT NOT NULL,        -- referencia a workflows/<slug>.ts
  required_documents JSONB,           -- array de document_type slugs
  pdf_template_path TEXT NOT NULL,    -- path al PDF de Utah Courts
  beneficiary_label_es TEXT,          -- ej "menor", "empresa", null si no aplica
  beneficiary_label_en TEXT,
  allows_multiple_beneficiaries BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASES (núcleo del negocio)
-- ============================================================

-- cases (instancia de un servicio para un cliente)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT UNIQUE NOT NULL,   -- ej: USLP-2026-001234
  client_id UUID NOT NULL REFERENCES profiles(id),
  service_id UUID NOT NULL REFERENCES services(id),
  
  -- Naming personalizado para diferenciar casos del mismo servicio
  -- ej: "Divorcio – cliente principal" / "Guardianship – sobrino Juan"
  display_name TEXT NOT NULL,         
  
  -- Beneficiary (si aplica): menor, empresa, etc.
  beneficiary_data JSONB,             -- {full_name, dob, relationship, etc.}
  
  -- Workflow status
  intake_status TEXT NOT NULL DEFAULT 'created' CHECK (intake_status IN (
    'created',           -- caso recién creado, sin contrato firmado
    'contract_pending',  -- contrato generado, esperando firma cliente
    'contract_signed',   -- contrato firmado, esperando pago
    'payment_pending',   -- esperando primer pago
    'in_progress',       -- cliente llenando formulario
    'review_pending',    -- enviado para revisión QA del lawyer supervisor
    'needs_correction',  -- lawyer pidió correcciones
    'approved',          -- lawyer aprobó, listo para firmar PDF final
    'finalized',         -- PDF final firmado por cliente
    'archived',          -- caso cerrado
    'cancelled'          -- caso cancelado
  )),
  
  -- Service-specific status (depende del workflow)
  service_status TEXT,                -- ej "draft" | "ready_to_file" | "filed_with_court"
  
  -- Form data (validado por workflow.formSchema)
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step TEXT,                  -- step actual del wizard
  completed_steps TEXT[] DEFAULT '{}',
  
  -- Pricing snapshot (immutable después de contrato firmado)
  agreed_price_cents INT,
  payment_plan TEXT,                  -- 'one_time' | 'monthly_subscription'
  
  -- Admin asignado y review (Moderate Innovation: el admin puede ser el abogado supervisor)
  assigned_admin_id UUID REFERENCES profiles(id),
  qa_review_required BOOLEAN DEFAULT true,
  qa_reviewed_at TIMESTAMPTZ,
  qa_reviewed_by UUID REFERENCES profiles(id),
  qa_review_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(intake_status);
CREATE INDEX idx_cases_admin ON cases(assigned_admin_id);

-- case_activities (timeline + audit)
CREATE TABLE case_activities (
  id BIGSERIAL PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('client', 'admin', 'system', 'ai')),
  activity_type TEXT NOT NULL,        -- ej 'status_changed', 'form_updated', 'document_uploaded'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_case_activities_case ON case_activities(case_id, created_at DESC);

-- ============================================================
-- CONTRACTS
-- ============================================================

-- contracts (uno por caso, opcional addendums)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  contract_number TEXT UNIQUE NOT NULL,  -- ej: CTR-2026-001234
  template_version TEXT NOT NULL,
  pdf_storage_path TEXT NOT NULL,
  
  -- Snapshot de términos al momento de firma (immutable)
  terms_snapshot JSONB NOT NULL,      -- {price, scope, deliverables, refund_policy, ...}
  
  -- E-signature
  dropbox_sign_request_id TEXT,
  signature_status TEXT NOT NULL DEFAULT 'draft' CHECK (signature_status IN (
    'draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'cancelled'
  )),
  signed_at TIMESTAMPTZ,
  signed_pdf_storage_path TEXT,
  signature_audit_trail JSONB,        -- IP, timestamp, geo, user agent
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BILLING (PAGOS MANUALES — sin pasarela)
-- ============================================================

-- payment_plans (plan de pagos por caso: full o cuotas)
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  total_amount_cents INT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one_time', 'installments')),
  num_installments INT DEFAULT 1,
  down_payment_cents INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'in_default')),
  notes TEXT,                         -- notas internas del admin sobre el plan
  created_by UUID NOT NULL REFERENCES profiles(id),  -- admin que creó el plan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- installments (cuotas programadas dentro de un plan)
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,    -- 1, 2, 3, ...
  amount_cents INT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'verified', 'overdue', 'waived')),
  payment_id UUID,                    -- FK al payment una vez verificado (set después)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_installments_plan ON installments(payment_plan_id);
CREATE INDEX idx_installments_due ON installments(due_date) WHERE status IN ('pending', 'overdue');

-- payments (registro de pagos físicos verificados)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id),
  installment_id UUID REFERENCES installments(id),  -- a qué cuota corresponde
  client_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID NOT NULL REFERENCES cases(id),
  
  -- Detalles del pago físico
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash',           -- efectivo
    'zelle',          -- Zelle transfer
    'bank_transfer',  -- transferencia bancaria (ACH/wire)
    'check',          -- cheque
    'money_order',    -- money order
    'cashapp',        -- Cash App
    'venmo',          -- Venmo
    'other'           -- otro (con notas)
  )),
  payment_method_details TEXT,        -- ej: últimos 4 del cheque, sender de Zelle, etc.
  payment_date DATE NOT NULL,         -- fecha en que el cliente pagó
  
  -- Estado de verificación
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported',       -- cliente reportó el pago, esperando verificación admin
    'verified',       -- admin verificó y aceptó
    'rejected',       -- admin rechazó (comprobante inválido, monto incorrecto, etc.)
    'refunded'        -- pago refundado
  )),
  
  -- Quien lo registró (cliente o admin directamente)
  reported_by UUID NOT NULL REFERENCES profiles(id),
  reported_by_role TEXT NOT NULL CHECK (reported_by_role IN ('client', 'admin')),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verificación
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Refund (si aplica)
  refunded_at TIMESTAMPTZ,
  refunded_by UUID REFERENCES profiles(id),
  refund_amount_cents INT DEFAULT 0,
  refund_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_status ON payments(status) WHERE status = 'reported';
CREATE INDEX idx_payments_case ON payments(case_id);

-- payment_proofs (comprobantes subidos: foto de Zelle, recibo, etc.)
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,         -- Supabase Storage path
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  sha256_hash TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- payment_receipts (recibos generados por la plataforma para el cliente)
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL, -- ej: REC-2026-001234
  pdf_storage_path TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  emailed_to TEXT,
  emailed_at TIMESTAMPTZ
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

-- document_types (catálogo)
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_es TEXT,
  description_en TEXT,
  applicable_services TEXT[],         -- service slugs donde aplica
  is_required_default BOOLEAN DEFAULT false,
  accepts_file_types TEXT[]           -- ['image/jpeg', 'application/pdf']
);

-- documents (instancia: archivo del cliente)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id),
  document_type_id UUID REFERENCES document_types(id),
  storage_path TEXT NOT NULL,         -- Supabase Storage path encriptado
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  sha256_hash TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  is_generated BOOLEAN DEFAULT false, -- true si fue generado por la plataforma
  is_signed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'approved', 'rejected', 'archived')),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- COMPLIANCE & SANDBOX
-- ============================================================

-- audit_log (append-only, OBLIGATORIO para sandbox)
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  pii_accessed BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- complaints (sistema obligatorio sandbox)
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id),
  client_id UUID REFERENCES profiles(id),
  category TEXT NOT NULL CHECK (category IN (
    'inaccurate_result', 'failed_exercise_rights',
    'unnecessary_service', 'billing', 'technical', 'other'
  )),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated')),
  assigned_to UUID REFERENCES profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  reported_to_innovation_office BOOLEAN DEFAULT false,
  reported_to_innovation_office_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ai_interactions (logging de IA para auditoría sandbox)
CREATE TABLE ai_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  case_id UUID REFERENCES cases(id),
  model TEXT NOT NULL,
  prompt_tokens INT,
  completion_tokens INT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  guardrails_triggered TEXT[],
  user_flagged_inappropriate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGING
-- ============================================================

-- conversations (cliente ↔ admin)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id),
  client_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAWYERS DIRECTORY
-- ============================================================

CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  bar_number TEXT UNIQUE NOT NULL,
  bar_state TEXT NOT NULL DEFAULT 'UT',
  practice_areas TEXT[] NOT NULL,
  languages TEXT[] DEFAULT '{en}',
  bio_es TEXT,
  bio_en TEXT,
  hourly_rate_cents INT,
  is_supervisor BOOLEAN DEFAULT false, -- supervisor del sandbox vs aliado externo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,                 -- 'case_status_changed', 'payment_due', etc.
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  delivered_via TEXT[] DEFAULT '{in_app}', -- ['in_app', 'email', 'sms', 'push']
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Multi-casos por cliente — modelo explícito

**Pregunta del usuario**: "¿Mismo cliente puede tener varios casos del mismo servicio pero con otro menor?"
**Respuesta**: SÍ. El modelo lo soporta nativamente con:

```typescript
// Cliente Juan tiene 3 casos:
{ id: 'a1', client_id: 'juan', service_id: 'guardianship', display_name: 'Guardianship – sobrino Diego' }
{ id: 'a2', client_id: 'juan', service_id: 'guardianship', display_name: 'Guardianship – sobrina María' }
{ id: 'a3', client_id: 'juan', service_id: 'llc_formation', display_name: 'LLC – Latino Foods LLC' }
```

Cada caso tiene:
- Su propio `display_name` (cliente lo personaliza al crear)
- Su propio `beneficiary_data` (datos del menor o empresa)
- Su propio `intake_status`, `form_data`, `contract`, `payments`, `documents`
- Su propio audit log

En el dashboard del cliente se ven como 3 cards separadas con color coding por categoría.

### 3.3 Row Level Security (RLS) — matriz de permisos

| Tabla | client | admin |
|---|---|---|
| profiles | read/write own | read/write all |
| cases | read/write own | read/write all |
| case_activities | read own | read all |
| contracts | read own | read/write all |
| payment_plans | read own | read/write all |
| installments | read own | read/write all |
| payments | read own + create (report) | read/write all (verify) |
| payment_proofs | read own + upload | read all |
| payment_receipts | read own | read/write all |
| documents | read/write own | read/write all |
| ai_interactions | read own | read all |
| audit_log | read own (limited) | read all |
| complaints | read/write own | read/write all |
| messages | read/write own | read all |
| lawyers | read public bio | read/write all |
| services | read all | read/write all |

Ejemplo policy:
```sql
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can see own cases"
ON cases FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Admins see all cases"
ON cases FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));
```

---

## 4. Flujo de Negocio del Cliente

### 4.1 Onboarding (primera vez)

```
1. Landing page (público, bilingüe)
   ↓
2. Click "Empezar" → /register
   ↓
3. Sign up con email + password (o Google OAuth)
   ↓
4. Verificación de email (link en correo)
   ↓
5. Onboarding wizard (5 pasos):
   a) Información personal básica (nombre, DOB, teléfono)
   b) Verificación residencia Utah (sección 4.8 — upload manual + revisión admin)
   c) Aceptación de los 8 disclaimers obligatorios
   d) Tutorial visual de cómo funciona la plataforma
   e) Selección de idioma preferido
   ↓
6. Llega al Dashboard del cliente (vacío, con CTA "Crear primer caso")
```

### 4.2 Dashboard del cliente (con casos activos)

```
┌──────────────────────────────────────────────────────────┐
│  Hola, Juan 👋        🌐 ES/EN     🔔 3      👤 Perfil   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Tus casos activos (3)              [+ Nuevo caso]        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │ FAMILIA │ │ FAMILIA │ │ EMPRESA │  Filtros:            │
│  │ Diego   │ │ María   │ │ Latino  │  ☐ Familia          │
│  │ guard.  │ │ guard.  │ │ Foods   │  ☐ Vivienda         │
│  │ ▓▓▓░ 70%│ │ ▓░░░ 20%│ │ ✓ Done  │  ☐ Empresa          │
│  └─────────┘ └─────────┘ └─────────┘                      │
│                                                            │
│  📋 Próximos pasos:                                        │
│  • Subir certificado de nacimiento de María (caso a2)     │
│  • Pagar segunda cuota – $99 (caso a1)                    │
│  • Revisar PDF antes de firmar (caso a3)                  │
│                                                            │
│  💬 Mensajes (1 nuevo)                                     │
│  📅 Próxima cita: 12 mayo – Consulta con abogado aliado   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

Componentes:
- **Header**: nombre, toggle idioma, notificaciones, perfil.
- **Cases Grid**: cards con color según categoría (familia=#9B59B6 morado, vivienda=#3498DB azul, empresa=#27AE60 verde), badge de status, % de progreso.
- **Filtros**: por categoría, por status, búsqueda por display_name.
- **Próximos pasos**: tareas pendientes agregadas de todos los casos.
- **Mensajes**: inbox unificado.
- **Citas**: si hay consultas con abogado aliado.

### 4.3 Crear nuevo caso (flujo completo)

```
1. Click "+ Nuevo caso" en dashboard
   ↓
2. Catálogo de servicios (3 categorías como tabs/secciones):
   
   👨‍👩‍👧 Familia          🏠 Vivienda          🏢 Empresarial
   • Divorcio sin disp.   • Defensa desalojo   • LLC Formation
   • Custodia             • Tenant rights      • DBA
   • Cambio de nombre                          • Operating Agreement
   • Guardianship                              • Contractor Agreement
   • Power of Attorney
   ↓
3. Click servicio → ficha detallada:
   - Qué incluye / qué NO incluye
   - Disclaimers específicos
   - Precio + opciones (one-time vs subscription)
   - Tiempo estimado
   - Documentos que necesitarás
   - Botón "Iniciar este caso"
   ↓
4. Confirmación: "Yo elijo iniciar [servicio] para [beneficiario]"
   - Si servicio acepta beneficiarios:
     a) Personalizar nombre del caso (ej: "Guardianship – sobrina María")
     b) Datos del beneficiario (nombre, DOB, relación)
   - Confirmación explícita de los disclaimers (botón check)
   ↓
5. Caso creado con intake_status='created'
   ↓
6. Generación automática del contrato:
   - Sistema toma terms_snapshot (precio, scope, refund policy)
   - Genera PDF de contrato
   - Crea Dropbox Sign signature request
   - intake_status → 'contract_pending'
   ↓
7. Cliente revisa y firma contrato (en pantalla, embedded Dropbox Sign)
   - Webhook recibe firma
   - signature_status → 'signed', signed_pdf_storage_path guardado
   - intake_status → 'contract_signed'
   - audit_log entry
   ↓
8. Pago manual (sección 4.7 detalla el flujo):
   - Admin define el plan de pagos al crear el caso (one-time o cuotas)
   - Cliente recibe instrucciones de pago en el portal:
     • Métodos aceptados: efectivo, Zelle, transferencia, cheque, money order
     • Datos de la cuenta/persona a quien pagar
     • Monto exacto y referencia (case_number)
   - Cliente paga físicamente
   - Cliente reporta el pago en el portal:
     • Selecciona método usado
     • Fecha del pago
     • Monto
     • SUBE FOTO/PDF del comprobante (recibo, screenshot Zelle, foto cheque)
   - Pago queda en status='reported' (pendiente verificación admin)
   - Admin recibe notificación, verifica el comprobante:
     • Si OK → status='verified' → genera recibo PDF → envía al cliente
     • Si NO → status='rejected' con razón → notifica al cliente
   - Si verified → intake_status del caso → 'in_progress'
   ↓
9. Wizard del formulario inicia
```

### 4.4 Wizard del formulario

```
┌──────────────────────────────────────────────────────────┐
│  Caso: Guardianship – sobrina María          [Guardar y salir]│
│  Paso 3 de 8: Información del menor          ▓▓▓░░░░░ 38% │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Pregunta 1: Nombre completo de la menor                   │
│  [María Pérez González                              ]      │
│  ℹ️ Tal como aparece en su acta de nacimiento              │
│                                                            │
│  Pregunta 2: Fecha de nacimiento                           │
│  [📅 12/03/2018          ]                                 │
│                                                            │
│  Pregunta 3: ¿Tienes el acta de nacimiento de María?       │
│  ⚪ Sí, ya la tengo  ⚪ No, debo conseguirla               │
│                                                            │
│  💡 Tip: Puedes subir una foto del documento y la IA       │
│     te ayudará a extraer la información automáticamente.   │
│  [📷 Subir foto del acta]                                  │
│                                                            │
│  ───────────────────────────────────────                   │
│  Chat IA opcional  💬                                      │
│  "¿Necesitas ayuda con esta sección?"                      │
│  [_________________________________________] [Enviar]     │
│  ⚠️ Esta IA NO da asesoría legal                          │
│                                                            │
│  [← Atrás]                          [Guardar] [Siguiente →]│
└──────────────────────────────────────────────────────────┘
```

Características:
- Auto-save cada 30s (localStorage + DB).
- Validación en tiempo real (Zod).
- Tooltips explicativos (definición, no asesoría).
- IA opcional (chat lateral).
- Subir documento → Gemini multimodal extrae datos → usuario REVISA antes de poblar.
- Botón "Guardar y salir" para continuar después.
- Indicador de progreso.

### 4.5 Revisión y finalización

```
1. Cliente completa todos los pasos del wizard
   ↓
2. Pantalla de revisión: PDF preview con todos los datos
   - Cliente puede editar cualquier respuesta (vuelve al wizard)
   - Confirmar correcciones
   ↓
3. Si lawyer_review_required=true:
   - intake_status → 'review_pending'
   - Notification al lawyer supervisor
   - Cliente espera (notificado por email cuando avanza)
   ↓
4. Lawyer revisa:
   - Si OK → intake_status → 'approved'
   - Si necesita correcciones → 'needs_correction' con notas
   ↓
5. Cliente firma el PDF final (Dropbox Sign)
   ↓
6. intake_status → 'finalized'
   ↓
7. Pantalla de descarga + instrucciones:
   - Descargar PDF firmado
   - "Cómo presentar en Utah Courts"
   - Costos de filing fee
   - Link a fee waiver si aplica
   - Encuesta NPS
   ↓
8. Caso queda en estado 'finalized' (visible en dashboard como completado)
```

### 4.6 Post-servicio
- Encuesta NPS post-finalización (métrica para sandbox).
- Acceso a documentos del caso por 7 años.
- Posibilidad de iniciar nuevo caso (incluyendo del mismo servicio).
- Sistema de complaints accesible siempre.

### 4.7 Sistema de control de pagos manuales (sin pasarela)

**Filosofía**: el cliente paga físicamente (efectivo, Zelle, transferencia, cheque, money order). El sistema **rastrea, verifica y documenta** cada pago, pero NO procesa transacciones.

#### Vista del cliente — sección "Mis Pagos"

```
┌──────────────────────────────────────────────────────────┐
│  Mis Pagos                                                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Caso: Divorcio sin disputa  (#USLP-2026-001234)          │
│  Plan: 3 cuotas de $200 + enganche $300                   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ✓ Enganche      $300   12 abr   Verificado         │  │
│  │ ✓ Cuota 1       $200   12 may   Verificado         │  │
│  │ ⏳ Cuota 2      $200   12 jun   Pendiente reporte  │  │
│  │ 📅 Cuota 3      $200   12 jul   No vencida         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Total pagado: $500 / $900    Saldo: $400                 │
│                                                            │
│  [📤 Reportar nuevo pago]                                 │
│                                                            │
│  💳 Métodos aceptados:                                     │
│  • Efectivo (en oficina, Salt Lake City)                  │
│  • Zelle: pagos@usalatinoprime.com                        │
│  • Cheque a nombre de "USA Latino Prime LLC"              │
│  • Transferencia: [Datos bancarios encriptados]            │
└──────────────────────────────────────────────────────────┘
```

#### Flujo de reporte de pago (cliente)

```
1. Click "Reportar nuevo pago"
   ↓
2. Modal:
   - Cuota a la que aplica (dropdown con cuotas pendientes)
   - Método usado (radio buttons)
   - Fecha del pago (date picker)
   - Monto pagado (con sugerencia automática)
   - Detalles según método:
     • Si Zelle: nombre/email del sender
     • Si cheque: número de cheque + banco
     • Si transferencia: últimos 4 + banco
     • Si efectivo: a quién se entregó
   - SUBIR COMPROBANTE (drag & drop, foto/PDF)
     ⚠️ Obligatorio: sin comprobante no se puede reportar
   ↓
3. Submit → payment creado con status='reported'
   ↓
4. Cliente ve confirmación: "Pago reportado. Esperando verificación (1-2 días hábiles)."
   ↓
5. Admin verifica → cliente recibe notificación + recibo PDF
```

#### Vista del admin — Dashboard de pagos

```
/admin/payments

Tabs: [Pendientes (12)] [Verificados] [Rechazados] [Cuotas vencidas]

PENDIENTES DE VERIFICAR:
┌──────────────────────────────────────────────────────────┐
│ Cliente | Caso | Monto | Método | Fecha | Comprobante    │
├──────────────────────────────────────────────────────────┤
│ J.Garc. │ #234 │ $200  │ Zelle  │ 12/06 │ [Ver foto] ✓✗ │
│ M.Lóp.  │ #235 │ $300  │ Efect. │ 11/06 │ [Ver foto] ✓✗ │
│ ...                                                        │
└──────────────────────────────────────────────────────────┘

Click en pago → Modal de verificación:
  - Comprobante en grande (zoom)
  - Detalles del pago reportado
  - Datos de la cuota correspondiente
  - Botones: [✓ Verificar] [✗ Rechazar con razón]

Si verifica:
  - payment.status='verified', verified_by=admin, verified_at=NOW()
  - installment.status='verified', installment.payment_id=pay.id
  - Generar payment_receipt (PDF) automáticamente
  - Email al cliente con recibo adjunto
  - audit_log entry
  - Si era última cuota → payment_plan.status='completed'
  - Si era enganche/primera cuota → case.intake_status puede avanzar

Si rechaza:
  - payment.status='rejected', rejection_reason
  - installment vuelve a 'pending'
  - Notificación al cliente con razón
  - audit_log entry
```

#### Crear plan de pagos (admin)

Cuando admin crea el caso o después:

```
/admin/cases/[id]/payment-plan

Form:
  - Monto total: [$900]
  - Tipo: ⚪ Pago único  ⚪ Cuotas
  
  Si cuotas:
    - Enganche (opcional): [$300]
    - Número de cuotas: [3]
    - Frecuencia: ⚪ Mensual  ⚪ Quincenal  ⚪ Custom
    - Fecha primera cuota: [12/05/2026]
  
  Preview del cronograma:
    Enganche $300  - 12/04/2026
    Cuota 1  $200  - 12/05/2026
    Cuota 2  $200  - 12/06/2026
    Cuota 3  $200  - 12/07/2026
  
  Notas internas: [textarea para admin]
  
  [Guardar plan]
```

Genera `payment_plan` + N filas en `installments`.

#### Cuotas vencidas (overdue)

Cron job diario (Upstash QStash) revisa `installments`:
- Si `due_date < NOW()` y status='pending' → status='overdue'
- Notificación al cliente: "Tienes una cuota vencida del $X"
- Notificación al admin: "Cliente Y tiene cuota vencida"
- Si overdue >30 días → admin puede marcar payment_plan.status='in_default'

#### Recibos PDF automáticos

Al verificar un pago, se genera:
- PDF con membretado de USA Latino Prime
- Número de recibo único (REC-2026-XXXXXX)
- Datos del cliente y caso
- Detalle del pago
- Saldo pendiente del plan
- Almacenado en Supabase Storage encriptado
- Enviado por email al cliente
- Disponible para descarga en su portal

#### Refunds (manejo manual)

Si el cliente cancela el caso:
- Admin marca caso como 'cancelled' con `cancellation_reason`
- Admin decide si hay refund (según refund_policy del contrato)
- Si refund: registra `payment.refunded_at`, `refunded_by`, `refund_amount_cents`, `refund_reason`
- Refund físico se ejecuta fuera del sistema (Zelle/cheque/etc.)
- Admin sube comprobante del refund (en `payment_proofs` con tipo refund)
- Email al cliente confirmando refund

#### Por qué este diseño funciona para sandbox

- **Audit trail completo**: cada pago tiene comprobante + verificación + recibo.
- **Transparencia**: cliente ve exactamente qué pagó y qué debe.
- **Sin riesgo de chargebacks** (no hay tarjeta de crédito).
- **Cumplimiento UCPA**: datos financieros mínimos (no se almacenan números de tarjeta).
- **Escalable**: cuando crezca el negocio, fácil migrar a pasarela agregando un nuevo `payment_method='stripe'` sin cambiar el modelo.

### 4.8 Verificación de residencia Utah (sin Stripe Identity)

Como NO usamos pasarelas, la verificación es manual + asistida por IA.

#### Flujo del cliente

```
1. En onboarding paso (b):
   "Necesitamos verificar que eres residente de Utah"
   ↓
2. Subir documentos:
   - Foto/scan del Driver License o State ID de Utah (frente y reverso)
   - Opcional: comprobante de domicilio reciente
     (utility bill, bank statement, lease — últimos 60 días)
   ↓
3. Gemini multimodal extrae datos del ID automáticamente:
   - Nombre completo
   - DOB
   - Dirección
   - Estado emisor (debe ser UT)
   - Fecha de expiración
   ↓
4. Cliente CONFIRMA los datos extraídos (puede corregir)
   ↓
5. Sistema marca: utah_residency_verified=false, _method='pending_admin_review'
   ↓
6. Admin recibe notificación → revisa documentos manualmente
   ↓
7. Admin verifica:
   - ID es válido (no expirado, no alterado visualmente)
   - Estado es Utah
   - Datos coinciden con onboarding
   - Si OK → utah_residency_verified=true, _method='admin_verified'
   - Si NO → solicita más info al cliente
   ↓
8. Cliente desbloqueado para usar la plataforma
```

#### Por qué este diseño es válido
- Stripe Identity costaría $1.50+/verificación; con escala se acumula.
- La revisión manual por admin es aceptable para volumen MVP (<500 usuarios).
- Cuando crezca el volumen, fácil agregar Stripe Identity como opción.
- Para sandbox: documentación completa del proceso de verificación es lo importante (no la herramienta específica).

---

## 5. Flujo del Admin

### 5.1 Dashboard principal (KPIs)

```
┌──────────────────────────────────────────────────────────┐
│  Admin Dashboard                  Período: [Este mes ▼]   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  📊 KPIs                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Casos    │ │   MRR    │ │ Compl.   │ │  NPS     │     │
│  │ activos  │ │          │ │ ratio    │ │ Score    │     │
│  │  127     │ │ $4,890   │ │ 1:6,200  │ │  +52     │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
│  ⚠️ Alertas (3)                                            │
│  • Caso #USLP-2026-001220 sin actividad 7 días            │
│  • Complaint nueva (cat: inaccurate_result)                │
│  • Audit pending del Innovation Office (vence en 14 días)  │
│                                                            │
│  📈 Tendencias                                             │
│  [Gráfica casos creados vs finalizados últimos 30 días]   │
│  [Funnel: signup → first case → contract → payment → done]│
│                                                            │
│  🗂️ Últimos casos             [Ver todos →]               │
│  ┌──────────────────────────────────────────────────────┐│
│  │ #001234 | Juan García | Divorcio | in_progress | 70% ││
│  │ #001233 | María López  | LLC      | finalized   | ✓  ││
│  │ ...                                                    ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 5.2 Gestión de casos (vista general)

```
/admin/cases

Filtros: 
  [Categoría ▼] [Estado ▼] [Servicio ▼] [Asignado a ▼] [Fecha ▼]
  [🔍 Buscar por # caso, cliente, email...]

Vista:
  • Tabla (default): paginada, ordenable
  • Kanban: drag-and-drop por intake_status

┌──────────┬──────────┬──────────┬──────────┬──────────┬─────────┐
│ # Caso   │ Cliente  │ Servicio │ Status   │ Asignado │ Acciones│
├──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤
│ #001234  │ J. García│ Divorcio │ revisión │ Lic. Pér.│ [Abrir] │
│ #001233  │ M. López │ LLC      │ in_prog  │ —        │ [Abrir] │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘

Bulk actions: asignar lawyer, cambiar status, exportar
```

### 5.3 Vista de cliente individual

```
/admin/clients/[clientId]

┌──────────────────────────────────────────────────────────┐
│  Juan García                       [Email] [Llamar] [...] │
│  jgarcia@email.com | (801) 555-1234 | Utah verified ✓     │
│  Cliente desde: 15 enero 2026                              │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Tabs: [Casos (3)] [Pagos] [Documentos] [Mensajes] [Audit]│
│                                                            │
│  CASOS:                                                    │
│  ┌──────────────────────────────────────────────────────┐│
│  │ #001234 Divorcio sin disputa     in_progress  70%    ││
│  │ #001220 Guardianship sobrino     finalized    ✓      ││
│  │ #001215 LLC Formation            cancelled    ✗      ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 5.4 Vista de caso individual (admin)

```
/admin/cases/[caseId]

Tabs: [Resumen] [Form Data] [Documentos] [Pagos] [Mensajes] [Audit Log]

RESUMEN:
  - Información general (cliente, servicio, beneficiary, status)
  - Timeline visual del workflow
  - Próximos pasos pendientes
  - Asignar admin responsable del caso
  - Botones: cambiar status, agregar nota interna, generar PDF, etc.

FORM DATA:
  - Visor de form_data completo
  - Comparación con plantilla del workflow
  - Botón "Generar PDF" (preview)
  - Botón "Solicitar correcciones" → notas + cambia status

AUDIT LOG:
  - Timeline cronológico de TODAS las acciones
  - Filtros por actor, tipo de acción, fecha
  - Export CSV
```

### 5.5 Control de pagos (admin) — cubierto en sección 4.7

Resumen de las pantallas admin:
- `/admin/payments` — dashboard de pagos pendientes/verificados/rechazados/vencidos.
- `/admin/payments/[paymentId]/verify` — modal de verificación con comprobante.
- `/admin/cases/[caseId]/payment-plan` — crear/editar plan de pagos para un caso.
- `/admin/billing-reports` — reportes financieros mensuales (ingresos, cuotas vencidas, refunds).

### 5.6 Verificación de identidad (admin)

`/admin/identity-verifications` — cola de clientes pendientes de verificación de residencia Utah.
Para cada uno: ver documentos subidos, datos extraídos por Gemini, botones aprobar/rechazar/pedir más info.

### 5.7 Compliance / Sandbox reporting

```
/admin/compliance

Secciones:
  • Métricas mensuales / trimestrales (auto-generadas)
  • Complaint dashboard (categorización del Consumer Harm Framework)
  • Generación de reportes para Innovation Office (CSV/PDF)
  • Audit log search (todas las acciones del sistema)
  • IA interactions log (revisión de respuestas inadecuadas)
  • Mock audits internos (simulación)
  • Export de TODA la data si Innovation Office la requiere
```

---

## 6. Nota sobre el Abogado Supervisor (sandbox Moderate Innovation)

El sandbox exige un abogado licenciado en Utah que supervise QA, plantillas y revisión de casos para Moderate Innovation. **No es un rol técnico separado en el sistema** — se modela de una de estas dos formas:

### Opción A (recomendada): el abogado tiene cuenta `admin`
- El abogado supervisor es un `admin` más en el sistema.
- Tiene acceso completo a `/admin/qa-reviews` para revisar casos pendientes.
- Sus revisiones se registran en `cases.qa_reviewed_by` (FK a su profile).
- El audit log diferencia sus acciones por `actor_id`.
- Ventaja: simplicidad técnica + cumple requisito sandbox.

### Opción B: revisión externa al sistema
- El admin (dueño) exporta el caso a PDF y lo envía al abogado por email.
- Abogado revisa fuera del sistema y devuelve aprobación/correcciones.
- El admin registra el resultado en `cases.qa_review_notes`.
- Ventaja: el abogado no necesita aprender la app. Desventaja: menos audit trail.

**Recomendación**: empezar con Opción A. Si el abogado prefiere no usar la app, fallback a B.

Pantallas relevantes (todas dentro del portal `/admin`):
- `/admin/qa-reviews` — cola de casos en `intake_status='review_pending'`.
- `/admin/qa-reviews/[caseId]` — visor del caso + checklist QA + botones aprobar/correcciones.
- `/admin/lawyers` — directorio de abogados aliados (PÚBLICO en website + privado para gestión).

---

## 7. Patrones de Diseño Aplicados

### 7.1 Repository Pattern
Abstrae acceso a Supabase. Permite testear sin BD real.

```typescript
// server/repositories/case-repository.ts
export interface CaseRepository {
  findById(id: string): Promise<Case | null>;
  findByClient(clientId: string): Promise<Case[]>;
  create(data: CreateCaseInput): Promise<Case>;
  update(id: string, patch: UpdateCaseInput): Promise<Case>;
  transitionStatus(id: string, to: IntakeStatus): Promise<Case>;
}

export class SupabaseCaseRepository implements CaseRepository {
  constructor(private readonly client: SupabaseClient) {}
  // implementación...
}

// Para testing:
export class InMemoryCaseRepository implements CaseRepository {
  private cases: Map<string, Case> = new Map();
  // implementación in-memory...
}
```

### 7.2 Service Layer (Use Cases)
Business logic centralizado.

```typescript
// server/services/case-service.ts
export class CaseService {
  constructor(
    private cases: CaseRepository,
    private contracts: ContractRepository,
    private audit: AuditLogService,
    private notify: NotificationService,
    private workflow: WorkflowEngine
  ) {}

  async createCase(input: CreateCaseInput): Promise<Case> {
    // 1. Validate input (schema)
    // 2. Verify client is Utah resident
    // 3. Create case (status='created')
    // 4. Generate contract
    // 5. Send for signature
    // 6. Audit log
    // 7. Notify client
  }

  async transitionStatus(caseId: string, to: IntakeStatus, actor: User): Promise<Case> {
    // 1. Load case
    // 2. Validate transition is allowed (state machine)
    // 3. Apply transition
    // 4. Trigger side effects (notifications, etc.)
    // 5. Audit log
  }
}
```

### 7.3 State Machine Pattern (workflow engine)

```typescript
// server/workflows/_engine.ts
export interface WorkflowDefinition<TFormData> {
  slug: string;
  steps: WorkflowStep<TFormData>[];
  formSchema: ZodSchema<TFormData>;
  pdfTemplate: string;
  validate(data: Partial<TFormData>): ValidationResult;
  isComplete(data: Partial<TFormData>): boolean;
}

export interface WorkflowStep<TFormData> {
  id: string;
  title_es: string;
  title_en: string;
  fields: FormField[];
  condition?: (data: Partial<TFormData>) => boolean;
  validation?: ZodSchema<Partial<TFormData>>;
}

// State machine de intake_status
const ALLOWED_TRANSITIONS: Record<IntakeStatus, IntakeStatus[]> = {
  created: ['contract_pending', 'cancelled'],
  contract_pending: ['contract_signed', 'cancelled'],
  contract_signed: ['payment_pending', 'cancelled'],
  payment_pending: ['in_progress', 'cancelled'],
  in_progress: ['review_pending', 'cancelled'],
  review_pending: ['approved', 'needs_correction', 'cancelled'],
  needs_correction: ['in_progress', 'cancelled'],
  approved: ['finalized', 'needs_correction'],
  finalized: ['archived'],
  archived: [],
  cancelled: [],
};

export function canTransition(from: IntakeStatus, to: IntakeStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 7.4 Strategy Pattern (servicios diferentes, mismo motor)

```typescript
// server/workflows/uncontested-divorce.ts
export const uncontestedDivorceWorkflow: WorkflowDefinition<DivorceFormData> = {
  slug: 'uncontested-divorce',
  steps: [
    { id: 'personal-info', title_es: 'Información personal', fields: [...] },
    { id: 'spouse-info', title_es: 'Información del cónyuge', fields: [...] },
    { id: 'children', title_es: 'Hijos', fields: [...] },
    { id: 'assets', title_es: 'Bienes', fields: [...] },
    // ...
  ],
  formSchema: divorceSchema,
  pdfTemplate: 'utah-uncontested-divorce.pdf',
  validate: (data) => divorceSchema.safeParse(data),
  isComplete: (data) => completedSteps.length === steps.length,
};

// server/workflows/llc-formation.ts
export const llcFormationWorkflow: WorkflowDefinition<LLCFormData> = {
  slug: 'llc-formation',
  // ... estructura idéntica, contenido distinto
};

// Uso uniforme:
const workflow = workflowRegistry.get(case.service.workflow_slug);
workflow.validate(case.form_data);
```

### 7.5 Compliance Wrapper (Decorator)

```typescript
// server/compliance/wrap-with-compliance.ts
export async function withCompliance<T>(
  ctx: ComplianceContext,
  fn: () => Promise<T>
): Promise<T> {
  await auditLog.write({ ...ctx, phase: 'started' });
  const riskCheck = await evaluateRisk(ctx);
  if (riskCheck.shouldBlock) {
    await auditLog.write({ ...ctx, phase: 'blocked', reason: riskCheck.reason });
    throw new ComplianceError(riskCheck.reason);
  }
  try {
    const result = await fn();
    await auditLog.write({ ...ctx, phase: 'completed' });
    return result;
  } catch (error) {
    await auditLog.write({ ...ctx, phase: 'failed', error: error.message });
    throw error;
  }
}
```

### 7.6 Factory Pattern (PDF generation)

```typescript
// server/services/pdf-generator-factory.ts
export class PDFGeneratorFactory {
  create(workflowSlug: string): PDFGenerator {
    switch (workflowSlug) {
      case 'uncontested-divorce':
        return new DivorcePDFGenerator();
      case 'llc-formation':
        return new LLCPDFGenerator();
      // ...
    }
  }
}
```

---

## 8. Capa de IA (Gemini) — diseño defensivo

```typescript
// server/integrations/gemini/legal-assistant.ts

export class LegalAssistant {
  constructor(
    private gemini: GeminiClient,
    private guardrails: GuardrailService,
    private auditLog: AIAuditService
  ) {}

  async chat(input: ChatInput): Promise<ChatResponse> {
    // CAPA 1: Filtro pre-IA de palabras clave
    const blocked = await this.guardrails.checkInput(input.message);
    if (blocked) {
      await this.auditLog.recordBlocked(input, blocked.reason);
      return blocked.cannedResponse;
    }

    // CAPA 2: System prompt defensivo
    const systemPrompt = this.guardrails.getSystemPrompt(input.context);

    // CAPA 3: Gemini call con safety settings
    const response = await this.gemini.generate({
      model: 'gemini-2.5-flash',
      systemPrompt,
      messages: [...input.history, { role: 'user', content: input.message }],
      safetySettings: STRICT_SAFETY_SETTINGS,
    });

    // CAPA 4: Output classifier (segundo LLM verifica que no sea asesoría)
    const isAdvice = await this.guardrails.classifyAsAdvice(response.text);
    if (isAdvice) {
      await this.auditLog.recordFlagged(input, response, 'output_classified_as_advice');
      return CANNED_NO_ADVICE_RESPONSE;
    }

    // CAPA 5: Audit log
    await this.auditLog.record({ input, response, model: 'gemini-2.5-flash' });

    return { text: response.text, requiresUserReview: false };
  }

  async extractFromDocument(image: Buffer, schema: ZodSchema): Promise<ExtractionResult> {
    // Function calling con structured output
    // Siempre retorna requiresUserReview: true
  }
}
```

---

## 9. Convenciones de Código

### 9.1 Naming
- **Tablas/columnas**: snake_case (`legal_cases`, `created_at`).
- **Routes**: kebab-case (`/admin/cases`, `/api/case-forms`).
- **Componentes React**: PascalCase (`CaseCard`, `WizardStep`).
- **Funciones**: camelCase (`fetchCases`, `createCase`).
- **Constantes**: UPPER_SNAKE_CASE (`MAX_CASES_PER_USER`).
- **Types/Interfaces**: PascalCase (`Case`, `IntakeStatus`).
- **Files**: kebab-case (`case-service.ts`, `wizard-step.tsx`).
- **Tests**: `<file>.test.ts` o `<file>.spec.ts`.

### 9.2 Estructura de archivos por feature
```
features/cases/
├── components/
│   ├── case-card.tsx
│   ├── case-detail.tsx
│   └── case-status-badge.tsx
├── hooks/
│   ├── use-cases.ts          # TanStack Query hook
│   └── use-create-case.ts
├── api/
│   └── cases-client.ts       # fetch wrappers
├── types.ts                   # feature-specific types
└── index.ts                   # barrel export
```

### 9.3 Reglas no negociables
1. **Strict TypeScript** — no `any`, no `@ts-ignore`.
2. **Zod schemas** para CADA validación (DB → API → UI).
3. **Tests obligatorios** para domain layer, services, y use cases.
4. **Server actions** validados con Zod antes de tocar DB.
5. **RLS en TODAS las tablas** — verificado por CI.
6. **Audit log automático** vía compliance wrapper.
7. **Secrets en Supabase Vault** o Vercel env vars cifrados, NO en código.
8. **PII enmascarado** en logs (SSN solo últimos 4 dígitos, nunca DOB completo).

---

## 10. Testing Strategy

### 10.1 Pirámide de tests
- **70% Unit tests** (Vitest): domain logic, services, utils.
- **20% Integration tests** (Vitest + Supabase test DB): repositories, server actions.
- **10% E2E tests** (Playwright): flujos críticos del cliente y admin.

### 10.2 Cobertura objetivo
- Domain layer: 95%+
- Application layer (services): 85%+
- Infrastructure layer (repositories): 70%+
- UI components: 60%+ (smoke tests + key interactions)

### 10.3 Tests críticos obligatorios
- State machine de `intake_status` (todas las transiciones permitidas/bloqueadas).
- Workflow engine para cada servicio.
- Guardrails de IA (50+ prompts maliciosos: asesoría, inmigración, jailbreak).
- Compliance wrapper (audit log se escribe en TODAS las acciones).
- RLS policies (cliente NO puede ver casos de otro cliente).
- Cálculo de pricing y cuotas.
- Generación de PDF (campo a campo contra plantilla oficial).
- Flujo end-to-end: signup → case creation → contract → payment → wizard → finalize.

---

## 11. Reutilización del Proyecto Existente UsaLatinoPrime

### 11.1 Componentes/código a reutilizar
| Origen | Qué reutilizar | Cómo adaptarlo |
|---|---|---|
| `lib/workflows/*.ts` | Estructura de workflow definitions | Refactorizar al nuevo `WorkflowDefinition` interface |
| `lib/legal/*-form-schema.ts` | Patrón de zod schemas exhaustivos | Usar tal cual para divorce, LLC, etc. |
| `lib/pdf/*/field-map.ts` | PDF field mapping | Reutilizar para forms de Utah Courts (no USCIS) |
| `hooks/useAutoSave.ts` | Lógica de autosave (190 líneas, bien hecho) | Mover a `features/wizard/hooks/use-autosave.ts` |
| `components/ui/*` | shadcn primitives | Copiar tal cual |
| `lib/data/countries.ts`, `states.ts` | Listas de datos | Copiar tal cual |
| Textos legales / disclaimers | Bilingüe español/inglés | Refinar para no migratorio |

### 11.2 Lo que se descarta
- TODOS los componentes (god components, refactorizar).
- TODAS las APIs (god APIs, reescribir con service layer).
- Estructura de carpetas actual.
- Estado ad-hoc con useState (reemplazar con Zustand + TanStack Query).
- Acceso directo a Supabase desde componentes.

### 11.3 Lo que se agrega desde cero
- Tests (Vitest + Playwright).
- Data layer (repositories + TanStack Query).
- Service layer (use cases).
- Compliance wrapper.
- Workflow engine genérico.
- ADRs y documentación.
- CI/CD con verificaciones (RLS, tests, types, lint).

---

## 12. Roadmap de Implementación (16 semanas)

### Sprint 1-2 (sem 1-4): Foundation
- Setup proyecto: Next.js 15 + TS strict + Tailwind + Biome + Vitest.
- Supabase: schema base + RLS + seed.
- Auth: signup/login/email verification.
- Compliance layer base (audit_log).
- CI/CD básico (Vercel + GitHub Actions).
- ADRs iniciales.

### Sprint 3-4 (sem 5-8): Onboarding y catálogo
- Onboarding wizard (5 pasos).
- Stripe Identity (verificación Utah).
- Disclaimers + consents tracking.
- Service catalog (UI + admin editor).
- Dashboard del cliente vacío.
- i18n base (next-intl).

### Sprint 5-6 (sem 9-12): Primer caso end-to-end (Divorcio)
- Workflow engine genérico.
- Workflow `uncontested-divorce`.
- Wizard UI completo.
- Auto-save.
- Generación de contrato + Dropbox Sign integration.
- **Sistema de pagos manuales completo** (payment_plans + installments + payments + proofs + receipts).
- **Dashboard admin de pagos** (verificación de comprobantes).
- **Verificación manual de residencia Utah** (Gemini extracción + admin review).
- PDF-lib para llenar formulario Utah Courts.
- Pantalla de revisión + finalización.

### Sprint 7-8 (sem 13-16): IA + servicios adicionales + admin
- Gemini Vertex AI con BAA.
- Guardrails multi-capa.
- Subir documento → extraer datos.
- Workflows: eviction defense, LLC formation.
- Admin dashboard básico (KPIs + lista de casos).
- Lawyer supervisor portal básico.
- Sistema de complaints integrado al Innovation Office.

### Pre-aplicación al sandbox (sem 17-20)
- Auditoría interna contra checklist sandbox.
- Pen test inicial.
- Refinamiento UX basado en beta testers (50+ usuarios Utah).
- Documentación legal completa.
- Application al Innovation Office.

---

## 13. Riesgos Arquitecturales y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Workflow engine no escala a nuevos servicios | Diseñar como plugin system desde día 1 con tests del engine |
| Supabase RLS mal configurado expone datos | CI verifica RLS en todas las tablas + tests automatizados |
| Estado UI complejo con multi-casos | Zustand stores por feature + TanStack Query para server state |
| Performance con 1000+ casos en admin dashboard | Pagination + virtual scrolling + índices Postgres |
| Gemini API caro si no se cachea | Context caching agresivo + Flash-Lite para tareas simples |
| Multi-step wizard pierde progreso | Auto-save dual (localStorage + DB) cada 30s |
| Audit log crece sin límite | Particionamiento Postgres por mes + archive cold storage 1 año+ |
| Tests se vuelven flaky | Repositorios in-memory para unit tests, Supabase test branch para integration |

---

## 14. Verificación

### 14.1 Cómo verificar arquitectura

```bash
# Type checking
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test           # unit
pnpm test:int       # integration
pnpm test:e2e       # Playwright

# Verificar RLS en todas las tablas
pnpm verify:rls

# Verificar que no hay imports de server/ en client/
pnpm verify:boundaries

# Verificar tamaño de archivos
pnpm verify:file-size  # falla si algún .tsx > 300 líneas

# Performance budget
pnpm lighthouse
```

### 14.2 Definition of Done por feature
- [ ] Domain layer con tests (95%+ coverage)
- [ ] Service layer con tests (85%+ coverage)
- [ ] Repository con tests
- [ ] UI components con smoke tests
- [ ] E2E test del flujo principal
- [ ] RLS policies definidas y testeadas
- [ ] Audit log entries para acciones sensibles
- [ ] i18n completo (es + en)
- [ ] WCAG 2.2 AA verificado (axe-core)
- [ ] Documentación actualizada (README + ADR si aplica)

---

## 15. Referencias

- **Documento complementario**: `C:\Users\mauri\Documents\Trabajos\usalatinoprimeutah\REQUERIMIENTOS.md` (requerimientos regulatorios sandbox).
- **Proyecto de referencia (NO usar como base)**: `C:\Users\mauri\Documents\Trabajos\UsaLatinoPrime` (form-filling migratorio existente).
- **Sandbox Utah**: https://utahinnovationoffice.org/
- **Stack docs**:
  - Next.js 15: https://nextjs.org/docs
  - Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
  - TanStack Query: https://tanstack.com/query/latest
  - Zustand: https://zustand-demo.pmnd.rs/
  - shadcn/ui: https://ui.shadcn.com/
  - Vitest: https://vitest.dev/

---

## 16. Resumen Ejecutivo

Plataforma SaaS bilingüe construida con **Next.js 15 + Supabase + Gemini Vertex AI**, organizada en **Clean Architecture de 4 capas** (Presentation, Application, Domain, Infrastructure) con módulos verticales por feature.

**Modelo de datos** centrado en `cases` que soportan multi-casos por cliente (incluyendo casos del mismo servicio con beneficiarios distintos como múltiples menores en guardianship o múltiples LLCs). Cada caso tiene su propio contrato con e-signature (Dropbox Sign), su plan de pagos con cuotas, audit log y workflow state machine.

**Pagos 100% manuales** (sin pasarela): el cliente paga físicamente (efectivo, Zelle, transferencia, cheque, money order), reporta el pago con comprobante en el portal, y el admin verifica manualmente. El sistema rastrea cuotas, genera recibos PDF automáticos, alerta sobre cuotas vencidas, y mantiene audit trail completo. Verificación de residencia Utah también manual: cliente sube ID, Gemini extrae datos, admin verifica.

**2 roles** (modelo simplificado): `client` (portal propio) y `admin` (dashboard completo, gestión de todo). El abogado supervisor del sandbox (requisito Moderate Innovation) se modela como un `admin` más — no como rol técnico separado.

**Compliance-first**: audit log inmutable en append-only, complaint system integrado al Innovation Office, IA con guardrails multi-capa, PII encriptada, RLS estricto en todas las tablas, secrets en vault.

**Reutiliza del proyecto migratorio existente**: workflow definitions, zod schemas, PDF field mappings, autosave hook, shadcn UI, listas de datos. **Descarta**: god components, god APIs, estado ad-hoc.

**Roadmap 16 semanas** hasta MVP listo para aplicar al sandbox + 4 semanas de pre-aplicación.
