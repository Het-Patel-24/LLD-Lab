const RUBRIC = [
  { criterion: 'Requirement Understanding', weight: 15 },
  { criterion: 'Class Responsibilities', weight: 25 },
  { criterion: 'Encapsulation & Abstraction', weight: 15 },
  { criterion: 'Coupling & Cohesion', weight: 15 },
  { criterion: 'Extensibility', weight: 20 },
  { criterion: 'Edge Cases & Testability', weight: 10 },
];

const calculateOverall = (scores) =>
  Math.round(scores.reduce((sum, s) => sum + (s.score / 5) * s.weight, 0));

module.exports = { RUBRIC, calculateOverall };
