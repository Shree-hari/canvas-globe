# CanvasGlobe launch and monetization playbook

**Prepared:** 2026-09-13  
**Product:** `canvas-globe`  
**Decision:** Free GPLv3 edition plus paid commercial licensing  
**Status:** Repository preparation in progress; npm publication and external
commerce setup intentionally not performed

This is the single operating document for launching, monetizing, and growing
CanvasGlobe. It records the lightGallery case-study research, translates it into
decisions for this package, and gives an ordered checklist with release gates.

> This document contains business and product recommendations, not legal,
> accounting, or tax advice. GPL scope and the commercial agreement require
> review by qualified counsel before money is accepted.

## 1. Executive conclusion

lightGallery did not become a meaningful business because of a clever license
key. It compounded more than a decade of useful open-source distribution into
a high-intent developer audience, then gave proprietary users a simple way to
buy out of GPL obligations.

Its system is:

```text
Useful free library
  → npm, GitHub, CDN, demos, framework docs, search
  → developer evaluates it in a real project
  → GPL-compatible project stays free
  → proprietary team chooses a commercial license
  → self-serve checkout, invoice, key, and support
  → higher-value OEM and custom-work conversations
```

For CanvasGlobe, the defensible version of this strategy is:

- one capable package, not a crippled “community edition”;
- GPLv3 for users who can comply and commercial terms for proprietary use;
- license keys supplied for the selected license path;
- sharp plan boundaries based on developers, products, and redistribution;
- perpetual use with only 12 months of updates/support, not lifetime service;
- OEM pricing separated from ordinary app use;
- a documentation site built around live examples and purchase-intent pages;
- no fake logos, fake testimonials, or unrelated traffic bait; and
- a Merchant of Record for checkout, tax, invoices, and fulfillment.

Success will come from adoption and trust first. The first validation target is
10 unrelated production adopters and 5 paid licenses: not an immediate attempt
to reproduce a $350,000 outcome.

## 2. What lightGallery built

### 2.1 A long-lived, broadly useful product

lightGallery began appearing on npm in 2014 and grew through repeated releases,
framework integrations, and a deep set of gallery capabilities. At the time of
this review, npm showed 120 published versions, built-in TypeScript declarations,
zero current runtime dependencies, and integrations for React, Angular, and
Vue. GitHub showed roughly 7,100 stars, 1,300 forks, and 1,200 commits.

This history matters. The reported revenue is an outcome of accumulated
distribution and buyer trust, not a plausible first-year benchmark.

### 2.2 Distribution everywhere developers already work

lightGallery is available through npm, Yarn-era instructions, GitHub, jsDelivr,
cdnjs, and unpkg. Its own repository and npm README point to:

- getting started and complete settings documentation;
- dozens of visual demos;
- framework-specific pages;
- CodePen and StackBlitz examples;
- events, methods, plugins, and customization guides; and
- a visible license page.

Every free usage path can become discovery. Every documentation page can lead
back to a commercial decision.

### 2.3 Dual licensing as the conversion mechanism

The same code is offered under GPLv3 and a commercial agreement. GPL-compatible
projects can use the free option. Teams that want to distribute proprietary
applications without accepting applicable GPL obligations can buy commercial
permission.

The important legal and marketing nuance is:

- GPL permits commercial activity.
- “A business uses it” is not itself the legal trigger.
- Copying, modification, combination, and distribution facts determine
  obligations.
- Browser JavaScript bundle boundaries can be fact-specific.

Therefore CanvasGlobe should not claim “all commercial sites must pay.” It should
say the commercial license is the straightforward proprietary-use option and
encourage uncertain users to obtain legal advice.

### 2.4 Simple self-serve tiers

lightGallery's reviewed public pricing was:

| Plan | Price | Public scope |
| --- | ---: | --- |
| Hobby | $48 lifetime | 1 developer, 1 product, not saleable |
| Team | $118 lifetime | Up to 8 developers, 5 products, saleable |
| Organization | $188 lifetime | Unlimited developers and products |
| Extended | $99 lifetime | 1 redistributable product |

The low prices reduce procurement friction. The maintainer reported a rough
mix of 100 Hobby sales to 40 Team and 30 Organization sales, with Organization
contributing the most revenue. Treat those figures and the reported
“over $350K in four years” as self-reported and unaudited.

### 2.5 Checkout and fulfillment remove maintainer work

The reviewed lightGallery purchase links used Kelviq. A Merchant of Record can
handle payment methods, tax collection/remittance, compliant invoices,
customer portals, refunds, and digital fulfillment. Kelviq's published base
pricing during this review was 3.5% + $0.40 per successful transaction, with
2.9% + $0.40 for the first $5,000 and additional published fees for some
transactions.

There is a related-party caveat: lightGallery's maintainer is a Kelviq
co-founder. CanvasGlobe should independently compare Kelviq, Paddle, and Lemon
Squeezy for:

