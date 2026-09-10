const Groq = require('groq-sdk');
const { RUBRIC, calculateOverall } = require('../domain/rubric');

class LLMEvaluator {
  async evaluate(problem, submission) {
    const key = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL || 'qwen/qwen3.8-27b';

    if (!key) {
      throw new Error('LLM_API_KEY is not configured');
    }

    const groq = new Groq({ apiKey: key });

    const schemaDescription = `
Return a JSON object with the following structure:
{
  "scores": [
    {
      "criterion": "string — the rubric criterion name",
      "score": integer 0-5,
      "evidence": "string — cite specific submission evidence",
      "concern": "string — note any concern or trade-off",
      "suggestion": "string — concrete actionable suggestion",
      "confidence": number 0-1
    }
  ],
  "strengths": ["string — top strengths"],
  "improvements": ["string — areas to improve"],
  "nextStep": "string — single most important next action"
}

The scores array must have exactly 6 entries, one per rubric criterion in order.`;

    const prompt = [
      'You are an exacting LLD mentor.',
      'Do not assume one canonical design.',
      'Judge only what the learner submitted; never invent classes or behavior.',
      'Cite submission evidence, distinguish trade-offs from flaws, and give concrete suggestions.',
      schemaDescription,
      `Rubric weights: ${RUBRIC.map(r => `${r.criterion} ${r.weight}%`).join(', ')}.`,
      `Problem: ${JSON.stringify(problem)}.`,
      `Learner submission: ${JSON.stringify(submission)}`,
    ].join('\n');

    const chatCompletion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an LLD evaluation assistant. Respond only with valid JSON matching the requested schema. No markdown, no explanation — just the JSON object.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = chatCompletion.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      throw new Error('LLM returned invalid JSON');
    }

    if (!Array.isArray(result.scores) || result.scores.length !== RUBRIC.length) {
      throw new Error(
        `LLM response did not match rubric: expected ${RUBRIC.length} scores, got ${result.scores?.length ?? 0}`
      );
    }

    result.scores = result.scores.map((s, i) => ({
      ...s,
      criterion: RUBRIC[i].criterion,
      weight: RUBRIC[i].weight,
    }));

    return {
      ...result,
      overall: calculateOverall(result.scores),
      provider: `LLM · ${model}`,
    };
  }
}

module.exports = { LLMEvaluator };
