# Code Organization Rules

## Component structure

- Every component lives in its own file. Never inline multiple components in one file, and never define a component inside another component's file (except tiny presentational sub-parts that are only ever used by that one parent and have no independent meaning).
- Related components, hooks, and utils are colocated under a common parent folder named after the feature/domain they belong to (kebab-case, e.g. `app/components/hero-card/`, `app/components/item-list/`), not scattered across flat `components/`, `hooks/`, `utils/` directories by file type.
- The folder name already says what the component is, so the folder's main/default component is `index.tsx` — not `HeroCard.tsx` inside `hero-card/` (that repeats the name). Any secondary component colocated in the same folder (used only by that folder's main component) gets its own kebab-case file, e.g. `ability-detail.tsx` next to `ability-popover/index.tsx`.
- Files that are colocated in a feature folder don't repeat the feature name either — it's `item-card/constants.ts`, not `item-card/itemCard.constants.ts`; `stat-delta/utils.ts`, not `stat-delta/statDelta.utils.ts`. The folder is the namespace.
- A typical feature folder looks like:

```
app/components/hero-card/
  index.tsx              # the component (HeroCard)
  useOpenAbility.ts       # state/logic hook(s)
  utils.ts                # pure helper functions (only if not shared elsewhere)
```

## Where logic goes

- **State-related logic** (useState/useReducer, effects, derived state, event handlers that touch state) → a custom hook (`useXyz.ts`), colocated with the component that uses it. Components should stay thin — mostly JSX plus a call to their hook(s).
- **Pure functions** (no React, no state, deterministic input → output: formatting, calculations, transforms) → a colocated `utils.ts`, or `app/utils/` if genuinely shared across multiple unrelated features.
- Shared, cross-feature hooks/utils (used by 3+ unrelated features) can graduate to `app/hooks/` or `app/utils/` — don't put feature-specific logic there by default.

## Where styles go

- Tailwind classes in the JSX come first. Reach for custom CSS only for what utilities can't express cleanly (pseudo-elements, `:has()`, complex `clip-path`s, keyframes).
- Custom CSS that belongs to one component goes in a CSS module colocated with it — `styles.module.css` in the feature folder, imported as `styles` — never in `app/styles/app.css`.
- `app/styles/app.css` is only for global concerns: Tailwind setup, theme tokens, base element styles, and utility classes shared by many unrelated components (e.g. `cut-double` / `cut-corner`).
- Module rules are unlayered, so they beat Tailwind utilities regardless of specificity. Don't set properties in a module (display, margin, size…) that callers are expected to override with utility classes — leave those to `className`.

## Naming

- A folder's main component file is `index.tsx`. Any other component file is kebab-case and named for what it renders (`ability-detail.tsx`), never PascalCase.
- Hook names start with `use` and describe what state/behavior they own, not just the component they belong to when it's ambiguous (`useHeroCardFilters`, not `useLogic`).
- Utils are named after what they do, in camelCase, verb-first when they're actions (`formatPatchDate`, `computeStatDelta`), noun-based when they're pure selectors/derivations (`abilityTierLabel`).
- Don't prefix a colocated file with its own feature/folder name — the folder already provides that scope. Only prefix when the file lives somewhere broader than the feature it describes (e.g. a shared `app/utils/statLabels.ts`).

## Destructuring

- Destructure objects before using their fields instead of repeating `obj.field` — in function/component params, callback params (`({ id, name }) => …`), loop bindings (`for (const [key, { label, bonus }] of map)`), and at the top of a block (`const { prefix, postfix } = properties?.[name] ?? {};`).
- Prefer shorthand properties once destructured (`{ key, label, scaling }` over `{ key: row.key, … }`).
- Rename when a field is a reserved word or would shadow something (`{ new: value }`).
- Skip it when it hurts readability: a single one-off access, a nullable object that needs a `?? {}` dance for one field, or when the whole object is still passed along and only one field is read.

Apply these rules going forward for new components and when meaningfully touching existing ones — no need to do a big-bang refactor of the current flat `app/components/` and `app/utils/` structure unless asked.
