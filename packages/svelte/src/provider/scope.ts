import type { Client } from '@openfeature/web-sdk';
import { OpenFeature, withFrameworkMetadata } from '@openfeature/web-sdk';
import { setScope } from '../internal/scope';
import type { NormalizedOptions } from '../options';

type ClientOrDomain =
  | {
      /**
       * An identifier which logically binds clients with providers
       * @see OpenFeature.setProvider() and overloads.
       */
      domain?: string;
      client?: never;
    }
  | {
      /**
       * OpenFeature client to use.
       */
      client?: Client;
      domain?: never;
    };

/**
 * The client or domain to bind, and the default update behaviour for evaluations in the scope.
 * Hooks are registered on the client or API rather than on the scope.
 */
export type OpenFeatureScopeOptions = ClientOrDomain & NormalizedOptions;

/**
 * Provides a scope for evaluating feature flags by binding a client to the current component and all of its descendants.
 * Must be called during component initialization (for example in the script of a root layout).
 * Descendants can use the evaluation functions without specifying a client or domain;
 * without a scope, they use the default client.
 * @param {OpenFeatureScopeOptions} options a domain or client to bind, and default update options for the scope
 */
export function setOpenFeatureScope(options: OpenFeatureScopeOptions = {}): void {
  const { client, domain, ...updateOptions } = options;
  setScope({
    client: withFrameworkMetadata(client ?? OpenFeature.getClient(domain), 'svelte'),
    options: updateOptions,
  });
}
