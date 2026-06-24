import { createStopwatch, getStopwatchParts, formatStopwatch } from './stopwatch';

// Owner: Merl — 4 unit tests
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

  test('a running stopwatch adds the elapsed time on top of the banked total', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      // Started "now" with one minute already banked.
      const running = { startedAt: new Date(), total: 60 };

      // Let an hour, a minute and five seconds pass on the (fake) clock.
      jest.advanceTimersByTime((3600 + 60 + 5) * 1000);

      // 60s banked + 3665s elapsed = 3725s = 1:02:05.
      expect(getStopwatchParts(running)).toEqual({ hours: 1, minutes: 2, seconds: 5 });
      expect(formatStopwatch(running)).toBe('1:02:05');
    } finally {
      jest.useRealTimers();
    }
  });
});
