require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const problems = require('./data/problems');
const repo = require('./repositories/attemptRepository');
const { validateSubmission } = require('./domain/validation');
const { evaluate } = require('./services/evaluationService');

const app = express();
const PORT = process.env.PORT || 3000;
const root = path.resolve(__dirname, '../..');

/* ── Middleware ──────────────────────────────────────────── */

app.use(express.json({ limit: '250kb' }));

/* ── Helpers ─────────────────────────────────────────────── */

function comparison(problemId) {
  const all = repo
    .byProblem(problemId)
    .filter(a => a.status === 'COMPLETED' && a.evaluation);

  if (all.length < 2) return null;

  const previous = all.at(-2);
  const current = all.at(-1);

  return {
    previousAttemptId: previous.id,
    currentAttemptId: current.id,
    overallDelta: current.evaluation.overall - previous.evaluation.overall,
    criteria: current.evaluation.scores.map(score => ({
      criterion: score.criterion,
      previous:
        previous.evaluation.scores.find(x => x.criterion === score.criterion)
          ?.score ?? 0,
      current: score.score,
      delta:
        score.score -
        (previous.evaluation.scores.find(x => x.criterion === score.criterion)
          ?.score ?? 0),
    })),
  };
}

/* ── API Routes ─────────────────────────────────────────── */

// GET /api/problems
app.get('/api/problems', (_req, res) => {
  res.json(problems);
});

// GET /api/problems/:id
app.get('/api/problems/:id', (req, res) => {
  const p = problems.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Problem not found' });
  res.json(p);
});

// GET /api/problems/:id/attempts
app.get('/api/problems/:id/attempts', (req, res) => {
  res.json(repo.byProblem(req.params.id));
});

// GET /api/problems/:id/comparison
app.get('/api/problems/:id/comparison', (req, res) => {
  res.json(comparison(req.params.id));
});

// GET /api/attempts/:id
app.get('/api/attempts/:id', (req, res) => {
  const a = repo.find(req.params.id);
  if (!a) return res.status(404).json({ error: 'Attempt not found' });
  res.json(a);
});

// POST /api/problems/:id/attempts  —  create attempt + evaluate
app.post('/api/problems/:id/attempts', async (req, res, next) => {
  try {
    const p = problems.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Problem not found' });

    const submission = req.body;
    const errors = validateSubmission(submission);
    if (errors.length) return res.status(422).json({ errors });

    const attempt = repo.create({
      id: crypto.randomUUID(),
      problemId: p.id,
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
      submission,
    });

    repo.update(attempt.id, { status: 'EVALUATING' });

    try {
      const evaluation = await evaluate(p, submission);
      res.status(201).json(
        repo.update(attempt.id, { status: 'COMPLETED', evaluation })
      );
    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(201).json(
        repo.update(attempt.id, {
          status: 'FAILED',
          evaluationError: 'Evaluation could not be completed. Retry it later.',
        })
      );
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/:id/evaluation/retry
app.post('/api/attempts/:id/evaluation/retry', async (req, res, next) => {
  try {
    const attempt = repo.find(req.params.id);
    const p = attempt && problems.find(x => x.id === attempt.problemId);
    if (!attempt || !p) return res.status(404).json({ error: 'Attempt not found' });

    repo.update(attempt.id, { status: 'EVALUATING', evaluationError: null });

    try {
      const evaluation = await evaluate(p, attempt.submission);
      res.json(
        repo.update(attempt.id, { status: 'COMPLETED', evaluation })
      );
    } catch (error) {
      console.error('Evaluation retry error:', error);
      res.status(503).json(
        repo.update(attempt.id, {
          status: 'FAILED',
          evaluationError: 'Evaluation could not be completed. Retry it later.',
        })
      );
    }
  } catch (error) {
    next(error);
  }
});

/* ── Static files ───────────────────────────────────────── */

app.use(express.static(root));

/* ── Error handler ──────────────────────────────────────── */

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(400).json({ error: err.message || 'Request failed' });
});

/* ── Start ──────────────────────────────────────────────── */

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () =>
    console.log(`LLD Practice Platform: http://localhost:${PORT}`)
  );
}

module.exports = app;
