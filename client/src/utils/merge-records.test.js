import mergeRecords from './merge-records';

// Owner: Merl — 2 unit tests
describe('mergeRecords', () => {
  test('merges fields of records sharing the same id and appends new ones', () => {
    const target = [{ id: 1, a: 1 }];
    const source = [
      { id: 1, b: 2 },
      { id: 2, c: 3 },
    ];

    expect(mergeRecords(target, source)).toEqual([
      { id: 1, a: 1, b: 2 },
      { id: 2, c: 3 },
    ]);
  });

  test('handles the empty edge cases (null target, no sources)', () => {
    const records = [{ id: 1 }];

    // A null target falls back to the source...
    expect(mergeRecords(null, records)).toEqual(records);
    // ...and with no sources the target is returned untouched.
    expect(mergeRecords(records)).toBe(records);
  });
});
