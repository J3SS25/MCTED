# ADR 0002: Integer Centavos for Monetary Amounts

## Context
Floating-point arithmetic in JavaScript and SQL can introduce rounding errors when calculating daily rental fees, deposits, overdue penalties, and municipal receipts.

## Decision
All monetary values in the database, API schemas, and business calculations are stored and processed as exact integer centavos (1 PHP = 100 centavos). Formatting functions in `@mcteb/shared` handle localized display as Philippine Pesos (`₱150.00`).

## Consequences
- Eliminates floating-point calculation discrepancies.
- Precise financial auditing and reconciliation.

