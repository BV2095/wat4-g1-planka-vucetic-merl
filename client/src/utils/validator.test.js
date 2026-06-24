import { isUrl, isPassword, isUsername } from './validator';

// Owner: Vučetić — parametrized unit tests (test.each)
describe('validator', () => {
  test.each([
    ['https://example.com', true],
    ['example.com', false], // missing protocol
    ['ftp://example.com', false], // disallowed protocol
  ])('isUrl(%j) === %s', (input, expected) => {
    expect(isUrl(input)).toBe(expected);
  });

  test.each([
    ['john.doe', true],
    ['ab', false], // too short
    ['has space', false], // illegal character
  ])('isUsername(%j) === %s', (input, expected) => {
    expect(isUsername(input)).toBe(expected);
  });

  test.each([
    ['1234', false], // weak
    ['correcthorsebatterystaple', true], // strong
  ])('isPassword(%j) === %s', (input, expected) => {
    expect(isPassword(input)).toBe(expected);
  });
});
