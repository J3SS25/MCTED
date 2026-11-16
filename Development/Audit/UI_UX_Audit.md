# UI/UX & Accessibility Audit

**Audit Date**: November 2026  
**Audited Target**: MCTEB Frontend Single-Page Application (`frontend`)  
**Design System**: Tailwind CSS with Civic Green & Slate Palette  
**Accessibility Level**: WCAG 2.1 AA Compliant

---

## 1. Visual Identity & Design System

The MCTEB user interface was designed to reflect the civic pride, island heritage, and natural landscapes of Basco, Batanes.

### Core Color Palette (`frontend/tailwind.config.ts`)

- **Civic Forest (`#1b4332`)**: Represents the rolling verdant pastures and hills of Batanes; used for primary buttons, active navigation, and branding.
- **Civic Deep (`#081c15`)**: Deep sea tone for headers, high-contrast dark mode surfaces, and dark sidebars.
- **Civic Accent (`#40916c`)**: Energetic green for hover states, focus rings, and positive indicators.
- **Slate (`#475569`, `#1e293b`)**: Neutral grounding tones for secondary buttons, borders, and body typography.

---

## 2. Accessibility & Usability Evaluation

| UX / Accessibility Criterion | Evaluation | Implementation Details                                                                                                |
| ---------------------------- | :--------: | --------------------------------------------------------------------------------------------------------------------- |
| **Contrast Ratios**          |  **PASS**  | Text meets WCAG AA contrast ratio of at least 4.5:1 against light and dark backgrounds.                               |
| **Keyboard Navigation**      |  **PASS**  | Interactive buttons, inputs, and modal dialogues maintain visible focus rings (`focus:ring-2 focus:ring-offset-2`).   |
| **Touch Targets**            |  **PASS**  | Mobile touch targets (drawer navigation items, catalog cards, modal buttons) adhere to >= 44x44px touch guidelines.   |
| **Modal Dialogues**          |  **PASS**  | Modals implement backdrop click dismissal, Escape key handlers, and autofocus on first input fields.                  |
| **Form Validation States**   |  **PASS**  | Inputs highlight in red with inline error messages upon Zod or React Hook Form validation failures.                   |
| **Loading & Empty States**   |  **PASS**  | All data tables and catalog lists implement dedicated `<Skeleton>` loaders and descriptive `<EmptyState>` components. |
| **Theme Switching**          |  **PASS**  | Dark / Light theme toggle persists user preference in `localStorage` and respects system `prefers-color-scheme`.      |

---

## 3. Responsive Screen Layouts

The application adapts dynamically across mobile, tablet, and desktop viewports:

- **Desktop (>= 1024px)**: Fixed left sidebar navigation with role-aware action groups, top header with user profile menu and theme toggle, and spacious multi-column dashboard grids.
- **Tablet (768px – 1023px)**: Two-column catalog grids, responsive data tables with horizontal scroll capability.
- **Mobile (< 768px)**: Collapsible hamburger menu opening an off-canvas drawer, stacked single-column form layouts, and full-width modal dialogues.

---

## 4. Persona-Specific User Experience

### 1. Resident Borrower Experience

- Simplified advance booking modal with date range pickers and automated rental fee computation.
- Clear loan status tracking ("Reserved", "Borrowed", "Due in 3 days").
- Printable official municipal receipts for treasury submissions.

### 2. Municipal Staff Desk Experience

- Rapid-access review queue for incoming advance reservation requests.
- Streamlined equipment checkout modal with initial condition tagging.
- Return inspection modal with automated late penalty calculation and damage defect ticket creation.

### 3. Administrator Experience

- Granular user registry with quick-action status toggles (Active, Suspended).
- Searchable and filterable system security audit trail.
