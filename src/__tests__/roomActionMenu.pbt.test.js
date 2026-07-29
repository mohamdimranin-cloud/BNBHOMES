/**
 * Property-based tests for Room Action Menu feature
 * Feature: room-action-menu
 *
 * These tests verify pure-logic properties that do not require DOM rendering.
 * Library: fast-check (https://fast-check.io/)
 */

import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Pure helper functions under test
// These mirror the exact logic implemented in the components/checkout.
// ---------------------------------------------------------------------------

/**
 * Balance formula (CheckOut.jsx / Property 4, 6, 9)
 * finalBalance = netPayable + Σ(extraCharges) - Σ(moneyEntries) - advanceAmount
 */
function computeBalance({ netPayable, extraCharges, moneyEntries, advanceAmount }) {
  const total = (parseFloat(netPayable) || 0)
    + extraCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
    - moneyEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
    - (parseFloat(advanceAmount) || 0);
  return parseFloat(total.toFixed(2));
}

/**
 * Extra-charges amount validation (ExtraChargesDialog.jsx)
 * Returns true when the amount string is valid (non-empty, numeric, > 0).
 */
function isValidExtraChargeAmount(amountStr) {
  if (typeof amountStr !== 'string') return false;
  const trimmed = amountStr.trim();
  if (trimmed === '') return false;
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) return false;
  if (parsed <= 0) return false;
  return true;
}

/**
 * Extension date validation (ExtensionDialog.jsx)
 * Returns true when newDate is strictly after currentCheckOutDate (ISO strings).
 */
function isValidExtensionDate(newDate, currentCheckOutDate) {
  if (!newDate) return false;
  return newDate > currentCheckOutDate;
}

/**
 * Number-of-days recalculation (backend mirrors, verifiable via pure JS)
 * Returns the calendar-day difference between two ISO date strings.
 */
function calcNumberOfDays(checkIn, newCheckOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const ci = new Date(checkIn);
  const co = new Date(newCheckOut);
  return Math.round((co - ci) / msPerDay);
}

/**
 * Checkout button availability (CheckOut.jsx, Property 10)
 * Button is enabled (i.e. NOT disabled) when balance <= 0 OR role === 'admin'.
 */
function isCheckoutEnabled(balance, role) {
  return balance <= 0 || role === 'admin';
}

/**
 * Add Guest required-field validation (AddGuestDialog.jsx, Property 14)
 * Returns { valid: bool, errors: object }
 */
function validateAddGuestForm({ guestName, mobileNo, idType, idNo }) {
  const errors = {};
  if (!guestName || guestName.trim() === '') errors.guestName = 'Guest Name is required.';
  if (!mobileNo || mobileNo.trim() === '') errors.mobileNo = 'Mobile Number is required.';
  if (!idType || idType === '') errors.idType = 'ID Type is required.';
  if (!idNo || idNo.trim() === '') errors.idNo = 'ID Number is required.';
  return { valid: Object.keys(errors).length === 0, errors };
}

// ---------------------------------------------------------------------------
// ISO date helper (YYYY-MM-DD)
// ---------------------------------------------------------------------------
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// A small positive float suitable for monetary amounts (2 dp, max 100,000)
// fc.float requires 32-bit float bounds — use Math.fround to convert
const posAmountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100_000), noNaN: true, noDefaultInfinity: true })
  .map(x => parseFloat(x.toFixed(2)));

