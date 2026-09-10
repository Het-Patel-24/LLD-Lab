const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSubmission } = require('../src/domain/validation');
const { calculateOverall } = require('../src/domain/rubric');

test('valid submission passes structural checks', () =>
  assert.deepEqual(
    validateSubmission({
      assumptions: 'A considered assumption.',
      classes: [{ name: 'ParkingLot', responsibility: 'Coordinates parking' }],
      explanation: 'I separated this responsibility.',
      relationships: '',
    }),
    []
  ));

test('invalid structural submission is rejected', () =>
  assert.ok(validateSubmission({ classes: [] }).length));

test('weighted score calculation is deterministic', () =>
  assert.equal(
    calculateOverall([
      { score: 5, weight: 20 },
      { score: 3, weight: 80 },
    ]),
    68
  ));
