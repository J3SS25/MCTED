import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ToolsService } from './tools.service.js';
import { AppError } from '../utils/errors.js';
import { runMigrations } from '../../db/migrate.js';
import { runSeed } from '../../db/seed/seed.js';

const BORROWER_ANA = {
  id: 'a0000000-0000-4000-8000-000000000003',
  name: 'Ana Reyes',
  role: 'Borrower',
};

const BORROWER_PEDRO = {
  id: 'a0000000-0000-4000-8000-000000000004',
  name: 'Pedro Batanes',
  role: 'Borrower',
};

const MUNICIPAL_TOOL_ID = 'b0000000-0000-4000-8000-000000000001';

const VALID_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const createdToolIds: string[] = [];

beforeAll(async () => {
  runMigrations();
  await runSeed();
});

afterAll(() => {
  for (const id of createdToolIds) {
    try {
      ToolsService.deleteTool(id, { id: 'admin', name: 'Cleanup', role: 'Administrator' });
    } catch {
      // Already deleted during test
    }
  }
});

describe('ToolsService - Borrower Tools & Equipment Management', () => {
  it('enforces borrower ownership access control on municipal and other borrowers tools', () => {
    // Borrower cannot edit, archive, or delete municipal catalog tools
    expect(() =>
      ToolsService.updateTool(MUNICIPAL_TOOL_ID, { name: 'Tampered Municipal Tool' }, BORROWER_ANA),
    ).toThrowError(AppError);

    try {
      ToolsService.updateTool(MUNICIPAL_TOOL_ID, { name: 'Tampered' }, BORROWER_ANA);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    try {
      ToolsService.archiveTool(MUNICIPAL_TOOL_ID, BORROWER_ANA);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    try {
      ToolsService.deleteTool(MUNICIPAL_TOOL_ID, BORROWER_ANA);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    // Ana creates her own tool
    const uniqueSerial = `ANA-SN-${Date.now()}`;
    const created = ToolsService.createTool(
      {
        name: 'Ana Cordless Grinder',
        category: 'Construction',
        description: 'Brushless angle grinder shared for community projects.',
        availability_status: 'Available',
        condition_status: 'Excellent',
        rental_fee_centavos: 12000,
        deposit_fee_centavos: 40000,
        total_quantity: 1,
        serial_number: uniqueSerial,
        image_urls: [VALID_PNG_DATA_URL, VALID_PNG_DATA_URL],
        image_filenames: ['grinder-front.png', 'grinder-side.png'],
      },
      BORROWER_ANA,
    );
    createdToolIds.push(created.id);

    expect(created.owner_id).toBe(BORROWER_ANA.id);
    expect(created.owner_name).toBe('Ana Reyes');
    expect(created.owner_role).toBe('Borrower');
    expect(created.owner_barangay).toBe('Barangay III');
    expect(created.image_urls).toHaveLength(2);
    expect(created.created_at).toBeTruthy();

    // Another borrower (Pedro) cannot edit or delete Ana's uploaded tool
    try {
      ToolsService.updateTool(created.id, { name: 'Hijacked Grinder' }, BORROWER_PEDRO);
      expect.unreachable('Expected updateTool to throw 403');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    try {
      ToolsService.deleteTool(created.id, BORROWER_PEDRO);
      expect.unreachable('Expected deleteTool to throw 403');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    // Ana CAN edit and delete her own uploaded tool
    const updated = ToolsService.updateTool(
      created.id,
      { name: 'Ana Cordless Grinder Pro', serial_number: uniqueSerial },
      BORROWER_ANA,
    );
    expect(updated.name).toBe('Ana Cordless Grinder Pro');

    ToolsService.deleteTool(created.id, BORROWER_ANA);
    expect(() => ToolsService.getToolById(created.id)).toThrowError(AppError);
  });

  it('verifies unique Serial ID Numbers and rejects duplicates on create and update', () => {
    // Existing municipal serial ID (case-insensitive & whitespace trimmed)
    const dupCheck = ToolsService.verifySerialNumber('  tlr-2024-001  ');
    expect(dupCheck.exists).toBe(true);
    expect(dupCheck.valid).toBe(false);
    expect(dupCheck.message).toMatch(/already exists/i);

    const uniqueSerialA = `UNQ-A-${Date.now()}`;
    const uniqueSerialB = `UNQ-B-${Date.now()}`;
    expect(ToolsService.verifySerialNumber(uniqueSerialA)).toMatchObject({
      exists: false,
      valid: true,
    });

    // Reject creating tool with existing municipal serial ID
    try {
      ToolsService.createTool(
        {
          name: 'Duplicate Serial Tool',
          category: 'Agriculture',
          description: 'Attempt to create duplicate serial ID.',
          availability_status: 'Available',
          condition_status: 'Good',
          rental_fee_centavos: 5000,
          deposit_fee_centavos: 10000,
          total_quantity: 1,
          serial_number: 'TLR-2024-001',
        },
        BORROWER_ANA,
      );
      expect.unreachable('Expected createTool to throw 409 Conflict');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).message).toMatch(/already exists/i);
    }

    // Create two distinct tools
    const toolA = ToolsService.createTool(
      {
        name: 'Tool A',
        category: 'Carpentry',
        description: 'Tool A unique serial.',
        availability_status: 'Available',
        condition_status: 'Good',
        rental_fee_centavos: 5000,
        deposit_fee_centavos: 10000,
        total_quantity: 1,
        serial_number: uniqueSerialA,
      },
      BORROWER_ANA,
    );
    createdToolIds.push(toolA.id);

    const toolB = ToolsService.createTool(
      {
        name: 'Tool B',
        category: 'Carpentry',
        description: 'Tool B unique serial.',
        availability_status: 'Available',
        condition_status: 'Good',
        rental_fee_centavos: 5000,
        deposit_fee_centavos: 10000,
        total_quantity: 1,
        serial_number: uniqueSerialB,
      },
      BORROWER_ANA,
    );
    createdToolIds.push(toolB.id);

    // Verification excluding toolA's own ID passes for toolA's serial
    expect(ToolsService.verifySerialNumber(uniqueSerialA, toolA.id).valid).toBe(true);

    // Updating toolB to toolA's serial must throw 409 Conflict
    try {
      ToolsService.updateTool(toolB.id, { serial_number: uniqueSerialA }, BORROWER_ANA);
      expect.unreachable('Expected updateTool to throw 409 Conflict');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(409);
    }
  });

  it('enforces max 5 images limit and rejects restricted image content', () => {
    const sixImages = Array.from({ length: 6 }, () => VALID_PNG_DATA_URL);
    try {
      ToolsService.createTool(
        {
          name: 'Too Many Photos Tool',
          category: 'Electrical',
          description: 'Testing 5-image maximum limit.',
          availability_status: 'Available',
          condition_status: 'Good',
          rental_fee_centavos: 5000,
          deposit_fee_centavos: 10000,
          total_quantity: 1,
          serial_number: `MAX-IMG-${Date.now()}`,
          image_urls: sixImages,
        },
        BORROWER_ANA,
      );
      expect.unreachable('Expected createTool to reject > 5 images');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toMatch(/maximum of 5 images/i);
    }

    const restrictedCases = [
      { filename: 'explicit_nsfw_photo.png', pattern: /Explicit or adult content/i },
      { filename: 'violent_gore_scene.jpg', pattern: /Violent or graphic content/i },
      { filename: 'hate_swastika_flag.png', pattern: /Hate symbols or offensive content/i },
      { filename: 'illegal_contraband_weapon.jpg', pattern: /Illegal or inappropriate materials/i },
    ];

    for (const testCase of restrictedCases) {
      try {
        ToolsService.createTool(
          {
            name: 'Moderation Test Tool',
            category: 'Agriculture',
            description: 'Testing backend content moderation enforcement.',
            availability_status: 'Available',
            condition_status: 'Good',
            rental_fee_centavos: 5000,
            deposit_fee_centavos: 10000,
            total_quantity: 1,
            serial_number: `MOD-${Date.now()}-${Math.random()}`,
            image_urls: [VALID_PNG_DATA_URL],
            image_filenames: [testCase.filename],
          },
          BORROWER_ANA,
        );
        expect.unreachable(`Expected moderation rejection for ${testCase.filename}`);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(400);
        expect((err as AppError).message).toMatch(testCase.pattern);
      }
    }
  });
});
