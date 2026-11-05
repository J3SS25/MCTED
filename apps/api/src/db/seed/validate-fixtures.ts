export interface FixtureValidationReport {
  valid: boolean;
  errors: string[];
}

export function validateFixtures(data: {
  users: Array<{ id: string; email: string }>;
  tools: Array<{ id: string; name: string }>;
  reservations: Array<{ id: string; user_id: string; tool_id: string; pickup_date: string; return_date: string }>;
  rentals: Array<{ id: string; user_id: string; tool_id: string; due_date: string; returned_at?: string | null }>;
  payments: Array<{ id: string; user_id: string; amount_centavos: number }>;
}): FixtureValidationReport {
  const errors: string[] = [];
  const userIds = new Set(data.users.map((u) => u.id));
  const toolIds = new Set(data.tools.map((t) => t.id));

  // Check reservations refer to existing users and tools
  for (const res of data.reservations) {
    if (!userIds.has(res.user_id)) {
      errors.push(`Reservation ${res.id} references non-existent user ${res.user_id}`);
    }
    if (!toolIds.has(res.tool_id)) {
      errors.push(`Reservation ${res.id} references non-existent tool ${res.tool_id}`);
    }
    if (new Date(res.pickup_date) > new Date(res.return_date)) {
      errors.push(`Reservation ${res.id} has pickup date after return date`);
    }
  }

  // Check rentals
  for (const rent of data.rentals) {
    if (!userIds.has(rent.user_id)) {
      errors.push(`Rental ${rent.id} references non-existent user ${rent.user_id}`);
    }
    if (!toolIds.has(rent.tool_id)) {
      errors.push(`Rental ${rent.id} references non-existent tool ${rent.tool_id}`);
    }
  }

  // Check payments
  for (const pay of data.payments) {
    if (!userIds.has(pay.user_id)) {
      errors.push(`Payment ${pay.id} references non-existent user ${pay.user_id}`);
    }
    if (pay.amount_centavos <= 0) {
      errors.push(`Payment ${pay.id} has non-positive amount`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