- seller availability and payouts in India;
- Merchant-of-Record liability and tax coverage;
- B2B invoices and tax IDs;
- license-key or webhook fulfillment;
- refunds and chargebacks;
- checkout conversion and localized payment methods;
- API quality and exportability; and
- total fee at the expected order value and geography.

Do not build custom global tax infrastructure for this launch.

### 2.6 A soft key instead of hostile DRM

lightGallery accepts a `licenseKey` option and documents a temporary key for
evaluation. Its public implementation is a console-level compliance reminder,
not a secure entitlement wall.

That is appropriate for browser JavaScript: any shipped secret is visible to
the customer. CanvasGlobe should keep key validation offline, avoid telemetry,
never disable rendering because a server is unavailable, and treat the order
record plus agreement as the actual license.

### 2.7 Organic search was the sales channel

The maintainer reported zero advertising and described Google searches such as
“javascript gallery” and “react image gallery” as the primary acquisition
channel. The high-converting pages were product demos, framework integrations,
documentation, and license-key/pricing pages.

The strongest lesson came from a later mistake. An unrelated YouTube-thumbnail
tool reportedly reached 1.4 million impressions and 47% of site clicks but
generated no buyers. During the compared period:

- brand-search clicks fell 52%;
- developer-intent clicks fell 50%;
- the “javascript gallery” position reportedly fell from 2 to 15; and
- low-intent free-tool traffic obscured the decline.

For CanvasGlobe, free tools on the main domain must be directly useful to likely
buyers: CSV-to-globe, marker preview, route builder, export generator, or
framework playground. Unrelated utilities belong elsewhere.

## 3. What lightGallery did well

1. **Solved a visible problem well.** A visual component demonstrates its value
   immediately.
2. **Kept evaluation friction low.** Users can install the real library before
   purchasing.
3. **Used existing developer channels.** npm, CDN, GitHub, demos, and framework
   pages all reinforce one another.
4. **Made the proprietary path obvious.** Pricing and licensing are visible
   from the docs instead of being hidden behind sales calls.
5. **Automated commodity operations.** Checkout, invoicing, tax, and keys do
   not require a manual email for every buyer.
6. **Separated redistribution.** Builders, templates, and SDK use create more
   downstream value and need different terms.
7. **Sustained maintenance.** A long release history reduces perceived risk.

## 4. Weaknesses not to copy

### 4.1 Underpriced upper tiers

$188 for unlimited developers and products, and $99 for redistribution, leave
substantial enterprise and OEM value unpriced. CanvasGlobe should make OEM a
high-value annual or negotiated plan.

### 4.2 Lifetime updates create an unfunded obligation

Perpetual use is buyer-friendly; lifetime updates and support are operationally
dangerous. CanvasGlobe should grant perpetual use of purchased versions, include
12 months of updates/support, and sell optional renewal.

### 4.3 Ambiguous public language

Phrases like “commercial sites need a commercial license” are simple but
legally imprecise. Public copy, order forms, and the signed agreement must use
the same definitions for:

- developer or seat;
- product;
- internal versus customer-facing use;
- saleable or monetized product;
- contractor access;
- affiliate coverage;
- redistribution, white-label, SDK, and builder use; and
- updates, support, and renewal.

### 4.4 A key is not enforcement

Client-side keys are copyable. Do not spend the launch cycle building strong
DRM or imply the key proves legal entitlement. Keep authoritative records in
the commerce system.

### 4.5 Vanity traffic can damage the funnel

Traffic, npm downloads, GitHub stars, and social impressions are useful
signals, not revenue. Segment by buyer intent and measure movement from docs
and demos into pricing and checkout.

## 5. CanvasGlobe's starting position

### 5.1 Existing strengths

At preparation time the repository already had:

- zero runtime dependencies;
- ESM source, a UMD browser build, CDN fields, and package exports;
- TypeScript declarations;
- Vanilla, React, and Web Component entry points;
- 159 passing tests;
- a build-time compressed-size budget;
- more than 40 documentation pages, 15 visual examples, and an interactive playground;
- bundled world geometry with no required network request;
- keyboard and reduced-motion support;
- changelog and CI;
- optional React peer dependency; and
- a small npm tarball (about 271 KB compressed and 900 KB unpacked in the
  pre-change dry run).

### 5.2 Launch gaps found

- The package was unpublished. On 2026-09-13, npm returned `E404` for the
  selected `canvas-globe` name; this is an availability snapshot,
  not a reservation.
- The public license was MIT, which cannot power a GPL/commercial conversion
  funnel. Copies already released under MIT would remain permissive forever.
- The repository has been transferred to the selected public identity,
  `Shree-hari/canvas-globe`.
- Package metadata lacked repository, homepage, bugs, and author fields.
- The website had no Pricing, Licensing, OEM, or commercial-support path.
- The configured Open Graph image did not exist.
- Framework docs covered only Vanilla, React, and Web Components.
- The showcase data was explicitly invented and must never be presented as
  real customer proof.
- There was no contributor relicensing process, security policy, release
  workflow, or full release gate.
