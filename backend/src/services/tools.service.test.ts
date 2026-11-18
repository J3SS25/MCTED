import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ToolsService } from './tools.service.js';
import { AppError } from '../utils/errors.js';
import { runMigrations } from '../../db/migrate.js';
import { runSeed } from '../../db/seed/seed.js';

const ADMIN_MARIA = {
  id: 'a0000000-0000-4000-8000-000000000001',
  name: 'Maria Santos',
  role: 'Administrator',
};

const STAFF_JUAN = {
  id: 'a0000000-0000-4000-8000-000000000002',
  name: 'Juan dela Cruz',
  role: 'Municipal Staff',
};

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
      ToolsService.deleteTool(id, ADMIN_MARIA);
    } catch {
      // Already deleted during test
    }
  }
});

describe('ToolsService - Role-Based Tool & Equipment Management', () => {
  it('forbids Borrowers from creating, updating, archiving, or deleting tools, while allowing Staff and Admins', () => {
    // Borrowers cannot upload/create tools
    for (const borrower of [BORROWER_ANA, BORROWER_PEDRO]) {
      try {
        ToolsService.createTool(
          {
            name: 'Unauthorized Borrower Tool',
            category: 'Carpentry',
            description: 'Borrowers must not be permitted to upload tools.',
            availability_status: 'Available',
            condition_status: 'Good',
            total_quantity: 1,
            serial_number: `BOR-DENIED-${Date.now()}-${Math.random()}`,
          },
          borrower,
        );
        expect.unreachable('Expected createTool to throw 403 for Borrower');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(403);
      }

      try {
        ToolsService.updateTool(MUNICIPAL_TOOL_ID, { name: 'Tampered' }, borrower);
        expect.unreachable('Expected updateTool to throw 403 for Borrower');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(403);
      }

      try {
        ToolsService.archiveTool(MUNICIPAL_TOOL_ID, borrower);
        expect.unreachable('Expected archiveTool to throw 403 for Borrower');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(403);
      }

      try {
        ToolsService.deleteTool(MUNICIPAL_TOOL_ID, borrower);
        expect.unreachable('Expected deleteTool to throw 403 for Borrower');
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).statusCode).toBe(403);
      }
    }

    // Municipal Staff creates a catalog tool
    const uniqueSerial = `STAFF-SN-${Date.now()}`;
    const createdByStaff = ToolsService.createTool(
      {
        name: 'Municipal Cordless Grinder',
        category: 'Construction',
        description: 'Brushless angle grinder managed by municipal staff.',
        availability_status: 'Available',
        condition_status: 'Excellent',
        total_quantity: 2,
        serial_number: uniqueSerial,
        image_urls: [VALID_PNG_DATA_URL, VALID_PNG_DATA_URL],
        image_filenames: ['grinder-front.png', 'grinder-side.png'],
      },
      STAFF_JUAN,
    );
    createdToolIds.push(createdByStaff.id);

    expect(createdByStaff.owner_id).toBe(STAFF_JUAN.id);
    expect(createdByStaff.owner_name).toBe('Juan dela Cruz');
    expect(createdByStaff.owner_role).toBe('Municipal Staff');
    expect(createdByStaff.image_urls).toHaveLength(2);
    expect(createdByStaff.created_at).toBeTruthy();

    // Borrower still cannot edit or delete a staff-created tool
    try {
      ToolsService.updateTool(createdByStaff.id, { name: 'Hijacked Grinder' }, BORROWER_ANA);
      expect.unreachable('Expected updateTool to throw 403 for Borrower');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }

    // Municipal Staff can update and archive, and Administrator can delete
    const updated = ToolsService.updateTool(
      createdByStaff.id,
      { name: 'Municipal Cordless Grinder Pro', serial_number: uniqueSerial },
      STAFF_JUAN,
    );
    expect(updated.name).toBe('Municipal Cordless Grinder Pro');

    const archived = ToolsService.archiveTool(createdByStaff.id, STAFF_JUAN);
    expect(archived.availability_status).toBe('Archived');

    ToolsService.deleteTool(createdByStaff.id, ADMIN_MARIA);
    expect(() => ToolsService.getToolById(createdByStaff.id)).toThrowError(AppError);
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
          total_quantity: 1,
          serial_number: 'TLR-2024-001',
        },
        STAFF_JUAN,
      );
      expect.unreachable('Expected createTool to throw 409 Conflict');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(409);
      expect((err as AppError).message).toMatch(/already exists/i);
    }

    // Create two distinct tools as Staff / Admin
    const toolA = ToolsService.createTool(
      {
        name: 'Tool A',
        category: 'Carpentry',
        description: 'Tool A unique serial.',
        availability_status: 'Available',
        condition_status: 'Good',
        total_quantity: 1,
        serial_number: uniqueSerialA,
      },
      STAFF_JUAN,
    );
    createdToolIds.push(toolA.id);

    const toolB = ToolsService.createTool(
      {
        name: 'Tool B',
        category: 'Carpentry',
        description: 'Tool B unique serial.',
        availability_status: 'Available',
        condition_status: 'Good',
        total_quantity: 1,
        serial_number: uniqueSerialB,
      },
      ADMIN_MARIA,
    );
    createdToolIds.push(toolB.id);

    // Verification excluding toolA's own ID passes for toolA's serial
    expect(ToolsService.verifySerialNumber(uniqueSerialA, toolA.id).valid).toBe(true);

    // Updating toolB to toolA's serial must throw 409 Conflict
    try {
      ToolsService.updateTool(toolB.id, { serial_number: uniqueSerialA }, ADMIN_MARIA);
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
          total_quantity: 1,
          serial_number: `MAX-IMG-${Date.now()}`,
          image_urls: sixImages,
        },
        STAFF_JUAN,
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
            total_quantity: 1,
            serial_number: `MOD-${Date.now()}-${Math.random()}`,
            image_urls: [VALID_PNG_DATA_URL],
            image_filenames: [testCase.filename],
          },
          STAFF_JUAN,
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
