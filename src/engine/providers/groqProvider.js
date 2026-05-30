import { createProvider } from './providerFactory';

const {
  isConfigured,
  getProviderInfo,
  setApiKey,
  getRateLimitInfo,
  incrementRateLimit,
  call,
  streamChat,
  debugConnection
} = createProvider('groq');

export {
  isConfigured,
  getProviderInfo,
  setApiKey,
  getRateLimitInfo,
  incrementRateLimit,
  call,
  streamChat,
  debugConnection
};