- No Merchant of Record, checkout links, legal seller entity, or approved
  commercial contract had been configured.

### 5.3 Naming decision: CanvasGlobe

The original working name, **Geo Globe**, was understandable but weak for
discovery: “geo” is broad, “geo globe” is mildly redundant, and the name did
not expose the library's strongest differentiator. The selected public name is:

- **Display name:** CanvasGlobe
- **npm package:** `canvas-globe`
- **repository:** `Shree-hari/canvas-globe`
- **documentation path:** `https://shree-hari.github.io/canvas-globe/`

| Candidate | Search intent | Differentiation | Memorability | Decision |
| --- | --- | --- | --- | --- |
| CanvasGlobe | High: contains “canvas” and “globe” | High: distinguishes Canvas 2D from WebGL competitors | Strong and short | **Selected** |
| Interactive Globe | Very high but generic | Low; many products use the phrase | Medium | Use as a keyword, not the brand |
| Globe Canvas | Same useful terms in less natural order | High | Weaker spoken name | Keep only as a keyword variant |
| World Map Globe | Broad query coverage | Low and awkward | Weak | Reject; reads like keyword stuffing |

Registry checks returned `E404` for the selected unscoped `canvas-globe`
package and the principal alternatives on 2026-09-13. The unscoped package is
preferred for the shortest install and import path. Publish it promptly; an npm
lookup cannot reserve a name.

Web search found old one-off snippets titled “CanvasGlobe,” but no established
npm package under that exact name. This is product/search research, not a
trademark clearance. Before publication, the owner must search the relevant
trademark jurisdictions, inspect matching domains and social handles, and have
counsel clear the final commercial brand.

The implementation class `GeoGlobe`, factory `createGlobe`, `<geo-globe>`
custom element, and `geo-*` events remain stable integration names. The root
package also exports `CanvasGlobe` and `createCanvasGlobe` aliases, and the UMD
global is `window.CanvasGlobe`. This gives the new brand a coherent API without
creating unnecessary source-level churn.

#### 5.3.1 Extended SEO/AEO naming research (2026-09-13)

The naming objective is not to pack every query into the package name. npm's
official guidance says names should be unique and descriptive, and its
`package.json` documentation specifically advises against adding `js` or
`node` to a name. Google recommends a concise, unique, accurate site name,
discourages generic names, and advises placing the words people search for in
prominent page content without keyword stuffing. Therefore the best structure
for this product is:

1. a short, stable entity name;
2. a lowercase, hyphenated npm slug;
3. a factual category descriptor containing the important search terms; and
4. consistent repetition of those facts across npm, GitHub, documentation,
   examples, structured data, and credible third-party references.

"AEO score" is not an official search-engine or model metric. The scores below
are a decision model, not measured search volume or a promise of ranking. They
weight search/category fit (25%), answer-engine clarity (25%), entity
ownability (25%), memorability (15%), and fit with the actual product (10%).

| Rank | Display name | Proposed npm package | Score | Main advantage | Main risk / reason not to select |
| ---: | --- | --- | ---: | --- | --- |
| 1 | **CanvasGlobe** | `canvas-globe` | **86** | Preserves the exact high-intent `canvas` + `globe` terms while styling them as one repeatable product entity | Still built from generic words; use one canonical descriptor consistently to disambiguate it |
| 2 | **GlobeCanvas** | `globe-canvas` | **82** | Immediately communicates both the object and rendering technology | Less natural English and weaker alignment with the likely phrase "canvas globe" |
| 3 | **Canvasphere** | `canvasphere` | **80** | Strongest ownable coined name: canvas + sphere, short and memorable | Does not contain `globe`; needs a descriptive subtitle everywhere until the brand earns recognition |
| 4 | **CanvasGlobe Map** | `canvas-globe-map` | **78** | Covers both globe and map intent with no interpretation required | Sounds keyword-assembled and is weaker as a brand people will cite |
| 5 | **Canvas World Globe** | `canvas-world-globe` | **76** | Clear global scope and rendering method | "World globe" is redundant and the name is longer than necessary |
| 6 | **Canvas World Map** | `canvas-world-map` | **76** | Strong fit for world-map searches | Hides the product's most visually distinctive globe mode |
| 7 | **OrbitCanvas** | `orbit-canvas` | **76** | Distinctive, visual, pronounceable, and technically suggestive | "Orbit" can imply satellites or animation rather than a map/globe library |
| 8 | **GlobeFlow** | `globe-flow` | **75** | Memorable and well matched to great-circle arcs and movement | Narrows perception toward routes/flows even though the library also does maps and choropleths |
| 9 | **GlobePlot** | `globe-plot` | **75** | Strong data-visualization meaning; suitable for markers and choropleths | "Plot" sounds scientific and less suited to decorative or marketing-site use cases |
| 10 | **GlobeMap Canvas** | `globe-map` | **75** | Accurately covers both supported projections and keeps the slug short | Display name is awkward; "GlobeMap" also has existing use in Microsoft's Power BI visual |
| 11 | **Interactive CanvasGlobe** | `interactive-canvas-globe` | **74** | Maximum immediate query and use-case clarity | Too generic and long to become a clean, ownable product entity |
| 12 | **2D CanvasGlobe** | `2d-canvas-globe` | **73** | Makes the Canvas 2D implementation explicit | Can be misread as visually flat or inferior even though the projection appears spherical |
| 13 | **MapSphere** | `map-sphere` | **73** | Compact expression of flat-map and spherical-view capability | Broad phrase with weaker JavaScript/canvas recognition and moderate ambiguity |
| 14 | **No-WebGL Globe** | `no-webgl-globe` | **72** | Owns a valuable technical differentiator and answers a specific constraint | Negative naming defines the product by an absent technology and limits future positioning |
| 15 | **GlobeArc** | `globe-arc` | **71** | Distinctive and strongly connected to route/connection visualizations | Over-focuses one feature and undersells maps, markers, clustering, and choropleths |
| 16 | **EarthCanvas** | `earth-canvas` | **63** | Pleasant, visual, and easy to remember | Search results are likely to mix software with artwork, Earth imagery, and HTML canvas experiments |
| 17 | **GlobeCraft** | `globe-craft` | **61** | Friendly maker-oriented brand with room to expand | Heavy collision with physical globe crafts and worldbuilding content; low package-category clarity |
| 18 | **TerraCanvas** | `terra-canvas` | **58** | Brandable and visually evocative | "Terra" and "canvas" are both crowded outside developer tooling, creating entity ambiguity |

