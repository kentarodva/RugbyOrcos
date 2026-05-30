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
} = createProvider('deepseek');

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
