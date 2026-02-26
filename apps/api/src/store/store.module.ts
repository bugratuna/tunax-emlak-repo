import { Global, Module } from '@nestjs/common';
import { InMemoryStore } from './store';

@Global()
@Module({
  providers: [InMemoryStore],
  exports: [InMemoryStore],
})
export class StoreModule {}
