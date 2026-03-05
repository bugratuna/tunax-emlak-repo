/**
 * Forwarding shim → taxonomy/index.ts
 *
 * The bundler may prefer this .ts file over the taxonomy/ directory index.
 * All exports come from the actual module at taxonomy/index.ts which sources
 * data from mnt/data/ taxonomy files.
 */
export * from './taxonomy/index';
