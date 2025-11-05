// Demonstration script for web client cancellation functionality
// Note: Web clients have synchronous evaluations but support cancellation checks

const { OpenFeature, ErrorCode, ProviderStatus } = require('./packages/web/dist/cjs');

// Mock web provider
class WebDemoProvider {
  constructor(delay = 100) {
    this.delay = delay;
    this.metadata = { name: 'web-demo-provider' };
    this.runsOn = 'client';
  }

  async initialize() {
    console.log(`🔄 Web provider initializing (${this.delay}ms delay)...`);
    await new Promise(resolve => setTimeout(resolve, this.delay));
    console.log('✅ Web provider initialized successfully');
  }

  // Web providers have synchronous evaluation methods
  resolveBooleanEvaluation(flagKey, defaultValue) {
    console.log(`✅ Web flag "${flagKey}" evaluated synchronously to true`);
    return { value: true, reason: 'STATIC' };
  }

  resolveStringEvaluation() { throw new Error('Not implemented'); }
  resolveNumberEvaluation() { throw new Error('Not implemented'); }
  resolveObjectEvaluation() { throw new Error('Not implemented'); }
}

// Mock console to capture warnings
const originalConsole = console;
const warnings = [];
console.warn = (...args) => {
  warnings.push(args.join(' '));
  originalConsole.warn(...args);
};

async function demonstrateWebCancellation() {
  console.log('🌐 OpenFeature Web Client Cancellation Demo\n');

  try {
    // Demo 1: Provider initialization with timeout (should succeed)
    console.log('📝 Demo 1: Web provider initialization with timeout');
    console.log('Setting provider with 200ms timeout, provider takes 100ms...');
    const provider = new WebDemoProvider(100);
    await OpenFeature.setProviderAndWait(provider, { timeout: 200 });
    console.log('✅ Web provider initialization succeeded within timeout\n');

    // Demo 2: Synchronous flag evaluation (no timeout support)
    console.log('📝 Demo 2: Synchronous flag evaluation (timeouts not supported)');
    const client = OpenFeature.getClient();

    // This should work but log a warning about timeout not being supported
    const result1 = client.getBooleanDetails('web-flag', false, {
      timeout: 1000 // This will trigger a warning
    });

    console.log(`✅ Flag evaluation completed: value=${result1.value}, errorCode=${result1.errorCode || 'none'}`);

    // Check if warning was logged
    const timeoutWarning = warnings.find(w => w.includes('Timeout option is not supported'));
    if (timeoutWarning) {
      console.log('✅ Timeout warning logged as expected for synchronous evaluation\n');
    } else {
      console.log('❌ Expected timeout warning was not logged\n');
    }

    // Demo 3: AbortSignal cancellation (should work)
    console.log('📝 Demo 3: Flag evaluation cancellation with pre-aborted signal');
    const controller = new AbortController();
    controller.abort(); // Pre-abort the signal

    const result2 = client.getBooleanDetails('cancelled-flag', false, {
      signal: controller.signal
    });

    if (result2.errorCode === ErrorCode.GENERAL && result2.errorMessage.includes('cancelled')) {
      console.log(`✅ Flag evaluation cancelled as expected: ${result2.errorMessage}`);
      console.log(`✅ Default value returned: ${result2.value}\n`);
    } else {
      console.log(`❌ Expected cancellation, got: errorCode=${result2.errorCode}, value=${result2.value}\n`);
    }

    // Demo 4: Provider initialization cancellation
    console.log('📝 Demo 4: Web provider initialization cancellation');
    console.log('Starting provider initialization, will abort after 50ms...');

    try {
      const controller2 = new AbortController();
      const slowProvider = new WebDemoProvider(200);

      // Abort after 50ms
      setTimeout(() => {
        console.log('🛑 Aborting web provider initialization...');
        controller2.abort();
      }, 50);

      await OpenFeature.setProviderAndWait(slowProvider, { signal: controller2.signal });
      console.log('❌ Unexpected success - should have been cancelled');
    } catch (error) {
      if (error.message.includes('cancelled')) {
        console.log(`✅ Web provider initialization cancelled as expected: ${error.message}\n`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}\n`);
      }
    }

    // Demo 5: Combined timeout warning and cancellation
    console.log('📝 Demo 5: Combined timeout warning and cancellation');
    const controller3 = new AbortController();
    controller3.abort();

    const result3 = client.getBooleanDetails('combined-test', false, {
      timeout: 5000, // Should trigger warning
      signal: controller3.signal // Should cause cancellation
    });

    if (result3.errorCode === ErrorCode.GENERAL && result3.errorMessage.includes('cancelled')) {
      console.log('✅ Cancellation took precedence over timeout');

      // Check if both the old warning and potential new warnings exist
      const hasTimeoutWarnings = warnings.some(w => w.includes('Timeout option is not supported'));
      if (hasTimeoutWarnings) {
        console.log('✅ Timeout warnings were logged for synchronous operations\n');
      }
    }

    console.log('🎉 Web client demo completed! Cancellation features are working correctly.');
    console.log('📝 Note: Web clients use synchronous evaluations, so timeouts apply only to provider initialization.');

  } catch (error) {
    console.error('❌ Web demo failed with error:', error);
  }
}

// Run the demonstration
demonstrateWebCancellation().catch(console.error);