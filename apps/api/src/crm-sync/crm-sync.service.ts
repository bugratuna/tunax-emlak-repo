import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CRMSyncResult, CRMSyncTrigger, InMemoryStore } from '../store/store';

@Injectable()
export class CrmSyncService {
  constructor(private readonly store: InMemoryStore) {}

  sync(
    trigger: CRMSyncTrigger,
    entityId: string,
    idempotencyKey: string,
  ): CRMSyncResult {
    if (this.store.hasSyncedKey(idempotencyKey)) {
      const result: CRMSyncResult = {
        syncId: randomUUID(),
        trigger,
        entityId,
        idempotencyKey,
        status: 'SKIPPED_DUPLICATE',
        attempt: 1,
        syncedAt: new Date().toISOString(),
      };
      return this.store.saveCRMSyncResult(result);
    }

    // Mock adapter: always succeeds
    const result: CRMSyncResult = {
      syncId: randomUUID(),
      trigger,
      entityId,
      idempotencyKey,
      status: 'SUCCESS',
      attempt: 1,
      externalRef: `CRM-${randomUUID().slice(0, 8).toUpperCase()}`,
      syncedAt: new Date().toISOString(),
    };
    return this.store.saveCRMSyncResult(result);
  }

  getResults(entityId: string): CRMSyncResult[] {
    return this.store.getCRMSyncResults(entityId);
  }
}
