import { createProvider } from './providerFactory';

export const {
  isConfigured,
  getProviderInfo,
  setApiKey,
  getRateLimitInfo,
  incrementRateLimit,
  call,
  streamChat,
  debugConnection,
} = createProvider('openrouter');
