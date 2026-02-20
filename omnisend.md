\# SOLDT ↔ Omnisend Integration (v5) — Implementation Spec

Last reviewed: 2026-02-08    
Docs: Omnisend API Reference (v5) \+ Events endpoint

\#\# Goal

Build a first-class Omnisend integration for SOLDT (multi-tenant) that enables:

\- Abandoned cart \+ abandoned checkout automations  
\- Post-purchase automations \+ revenue attribution  
\- Contact identification/sync (email/phone \+ consent)  
\- Optional: product/category sync for richer templates/blocks

SOLDT context:  
\- Storefront \+ admin are hosted on different domains.  
\- Merchant identity is resolved via \`MerchantContext\` (slug-based on admin domain, hostname-based on custom domains).  
\- Orders are created in Supabase on checkout submit; cart is managed client-side.

\---

\#\# Omnisend API “truths” we rely on

\#\#\# API versions & surface area  
Omnisend docs expose multiple versions (v3, v4, v5 \+ preview/beta). We implement v5 for event tracking, and keep room for fallback/compat decisions later.

\#\#\# Events are the core  
Omnisend v5 includes predefined ecommerce events we will emit from SOLDT, including:  
\- \`added product to cart\`  
\- \`started checkout\`  
\- \`placed order\`  
\- \`paid for order\`  
\- \`order refunded\`  
\- \`order fulfilled\`  
\- \`order canceled\`  
\- \`viewed product\`  
(These names appear as event pages in the Omnisend docs navigation.)  

\#\#\# Event endpoint (v5)  
\- \`POST https://api.omnisend.com/v5/events\`  
\- Purpose: send customer events to track behavior \+ trigger automations.  
\- Scope: \`events.write\`

Reference: "Send Customer event" endpoint page.

\---

\#\# Architecture (multi-tenant safe)

\#\#\# High-level flow  
Storefront → SOLDT API route → Omnisend API

Never call Omnisend directly from the browser (API secrets).

\#\#\# Tenant isolation  
Each merchant has their own Omnisend credentials/settings stored server-side.

\#\#\# Where to get merchantId  
Use \`useMerchant()\` from MerchantContext and use \`merchant.id\` as tenant key.

\---

\#\# Data model (Supabase)

Create table: \`integrations\_omnisend\`

Columns:  
\- \`merchant\_id uuid PK/FK\`  
\- \`status text\` ('connected' | 'error' | 'disabled')  
\- \`auth\_type text\` ('oauth' | 'api\_key')  // keep flexible  
\- \`access\_token\_enc text null\`  
\- \`refresh\_token\_enc text null\`  
\- \`token\_expires\_at timestamptz null\`  
\- \`api\_key\_enc text null\`  
\- \`scopes text\[\] null\`  
\- \`created\_at timestamptz default now()\`  
\- \`updated\_at timestamptz default now()\`  
\- \`last\_event\_at timestamptz null\`  
\- \`last\_error text null\`

And an audit/log table: \`integrations\_omnisend\_logs\`  
\- \`id bigserial PK\`  
\- \`merchant\_id uuid\`  
\- \`direction text\` ('outbound')  
\- \`kind text\` ('event'|'contact'|'product'|'order')  
\- \`name text null\` (eventName, endpoint name, etc.)  
\- \`status\_code int null\`  
\- \`request jsonb\`  
\- \`response jsonb\`  
\- \`created\_at timestamptz default now()\`

Security:  
\- encrypt \*\_enc at rest  
\- only decrypt in server routes / edge functions  
\- add RLS: merchant can only read their own integration rows/logs in admin

\---

\#\# API routes in SOLDT

\#\#\# 1\) POST /api/integrations/omnisend/events  
Purpose:  
\- validate merchantId \+ integration is connected  
\- normalize event payload  
\- forward to Omnisend /v5/events  
\- log success/failure

Request body (from storefront/admin):  
\`\`\`json  
{  
  "merchantId": "uuid",  
  "name": "checkout\_started",  
  "properties": { "...": "..." }  
}