Registry lookups returned no public package for every unscoped slug in the
table at the time of checking. That is only a point-in-time npm availability
screen: it does not reserve a package, guarantee that npm will accept a new
publication, or clear trademark and company-name rights.

Several superficially attractive names should be rejected despite having no
public package at the checked slug:

- **GlobeViz**: an existing `globeviz` package is indexed publicly, and another
  globe library exposes `GlobeViz` as a class name.
- **MapOrbit**: an established geospatial company operates at `maporbit.com`.
- **GlobeForge**: used by an Indian company, a web-design identity, and a
  browser-based globe creation tool.
- **Atlasphere**: used by multiple active businesses and historically by the
  Odyssey Atlasphere interactive globe. It also loses the direct `canvas` and
  `globe` category terms.

**Recommendation:** use the unscoped `canvas-globe` npm slug and style the
public product as **CanvasGlobe** (one word). Identify **Harsh Jhunjhunuwala**
separately as the author rather than placing an organization scope in the package name. This
captures the discovery value of the current name and creates a consistent token
for documentation, third-party citations, and answer engines.
No alternative above offers a large enough total advantage to justify changing
the already prepared slug before launch. If a more ownable coined brand is a
hard requirement, **Canvasphere** is the best fallback; **OrbitCanvas** is the
best lifestyle/visual fallback; **GlobeFlow** is best only if route arcs become
the primary commercial use case.

Use this canonical definition consistently:

> CanvasGlobe is a zero-dependency JavaScript and React library for interactive
> 3D globes and flat world maps rendered with Canvas 2D, with markers,
> clustering, great-circle arcs, choropleths, and export, without WebGL or API
> keys.

Recommended presentation metadata:

- site/product name: `CanvasGlobe`;
- alternate name: `CanvasGlobe`;
- npm package: `canvas-globe`;
- home-page title: `CanvasGlobe: JavaScript 3D Globe & World Map - No WebGL`;
- home-page H1: `CanvasGlobe`;
- short tagline: `Interactive 3D globes and world maps, rendered with Canvas 2D.`

Do not rotate among different brand names in headings. Use query variants such
as "JavaScript globe library," "React globe," "interactive world map," and
"no-WebGL globe" in natural page titles, comparison content, examples, npm
keywords, and explanatory prose. Answer engines are more likely to resolve a
clear entity with repeated, verifiable capabilities than a keyword-heavy name
with no adoption or independent references.

### 5.4 Search and LLM discoverability strategy

There is no metadata switch that guarantees a search ranking or an LLM
recommendation. The defensible strategy is to make the package easy to crawl,
unambiguous to identify, useful enough to earn adoption and links, and easy to
cite for the exact questions developers ask.

Repository preparation now includes:

- one canonical name across npm metadata, README, repository URLs, docs, UMD,
  Open Graph content, pricing, licensing, and support;
- high-intent npm keywords and a factual first-paragraph definition;
- a substantive `/javascript-interactive-globe` guide and
  `/react-globe` integration page;
- one maintained `/compare/javascript-globe-libraries` page with explicit
  “choose this / do not choose this” criteria and primary competitor links;
- canonical Docusaurus URLs, XML sitemap generation, descriptive page titles,
  descriptions, and `SoftwareSourceCode` JSON-LD;
- `codemeta.json` for machine-readable software identity;
- a spec-shaped `llms.txt` plus a compact `llms-full.txt` containing package,
  API, use-case, limitation, licensing, and canonical-link facts;
