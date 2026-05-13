import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async invalidatePattern(pattern: string) {
    const store = (this.cache as any).store;
    if (store.keys) {
      const keys = await store.keys(pattern);
      for (const key of keys) {
        await this.cache.del(key);
      }
    }
  }
}
