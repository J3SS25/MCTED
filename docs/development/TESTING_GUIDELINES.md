# Testing Guidelines & Test Suite Reference

This document outlines the testing strategy, test runner configuration, and conventions for authoring automated tests in MCTEB.

---

## 1. Testing Strategy

MCTEB implements a multi-tier automated test suite covering all three monorepo packages:

```mermaid
flowchart TD
    subgraph TestingPyramid ["Test Coverage Distribution"]
        Integration["Backend Integration Tests<br/>(apps/api: Vitest + Supertest + In-Memory SQLite)<br/>• Route handling & RBAC<br/>• Age verification<br/>• Multi-row transactions"]
        Component["Frontend Component Tests<br/>(apps/web: Vitest + React Testing Library + jsdom)<br/>• UI state rendering<br/>• Accessibility and button actions"]
        Unit["Shared Utility Unit Tests<br/>(packages/shared: Vitest)<br/>• Integer centavos calculations<br/>• Date localization & timezone formatting"]
    end
```

---

## 2. Running Test Suites

### Run All Tests Across Monorepo

```bash
pnpm run test
```

### Run Tests for Specific Packages

```bash
# Shared package tests
pnpm --filter @mcteb/shared test

# Backend API integration tests
pnpm --filter @mcteb/api test

# Frontend React component tests
pnpm --filter @mcteb/web test
```

---

## 3. Backend Integration Testing (`apps/api/src/app.test.ts`)

Backend integration tests execute against the full Express middleware stack, using an initialized SQLite database with migrations and demo fixtures.

### Key Test Scenarios Covered

1. **Health Verification**: `GET /health` returns `200 OK` with status and timestamp.
2. **Public Catalog Access**: `GET /api/v1/tools` returns public catalog equipment items without authentication.
3. **Municipal Policy Guard**: `POST /api/v1/auth/register` rejects applicants under 18 years of age with `400 Bad Request`.
4. **Credential Verification**: `POST /api/v1/auth/login` verifies scrypt password hashing for seeded demo accounts.
5. **RBAC Isolation (IDOR / Privilege Boundary)**: Verifies that Borrowers cannot access the administrative user list (`/api/v1/users`), returning `403 Forbidden`.
6. **Administrator Access**: Verifies that Administrators can successfully query the user registry.
7. **Not Found Handling**: Verifies unmapped routes return standardized `404 Not Found` JSON errors.

---

## 4. Frontend Component Testing (`apps/web/src/**/*.test.tsx`)

Frontend tests utilize Vitest configured with the `jsdom` environment and `@testing-library/react`.

### Component Test Example (`Button.test.tsx`)

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from './Button.js';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDefined();
  });

  it('renders disabled state when isLoading is true', () => {
    render(<Button isLoading>Submitting</Button>);
    const button = screen.getByRole('button', { name: /submitting/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
```

---

## 5. Shared Utility Unit Testing (`packages/shared/src/**/*.test.ts`)

Validates pure functional calculations, currency conversions, and date parsing.

### Example: Integer Centavos Conversions (`money.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { centavosToPesos, pesosToCentavos, formatPHP } from './money.js';

describe('money utilities', () => {
  it('centavosToPesos correctly converts integer centavos to decimal pesos', () => {
    expect(centavosToPesos(10000)).toBe(100);
    expect(centavosToPesos(2550)).toBe(25.5);
  });

  it('pesosToCentavos correctly converts decimal pesos to integer centavos', () => {
    expect(pesosToCentavos(100)).toBe(10000);
    expect(pesosToCentavos(25.5)).toBe(2550);
  });

  it('formatPHP formats centavos into Philippine Peso currency representation', () => {
    const formatted = formatPHP(15000);
    expect(formatted).toMatch(/150\.00/);
  });
});
```
