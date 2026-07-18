import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { StorageService } from '../storage/storage.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const mockConnection = {
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        insertOne: jest.fn(),
      }),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
      uploadBuffer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