- explicit `robots.txt` access for OAI-SearchBot, ChatGPT-User,
  Claude-SearchBot, Claude-User, PerplexityBot, and Perplexity-User; and
- release checks that fail on stale names or missing discovery files.

LLM-oriented copy must stay factual. In particular, never claim CanvasGlobe
uses WebGL, provides terrain or street maps, needs an API key, or is free only
for noncommercial use. Recommendation pages should explain when Cobe,
globe.gl, MapLibre, or Cesium is more appropriate. Honest boundaries make the
documentation more trustworthy and reduce bad AI-generated integrations.

After deployment, distribution still matters more than files: publish useful
examples, earn relevant links and GitHub references, answer real integration
questions, keep comparison claims current, and make releases regularly. Track
Search Console queries and inbound URLs with `utm_source=chatgpt.com`; do not
infer “AI visibility” from impressions alone.

## 6. Product and pricing decisions

### 6.1 Recommended launch plans

| Plan | Launch price | Scope | Delivery |
| --- | ---: | --- | --- |
| Open Source | $0 | GPL-compatible projects | npm/GitHub |
| Solo Commercial | $79 perpetual | 1 developer, 1 proprietary product | Self-serve |
| Team Commercial | $249 perpetual | Up to 5 developers, 5 products | Self-serve |
| Business Commercial | $599 perpetual | Up to 20 developers, unlimited internal products | Self-serve |
| OEM / Builder | From $1,500/product/year | SDK, builder, templates, white-label, generated or redistributable copies | Qualification + invoice |
| Enterprise | Custom | Larger teams, affiliates, security/procurement terms, SLAs | Sales-assisted |

Perpetual tiers include the versions released during 12 months after purchase
and standard support for that period. The buyer may keep using those versions
after expiry. Continued updates/support require optional renewal. The lawyer
must decide whether post-expiry development with old versions remains allowed.

### 6.2 Why these prices

- They preserve low-friction entry for an individual developer.
- Team and Business prices better reflect the number of developers and
  products receiving value.
- The gap between Team and Business creates a natural procurement path.
- OEM is priced separately because one integration can create many downstream
  copies or become core product value.
- The structure can be increased after demand is proven without promising
  lifetime labor at launch.

Do not discount before observing real objections. Prefer a 30-day launch coupon
over permanently low list prices. Offer a student/nonprofit policy only when
there is a repeatable verification process.

## 7. Repository launch work

Legend: ✅ completed in repository, 🟡 prepared but requires an external value
or approval, ⬜ still to execute.

### 7.1 Package and engineering

- ✅ Set SPDX license to `GPL-3.0-only` and include the canonical text.
- ✅ Add dual-licensing and third-party-notice files to the package.
- ✅ Add repository, homepage, bugs, and author metadata.
- ✅ Add the `licenseKey` option and browser-console reminders.
- ✅ Add license behavior tests and TypeScript declarations.
- ✅ Add a release-validation script and full `npm run release:check`.
- ✅ Extend CI to test package contents and build the documentation.
- ✅ Add a manually triggered, provenance-enabled npm release workflow.
- ✅ Rename the public identity to CanvasGlobe / `canvas-globe`.
- ✅ Add search metadata, structured software data, LLM discovery files, and
  high-intent JavaScript, React, and comparison pages.
- ✅ Verify tests, types, build, documentation, and package dry run.
- 🟡 Configure npm trusted publishing for the final GitHub workflow.
- 🟡 Confirm the npm account that will own `canvas-globe` and maintainer access.
- ⬜ Publish only after every release gate in section 11 passes.

### 7.2 Legal and governance

- ✅ Include `LICENSE`, `LICENSING.md`, and `THIRD_PARTY_NOTICES.md`.
- ✅ Draft the commercial agreement for counsel in `legal/`.
- ✅ Draft a contributor agreement that grants relicensing rights.
- ✅ Add contribution and security policies.
- ✅ Record Harsh Jhunjhunuwala as the copyright owner and Swiftools as the
  operating brand.
- 🟡 Confirm the legal seller status, address, and Swiftools trade-name wording.
- 🟡 Have counsel review GPL applicability and all website language.
- 🟡 Have counsel finalize the commercial agreement, order form, refund policy,
  privacy terms, liability allocation, jurisdiction, and tax/MoR relationship.
- 🟡 Select and configure a reliable CLA acceptance record before merging
  external code.
- 🟡 Audit every pre-launch contributor and dependency/data source for the
  right to commercially relicense.

### 7.3 Website and conversion funnel

- ✅ Add Pricing, Licensing, Commercial FAQ, Support, framework, comparison,
  and high-intent solution pages.
- ✅ Add pricing/navigation calls to action and an honest pre-launch state.
- ✅ Add a real Open Graph card, crawler-specific robots.txt, `llms.txt`,
  `llms-full.txt`, JSON-LD, and CodeMeta metadata.
