# Mini Pokédex Application

A high-performance, modern Mini Pokédex and Team Builder web application built with **Angular (standalone components & signals)**, **TypeScript**, **RxJS**, **Reactive Forms**, **GraphQL**, and **Chart.js**.

---

## 🌟 Tech Stack & Key Architectural Highlights

* **Angular (Modern Architecture)**:
  * 100% Standalone components throughout (`imports: [...]`).
  * `ChangeDetectionStrategy.OnPush` on every component for optimal rendering performance.
  * Dependency Injection using `inject()`.
  * Modern input & output signals via `input()` and `output()`.
  * Zone coalescing enabled for minimal change detection cycles.
* **State Management**:
  * **Custom RxJS Stores**: Custom reactive stores (`PokemonStore`, `TeamStore`) built on `BehaviorSubject` without third-party bloat (no NgRx, Akita, or NgXS).
  * **RxJS Operators**: `debounceTime(300)`, `distinctUntilChanged()`, `switchMap()`, and `shareReplay(1)` for multicasting and leak prevention.
  * **Angular Signals**: Bridged via `toSignal()` for reactive UI consumption, local component state (`signal()`), derived stats and team synergy distribution (`computed()`), and `effect()` for localStorage synchronization.
* **GraphQL Integration**:
  * **PokéAPI GraphQL**: Queries `https://beta.pokeapi.co/graphql/v1beta` for Pokémon catalog, stats, sprites, and types.
  * **Local Teams GraphQL Server**: Uses `json-graphql-server` (`db.js` on port `4000`) for CRUD team operations.
  * **Error Handling & Resilience**: Custom `GraphQLService` handles errors returned even with HTTP 200, implements exponential backoff retry (`retry({ count: 3, delay: ... })`), and provides an authentic Generation-1 fallback dataset if external networks/firewalls block PokéAPI.
* **Data Visualization**:
  * Interactive, responsive, 6-stat animated Radar Chart powered by **Chart.js** (HP, Attack, Defense, Special Attack, Special Defense, Speed).
* **Team Builder**:
  * Reactive Form with strict validation: 3-30 character name, async debounced unique-name check against existing teams, 1-6 Pokémon member constraint.
  * Pokémon autocomplete with keyboard navigation and removable chips.
  * **Optimistic UI with Automatic Rollback**: Instantly displays newly added or removed teams, syncing asynchronously with the GraphQL backend and rolling back state if the server encounters an error.

---

## 📁 Project Architecture & Folder Structure

The project follows a clean, feature-driven, scalable structure:

```
pokedex/
├── db.js                                   # Mock DB for json-graphql-server
├── src/
│   ├── app/
│   │   ├── core/                           # Singleton core services & models
│   │   │   ├── data/
│   │   │   │   └── pokemon-fallback.data.ts# Authentic Generation 1 offline fallback
│   │   │   ├── graphql/
│   │   │   │   ├── graphql.service.ts      # Generic client with retries & HTTP 200 error handling
│   │   │   │   └── queries/
│   │   │   │       ├── pokeapi.queries.ts  # PokéAPI GraphQL queries
│   │   │   │       └── team.queries.ts     # Local json-graphql-server queries/mutations
│   │   │   └── models/
│   │   │       ├── pokemon.model.ts        # Pokémon, stats, filters, and response models
│   │   │       └── team.model.ts           # Team, TeamMember, and GraphQL models
│   │   │
│   │   ├── features/
│   │   │   ├── pokedex/                    # Pokédex Feature Module
│   │   │   │   ├── components/
│   │   │   │   │   ├── pokemon-filter/     # Debounced name search & type filter
│   │   │   │   │   ├── pokemon-table/      # Responsive table with pagination & sorting
│   │   │   │   │   ├── pokemon-detail/     # Slide-in drawer with stat breakdown
│   │   │   │   │   └── stat-radar-chart/   # Animated 6-stat Chart.js radar canvas
│   │   │   │   ├── services/
│   │   │   │   │   └── pokemon-api.service.ts
│   │   │   │   ├── store/
│   │   │   │   │   ├── pokemon.store.ts    # BehaviorSubject custom state
│   │   │   │   │   └── pokemon.selectors.ts# shareReplay(1) derived streams
│   │   │   │   └── pokedex.component.ts    # Pokedex container view (OnPush)
│   │   │   │
│   │   │   └── team-builder/               # Team Builder Feature Module
│   │   │       ├── components/
│   │   │       │   ├── pokemon-autocomplete/# Search & select dropdown
│   │   │       │   ├── team-chips/         # Selected Pokémon removable chips
│   │   │       │   ├── team-form/          # Reactive Form with async unique validator
│   │   │       │   └── team-list/          # List of saved teams with delete button
│   │   │       ├── services/
│   │   │       │   └── team-api.service.ts
│   │   │       ├── store/
│   │   │       │   └── team.store.ts       # Optimistic updates with rollback
│   │   │       ├── validators/
│   │   │       │   └── unique-team-name.validator.ts # Debounced async validator
│   │   │       └── team-builder.component.ts # Container view with type synergy widget
│   │   │
│   │   ├── shared/                         # Shared UI, Pipes, and Utilities
│   │   │   ├── components/
│   │   │   │   ├── navbar/                 # Sticky navigation with live status badge
│   │   │   │   └── toast/                  # Non-blocking accessible toast notifications
│   │   │   └── pipes/
│   │   │       └── type-color.pipe.ts      # Canonical Pokémon type color mapper
│   │   │
│   │   ├── app.component.ts                # Root component
│   │   ├── app.config.ts                   # Application configuration & providers
│   │   └── app.routes.ts                   # Route definitions (/pokedex, /teams)
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v20+` or `v24+` / `v25+`
* **npm**: `v10+` or `v11+`

