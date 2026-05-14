import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getRequestFromContext } from '../src/utils';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

const mockRequest = { headers: {}, body: {} };

describe('getRequestFromContext', () => {
  describe('when context type is http', () => {
    it('should return the HTTP request', () => {
      const context = {
        getType: () => 'http',
        switchToHttp: () => ({ getRequest: () => mockRequest }),
      } as unknown as ExecutionContext;

      expect(getRequestFromContext(context)).toBe(mockRequest);
    });
  });

  describe('when context type is graphql', () => {
    describe('and @nestjs/graphql is available', () => {
      it('should return the request from the GraphQL context', () => {
        const context = { getType: () => 'graphql' } as unknown as ExecutionContext;
        (GqlExecutionContext.create as jest.Mock).mockReturnValue({
          getContext: () => ({ req: mockRequest }),
        });

        expect(getRequestFromContext(context)).toBe(mockRequest);
      });
    });

    it('should return undefined when @nestjs/graphql is not available', () => {
      jest.resetModules();
      jest.doMock('@nestjs/graphql', () => {
        throw new Error('Cannot find module');
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
      const { getRequestFromContext: fn } = require('../src/utils') as typeof import('../src/utils');
      const context = { getType: () => 'graphql' } as unknown as ExecutionContext;
      expect(fn(context)).toBeUndefined();
      jest.resetModules();
    });
  });

  describe('when context type is unknown', () => {
    it('should return undefined', () => {
      const context = { getType: () => 'rpc' } as unknown as ExecutionContext;

      expect(getRequestFromContext(context)).toBeUndefined();
    });
  });
});