- ✅ Remove MIT-only public copy.
- ✅ Preserve live demos and the playground as the product proof.
- ✅ Add event hooks for privacy-conscious first-party analytics.
- 🟡 Replace pre-launch purchase buttons with Merchant-of-Record checkout URLs.
- 🟡 Add the approved private sales/support address.
- 🟡 Add only verifiable customer logos, quotes, and links with permission.
- 🟡 Connect the custom domain, Search Console, analytics endpoint, and
  production deployment.

### 7.4 Commerce and operations

- 🟡 Compare MoR availability, terms, payouts, fees, and India support.
- 🟡 Create products and prices with matching plan definitions.
- 🟡 Configure invoice fields, tax-ID collection, refund handling, and customer
  portal.
- 🟡 Configure license-key generation and email/PDF fulfillment.
- 🟡 Save webhook events and orders in a durable entitlement ledger.
- 🟡 Create support inbox routing and canned responses.
- 🟡 Test successful payment, failed payment, refund, duplicate webhook,
  invoice, tax, key delivery, and customer portal in sandbox.
- 🟡 Document monthly reconciliation, support, refund, and renewal ownership.

These are external-account actions and cannot be truthfully completed from the
repository alone.

## 8. Acquisition strategy

### 8.1 Channel priority

1. npm package page and README.
2. GitHub repository, topics, releases, and examples.
3. Search-optimized documentation and live demos.
4. Framework integrations and starter projects.
5. StackBlitz/CodePen examples.
6. Relevant launch communities and developer content.
7. Comparison and migration pages once claims can be kept current.
8. Paid acquisition only after organic pages demonstrate conversion.

### 8.2 High-intent content map

Keep each page substantive and connected to a working example:

- interactive JavaScript globe;
- React globe component;
- canvas globe without WebGL;
- customer or visitor map;
- live signup globe;
- shipping route / great-circle map;
- service status map;
- store locator;
- CSV-to-globe converter;
- social card / screenshot generator;
- CanvasGlobe versus Cobe;
- CanvasGlobe versus globe.gl;
- CanvasGlobe versus Mappo and `@wescld/dotted-map`;
- choosing between Canvas 2D and WebGL; and
- no-build CDN globe.

Do not generate dozens of near-duplicate location or competitor pages. One
excellent decision page is worth more than thin programmatic SEO.

### 8.3 Framework coverage

Dedicated wrappers are not required for every framework at launch because the
vanilla API and Web Component already compose well. Publish tested recipes for:

- React;
- Next.js client components;
- Vue;
- Svelte;
- Angular;
- Astro;
- Web Components; and
- no-build Vanilla JS.

Create dedicated wrappers only when repeated integration friction or demand
justifies the maintenance cost.

## 9. Measurement

### 9.1 Funnel events

Use anonymous, consent-compatible first-party events where lawful:

| Event | Meaning |
| --- | --- |
| `docs_install_view` | Installation intent |
| `install_command_copy` | Strong evaluation intent |
| `playground_open` | Hands-on evaluation |
| `example_open` | Use-case interest |
| `pricing_view` | Commercial consideration |
| `plan_select` | Plan and price interest |
| `checkout_start` | Purchase intent |
| `checkout_complete` | Revenue |
| `commercial_contact` | OEM/Enterprise lead |

Do not add tracking to the npm library. Website analytics must not collect
marker contents, customer data, canvas exports, precise viewer location, or
license keys.

### 9.2 Dashboard segments

Review weekly:

- branded, developer-intent, comparison, and unrelated search queries;
- landing page to install-copy rate;
- example/playground to pricing rate;
- pricing to checkout-start rate;
- checkout completion and payment failure rate;
- revenue, orders, average order value, and plan mix;
- revenue and leads by landing page/framework;
- refunds, chargebacks, support volume, and response time;
- npm downloads and GitHub adoption signals; and
- OEM/Enterprise lead source and outcome.

npm download counts are downloads, not unique people or production users.

### 9.3 Validation milestones

**Milestone A: technical launch**

- release gate green;
- public repository and docs online;
- package install tested from the packed tarball;
- npm provenance configured; and
- legal/checkout external gates approved.

**Milestone B: demand**

- 10 unrelated production implementations;
- 5 paid licenses;
- at least 3 distinct acquisition sources; and
- direct interviews with paid and non-paying adopters.

**Milestone C: repeatability**

- measurable pricing-to-checkout conversion;
- at least one plan produces repeated sales;
- support load is sustainable;
- a clear top-three set of search/use-case pages emerges; and
- pricing changes are based on observed buyer behavior.

## 10. Launch sequence

### Phase 0: ownership and legal gate

1. Confirm no employer, client, or previous collaborator owns any part of the
   code.
2. Decide the exact legal seller/copyright entity.
3. Review commit authors and obtain assignments or commercial relicensing
   grants if needed.
4. Have counsel review GPL choice, `LICENSING.md`, pricing definitions, CLA,
   and commercial agreement.
5. Replace every legal draft placeholder.
6. Freeze external code merges until the approved CLA process is operational.