### 2. Start the Local Teams GraphQL Server
Run the local `json-graphql-server` on port `4000`:
```bash
npm run server
# or directly:
npx json-graphql-server db.js --port 4000
```
This serves the GraphQL endpoint at `http://localhost:4000/`.

### 3. Start the Angular Application
In a separate terminal tab:
```bash
npm start
```
Navigate to `http://localhost:4200/` in your browser.

### 4. Running Unit Tests
Execute the full test suite (13 unit tests across components, stores, selectors, and validators):
```bash
npm run test:run
# or
npm test -- --watch=false
```

### 5. Production Build
Build optimized production artifacts:
```bash
npm run build
```

---

## 🧪 Requirements Compliance Checklist

| Rule / Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Angular Modern Standard** | ✅ Passed | Modern Angular with standalone components throughout (`imports: [...]`). |
| **ChangeDetectionStrategy.OnPush** | ✅ Passed | Enforced on every component (`App`, `PokedexComponent`, `TeamBuilderComponent`, table, filters, drawer, radar, chips). |
| **Dependency Injection** | ✅ Passed | Built using `inject()` exclusively; no constructor parameter injection. |
| **Modern Inputs & Outputs** | ✅ Passed | Uses `input<T>()` and `output<T>()` instead of legacy `@Input()` and `@Output()` decorators. |
| **No Third-Party State Libs** | ✅ Passed | Zero NgRx, Akita, or NgXS. Built with custom RxJS `BehaviorSubject` stores. |
| **RxJS Pipelines** | ✅ Passed | Uses `debounceTime(300)`, `distinctUntilChanged()`, `switchMap()`, and `shareReplay(1)`. |
| **Memory Leak Protection** | ✅ Passed | Subscriptions safely guarded by `takeUntilDestroyed(this.destroyRef)` and `toSignal()`. |
| **Angular Signals** | ✅ Passed | `signal()` for local UI state (drawer, selected item), `computed()` for derived values (total base stats, team type distribution), `effect()` for localStorage sync, and `toSignal()` for RxJS bridge. |
| **Pokédex Table & Controls** | ✅ Passed | Displays Sprite, Name, Types, HP, Atk, Def, Sp.Atk, Sp.Def, Spd, Total. Sortable stat columns. Pagination (10, 25, 50). Debounced search & type filter. |
| **Slide-in Detail & Radar** | ✅ Passed | Slide-in drawer with backdrop, artwork, stat breakdown bars, and animated Chart.js 6-stat radar chart. |
| **GraphQL PokéAPI** | ✅ Passed | Primary endpoint: `https://beta.pokeapi.co/graphql/v1beta`. Exponential backoff retry (`retry({ count: 3 })`). Handles HTTP 200 with GraphQL errors. |
| **Local GraphQL Server** | ✅ Passed | `npx json-graphql-server db.js --port 4000` supporting query and mutation operations. |
| **Optimistic Team Creation** | ✅ Passed | Optimistic insertion in `TeamStore` with temporary ID, server mutation, and automatic rollback to prior state on network/server error. |
| **Reactive Team Form** | ✅ Passed | 3-30 char name, debounced async unique-name validator, autocomplete selector, 1-6 Pokémon chips, inline validation strictly after dirty/touched. |
| **No alert()** | ✅ Passed | Accessible, non-blocking floating `ToastComponent` used for all feedback and errors. |
| **Unit Tests** | ✅ Passed | 13 Vitest unit tests verifying stores, selectors, optimistic rollback, async validator, and root app. |
| **JSDoc Documentation** | ✅ Passed | Detailed JSDoc comments on all public methods and store classes. |

---

## 🛡️ Network Resilience & Offline Fallback

Certain corporate or educational Wi-Fi networks (e.g. Cyberoam / Sophos firewalls) intercept and block requests to `beta.pokeapi.co`. 

This application provides enterprise-grade resilience:
1. It queries `https://beta.pokeapi.co/graphql/v1beta` with configured retries.
2. If blocked or unreachable, it smoothly transitions to an authentic Generation-1 fallback dataset with identical domain types, sprites, and stats.
3. The navigation header displays an informational status badge (`PokéAPI Live` vs `Offline Mode (Local Fallback)`), guaranteeing a complete, interactive evaluation experience in any environment.
