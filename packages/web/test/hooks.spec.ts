import type { Provider, ResolutionDetails, Client, FlagValueType, EvaluationContext, Hook } from '../src';
import { GeneralError, OpenFeature, StandardResolutionReasons, ErrorCode } from '../src';

const BOOLEAN_VALUE = true;

const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const REASON = 'mocked-value';

// a mock provider with some jest spies
const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock-hooks-success',
  },
  resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
    return {
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    };
  }),
} as unknown as Provider;

// a mock provider with some jest spies
const MOCK_ERROR_PROVIDER: Provider = {
  metadata: {
    name: 'mock-hooks-error',
  },
  resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
    throw new GeneralError();
  }),
} as unknown as Provider;

describe('Hooks', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);

  let client: Client;
  const FLAG_KEY = 'my-flag';

  afterEach(async () => {
    await OpenFeature.clearProviders();
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    OpenFeature.setProvider(MOCK_PROVIDER);
    client = OpenFeature.getClient();
  });

  describe('Requirement 4.1.1, 4.1.2', () => {
    it('must provide flagKey, flagType, evaluationContext, defaultValue, client metadata and provider metadata', (done) => {
      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            before: (hookContext) => {
              try {
                expect(hookContext.flagKey).toEqual(FLAG_KEY);
                expect(hookContext.flagValueType).toBeDefined();
                expect(hookContext.context).toBeDefined();
                expect(hookContext.defaultValue).toBeDefined();
                expect(hookContext.providerMetadata).toBeDefined();
                expect(hookContext.clientMetadata).toBeDefined();
                done();
              } catch (err) {
                done(err);
              }
            },
          },
        ],
      });
    });
    it('client metadata and provider metadata must match the client and provider used to resolve the flag', (done) => {
      const provider: Provider = {
        metadata: {
          name: 'mock-my-domain-provider',
        },
        resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
          return Promise.resolve({
            value: BOOLEAN_VALUE,
            variant: BOOLEAN_VARIANT,
            reason: REASON,
          });
        }),
      } as unknown as Provider;

      OpenFeature.setProvider('my-domain', provider);
      const client = OpenFeature.getClient('my-domain');

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            before: (hookContext) => {
              try {
                expect(hookContext.providerMetadata).toEqual(provider.metadata);
                expect(hookContext.clientMetadata).toEqual(client.metadata);
                done();
              } catch (err) {
                done(err);
              }
            },
          },
        ],
      });
    });
  });

  describe('Requirement 4.1.3', () => {
    it('flagKey, flagType, defaultValue must be immutable', (done) => {
      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            before: (hookContext) => {
              try {
                // cast this to allow us to attempt to overwrite, to verify runtime immutability.
                const hookContextCasted = hookContext as {
                  flagKey: string;
                  flagValueType: FlagValueType;
                  defaultValue: boolean;
                };
                hookContextCasted.flagKey = 'not allowed';
                hookContextCasted.flagValueType = 'object';
                hookContextCasted.defaultValue = true;
                done(new Error('Expected error, hookContext should be immutable'));
              } catch (err) {
                done();
              }
            },
          },
        ],
      });
    });
  });

  describe('Requirement 4.1.4', () => {
    describe('after', () => {
      it('evaluationContext must be immutable', (done) => {
        client.getBooleanValue(FLAG_KEY, false, {
          hooks: [
            {
              after: (hookContext) => {
                try {
                  // evaluation context is immutable (frozen) in all but the "before" stage
                  // cast this to allow us to attempt to overwrite, to verify runtime immutability.
                  const evaluationContextCasted = hookContext.context as EvaluationContext;
                  evaluationContextCasted.newAfterProp = true;
                  done(new Error('Expected error, hookContext should be immutable'));
                } catch (err) {
                  done();
                }
              },
            },
          ],
        });
      });
    });
  });

  describe('Requirement 4.3.5', () => {
    it('"after" must run after flag evaluation', (done) => {
      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            after: () => {
              try {
                // expect provider was called by the time "after" hook runs.
                expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalled();
                done();
              } catch (err) {
                done(err);
              }
            },
          },
        ],
      });
    });
  });

  describe('"error" stage', () => {
    beforeEach(() => {
      OpenFeature.setProvider(MOCK_ERROR_PROVIDER);
    });

    describe('Requirement 4.3.6', () => {
      it('"error" must run if any errors occur', (done) => {
        client.getBooleanValue(FLAG_KEY, false, {
          hooks: [
            {
              error: () => {
                try {
                  // expect provider was by called the time "error" hook runs.
                  expect(MOCK_ERROR_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalled();
                  done();
                } catch (err) {
                  done(err);
                }
              },
            },
          ],
        });
      });

      it('"error" must run if resolution details contains an error code', () => {
        (MOCK_ERROR_PROVIDER.resolveBooleanEvaluation as jest.Mock).mockReturnValue({
          value: BOOLEAN_VALUE,
          errorCode: ErrorCode.FLAG_NOT_FOUND,
        });

        const mockErrorHook = jest.fn();

        const details = client.getBooleanDetails(FLAG_KEY, false, {
          hooks: [{ error: mockErrorHook }],
        });

        expect(mockErrorHook).toHaveBeenCalled();
        expect(details).toEqual(
          expect.objectContaining({
            errorCode: ErrorCode.FLAG_NOT_FOUND,
            reason: StandardResolutionReasons.ERROR,
          }),
        );
      });
    });
  });

  describe('"finally" stage', () => {
    describe('Requirement 4.3.7', () => {
      it('"finally" must run after "after" stage', (done) => {
        OpenFeature.setProvider(MOCK_PROVIDER);

        const afterAndFinallyHook: Hook = {
          // mock "after"
          after: jest.fn(() => {
            return;
          }),
          finally: () => {
            try {
              // assert mock was called
              expect(afterAndFinallyHook.after).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
          },
        };

        client.getBooleanValue(FLAG_KEY, false, {
          hooks: [afterAndFinallyHook],
        });
      });

      it('"finally" must run after "error" stage', (done) => {
        OpenFeature.setProvider(MOCK_ERROR_PROVIDER);

        const errorAndFinallyHook: Hook = {
          error: jest.fn(() => {
            return;
          }),
          finally: () => {
            try {
              // assert mock is called
              expect(errorAndFinallyHook.error).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
          },
        };

        client.getBooleanValue(FLAG_KEY, false, {
          hooks: [errorAndFinallyHook],
        });
      });
    });

    describe('Requirement 4.3.8', () => {
      it('"evaluation details" passed to the "finally" stage matches the evaluation details returned to the application author', () => {
        OpenFeature.setProvider(MOCK_PROVIDER);
        let evaluationDetailsHooks;

        const evaluationDetails = client.getBooleanDetails(FLAG_KEY, false, {
          hooks: [
            {
              finally: (_, details) => {
                evaluationDetailsHooks = details;
              },
            },
          ],
        });

        expect(evaluationDetailsHooks).toEqual(evaluationDetails);
      });
    });
  });

  describe('Requirement 4.4.2', () => {
    it('"before" must run hook in order global, client, invocation, provider', (done) => {
      const globalBeforeHook: Hook = {
        before: jest.fn(() => {
          try {
            // provider, nor client, nor invocation should have run at this point.
            expect(provider.hooks?.[0].before).not.toHaveBeenCalled();
            expect(clientBeforeHook.before).not.toHaveBeenCalled();
            expect(invocationBeforeHook.before).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const clientBeforeHook: Hook = {
        before: jest.fn(() => {
          try {
            // global should have run and, but not invocation or provider
            expect(globalBeforeHook.before).toHaveBeenCalled();
            expect(invocationBeforeHook.before).not.toHaveBeenCalled();
            expect(provider.hooks?.[0].before).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const invocationBeforeHook: Hook = {
        before: jest.fn(() => {
          try {
            // global and client should have been called, but not provider
            expect(globalBeforeHook.before).toHaveBeenCalled();
            expect(clientBeforeHook.before).toHaveBeenCalled();
            expect(provider.hooks?.[0].before).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const provider: Provider = {
        metadata: {
          name: 'mock-hooks-before-with-hooks',
        },
        hooks: [
          {
            before: jest.fn(() => {
              try {
                // invocation, nor client, nor global should have run at this point.
                expect(globalBeforeHook.before).toHaveBeenCalled();
                expect(clientBeforeHook.before).toHaveBeenCalled();
                expect(invocationBeforeHook.before).toHaveBeenCalled();
                done();
              } catch (err) {
                done(err);
              }
            }),
          },
        ],
        resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
          return {
            value: BOOLEAN_VALUE,
            variant: BOOLEAN_VARIANT,
            reason: REASON,
          };
        }),
      } as unknown as Provider;

      OpenFeature.setProvider(provider);
      OpenFeature.clearHooks();
      client.clearHooks();

      OpenFeature.addHooks(globalBeforeHook);
      client.addHooks(clientBeforeHook);

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [invocationBeforeHook],
      });
    });

    it('"after" must run hook in order provider, invocation, client, global', (done) => {
      const invocationAfterHook: Hook = {
        after: jest.fn(() => {
          try {
            // provider should have run.
            expect(provider.hooks?.[0].after).toHaveBeenCalled();
            // neither client, nor global should have run at this point.
            expect(clientAfterHook.after).not.toHaveBeenCalled();
            expect(globalAfterHook.after).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const clientAfterHook: Hook = {
        after: jest.fn(() => {
          try {
            // provider and invocation should have run, but not global
            expect(provider.hooks?.[0].after).toHaveBeenCalled();
            expect(invocationAfterHook.after).toHaveBeenCalled();
            expect(globalAfterHook.after).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const globalAfterHook: Hook = {
        after: jest.fn(() => {
          try {
            // all hooks should have been called by now
            expect(provider.hooks?.[0].after).toHaveBeenCalled();
            expect(invocationAfterHook.after).toHaveBeenCalled();
            expect(clientAfterHook.after).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
      };

      const provider: Provider = {
        metadata: {
          name: 'mock-hooks-after-with-hooks',
        },
        hooks: [
          {
            after: jest.fn(() => {
              try {
                // not invocation, nor client, nor global should have run at this point.
                expect(globalAfterHook.after).not.toHaveBeenCalled();
                expect(clientAfterHook.after).not.toHaveBeenCalled();
                expect(invocationAfterHook.after).not.toHaveBeenCalled();
              } catch (err) {
                done(err);
              }
            }),
          },
        ],
        resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
          return {
            value: BOOLEAN_VALUE,
            variant: BOOLEAN_VARIANT,
            reason: REASON,
          };
        }),
      } as unknown as Provider;

      OpenFeature.setProvider(provider);
      OpenFeature.clearHooks();
      client.clearHooks();

      OpenFeature.addHooks(globalAfterHook);
      client.addHooks(clientAfterHook);

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [invocationAfterHook],
      });
    });

    it('"error" must run hook in order provider, invocation, client, global', (done) => {
      const invocationErrorHook: Hook = {
        error: jest.fn(() => {
          try {
            // provider should have run.
            expect(errorProviderWithHooks.hooks?.[0].error).toHaveBeenCalled();

            // neither client, nor global should have run at this point.
            expect(clientErrorHook.error).not.toHaveBeenCalled();
            expect(globalErrorHook.error).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const clientErrorHook: Hook = {
        error: jest.fn(() => {
          try {
            // provider and invocation should have run, but not global
            expect(errorProviderWithHooks.hooks?.[0].error).toHaveBeenCalled();
            expect(invocationErrorHook.error).toHaveBeenCalled();
            expect(globalErrorHook.error).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const globalErrorHook: Hook = {
        error: jest.fn(() => {
          try {
            // all hooks should have been called by now
            expect(errorProviderWithHooks.hooks?.[0].error).toHaveBeenCalled();
            expect(invocationErrorHook.error).toHaveBeenCalled();
            expect(clientErrorHook.error).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
      };

      const errorProviderWithHooks = {
        metadata: {
          name: 'mock-hooks-error-with-hooks',
        },
        hooks: [
          {
            error: jest.fn(() => {
              try {
                // not invocation, nor client, nor global should have run at this point.
                expect(invocationErrorHook.error).not.toHaveBeenCalled();
                expect(clientErrorHook.error).not.toHaveBeenCalled();
                expect(globalErrorHook.error).not.toHaveBeenCalled();
              } catch (err) {
                done(err);
              }
            }),
          },
        ],
        resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
          throw new GeneralError();
        }),
      } as unknown as Provider;

      OpenFeature.setProvider(errorProviderWithHooks);
      OpenFeature.clearHooks();
      client.clearHooks();

      OpenFeature.addHooks(globalErrorHook);
      client.addHooks(clientErrorHook);

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [invocationErrorHook],
      });
    });

    it('"finally" must run hook in order provider, invocation, client, global', (done) => {
      const clientFinallyHook: Hook = {
        finally: jest.fn(() => {
          try {
            // provider and invocation should have run, but not global
            expect(errorProviderWithHooks.hooks?.[0].finally).toHaveBeenCalled();
            expect(invocationFinallyHook.finally).toHaveBeenCalled();
            expect(globalFinallyHook.finally).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const globalFinallyHook: Hook = {
        finally: jest.fn(() => {
          try {
            // all hooks should have been called by now
            expect(errorProviderWithHooks.hooks?.[0].finally).toHaveBeenCalled();
            expect(invocationFinallyHook.finally).toHaveBeenCalled();
            expect(clientFinallyHook.finally).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
      };

      const invocationFinallyHook: Hook = {
        finally: jest.fn(() => {
          try {
            // provider hooks should have run.
            expect(errorProviderWithHooks.hooks?.[0].finally).toHaveBeenCalled();

            // neither client, nor global should have run at this point.
            expect(clientFinallyHook.finally).not.toHaveBeenCalled();
            expect(globalFinallyHook.finally).not.toHaveBeenCalled();
          } catch (err) {
            done(err);
          }
        }),
      };

      const errorProviderWithHooks = {
        metadata: {
          name: 'mock-hooks-finally-with-hooks',
        },
        hooks: [
          {
            finally: jest.fn(() => {
              try {
                // not invocation, nor client, nor global should have run at this point.
                expect(invocationFinallyHook.finally).not.toHaveBeenCalled();
                expect(clientFinallyHook.finally).not.toHaveBeenCalled();
                expect(globalFinallyHook.finally).not.toHaveBeenCalled();
              } catch (err) {
                done(err);
              }
            }),
          },
        ],
        resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
          throw new GeneralError();
        }),
      } as unknown as Provider;
      OpenFeature.setProvider(errorProviderWithHooks);
      OpenFeature.clearHooks();
      client.clearHooks();

      OpenFeature.addHooks(globalFinallyHook);
      client.addHooks(clientFinallyHook);

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [invocationFinallyHook],
      });
    });
  });

  describe('Requirement 4.4.3', () => {
    it('all "finally" hooks must execute, despite errors', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      const firstFinallyHook: Hook = {
        finally: jest.fn(() => {
          throw new Error('expected');
        }),
      };

      const secondFinallyHook: Hook = {
        finally: () => {
          try {
            expect(firstFinallyHook.finally).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        },
      };

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [secondFinallyHook, firstFinallyHook], // remember error hooks run in reverse order
      });
    });
  });

  describe('Requirement 4.4.4', () => {
    it('all "error" hooks must execute, despite errors', (done) => {
      OpenFeature.setProvider(MOCK_ERROR_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      const firstErrorHook: Hook = {
        error: jest.fn(() => {
          throw new Error('expected');
        }),
      };

      const secondErrorHook: Hook = {
        error: () => {
          try {
            expect(firstErrorHook.error).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        },
      };

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [secondErrorHook, firstErrorHook], // remember error hooks run in reverse order
      });
    });
  });

  describe('Requirement 4.4.5', () => {
    it('"before" must trigger error hook', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      const beforeAndErrorHook: Hook = {
        before: jest.fn(() => {
          throw new Error('Fake error');
        }),
        error: jest.fn(() => {
          try {
            expect(beforeAndErrorHook.before).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
      };

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [beforeAndErrorHook],
      });
    });

    it('"after" must trigger error hook', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      const afterAndErrorHook: Hook = {
        after: jest.fn(() => {
          throw new Error('Fake error');
        }),
        error: jest.fn(() => {
          try {
            expect(afterAndErrorHook.after).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
      };

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [afterAndErrorHook],
      });
    });
  });

  describe('Requirement 4.4.6', () => {
    it('remaining before/after hooks must not run after error', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      const clientBeforeHook: Hook = {
        before: jest.fn(() => {
          throw new Error('Fake error!');
        }),
      };

      const beforeAndErrorHook: Hook = {
        error: jest.fn(() => {
          try {
            // our subsequent "before" hook should not have run.
            expect(beforeAndErrorHook.before).not.toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        }),
        before: jest.fn(() => {
          done(new Error('Should not have run!'));
        }),
      };

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [clientBeforeHook, beforeAndErrorHook],
      });
    });
  });

  describe('Requirement 4.5.1, 4.5.2, 4.5.3', () => {
    it('HookHints should be passed to each hook', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            before: (_, hookHints) => {
              try {
                expect(hookHints?.hint).toBeTruthy();
              } catch (err) {
                done(err);
              }
            },
            after: (_hookContext, _evaluationDetails, hookHints) => {
              try {
                expect(hookHints?.hint).toBeTruthy();
              } catch (err) {
                done(err);
              }
            },
            finally: (_, _evaluationDetails, hookHints) => {
              try {
                expect(hookHints?.hint).toBeTruthy();
                done();
              } catch (err) {
                done(err);
              }
            },
          },
        ],
        hookHints: {
          hint: true,
        },
      });
    });
  });

  describe('Requirement 5.4', () => {
    it('HookHints should be immutable', (done) => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.clearHooks();
      client.clearHooks();

      client.getBooleanValue(FLAG_KEY, false, {
        hooks: [
          {
            before: (_, hookHints) => {
              try {
                expect(hookHints?.hint).toBeTruthy();
              } catch (err) {
                done(err);
              }

              try {
                // cast this so we can attempt to modify it.
                (hookHints as { hint: boolean }).hint = false;
                done(new Error('Expected error, "hookHints" to be immutable.'));
              } catch (err) {
                // expect an error since we are modifying a frozen object.
                done();
              }
            },
          },
        ],
        hookHints: {
          hint: true,
        },
      });
    });
  });
});