**Exit:** counsel approves the documents actually delivered to buyers.

### Phase 1: identity and public infrastructure

1. Transfer the public repository to `Shree-hari/canvas-globe`. Completed.
2. Update the local Git remote and protect `master`.
3. Enable issues, Discussions if desired, private vulnerability reporting, and
   required CI checks.
4. Confirm the owning npm account and enable 2FA or passkeys for maintainers.
5. Configure npm trusted publishing for the npm account that will own
   `canvas-globe`, repository `canvas-globe`, workflow filename `release.yml`,
   and environment `npm`; explicitly allow direct `npm publish`. npm currently requires CLI
   11.5.1+ and Node 22.14+, so the workflow uses Node 24 on a GitHub-hosted
   runner. The repository must be public for npm provenance.
6. Connect the documentation domain and verify HTTPS.

**Exit:** all package and website URLs resolve publicly.

### Phase 2: commerce

1. Select a Merchant of Record.
2. Create Solo, Team, and Business products; configure OEM/Enterprise as
   contact sales.
3. Attach the final commercial agreement and refund terms.
4. Configure checkout fields, invoice identity, taxes, key generation,
   fulfillment email, portal, and webhooks.
5. Put checkout URLs into the website's production environment.
6. Run sandbox and low-value live transactions end to end.
7. Refund the live test and verify ledger state.

**Exit:** a buyer receives the correct agreement, invoice, key, and support
route without manual rescue.

### Phase 3: release candidate

1. Choose version `0.1.0` or `1.0.0`. Use `1.0.0` only if the API stability
   promise is intentional.
2. Move changelog items from Unreleased into the release version/date.
3. Run `npm run release:check`.
4. Run `npm pack --dry-run --json` and inspect every included path.
5. Install the generated tarball into clean Vanilla and React test projects.
6. Verify CDN/UMD instructions against the final package.
7. Build and crawl the production docs for broken links and metadata.
8. Tag and create release notes only after approval.

**Exit:** the exact artifact intended for npm is reproducible and reviewed.

### Phase 4: publish and announce

1. Manually dispatch the release workflow for the reviewed version.
2. Verify npm package metadata, provenance, files, types, imports, and CDN URL.
3. Publish the matching GitHub release.
4. Deploy the final website and remove all pre-launch messages.
5. Submit sitemap and validate structured metadata/social previews.
6. Announce with a working demo and a specific use case, not a generic
   “we launched” message.
7. Monitor install issues, checkout failures, and support closely for 72 hours.

### Phase 5: first 90 days

- Interview every early paying customer who agrees.
- Fix onboarding and documentation friction before adding broad features.
- Publish one deep, high-intent page or demo per week.
- Create framework starters based on actual demand.
- Review plan selection and quote requests monthly.
- Raise OEM pricing if inquiries show core-value or mass-redistribution use.
- Publish real customer proof only with written permission.
- Review security, dependencies, legal records, and entitlement backups
  monthly.

## 11. Non-negotiable release gate

Do not publish or accept payment until every applicable item is true.

### Artifact

- [ ] `npm run release:check` passes on a clean clone.
- [ ] Package name, version, license, repository, homepage, and bugs URLs are
      correct.
- [ ] `npm pack --dry-run --json` contains only intended files.
- [ ] Packed ESM, UMD, types, React entry, Web Component entry, and CDN usage
      have been smoke tested.
- [ ] Changelog and README describe the release.
- [ ] No secrets, fake testimonials, or unresolved launch placeholders ship.

### Legal

- [x] Copyright owner confirmed as Harsh Jhunjhunuwala.
- [ ] Seller status, address, and Swiftools trade-name wording confirmed.
- [ ] Commercial relicensing rights confirmed for every contribution.
- [ ] GPL and commercial messaging reviewed by counsel.
- [ ] Commercial agreement and order form approved and versioned.
- [ ] Privacy, refunds, tax, and support commitments approved.
- [ ] Contributor agreement approved and acceptance records enabled.

### Public infrastructure

- [ ] Public GitHub repository exists at the metadata URL.
- [ ] Documentation homepage, pricing, license, support, and security links
      resolve.
- [ ] npm owner access, 2FA/passkeys, and trusted publisher are configured.
- [ ] Domain, TLS, sitemap, robots, Open Graph preview, and analytics are
      verified.
- [ ] `llms.txt`, `llms-full.txt`, canonical tags, and JSON-LD resolve in the
      deployed site output.
- [ ] Google Search Console and Bing Webmaster Tools have the sitemap; ChatGPT,
      Claude, and Perplexity search crawlers are not blocked by the host/WAF.

### Commerce

- [ ] MoR account and payouts approved.
- [ ] Plan names, prices, currency, seat/product limits, update period, and
      checkout agreement match the website.
- [ ] Checkout success/failure, invoices, taxes, refunds, webhooks, keys, and
      support routing have been tested.
- [ ] OEM/Enterprise contact is private and monitored.
- [ ] Order and entitlement records are exportable and backed up.

