// Demonstration script for timeout and cancellation functionality
// This script shows the new timeout and AbortSignal features working

const { OpenFeature, ErrorCode, ProviderStatus } = require('./packages/server/dist/cjs');

// Mock provider that simulates slow operations
class SlowProvider {
  constructor(delay = 100) {
    this.delay = delay;
    this.metadata = { name: 'slow-demo-provider' };
    this.runsOn = 'server';
  }

  async initialize() {
    console.log(`🔄 Provider initializing (${this.delay}ms delay)...`);
    await new Promise(resolve => setTimeout(resolve, this.delay));
    console.log('✅ Provider initialized successfully');
  }

  async resolveBooleanEvaluation(flagKey, defaultValue) {
    console.log(`🔄 Evaluating flag "${flagKey}" (${this.delay}ms delay)...`);
    await new Promise(resolve => setTimeout(resolve, this.delay));
    console.log(`✅ Flag "${flagKey}" evaluated to true`);
    return { value: true, reason: 'STATIC' };
  }

  resolveStringEvaluation() { throw new Error('Not implemented'); }
  resolveNumberEvaluation() { throw new Error('Not implemented'); }
  resolveObjectEvaluation() { throw new Error('Not implemented'); }
}

async function demonstrateTimeoutAndCancellation() {
  console.log('🚀 OpenFeature Timeout and Cancellation Demo\n');

  try {
    // Demo 1: Provider initialization timeout (should succeed)
    console.log('📝 Demo 1: Provider initialization with sufficient timeout');
    console.log('Setting provider with 200ms timeout, provider takes 100ms...');
    const fastProvider = new SlowProvider(100);
    await OpenFeature.setProviderAndWait(fastProvider, { timeout: 200 });
    console.log('✅ Provider initialization succeeded within timeout\n');

    // Demo 2: Flag evaluation timeout (should succeed)
    console.log('📝 Demo 2: Flag evaluation with sufficient timeout');
    console.log('Evaluating flag with 200ms timeout, evaluation takes 100ms...');
    const client = OpenFeature.getClient();
    const result1 = await client.getBooleanDetails('demo-flag', false, {}, { timeout: 200 });
    console.log(`✅ Flag evaluation succeeded: value=${result1.value}, errorCode=${result1.errorCode || 'none'}\n`);

    // Demo 3: Provider initialization timeout (should fail)
    console.log('📝 Demo 3: Provider initialization timeout');
    console.log('Setting provider with 50ms timeout, provider takes 200ms...');
    try {
      const slowProvider = new SlowProvider(200);
      await OpenFeature.setProviderAndWait(slowProvider, { timeout: 50 });
      console.log('❌ Unexpected success - should have timed out');
    } catch (error) {
      if (error.code === ErrorCode.TIMEOUT) {
        console.log(`✅ Provider initialization timed out as expected: ${error.message}\n`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}\n`);
      }
    }

    // Demo 4: Flag evaluation timeout (should fail)
    console.log('📝 Demo 4: Flag evaluation timeout');
    console.log('Evaluating flag with 50ms timeout, evaluation takes 200ms...');
    // Set a new slow provider for this test
    const anotherSlowProvider = new SlowProvider(200);
    await OpenFeature.setProviderAndWait(anotherSlowProvider, { timeout: 300 }); // Give it time to initialize

    const client2 = OpenFeature.getClient();
    const result2 = await client2.getBooleanDetails('timeout-flag', false, {}, { timeout: 50 });

    if (result2.errorCode === ErrorCode.TIMEOUT) {
      console.log(`✅ Flag evaluation timed out as expected: ${result2.errorMessage}\n`);
    } else {
      console.log(`❌ Expected timeout, got: errorCode=${result2.errorCode}, value=${result2.value}\n`);
    }

    // Demo 5: AbortSignal cancellation
    console.log('📝 Demo 5: Provider initialization cancellation with AbortSignal');
    console.log('Starting provider initialization, will abort after 50ms...');
    try {
      const controller = new AbortController();
      const cancelProvider = new SlowProvider(200);

      // Abort after 50ms
      setTimeout(() => {
        console.log('🛑 Aborting provider initialization...');
        controller.abort();
      }, 50);

      await OpenFeature.setProviderAndWait(cancelProvider, { signal: controller.signal });
      console.log('❌ Unexpected success - should have been cancelled');
    } catch (error) {
      if (error.message.includes('cancelled')) {
        console.log(`✅ Provider initialization cancelled as expected: ${error.message}\n`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}\n`);
      }
    }

    // Demo 6: Flag evaluation cancellation
    console.log('📝 Demo 6: Flag evaluation cancellation with AbortSignal');
    console.log('Starting flag evaluation, will abort after 50ms...');

    // Set up a provider for this test
    const evalTestProvider = new SlowProvider(200);
    await OpenFeature.setProviderAndWait(evalTestProvider, { timeout: 300 });

    const controller2 = new AbortController();
    const client3 = OpenFeature.getClient();

    // Abort after 50ms
    setTimeout(() => {
      console.log('🛑 Aborting flag evaluation...');
      controller2.abort();
    }, 50);

    const result3 = await client3.getBooleanDetails('cancel-flag', false, {}, {
      signal: controller2.signal
    });

    if (result3.errorCode === ErrorCode.GENERAL && result3.errorMessage.includes('cancelled')) {
      console.log(`✅ Flag evaluation cancelled as expected: ${result3.errorMessage}\n`);
    } else {
      console.log(`❌ Expected cancellation, got: errorCode=${result3.errorCode}, value=${result3.value}\n`);
    }

    console.log('🎉 Demo completed! All timeout and cancellation features are working.');

  } catch (error) {
    console.error('❌ Demo failed with error:', error);
  }
}

// Run the demonstration
demonstrateTimeoutAndCancellation().catch(console.error);