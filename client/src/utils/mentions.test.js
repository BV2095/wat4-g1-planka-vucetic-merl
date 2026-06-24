import { mentionTextToMarkup, mentionMarkupToText } from './mentions';

// Owner: Vučetić — parametrized unit tests (test.each)
describe('mentions', () => {
  const userByUsername = {
    john: { username: 'john', id: '42' },
  };

  test.each([
    ['hi @john', 'hi @[john](42)'], // known mention -> markup
    ['hi @bob', 'hi @bob'], // unknown mention left untouched
  ])('mentionTextToMarkup(%j) === %j', (input, expected) => {
    expect(mentionTextToMarkup(input, userByUsername)).toBe(expected);
  });

  test.each([
    ['hi @[john](42)', 'hi @john'], // single mention
    ['@[john](42) and @[john](42)', '@john and @john'], // multiple in one string
  ])('mentionMarkupToText(%j) === %j', (input, expected) => {
    expect(mentionMarkupToText(input)).toBe(expected);
  });
});
