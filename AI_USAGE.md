# AI Usage — Engineering Decisions Log

This document records how AI was used during the development of LLD Lab, where the developer (human) actively directed AI decisions to produce a better outcome, and how that collaboration shaped the final MVP.

---

## 1. AI Initially Wrote Raw API Code — Developer Directed Use of Express

**What AI did first:**
When building the backend server, AI generated raw Node.js HTTP code using `http.createServer()` with manual request parsing, URL matching via string splitting, and hand-written response headers. The routing logic was nested inside a single callback with `if/else` chains for each endpoint, and JSON body parsing was done manually with `req.on('data')` / `req.on('end')` event handlers.

**What the developer directed:**
The developer recognized this approach would become unmaintainable as the API surface grew (6+ routes with path parameters) and explicitly directed AI to **use Express.js** instead. This was a deliberate architectural choice — Express provides clean route declarations (`app.get`, `app.post`), built-in JSON body parsing via `express.json()`, middleware composition, and a structured error handling pattern.

**Outcome:**
The final server ([`server/src/index.js`](server/src/index.js)) uses Express v5 with clearly separated route handlers, middleware for JSON parsing, and a centralized error handler. What would have been 200+ lines of brittle manual HTTP parsing became ~160 lines of readable, extensible route definitions.

**Why this matters:**
The developer's direction avoided technical debt at the foundation layer. Express's middleware pattern also made it trivial to later add `express.static()` for serving the frontend and `express.json({ limit: '250kb' })` for payload limits — features that would have required significant custom code with raw HTTP.

---

## 2. AI Made Raw LLM API Calls — Developer Directed Use of Groq SDK

**What AI did first:**
For the LLM-backed evaluation feature, AI initially wrote a raw `fetch()` call to the OpenAI-compatible chat completions endpoint. This involved manually constructing the request body, setting authorization headers, handling streaming vs. non-streaming responses, parsing the JSON response, and extracting the message content from the nested `choices[0].message.content` structure. Error handling was a generic `try/catch` around the fetch with no retry logic or schema validation.

**What the developer directed:**
The developer directed AI to **use the Groq SDK** (`groq-sdk` package) and target **Groq's inference API** specifically. This was a deliberate choice driven by three factors: (1) Groq provides significantly faster inference times compared to standard OpenAI endpoints, which matters for a practice platform where learners expect near-instant feedback; (2) the official SDK handles authentication, request formatting, and response parsing correctly; and (3) Groq's free tier makes the platform accessible without cost barriers.

**Outcome:**
The final LLM evaluator ([`server/src/evaluators/llmEvaluator.js`](server/src/evaluators/llmEvaluator.js)) uses `new Groq({ apiKey })` and `groq.chat.completions.create()` — a clean, typed interface that handles the HTTP layer entirely. The developer's choice of Groq also enabled the use of `response_format: { type: 'json_object' }` for structured JSON output, which is critical for the rubric-based evaluation schema with its 6-criterion scoring format.

**Why this matters:**
The developer's direction eliminated an entire class of bugs (malformed requests, header mismanagement, response parsing edge cases) and selected an infrastructure provider aligned with the product's UX goals (fast feedback loops for learners).

---

## 3. Developer-Directed Architectural Separation Made AI Decisions More Efficient

**What AI initially proposed:**
In the early stages, AI tended to generate monolithic code — mixing validation logic inside route handlers, embedding evaluator logic directly in the submission endpoint, and coupling persistence with evaluation. When asked to add the rule-based fallback evaluator, AI initially proposed adding an `if/else` branch _inside_ the LLM evaluator function itself.

**What the developer directed:**
The developer consistently directed AI to **separate concerns into distinct modules**:
- **Domain layer** (`validation.js`, `rubric.js`) — pure functions, no I/O
- **Evaluators** (`llmEvaluator.js`, `ruleBasedEvaluator.js`) — each behind the same `evaluate(problem, submission)` contract
- **Services** (`evaluationService.js`) — orchestration and evaluator selection
- **Repositories** (`attemptRepository.js`) — persistence isolated from business logic

**How this made AI more efficient:**
Once the developer established this boundary structure, subsequent AI interactions became dramatically more productive. When asking AI to:
- Add the retry endpoint → AI immediately knew to call `evaluationService.evaluate()` rather than duplicating evaluator logic
- Add attempt comparison → AI placed it in the route layer using the existing repository, without touching evaluation
- Fix a validation edge case → AI edited only `validation.js` without risk of side effects elsewhere

The modular structure gave AI **clear, constrained contexts** for each task. Instead of reasoning about the entire codebase, AI could focus on a single file with a well-defined contract. This reduced hallucination, prevented code duplication, and made each AI-generated change smaller and easier to review.

**Why this matters:**
This demonstrates a key insight about human-AI collaboration: **the human's role isn't just to accept or reject AI output, but to establish architectural constraints that make AI's subsequent decisions inherently better**. The developer's upfront investment in module boundaries paid compound returns across every later interaction.

---

## Summary

| Situation | AI's Initial Approach | Developer's Direction | Result |
|---|---|---|---|
| Backend server | Raw `http.createServer()` with manual parsing | Use Express.js | Clean routes, middleware, error handling |
| LLM integration | Raw `fetch()` to OpenAI endpoint | Use Groq SDK targeting Groq API | Type-safe SDK, faster inference, structured JSON output |
| Code organization | Monolithic handlers mixing concerns | Separate domain / evaluators / services / repositories | Each AI task scoped to one module, faster and more accurate output |
