/* ── LLD Practice Platform — Frontend ────────────────────── */

const $ = (s) => document.querySelector(s);
const app = $('#app');
let ps = [];

/* ── API helpers ─────────────────────────────────────────── */

const api = {
  g: (p) => fetch('/api' + p).then((r) => r.json()),

  p: (p, x) =>
    fetch('/api' + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: x && JSON.stringify(x),
    }).then(async (r) => {
      let data = await r.json();
      if (!r.ok) throw data;
      return data;
    }),
};

/** Escape HTML entities to prevent XSS */
const E = (x) =>
  String(x || '').replace(
    /[&<>]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]
  );

/** Find a problem by id from the cached list */
const P = (id) => ps.find((x) => x.id === id);

/* ── Router ──────────────────────────────────────────────── */

async function route() {
  ps = await api.g('/problems');
  let [, v, id] = location.hash.slice(1).split('/');

  if (v === 'problem') return detail(id);
  if (v === 'practice') return practice(id);
  if (v === 'feedback') return feedback(id);
  if (v === 'attempt') return attempt(id);
  if (v === 'history') return history();
  return library();
}

/* ── Pages ───────────────────────────────────────────────── */

function library() {
  app.innerHTML = `
    <section class="hero">
      <div class="eyebrow">Deliberate design practice</div>
      <h1>Build better systems,<br><i>one decision at a time.</i></h1>
      <p>Turn an LLD prompt into a structured design, then get focused rubric
      feedback you can use in your next attempt.</p>
    </section>
    <section class="grid">
      ${ps
        .map(
          (p) => `
        <article class="card">
          <span class="pill">${p.difficulty}</span>
          <h2>${p.title}</h2>
          <p>${p.description}</p>
          <a class="button" href="#/problem/${p.id}">View problem</a>
        </article>`
        )
        .join('')}
    </section>`;
}

async function detail(id) {
  let p = P(id);
  let as = await api.g(`/problems/${id}/attempts`);

  app.innerHTML = `
    <a class="back" href="#/">← All problems</a>
    <section class="detail">
      <span class="pill">${p.difficulty}</span>
      <h1>${p.title}</h1>
      <p class="muted">${p.description}</p>

      <div class="section">
        <h2>The challenge</h2>
        <p>${p.statement}</p>
      </div>

      <div class="section">
        <h2>Requirements</h2>
        <ul>${p.requirements.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="section">
        <h2>Constraints</h2>
        <ul>${p.constraints.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="section">
        <h2>What to consider</h2>
        <ul>${p.consider.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      ${
        as.length
          ? `<div class="callout">${as.length} saved attempts. Latest score: <b>${as.at(-1).evaluation?.overall ?? 'pending'}</b>.</div>`
          : ''
      }

      <a class="button" href="#/practice/${id}">Start practice</a>
    </section>`;
}

/* ── Practice form ───────────────────────────────────────── */

const card = () => `
  <div class="class-card">
    <button type="button" class="remove">×</button>
    <label>Class name<input class="n" placeholder="ParkingLot"></label>
    <label>Responsibility<textarea class="r"></textarea></label>
    <details>
      <summary>Attributes and methods (optional)</summary>
      <textarea class="a"></textarea>
      <textarea class="m"></textarea>
    </details>
  </div>`;

function add() {
  let d = document.createElement('div');
  d.innerHTML = card();
  let c = d.firstElementChild;
  $('#classes').append(c);
  c.querySelector('.remove').onclick = () => c.remove();
}

function practice(id) {
  let p = P(id);

  app.innerHTML = `
    <a class="back" href="#/problem/${id}">← Back to problem</a>
    <div class="form-layout">
      <form class="panel" id="f">
        <div class="eyebrow">Design workspace</div>
        <h1 class="page-title">${p.title}</h1>

        <div class="form-section">
          <h2>1. Requirements & assumptions</h2>
          <textarea name="assumptions"></textarea>
        </div>

        <div class="form-section">
          <h2>2. Classes</h2>
          <div id="classes"></div>
          <button class="secondary" type="button" id="add">+ Add class</button>
        </div>

        <div class="form-section">
          <h2>3. Relationships</h2>
          <textarea name="relationships"></textarea>
        </div>

        <div class="form-section">
          <h2>4. Design explanation</h2>
          <textarea name="explanation"></textarea>
        </div>

        <div class="form-section">
          <h2>5. Optional code</h2>
          <textarea name="code"></textarea>
        </div>

        <div id="errors"></div>
        <button>Submit for evaluation</button>
      </form>

      <aside class="panel sticky">
        <h3>Submission checklist</h3>
        <ul class="checklist">
          <li>State assumptions</li>
          <li>Name responsibilities</li>
          <li>Explain relationships</li>
          <li>Consider edge cases</li>
        </ul>
        <p class="muted">The server saves your design before evaluation.</p>
      </aside>
    </div>`;

  add(); // start with one class card
  $('#add').onclick = add;
  $('#f').onsubmit = (e) => submit(e, id);
}

async function submit(e, id) {
  e.preventDefault();

  let s = Object.fromEntries(new FormData(e.target));
  s.classes = [...document.querySelectorAll('.class-card')].map((c) => ({
    name: c.querySelector('.n').value.trim(),
    responsibility: c.querySelector('.r').value.trim(),
    attributes: c.querySelector('.a').value.trim(),
    methods: c.querySelector('.m').value.trim(),
  }));

  app.innerHTML =
    '<div class="empty"><div class="eyebrow">Evaluation in progress</div><h2>Reading your design…</h2></div>';

  try {
    location.hash = '#/feedback/' + (await api.p(`/problems/${id}/attempts`, s)).id;
  } catch (x) {
    app.innerHTML = `
      <div class="notice">${E(x.errors?.join(' ') || x.error)}</div>
      <a class="button" href="#/practice/${id}">Return to practice</a>`;
  }
}

