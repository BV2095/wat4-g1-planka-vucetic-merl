import { mentionTextToMarkup, mentionMarkupToText } from './mentions';

// Owner: Vučetić — 2 unit tests
describe('mentions', () => {
  const userByUsername = {
    john: { username: 'john', id: '42' },
  };

  test('mentionTextToMarkup converts known @mentions and leaves unknown ones', () => {
    expect(mentionTextToMarkup('hi @john', userByUsername)).toBe('hi @[john](42)');
    expect(mentionTextToMarkup('hi @bob', userByUsername)).toBe('hi @bob');
  });

  test('mentionMarkupToText converts markup back to a plain @mention', () => {
    expect(mentionMarkupToText('hi @[john](42)')).toBe('hi @john');
  });
});
