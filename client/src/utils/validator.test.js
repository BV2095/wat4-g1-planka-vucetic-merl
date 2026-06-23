import { isUrl, isPassword, isUsername } from './validator';

// Owner: Vučetić — 3 unit tests
describe('validator', () => {
  test('isUrl accepts a valid https URL and rejects bad ones', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('example.com')).toBe(false); // missing protocol
    expect(isUrl('ftp://example.com')).toBe(false); // disallowed protocol
  });

  test('isUsername enforces length and allowed characters', () => {
    expect(isUsername('john.doe')).toBe(true);
    expect(isUsername('ab')).toBe(false); // too short
    expect(isUsername('has space')).toBe(false); // illegal char
  });

  test('isPassword rejects weak and accepts strong passwords', () => {
    expect(isPassword('1234')).toBe(false);
    expect(isPassword('correcthorsebatterystaple')).toBe(true);
  });
});
