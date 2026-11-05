/**
 * MCTEB Demo Seed Fixtures
 * Municipality of Basco, Batanes
 *
 * Covers: 4 demo users, 7 catalog tools, 2 reservations, 1 active rental,
 * 1 verified payment, 1 public feedback entry.
 *
 * All monetary values in centavos (integer). Dates as ISO-8601 strings.
 * UUIDs are deterministic v4-compatible fixed values for idempotent re-seeds.
 */

// ─── USERS ───────────────────────────────────────────────────────────────────

export const SEED_USERS = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    full_name: 'Maria Santos',
    email: 'admin@basco.gov.ph',
    phone: '+639171234567',
    birth_date: '1980-03-15',
    barangay: 'Barangay I (Poblacion)',
    address: 'Municipal Hall Compound, Basco, Batanes',
    role: 'Administrator',
    status: 'Active',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    full_name: 'Juan dela Cruz',
    email: 'staff@basco.gov.ph',
    phone: '+639181234567',
    birth_date: '1990-07-22',
    barangay: 'Barangay II',
    address: 'Sitio Centro, Basco, Batanes',
    role: 'Municipal Staff',
    status: 'Active',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    full_name: 'Ana Reyes',
    email: 'borrower@basco.gov.ph',
    phone: '+639191234567',
    birth_date: '1995-11-08',
    barangay: 'Barangay III',
    address: 'Brgy III, Basco, Batanes',
    role: 'Borrower',
    status: 'Active',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    full_name: 'Pedro Batanes',
    email: 'farmer@basco.gov.ph',
    phone: '+639201234567',
    birth_date: '1988-05-12',
    barangay: 'Barangay IV',
    address: 'Brgy IV, Basco, Batanes',
    role: 'Borrower',
    status: 'Active',
  },
];

// ─── TOOLS ────────────────────────────────────────────────────────────────────

export const SEED_TOOLS = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    name: 'Agricultural Hand Tiller',
    category: 'Agricultural',
    description:
      'Gas-powered hand tiller suitable for small farm lots. Ideal for land preparation in Batanes terraced fields.',
    specifications: JSON.stringify({
      engine: '196cc 4-stroke gasoline',
      tillage_width: '60–90 cm adjustable',
      weight: '75 kg',
      fuel_capacity: '3.6 L',
    }),
    availability_status: 'Available',
    condition_status: 'Good',
    rental_fee_centavos: 50000,  // PHP 500.00
    deposit_fee_centavos: 200000, // PHP 2,000.00
    total_quantity: 2,
    available_quantity: 2,
    serial_number: 'TLR-2024-001',
    image_url: '/equipment/tiller.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    name: 'Honda Generator 3.5kVA',
    category: 'Power Equipment',
    description:
      'Portable inverter generator with 3.5 kVA output. Essential for barangay events and emergency power.',
    specifications: JSON.stringify({
      output: '3.5 kVA / 2.8 kW',
      fuel: 'Gasoline',
      run_time: '~8 hrs at 50% load',
      outlets: '2×230V + 1×12V DC',
      weight: '45 kg',
    }),
    availability_status: 'Available',
    condition_status: 'Excellent',
    rental_fee_centavos: 80000,   // PHP 800.00
    deposit_fee_centavos: 500000, // PHP 5,000.00
    total_quantity: 3,
    available_quantity: 2,
    serial_number: 'GEN-2024-001',
    image_url: '/equipment/generator.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    name: 'Concrete Mixer (1-Bag)',
    category: 'Construction',
    description:
      'Electric drum mixer for 1-bag concrete batches. Suitable for housing and community infrastructure projects.',
    specifications: JSON.stringify({
      drum_capacity: '0.5 ft³ (60 kg)',
      motor: '1.5 HP electric',
      drum_speed: '25 rpm',
      weight: '110 kg',
    }),
    availability_status: 'Available',
    condition_status: 'Good',
    rental_fee_centavos: 60000,   // PHP 600.00
    deposit_fee_centavos: 300000, // PHP 3,000.00
    total_quantity: 2,
    available_quantity: 2,
    serial_number: 'CMX-2024-001',
    image_url: '/equipment/concrete-mixer.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    name: 'Water Pump 2-inch',
    category: 'Agricultural',
    description:
      'Gasoline-powered centrifugal pump for irrigation, drainage, and water transfer.',
    specifications: JSON.stringify({
      discharge_diameter: '2 inch',
      max_flow: '500 L/min',
      max_head: '30 m',
      engine: '168F 5.5HP gasoline',
      weight: '17 kg',
    }),
    availability_status: 'Available',
    condition_status: 'Good',
    rental_fee_centavos: 40000,   // PHP 400.00
    deposit_fee_centavos: 150000, // PHP 1,500.00
    total_quantity: 4,
    available_quantity: 4,
    serial_number: 'WPM-2024-001',
    image_url: '/equipment/water-pump.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000005',
    name: 'Circular Saw 7-1/4"',
    category: 'Construction',
    description:
      'Corded circular saw for cutting lumber, plywood, and roofing materials.',
    specifications: JSON.stringify({
      blade_diameter: '7-1/4 inch',
      no_load_speed: '5800 rpm',
      bevel_capacity: '0–56°',
      power: '1200W',
      weight: '3.8 kg',
    }),
    availability_status: 'Available',
    condition_status: 'Good',
    rental_fee_centavos: 25000,  // PHP 250.00
    deposit_fee_centavos: 100000, // PHP 1,000.00
    total_quantity: 3,
    available_quantity: 3,
    serial_number: 'SAW-2024-001',
    image_url: '/equipment/circular-saw.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000006',
    name: 'Backpack Sprayer 20L',
    category: 'Agricultural',
    description:
      'Manual lever-action backpack sprayer for pesticide and fertilizer application.',
    specifications: JSON.stringify({
      tank_capacity: '20 L',
      pressure_range: '2–4 bar',
      lance_length: '70 cm',
      weight_empty: '2.5 kg',
    }),
    availability_status: 'Available',
    condition_status: 'Good',
    rental_fee_centavos: 10000,  // PHP 100.00
    deposit_fee_centavos: 50000, // PHP 500.00
    total_quantity: 10,
    available_quantity: 9,
    serial_number: 'SPR-2024-001',
    image_url: '/equipment/backpack-sprayer.svg',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000007',
    name: 'Marine GPS Handheld',
    category: 'Fishery',
    description:
      'Waterproof handheld GPS unit for fishing boat navigation and sea route plotting.',
    specifications: JSON.stringify({
      screen: '2.6" sunlight-readable',
      battery: 'AA ×2 — 20 hrs',
      waterproof: 'IPX7',
      channels: '72-channel GPS + GLONASS',
      weight: '158 g',
    }),
    availability_status: 'Available',
    condition_status: 'Excellent',
    rental_fee_centavos: 20000,  // PHP 200.00
    deposit_fee_centavos: 80000, // PHP 800.00
    total_quantity: 5,
    available_quantity: 5,
    serial_number: 'GPS-2024-001',
    image_url: '/equipment/marine-gps.svg',
  },
];

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const SEED_RESERVATIONS = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    user_id: 'a0000000-0000-4000-8000-000000000003', // Ana Reyes
    tool_id: 'b0000000-0000-4000-8000-000000000001', // Hand Tiller
    quantity: 1,
    pickup_date: '2026-11-10',
    return_date: '2026-11-14',
    purpose: 'Land preparation for root crop planting in my farm lot at Brgy III.',
    status: 'Approved',
    staff_notes: 'Verified farm ownership document. Approved for 5 days.',
    reviewed_by: 'a0000000-0000-4000-8000-000000000002', // Juan dela Cruz
    reviewed_at: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    user_id: 'a0000000-0000-4000-8000-000000000004', // Pedro Batanes
    tool_id: 'b0000000-0000-4000-8000-000000000006', // Backpack Sprayer
    quantity: 2,
    pickup_date: '2026-11-15',
    return_date: '2026-11-16',
    purpose: 'Pest control application for vegetable garden in Brgy IV.',
    status: 'Pending',
    staff_notes: null,
    reviewed_by: null,
    reviewed_at: null,
  },
];