// A list of monetary amounts (each entry has .amount)
const amountListArb = fc.array(posAmountArb.map(a => ({ amount: a })), { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Property 9: Checkout balance formula
// Validates: Requirements 5.3
// ---------------------------------------------------------------------------
describe('Property 9: Checkout balance formula', () => {
  it('should equal netPayable + sum(extraCharges) - sum(moneyEntries) - advanceAmount', () => {
    fc.assert(
      fc.property(
        posAmountArb,        // netPayable
        amountListArb,       // extraCharges
        amountListArb,       // moneyEntries
        posAmountArb,        // advanceAmount
        (netPayable, extraCharges, moneyEntries, advanceAmount) => {
          const result = computeBalance({ netPayable, extraCharges, moneyEntries, advanceAmount });

          const expected = parseFloat(
            (
              netPayable
              + extraCharges.reduce((s, c) => s + c.amount, 0)
              - moneyEntries.reduce((s, e) => s + e.amount, 0)
              - advanceAmount
            ).toFixed(2)
          );

          // Allow for floating-point imprecision up to 1 cent
          expect(Math.abs(result - expected)).toBeLessThanOrEqual(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Balance increases by extra charge amount
// Validates: Requirements 2.7, 5.3
// ---------------------------------------------------------------------------
describe('Property 4: Balance increases by extra charge amount', () => {
  it('adding an extra charge increases the balance by exactly that amount', () => {
    fc.assert(
      fc.property(
        posAmountArb,   // netPayable
        amountListArb,  // existing extraCharges
        amountListArb,  // moneyEntries
        posAmountArb,   // advanceAmount
        posAmountArb,   // new charge amount
        (netPayable, extraCharges, moneyEntries, advanceAmount, newCharge) => {
          const before = computeBalance({ netPayable, extraCharges, moneyEntries, advanceAmount });
          const after  = computeBalance({
            netPayable,
            extraCharges: [...extraCharges, { amount: newCharge }],
            moneyEntries,
            advanceAmount,
          });
          expect(Math.abs((after - before) - newCharge)).toBeLessThanOrEqual(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Balance decreases by money entry amount
// Validates: Requirements 3.7, 5.3
// ---------------------------------------------------------------------------
describe('Property 6: Balance decreases by money entry amount', () => {
  it('adding a money entry decreases the balance by exactly that amount', () => {
    fc.assert(
      fc.property(
        posAmountArb,
        amountListArb,
        amountListArb,
        posAmountArb,
        posAmountArb,   // new entry amount
        (netPayable, extraCharges, moneyEntries, advanceAmount, newEntry) => {
          const before = computeBalance({ netPayable, extraCharges, moneyEntries, advanceAmount });
          const after  = computeBalance({
            netPayable,
            extraCharges,
            moneyEntries: [...moneyEntries, { amount: newEntry }],
            advanceAmount,
          });
          expect(Math.abs((before - after) - newEntry)).toBeLessThanOrEqual(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Checkout button availability depends on balance and role
// Validates: Requirements 5.4, 5.5
// ---------------------------------------------------------------------------
describe('Property 10: Checkout button availability', () => {
  it('button is enabled when balance <= 0', () => {
    fc.assert(
      fc.property(
        fc.float({ max: Math.fround(0), noNaN: true, noDefaultInfinity: true }),
        fc.string(),
        (balance, role) => {
          expect(isCheckoutEnabled(balance, role)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('button is enabled for admin regardless of balance', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (balance) => {
          expect(isCheckoutEnabled(balance, 'admin')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('button is disabled when balance > 0 and role is not admin', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100_000), noNaN: true, noDefaultInfinity: true }),
        fc.string().filter(s => s !== 'admin'),
        (balance, role) => {
          expect(isCheckoutEnabled(balance, role)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Extra charges amount validation rejects invalid inputs
// Validates: Requirements 2.4
// ---------------------------------------------------------------------------
describe('Property 2: Extra charges amount validation', () => {
  it('rejects empty or whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s*$/),
        (s) => {
          expect(isValidExtraChargeAmount(s)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-numeric strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() !== '' && isNaN(parseFloat(s))),
        (s) => {
          expect(isValidExtraChargeAmount(s)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects zero and negative numbers', () => {
    fc.assert(
      fc.property(
        fc.float({ max: Math.fround(0), noNaN: true, noDefaultInfinity: true }),
        (n) => {
          expect(isValidExtraChargeAmount(String(n))).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts any positive number', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(100_000), noNaN: true, noDefaultInfinity: true }),
        (n) => {
          expect(isValidExtraChargeAmount(String(n))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Extension date validation rejects non-future dates
// Validates: Requirements 4.4
// ---------------------------------------------------------------------------
describe('Property 7: Extension date validation', () => {
  // Generate a pair of ISO dates where newDate <= currentDate
  const sameOrPastDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .chain(base =>
      fc.date({ min: new Date('2020-01-01'), max: base }).map(earlier => ({
        currentCheckOutDate: toISODate(base),
        newDate: toISODate(earlier),
      }))
    );

  it('rejects dates equal to or before the current checkout date', () => {
    fc.assert(
      fc.property(
        sameOrPastDateArb,
        ({ currentCheckOutDate, newDate }) => {
          expect(isValidExtensionDate(newDate, currentCheckOutDate)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Generate a pair where newDate > currentDate
  const futureDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-30') })
    .chain(base => {
      const minFuture = new Date(base);
      minFuture.setDate(minFuture.getDate() + 1);
      return fc.date({ min: minFuture, max: new Date('2030-12-31') }).map(later => ({
        currentCheckOutDate: toISODate(base),
        newDate: toISODate(later),
      }));
    });

  it('accepts dates strictly after the current checkout date', () => {
    fc.assert(
      fc.property(
        futureDateArb,
        ({ currentCheckOutDate, newDate }) => {
          expect(isValidExtensionDate(newDate, currentCheckOutDate)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Extension recalculates number_of_days correctly
// Validates: Requirements 4.7
// ---------------------------------------------------------------------------
describe('Property 8: Extension recalculates number_of_days', () => {
  it('number_of_days equals the calendar-day difference between check-in and new check-out', () => {
    fc.assert(
      fc.property(
        // check-in date
        fc.date({ min: new Date('2020-01-01'), max: new Date('2029-12-30') }),
        // number of nights (1..365)
        fc.integer({ min: 1, max: 365 }),
        (checkIn, nights) => {
          const checkOut = new Date(checkIn);
          checkOut.setDate(checkOut.getDate() + nights);

          const days = calcNumberOfDays(toISODate(checkIn), toISODate(checkOut));
          expect(days).toBe(nights);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Add Guest required field validation
// Validates: Requirements 7.5
// ---------------------------------------------------------------------------
describe('Property 14: Add Guest required field validation', () => {
  const idTypes = ['Aadhar', 'Passport', 'Driving License', 'Other'];

  it('blocks submission when any required field is empty or whitespace', () => {
    // At least one field is empty/blank
    const withOneBlankArb = fc.record({
      guestName: fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/), fc.string({ minLength: 1 })),
      mobileNo:  fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/), fc.string({ minLength: 1 })),
      idType:    fc.oneof(fc.constant(''), fc.oneof(...idTypes.map(fc.constant))),
      idNo:      fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/), fc.string({ minLength: 1 })),
    }).filter(({ guestName, mobileNo, idType, idNo }) =>
      [guestName, mobileNo, idType, idNo].some(f => !f || f.trim() === '')
    );

    fc.assert(
      fc.property(
        withOneBlankArb,
        (form) => {
          const { valid } = validateAddGuestForm(form);
          expect(valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('passes when all required fields are non-empty', () => {
    const allFilledArb = fc.record({
      guestName: fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
      mobileNo:  fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
      idType:    fc.oneof(...idTypes.map(fc.constant)),
      idNo:      fc.string({ minLength: 1 }).map(s => s.trim()).filter(s => s.length > 0),
    });

    fc.assert(
      fc.property(
        allFilledArb,
        (form) => {
          const { valid } = validateAddGuestForm(form);
          expect(valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
