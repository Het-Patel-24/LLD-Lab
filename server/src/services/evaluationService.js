const { LLMEvaluator } = require('../evaluators/llmEvaluator');
const { RuleBasedEvaluator } = require('../evaluators/ruleBasedEvaluator');

async function evaluate(problem, submission) {
  if (process.env.LLM_API_KEY) {
    return new LLMEvaluator().evaluate(problem, submission);
  }
  return new RuleBasedEvaluator().evaluate(problem, submission);
}

module.exports = { evaluate };