/* ── Feedback ────────────────────────────────────────────── */

async function feedback(id) {
  let a = await api.g(`/attempts/${id}`);
  let p = P(a.problemId);

  if (a.status === 'FAILED') {
    app.innerHTML =
      '<div class="notice">Saved, but evaluation failed.</div><button id="retry">Retry evaluation</button>';
    $('#retry').onclick = async () => {
      try {
        await api.p(`/attempts/${id}/evaluation/retry`);
      } catch (e) {
        console.error('Retry failed:', e);
      } finally {
        feedback(id);
      }
    };
    return;
  }

  let e = a.evaluation;

  app.innerHTML = `
    <a class="back" href="#/attempt/${id}">← View submitted design</a>
    <section class="panel">
      <div class="feedback-head">
        <div class="score">
          <b>${e.overall}</b>
          <span>out of 100</span>
        </div>
        <div>
          <div class="eyebrow">Your evaluation</div>
          <h1 class="page-title">Useful feedback,<br>not a verdict.</h1>
          <p class="muted">${e.provider}</p>
        </div>
      </div>

      ${e.scores
        .map(
          (r) => `
        <div class="rubric">
          <div>
            <h3>${r.criterion}</h3>
            <div class="rating">${'●'.repeat(r.score)}${'○'.repeat(5 - r.score)} ${r.score}/5</div>
          </div>
          <div>
            <b>Evidence</b><p>${E(r.evidence)}</p>
            <b>Concern</b><p>${E(r.concern)}</p>
            <b>Suggested move</b><p>${E(r.suggestion)}</p>
          </div>
        </div>`
        )
        .join('')}

      <div class="callout">
        <b>Recommended next step:</b> ${E(e.nextStep)}
      </div>

      <a class="button" href="#/practice/${p.id}">Retry problem</a>
      <a class="button secondary" href="#/history">See all attempts</a>
    </section>`;
}

/* ── Attempt detail ──────────────────────────────────────── */

async function attempt(id) {
  let a = await api.g(`/attempts/${id}`);
  let s = a.submission;
  let p = P(a.problemId);

  app.innerHTML = `
    <a class="back" href="#/history">← Attempt history</a>
    <section class="detail">
      <div class="eyebrow">${p.title}</div>
      <h1>Attempt details</h1>
      <p class="status">${a.status} ${a.evaluation ? `· ${a.evaluation.overall}/100` : ''}</p>

      <div class="section">
        <h2>Assumptions</h2>
        <p>${E(s.assumptions)}</p>
      </div>

      <div class="section">
        <h2>Classes</h2>
        ${s.classes
          .map(
            (c) => `
          <div class="class-card">
            <b>${E(c.name)}</b>
            <p>${E(c.responsibility)}</p>
            <p class="muted">${E(c.attributes)} ${E(c.methods)}</p>
          </div>`
          )
          .join('')}
      </div>

      <div class="section">
        <h2>Relationships</h2>
        <p>${E(s.relationships)}</p>
      </div>

      <div class="section">
        <h2>Explanation</h2>
        <p>${E(s.explanation)}</p>
      </div>

      ${a.evaluation ? `<a class="button" href="#/feedback/${id}">View evaluation</a>` : ''}
    </section>`;
}

/* ── History & comparison ────────────────────────────────── */

async function history() {
  let gs = await Promise.all(
    ps.map(async (p) => ({
      p,
      a: await api.g(`/problems/${p.id}/attempts`),
      c: await api.g(`/problems/${p.id}/comparison`),
    }))
  );

  let all = gs
    .flatMap((g) => g.a.map((a) => ({ ...a, c: g.c })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  app.innerHTML = `
    <div class="hero">
      <div class="eyebrow">Learning record</div>
      <h1>See the decisions<br><i>getting stronger.</i></h1>
    </div>

    <section class="panel">
      ${
        all.length
          ? all
              .map(
                (a) => `
            <div class="attempt">
              <div>
                <b>${P(a.problemId).title}</b>
                <div class="muted">${new Date(a.createdAt).toLocaleString()} · ${a.status}</div>
              </div>
              <div>
                ${a.evaluation ? `<b>${a.evaluation.overall}/100</b>` : ''}
                <a class="button secondary" href="#/attempt/${a.id}">Open</a>
              </div>
            </div>`
              )
              .join('')
          : 'No attempts yet.'
      }
    </section>

    ${gs
      .filter((g) => g.c)
      .map(
        (g) => `
      <section class="panel comparison">
        <div class="eyebrow">${g.p.title}</div>
        <h2>Your progress
          <span class="delta">${g.c.overallDelta >= 0 ? '+' : ''}${g.c.overallDelta} points</span>
        </h2>
        ${g.c.criteria
          .map(
            (r) => `
          <div class="progress-row">
            <span>${r.criterion}</span>
            <b>${r.previous} → ${r.current}</b>
            <span class="delta">${r.delta >= 0 ? '+' : ''}${r.delta}</span>
          </div>`
          )
          .join('')}
      </section>`
      )
      .join('')}`;
}

/* ── Bootstrap ───────────────────────────────────────────── */

window.addEventListener('hashchange', route);
route();
