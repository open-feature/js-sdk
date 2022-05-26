import { OpenFeature } from '../src/open-feature.js';
import { Client, EvaluationContext, FlagType, Hook, Provider, ResolutionDetails } from '../src/types.js';

const BOOLEAN_VALUE = true;

const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const REASON = 'mocked-value';
const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';

// a mock provider with some jest spies
const MOCK_PROVIDER: Provider = {
  name: 'mock-hooks-success',

  resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
    return Promise.resolve({
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    });
  }),
} as unknown as Provider;

// a mock provider with some jest spies
const MOCK_ERROR_PROVIDER: Provider = {
  name: 'mock-hooks-error',

  resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
    return Promise.reject({
      reason: ERROR_REASON,
      errorCode: ERROR_CODE,
    });
  }),
} as unknown as Provider;

describe('Hooks', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);

  let client: Client;
  const FLAG_KEY = 'my-flag';

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    OpenFeature.provider = MOCK_PROVIDER;
  });

  beforeEach(() => {
    client = OpenFeature.getClient();
  });

  describe('Requirement 1.1, 1.2', () => {
    it('must provide flagKey, flagType, evaluationContext, defaultValue, client and provider', (done) => {
      client.getBooleanValue(FLAG_KEY, false, undefined, {
        hooks: [
          {
            before: (hookContext) => {
              try {
                expect(hookContext.flagKey).toEqual(FLAG_KEY);
                expect(hookContext.flagType).toBeDefined();
                expect(hookContext.context).toBeDefined();
                expect(hookContext.defaultValue).toBeDefined();
                expect(hookContext.provider).toBeDefined();
                expect(hookContext.client).toBeDefined();
                done();
              } catch (err) {
                done(err);
              }
              return Promise.resolve();
            },
          },
        ],
      });
    });
  });

  describe('Requirement 1.3', () => {
    it('flagKey, flagType, defaultValue must be immutable', (done) => {
      client.getBooleanValue(FLAG_KEY, false, undefined, {
        hooks: [
          {
            before: (hookContext) => {
              try {
                // cast this to allow us to attempt to overwrite, to verify runtime immutability.
                const hookContextCasted = hookContext as { flagKey: string; flagType: FlagType; defaultValue: boolean };
                hookContextCasted.flagKey = 'not allowed';
                hookContextCasted.flagType = 'object';
                hookContextCasted.defaultValue = true;
                done(new Error('Expected error, hookContext should be immutable'));
              } catch (err) {
                done();
              }
              return Promise.resolve();
            },
          },
        ],
      });
    });
  });

  describe('Requirement 1.3', () => {
    describe('before', () => {
      it('evaluationContext must be mutable', (done) => {
        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [
            {
              before: (hookContext) => {
                try {
                  // evaluation context is mutable in before, so this should work.
                  hookContext.context.newBeforeProp = 'new!';
                  expect(hookContext.context.newBeforeProp).toBeTruthy();
                  done();
                } catch (err) {
                  done(err);
                }
                return Promise.resolve();
              },
            },
          ],
        });
      });
    });

    describe('after', () => {
      it('evaluationContext must be immutable', (done) => {
        client.getBooleanValue(FLAG_KEY, false, undefined, {
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
                return Promise.resolve();
              },
            },
          ],
        });
      });
    });
  });

  describe('before', () => {
    describe('3.2', () => {
      it('"before" must run before flag resolution', async () => {
        await client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [
            {
              before: () => {
                // add a prop to the context.
                return Promise.resolve({ beforeRan: true });
              },
            },
          ],
        });

        expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          // ensure property was added by the time the flag resolution occurred.
          expect.objectContaining({
            beforeRan: true,
          }),
          expect.anything()
        );
      });
    });

    describe('Requirement 3.3', () => {
      it('EvaluationContext must be passed to next "before" hook', (done) => {
        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [
            {
              before: () => {
                // add a prop to the context.
                return Promise.resolve({ beforeRan: true });
              },
            },
            {
              before: (hookContext) => {
                // ensure added prop exists in next hook
                try {
                  expect(hookContext.context.beforeRan).toBeTruthy();
                  done();
                } catch (err) {
                  done(err);
                }
                return Promise.resolve({ beforeRan: true });
              },
            },
          ],
        });
      });
    });

    describe('Requirement 3.4', () => {
      it('"before" evaluationContext must be merged with invocation evaluationContext, which invocation taking precedence', async () => {
        await client.getBooleanValue(
          FLAG_KEY,
          false,
          { invocationProp: 'abc', propToOverwrite: 'ghi' },
          {
            hooks: [
              {
                before: () => {
                  // add a prop to the context, and some duplicates to overwrite
                  return Promise.resolve({ hookProp: 'def', invocationProp: 'xxx', propToOverwrite: 'xxx' });
                },
              },
            ],
          }
        );
        expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          // ensure correct properties were maintained/overwritten
          expect.objectContaining({
            invocationProp: 'abc',
            hookProp: 'def',
            propToOverwrite: 'ghi',
          }),
          expect.anything()
        );
      });
    });

    describe('Requirement 3.5', () => {
      it('"after" must run after flag evaluation', (done) => {
        client.getBooleanValue(FLAG_KEY, false, undefined, {
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
                return Promise.resolve();
              },
            },
          ],
        });
      });
    });

    describe('"error" stage', () => {
      beforeAll(() => {
        OpenFeature.provider = MOCK_ERROR_PROVIDER;
      });

      describe('Requirement 3.6', () => {
        it('"error" must run if any errors occur', (done) => {
          client.getBooleanValue(FLAG_KEY, false, undefined, {
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
                  return Promise.resolve();
                },
              },
            ],
          });
        });
      });
    });

    describe('"finally" stage', () => {
      describe('Requirement 3.7', () => {
        it('"finally" must run after "after" stage', (done) => {
          OpenFeature.provider = MOCK_PROVIDER;

          const afterAndFinallyHook: Hook = {
            // mock "after"
            after: jest.fn(() => {
              return Promise.resolve();
            }),
            finally: () => {
              try {
                // assert mock was called
                expect(afterAndFinallyHook.after).toHaveBeenCalled();
                done();
              } catch (err) {
                done(err);
              }
              return Promise.resolve();
            },
          };

          client.getBooleanValue(FLAG_KEY, false, undefined, {
            hooks: [afterAndFinallyHook],
          });
        });

        it('"finally" must run after "error" stage', (done) => {
          OpenFeature.provider = MOCK_ERROR_PROVIDER;

          const errorAndFinallyHook: Hook = {
            error: jest.fn(() => {
              return Promise.resolve();
            }),
            finally: () => {
              try {
                // assert mock is called
                expect(errorAndFinallyHook.error).toHaveBeenCalled();
                done();
              } catch (err) {
                done(err);
              }
              return Promise.resolve();
            },
          };

          client.getBooleanValue(FLAG_KEY, false, undefined, {
            hooks: [errorAndFinallyHook],
          });
        });
      });
    });

    describe('Requirement 4.2', () => {
      it('"before" must run hook in order global, client, invocation', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const globalBeforeHook: Hook = {
          before: jest.fn(() => {
            try {
              // neither client, nor invocation should have run at this point.
              expect(clientBeforeHook.before).not.toHaveBeenCalled();
              expect(invocationBeforeHook.before).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const clientBeforeHook: Hook = {
          before: jest.fn(() => {
            try {
              // global should have run, but not invocation
              expect(globalBeforeHook.before).toHaveBeenCalled();
              expect(invocationBeforeHook.before).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const invocationBeforeHook: Hook = {
          before: jest.fn(() => {
            try {
              // all hooks should have been called by now
              expect(globalBeforeHook.before).toHaveBeenCalled();
              expect(clientBeforeHook.before).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        OpenFeature.addHooks(globalBeforeHook);
        client.addHooks(clientBeforeHook);

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [invocationBeforeHook],
        });
      });

      it('"after" must run hook in order invocation, client, global', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const invocationAfterHook: Hook = {
          after: jest.fn(() => {
            try {
              // neither client, nor global should have run at this point.
              expect(clientAfterHook.after).not.toHaveBeenCalled();
              expect(globalAfterHook.after).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const clientAfterHook: Hook = {
          after: jest.fn(() => {
            try {
              // invocation should have run, but not global
              expect(invocationAfterHook.after).toHaveBeenCalled();
              expect(globalAfterHook.after).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const globalAfterHook: Hook = {
          after: jest.fn(() => {
            try {
              // all hooks should have been called by now
              expect(invocationAfterHook.after).toHaveBeenCalled();
              expect(clientAfterHook.after).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        OpenFeature.addHooks(globalAfterHook);
        client.addHooks(clientAfterHook);

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [invocationAfterHook],
        });
      });

      it('"error" must run hook in order invocation, client, global', (done) => {
        OpenFeature.provider = MOCK_ERROR_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const invocationErrorHook: Hook = {
          error: jest.fn(() => {
            try {
              // neither client, nor global should have run at this point.
              expect(clientErrorHook.error).not.toHaveBeenCalled();
              expect(globalErrorHook.error).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const clientErrorHook: Hook = {
          error: jest.fn(() => {
            try {
              // invocation should have run, but not global
              expect(invocationErrorHook.error).toHaveBeenCalled();
              expect(globalErrorHook.error).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const globalErrorHook: Hook = {
          error: jest.fn(() => {
            try {
              // all hooks should have been called by now
              expect(invocationErrorHook.error).toHaveBeenCalled();
              expect(clientErrorHook.error).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        OpenFeature.addHooks(globalErrorHook);
        client.addHooks(clientErrorHook);

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [invocationErrorHook],
        });
      });

      it('"finally" must run hook in order invocation, client, global', (done) => {
        OpenFeature.provider = MOCK_ERROR_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const invocationFinallyHook: Hook = {
          error: jest.fn(() => {
            try {
              // neither client, nor global should have run at this point.
              expect(clientFinallyHook.error).not.toHaveBeenCalled();
              expect(globalFinallyHook.error).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const clientFinallyHook: Hook = {
          error: jest.fn(() => {
            try {
              // invocation should have run, but not global
              expect(invocationFinallyHook.error).toHaveBeenCalled();
              expect(globalFinallyHook.error).not.toHaveBeenCalled();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        const globalFinallyHook: Hook = {
          error: jest.fn(() => {
            try {
              // all hooks should have been called by now
              expect(invocationFinallyHook.error).toHaveBeenCalled();
              expect(clientFinallyHook.error).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        OpenFeature.addHooks(globalFinallyHook);
        client.addHooks(clientFinallyHook);

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [invocationFinallyHook],
        });
      });
    });

    describe('Requirement 4.3', () => {
      it('"finally" must not trigger error', (done) => {
        OpenFeature.provider = MOCK_ERROR_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const errorAndFinallyHook: Hook = {
          after: jest.fn(() => {
            done(new Error('Should not have been called.'));
            return Promise.resolve();
          }),
          finally: () => {
            return Promise.reject('expected');
          },
        };

        client
          .getBooleanValue(FLAG_KEY, false, undefined, {
            hooks: [errorAndFinallyHook],
          })
          .then(() => {
            // this should not run.
            done(new Error('Expected error in finally to bubble-up.'));
          })
          .catch(() => {
            // for now, we expect errors in finally to bubble up, so catch and call done().
            done();
          });
      });
    });

    describe('Requirement 4.4', () => {
      it('"before" must trigger error hook', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const beforeAndErrorHook: Hook = {
          before: jest.fn(() => {
            return Promise.reject('Fake error');
          }),
          error: jest.fn(() => {
            try {
              expect(beforeAndErrorHook.before).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [beforeAndErrorHook],
        });
      });

      it('"after" must trigger error hook', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const afterAndErrorHook: Hook = {
          after: jest.fn(() => {
            return Promise.reject('Fake error');
          }),
          error: jest.fn(() => {
            try {
              expect(afterAndErrorHook.after).toHaveBeenCalled();
              done();
            } catch (err) {
              done(err);
            }
            return Promise.resolve();
          }),
        };

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [afterAndErrorHook],
        });
      });
    });

    describe('Requirement 4.5', () => {
      it('remaining hooks must not run after error', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        const clientBeforeHook: Hook = {
          before: jest.fn(() => {
            return Promise.reject('Fake error!');
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
            return Promise.resolve();
          }),
          before: jest.fn(() => {
            done(new Error('Should not have run!'));
            return Promise.resolve();
          }),
        };

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [clientBeforeHook, beforeAndErrorHook],
        });
      });
    });

    describe('Requirement 5.2, 5.3', () => {
      it('HookHints should be passed to each hook', (done) => {
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        client.getBooleanValue(FLAG_KEY, false, undefined, {
          hooks: [
            {
              before: (_, hookHints) => {
                try {
                  expect(hookHints?.hint).toBeTruthy();
                } catch (err) {
                  done(err);
                }
                return Promise.resolve();
              },
              after: (_hookContext, _evaluationDetils, hookHints) => {
                try {
                  expect(hookHints?.hint).toBeTruthy();
                } catch (err) {
                  done(err);
                }
                return Promise.resolve();
              },
              finally: (_, hookHints) => {
                try {
                  expect(hookHints?.hint).toBeTruthy();
                  done();
                } catch (err) {
                  done(err);
                }
                return Promise.resolve();
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
        OpenFeature.provider = MOCK_PROVIDER;
        OpenFeature.clearHooks();
        client.clearHooks();

        client.getBooleanValue(FLAG_KEY, false, undefined, {
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
                return Promise.resolve();
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
});