## 12. Source record

Sources were reviewed on 2026-09-13 unless noted. Prices and platform metrics
change; re-check them before using them in public claims.

### Primary lightGallery sources

- [lightGallery website](https://www.lightgalleryjs.com/)
- [lightGallery pricing and license page](https://www.lightgalleryjs.com/license/)
- [lightGallery settings and licenseKey documentation](https://www.lightgalleryjs.com/docs/settings/)
- [lightGallery npm package](https://www.npmjs.com/package/lightgallery)
- [lightGallery GitHub repository](https://github.com/sachinchoolur/lightGallery)
- [lightGallery documentation index](https://www.lightgalleryjs.com/docs/)
- [lightGallery sitemap](https://www.lightgalleryjs.com/sitemap.xml)

### Maintainer case studies

- [How I made over $350K from a COSS project using dual licensing](https://www.kelviq.com/blog/monetize-open-source-dual-licensing/)
- [I built a free tool that got 47% of my traffic. It was my worst SEO mistake](https://www.kelviq.com/blog/free-tools-seo-mistake/)

The revenue, sales-mix, advertising, and Search Console figures in this
playbook come from maintainer-authored posts and are not independently audited.
Kelviq is also connected to the maintainer, so its checkout recommendation is
not independent.

### Licensing and commerce references

- [GNU GPL version 3](https://www.gnu.org/licenses/gpl-3.0.html)
- [GNU GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html)
- [Kelviq pricing](https://www.kelviq.com/pricing/)
- [amCharts licenses explained](https://www.amcharts.com/online-store/licenses-explained/)
- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/)

### npm demand snapshots

The npm downloads API was used for a directional seven-day comparison ending
2026-09-11:

| Package | Downloads |
| --- | ---: |
| `lightgallery` | 74,900 |
| `globe.gl` | 165,068 |
| `react-globe.gl` | 114,051 |
| `three-globe` | 222,476 |
| `cobe` | 308,875 |
| `@amcharts/amcharts5` | 273,743 |
| `highcharts` | 1,645,898 |

Reproducible endpoint pattern:
`https://api.npmjs.org/downloads/point/2026-09-05:2026-09-11/PACKAGE`

These figures show active demand for globe and visualization packages. They do
not show unique users, commercial intent, retention, or achievable CanvasGlobe
revenue.

Historical lightGallery downloads used in the analysis:

| Period | Downloads |
| --- | ---: |
| 2015 | 3,759 |
| 2020 | 450,357 |
| 2021 | 791,201 |
| 2022 | 2,002,236 |
| 2025 | 3,514,366 |
| 2026 through 2026-09-11 | 3,146,722 |

The growth curve reinforces the central finding: distribution and trust
compound over years.

### Search and AI discovery references

- [npm package name guidelines](https://docs.npmjs.com/package-name-guidelines/)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google site-name guidance](https://developers.google.com/search/docs/appearance/site-names)
- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Schema.org SoftwareSourceCode](https://schema.org/SoftwareSourceCode)
- [npm package.json documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [OpenAI publisher crawler guidance](https://help.openai.com/en/articles/12627856)
- [Anthropic crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Perplexity crawler guidance](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [llms.txt proposal](https://llmstxt.org/)
- [Mappo repository](https://github.com/rameerez/mappo)
- [@wescld/dotted-map repository](https://github.com/wescld/dotted-map)
- [Microsoft Power BI GlobeMap repository](https://github.com/microsoft/powerbi-visuals-globemap)
- [MapOrbit company site](https://maporbit.com/)
- [Globe Forge naming collision](https://www.chideas.net/tutorials.html)
- [Atlasphere naming collision](https://www.atlasphere.mx/)

`llms.txt` is a community proposal, not a ranking guarantee. Standard crawlable
HTML, canonical URLs, sitemaps, clear documentation, third-party references,
and real adoption remain the foundation.

## 13. Owner decisions still required

Repository work can prepare these choices but cannot make them truthfully:

1. **Legal identity:** seller status, address, governing jurisdiction,
   commercial contact, and the exact Swiftools trade-name wording.
2. **License approval:** counsel-approved GPL guidance, CLA, commercial
   agreement, refunds, privacy, warranty, and liability language.
3. **Public location:** use `Shree-hari/canvas-globe` and decide whether the
   docs remain on GitHub Pages or move to a custom domain. If the domain changes,
   update every canonical URL and add permanent redirects before launch.
4. **Brand clearance:** confirm relevant trademarks, package names, domains,
   and social handles before accepting money under the CanvasGlobe name.
5. **Commerce provider:** Kelviq, Paddle, Lemon Squeezy, or another MoR after
   checking India availability and contract terms.
6. **Checkout values:** product IDs/URLs, webhook secret destination, key
   format, support inbox, and customer portal.
7. **Release version:** honest pre-1.0 launch or a deliberate stable 1.0
   promise.

Record final decisions in this file so website copy, checkout, invoices,
license grants, and support operations never drift apart.
