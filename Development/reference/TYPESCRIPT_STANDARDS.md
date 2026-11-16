# TypeScript Standards & Language Standardization

This document details the TypeScript standards, compiler configurations, type-safety rules, and the language standardization roadmap for MCTEB.

---

## 1. Preferred Standard: 100% TypeScript

All application logic, components, routes, services, repositories, and utilities must be written in **TypeScript**:

| File Extension | Content Type                                                         | Status                  |
| -------------- | -------------------------------------------------------------------- | ----------------------- |
| `.ts`          | Backend logic, services, repositories, Zod schemas, utilities, types | **Standard**            |
| `.tsx`         | React UI components, modals, layout shells, screens                  | **Standard**            |
| `.js`          | Application source files                                             | **Forbidden** in `src/` |
| `.jsx`         | React components                                                     | **Forbidden** in `src/` |

### Justified JavaScript Exceptions

JavaScript is strictly restricted to top-level configuration tooling where ecosystem loaders demand it:

- `commitlint.config.cjs`: CommonJS configuration for commitlint.
- `eslint.config.mjs`: ES Module configuration for flat ESLint.
- `frontend/postcss.config.js`: PostCSS plugin runner.

No application code or domain business logic may be written in JavaScript.

---

## 2. Compiler Strictness Configuration

MCTEB enforces modern strict compiler settings in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Key Compiler Guarantees

- **`strict: true`**: Activates `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, and `alwaysStrict`.
- **`noUncheckedIndexedAccess: true`**: Array accesses (`arr[0]`) and dictionary lookups (`dict[key]`) infer `T | undefined`, forcing safe null-checks before accessing properties.
- **`noImplicitOverride: true`**: Guarantees class method overrides explicitly declare the `override` keyword.
- **`forceConsistentCasingInFileNames: true`**: Prevents cross-platform file system bugs between Windows (case-insensitive) and Linux CI environments.

---

## 3. Emitted Artifact Discipline

A previous build configuration error caused `tsc` to emit `.js`, `.d.ts`, `.js.map`, and `.d.ts.map` directly alongside `.tsx` source files in `frontend/src`.

### Current Rules:

1. `frontend/tsconfig.json` has `"noEmit": true`. All TypeScript compilation for the web application is handled in-memory by Vite during `pnpm run build` and `pnpm run dev`.
2. `packages/shared/tsconfig.json` explicitly outputs declarations to `packages/shared/dist/`.
3. `backend/tsconfig.json` outputs compiled JavaScript to `backend/dist/`.
4. The `.gitignore` and `.prettierignore` files strictly prevent any `.d.ts` or `.js` build output inside `src/` from being tracked in git.

---

## 4. Type Inference from Zod Schemas

Avoid manually declaring duplicate TypeScript interfaces for data entities that are already validated via Zod. Derive types directly using `z.infer`:

```typescript
import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema } from '../enums.js';

export const UserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2),
  email: z.string().email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  created_at: z.string(),
});

// Authoritative inferred type:
export type User = z.infer<typeof UserSchema>;
```

---

## 5. Banned Patterns & Strict Rules

1. **No Unchecked `any`**:
   - Use `unknown` for unparsed input data, then validate with Zod or type guards before use.
   - Do not use redundant union constituents such as `any | null` (as `any` completely subsumes all other types).
2. **No Unsafe Type Assertions**:
   - Avoid `as unknown as SomeType` workarounds.
   - For database rows, provide generic type parameters to `db.prepare<T>()`.
3. **No Circular Dependencies**:
   - Shared contracts belong in `packages/shared`.
   - Domain modules must not import from sibling module private repositories.
4. **Explicit Return Types on Services**:
   - Public service methods must explicitly state return types (e.g. `Promise<Tool>`, `Promise<void>`).