// ─── RENTALS ──────────────────────────────────────────────────────────────────

export const SEED_RENTALS = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    reservation_id: 'c0000000-0000-4000-8000-000000000001',
    user_id: 'a0000000-0000-4000-8000-000000000003', // Ana Reyes
    tool_id: 'b0000000-0000-4000-8000-000000000001', // Hand Tiller
    quantity: 1,
    due_date: '2026-11-14',
    returned_at: null,
    status: 'Borrowed',
    initial_condition: 'Good',
    returned_condition: null,
    inspection_notes: 'Engine oil checked, all tines intact, fully fueled.',
    overdue_penalty_centavos: 0,
    damage_penalty_centavos: 0,
    released_by: 'a0000000-0000-4000-8000-000000000002', // Juan dela Cruz
    received_by: null,
  },
];

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const SEED_PAYMENTS = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    receipt_reference: 'OR-2026-00001',
    user_id: 'a0000000-0000-4000-8000-000000000003', // Ana Reyes
    reservation_id: 'c0000000-0000-4000-8000-000000000001',
    rental_id: 'd0000000-0000-4000-8000-000000000001',
    tool_id: 'b0000000-0000-4000-8000-000000000001', // Hand Tiller
    amount_centavos: 250000, // PHP 2,500.00 (500 rental + 2,000 deposit)
    payment_method: 'GCash',
    status: 'Paid',
    proof_url: null,
    verified_by: 'a0000000-0000-4000-8000-000000000002', // Juan dela Cruz
    verified_at: '2026-11-10T08:30:00.000Z',
  },
];

// ─── FEEDBACK ─────────────────────────────────────────────────────────────────

export const SEED_FEEDBACK = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    user_id: 'a0000000-0000-4000-8000-000000000003', // Ana Reyes
    tool_id: 'b0000000-0000-4000-8000-000000000001', // Hand Tiller
    rental_id: null,
    overall_rating: 5,
    tool_condition_rating: 5,
    service_rating: 5,
    comments:
      'Napakagandang programa ng munisipyo! Napakalinis at maayos ng tiller. Ang staff naman ay magalang at makakatulong. Maraming salamat!',
    is_public: 1,
  },
];

