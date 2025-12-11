/// <reference types="react/experimental" />
// This function is adopted from https://github.com/vercel/swr
import React from 'react';

/**
 * Extends a Promise-like value to include status tracking.
 * The extra properties are used to manage the lifecycle of the Promise, indicating its current state.
 * More information can be found in the React RFE for the use hook.
 * @see https://github.com/reactjs/rfcs/pull/229
 */
export type UsePromise<T> = Promise<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
};

/**
 * React.use is a React API that lets you read the value of a resource like a Promise or context.
 * It was officially added in React 19, so needs to be polyfilled to support older React versions.
 * @param {UsePromise} thenable A thenable object that represents a Promise-like value.
 * @returns {unknown} The resolved value of the thenable or throws if it's still pending or rejected.
 */
export const use =
  React.use ||
  // This extra generic is to avoid TypeScript mixing up the generic and JSX syntax
  // and emitting an error.
  // We assume that this is only for the `use(thenable)` case, not `use(context)`.
  // https://github.com/facebook/react/blob/aed00dacfb79d17c53218404c52b1c7aa59c4a89/packages/react-server/src/ReactFizzThenable.js#L45
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (<T, _>(thenable: UsePromise<T>): T => {
    switch (thenable.status) {
      case 'pending':
        throw thenable;
      case 'fulfilled':
        return thenable.value as T;
      case 'rejected':
        throw thenable.reason;
      default:
        thenable.status = 'pending';
        thenable.then(
          (v) => {
            thenable.status = 'fulfilled';
            thenable.value = v;
          },
          (e) => {
            thenable.status = 'rejected';
            thenable.reason = e;
          },
        );
        throw thenable;
    }
  });
