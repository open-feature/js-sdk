import { isEqual } from '../src/common/is-equal';

describe('isEqual', () => {
  it('should return true for equal primitive values', () => {
    expect(isEqual(5, 5)).toBe(true);
    expect(isEqual('hello', 'hello')).toBe(true);
    expect(isEqual(true, true)).toBe(true);
  });

  it('should return false for different primitive values', () => {
    expect(isEqual(5, 10)).toBe(false);
    expect(isEqual('hello', 'world')).toBe(false);
    expect(isEqual(true, false)).toBe(false);
  });

  it('should return true for equal serializable objects', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'John', age: 30 };
    expect(isEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different serializable objects', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'Jane', age: 25 };
    expect(isEqual(obj1, obj2)).toBe(false);
  });

  it('should return true for equal deep objects', () => {
    const obj1 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
    const obj2 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
    expect(isEqual(obj1, obj2)).toBe(true);
  });

  it('should return true for equal deep objects with properties in a different order', () => {
    const obj1 = { name: 'John', age: 30, address: { city: 'New York', country: 'USA' } };
    const obj2 = { address: { country: 'USA', city: 'New York' }, age: 30, name: 'John' };
    expect(isEqual(obj1, obj2)).toBe(true);
  });
});
