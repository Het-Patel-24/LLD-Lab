const { RUBRIC, calculateOverall } = require('../domain/rubric');

const suggestions = [
  'State which requirements and trade-offs drive your classes.',
  'Give each class one reason to change; separate allocation, pricing, or state behavior.',
  'Hide mutable state and use small interfaces at changing boundaries.',
  'Describe ownership and keep collaboration directional where possible.',
  'Put likely change points behind a policy, strategy, or interface.',
  'Name failure states, boundary cases, and unit-test seams.',
];

class RuleBasedEvaluator {
  async evaluate(_problem, s) {
    const text = `${s.assumptions} ${s.explanation} ${s.relationships} ${s.classes
      .map(c => Object.values(c).join(' '))
      .join(' ')}`.toLowerCase();

    const signals = [
      s.assumptions.length > 30,
      s.classes.length >= 3,
      s.classes.some(c => c.methods),
      s.relationships.length > 15,
      /strategy|interface|abstract|factory|observer|policy/.test(text),
      /edge|error|invalid|full|empty|test|concurrent/.test(text),
    ];

    const scores = RUBRIC.map((r, i) => {
      const score = signals[i]
        ? i === 1 && s.classes.length >= 5
          ? 5
          : 4
        : 2;

      return {
        ...r,
        score,
        evidence: signals[i]
          ? `Submission includes explicit evidence for ${r.criterion.toLowerCase()}.`
          : 'The submission has limited explicit evidence for this criterion.',
        concern: signals[i]
          ? 'No major concern identified; make this decision explicit as the design evolves.'
          : 'This area needs more explicit design reasoning.',
        suggestion: suggestions[i],
        confidence: signals[i] ? 0.82 : 0.72,
      };
    });

    return {
      overall: calculateOverall(scores),
      scores,
      strengths: scores
        .filter(x => x.score >= 4)
        .map(x => x.criterion)
        .slice(0, 3),
      improvements: scores
        .filter(x => x.score < 4)
        .map(x => x.criterion)
        .slice(0, 3),
      nextStep:
        scores.find(x => x.score < 4)?.suggestion ||
        'Refine one responsibility boundary, then retry.',
      provider: 'Local rule-based fallback',
    };
  }
}

module.exports = { RuleBasedEvaluator };
