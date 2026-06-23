import { createStopwatch, getStopwatchParts, formatStopwatch } from './stopwatch';

// Owner: Merl — 3 unit tests
describe('stopwatch', () => {
  test('createStopwatch converts h/m/s into total seconds', () => {
    expect(createStopwatch({ hours: 1, minutes: 2, seconds: 3 })).toEqual({
      startedAt: null,
      total: 3723,
    });
  });

  test('getStopwatchParts splits total seconds back into h/m/s', () => {
    expect(getStopwatchParts({ startedAt: null, total: 3723 })).toEqual({
      hours: 1,
      minutes: 2,
      seconds: 3,
    });
  });

  test('formatStopwatch zero-pads minutes and seconds', () => {
    expect(formatStopwatch({ startedAt: null, total: 3723 })).toBe('1:02:03');
  });
});
