import { describe, expect, it } from 'vitest';
import { cloneContext } from '../src/internal/clone-context';

describe('cloneContext', () => {
  it('should copy a JSON-parsed "__proto__" attribute as an own property', () => {
    const original = JSON.parse('{"__proto__": {"admin": true}, "user": "a"}');
    const copy = cloneContext(original);

    expect(Object.getOwnPropertyDescriptor(copy, '__proto__')?.value).toEqual({ admin: true });
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(copy).toEqual(original);
  });

  it('should produce an equal but independent copy', () => {
    const original = { user: { id: 'a', roles: ['viewer'] }, since: new Date(0), count: 1, flag: true, none: null };
    const copy = cloneContext(original);

    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.user).not.toBe(original.user);
    expect((copy.user as { roles: string[] }).roles).not.toBe(original.user.roles);
    expect(copy.since).not.toBe(original.since);

    (copy.user as { roles: string[] }).roles.push('editor');
    (copy.since as Date).setFullYear(2000);
    expect(original.user.roles).toEqual(['viewer']);
    expect(original.since.getTime()).toBe(0);
  });
});
