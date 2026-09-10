# LLD Lab — Low-Level Design Practice Platform

> **Deliberate design practice.** Pick a problem, structure your design, get rubric-graded feedback, retry, and track your progress.

LLD Lab is a focused web application that helps software engineers practice Low-Level Design (LLD) skills through a structured, feedback-driven loop. Instead of comparing against a single "correct" reference solution, it evaluates _your_ design decisions using a weighted rubric and cites evidence from what you actually submitted.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Problem Library** | Three curated LLD problems (Parking Lot, Elevator System, Vending Machine) with requirements, constraints, and design prompts |
| **Structured Design Workspace** | Guided form capturing assumptions, classes with responsibilities, relationships, design rationale, and optional code |
| **AI-Powered Evaluation** | LLM-backed rubric evaluation via Groq (Qwen 3.8-27B) that cites specific evidence from your submission |
| **Deterministic Fallback** | Transparently labeled rule-based evaluator when no API key is configured — never fakes AI feedback |
| **6-Criterion Rubric** | Requirement Understanding (15%), Class Responsibilities (25%), Encapsulation & Abstraction (15%), Coupling & Cohesion (15%), Extensibility (20%), Edge Cases & Testability (10%) |
| **Attempt History & Comparison** | View past submissions, track scores over time, and see criterion-by-criterion deltas between attempts |
| **Persist-Before-Evaluate** | Submissions are durably saved _before_ evaluation begins — a failed LLM call never loses your work |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (SPA)                         │
│  index.html + app.js + style.css                        │
│  Hash router · Fetch API · No framework dependencies    │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API (/api/*)
┌────────────────────────▼─────────────────────────────────┐
│                  Express Server                          │
│  server/src/index.js                                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Domain     │  │   Services   │  │  Repositories   │ │
│  │ validation   │  │  evaluation  │  │  attemptRepo    │ │
│  │ rubric       │  │  Service     │  │  (JSON file)    │ │
│  └─────────────┘  └──────┬───────┘  └─────────────────┘ │
│                          │                               │
│            ┌─────────────┴──────────────┐                │
│            ▼                            ▼                │
│  ┌─────────────────┐        ┌───────────────────┐        │
│  │ LLM Evaluator   │        │ Rule-Based        │        │
│  │ (Groq SDK)      │        │ Evaluator         │        │
│  └─────────────────┘        └───────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Evaluator boundary**: Evaluation is isolated behind an `evaluate(problem, submission)` contract. The `LLMEvaluator` and `RuleBasedEvaluator` are interchangeable — the practice flow never knows which one ran.
- **Structured submission**: Instead of free-text or a diagram editor, the form captures named classes, responsibilities, and relationships — making designs machine-evaluable and comparable across attempts.
- **Persist-first lifecycle**: `SUBMITTED → EVALUATING → COMPLETED | FAILED`. The submission is saved before any external call, so a Groq timeout or schema error cannot destroy learner work.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or later
- **Groq API key** (optional — the platform works without one using the rule-based fallback)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd LLD-Learner

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
PORT=3000
LLM_API_KEY=gsk_your_groq_api_key_here    # Optional: enables LLM evaluation
LLM_MODEL=qwen/qwen3.8-27b                # Optional: defaults to qwen/qwen3.8-27b
```

Without `LLM_API_KEY`, the platform uses a transparently labeled **rule-based fallback evaluator**.

### Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test

```bash
npm test
```

Runs domain-level tests (validation rules, rubric score calculation) using Node's built-in test runner.

---

## 🗂️ Project Structure

```
LLD Learner/
├── index.html                          # Entry point — single-page app shell
├── app.js                              # Frontend SPA (hash router, API calls, rendering)
├── style.css                           # Full stylesheet (DM Sans + Instrument Serif)
├── package.json                        # Dependencies: express, groq-sdk, dotenv
├── .env                                # Environment config (gitignored)
├── .gitignore
│
├── server/
│   ├── src/
│   │   ├── index.js                    # Express server, routes, middleware
│   │   ├── data/
│   │   │   └── problems.js             # Seeded problem definitions
│   │   ├── domain/
│   │   │   ├── validation.js           # Structural submission validation
│   │   │   └── rubric.js               # Rubric criteria, weights, score calculation
│   │   ├── evaluators/
│   │   │   ├── llmEvaluator.js         # Groq SDK-based LLM evaluation
│   │   │   └── ruleBasedEvaluator.js   # Deterministic fallback evaluator
│   │   ├── services/
│   │   │   └── evaluationService.js    # Routes to LLM or rule-based evaluator
│   │   └── repositories/
│   │       └── attemptRepository.js    # JSON file-based persistence
│   ├── data/
│   │   └── db.json                     # Runtime data store (gitignored, auto-created)
│   └── test/
│       └── domain.test.js              # Validation and rubric unit tests
│
├── DESIGN.md                           # Architecture and domain model notes
├── RESEARCH.md                         # Research notes on the problem space
└── AI_USAGE.md                         # AI-assisted engineering decisions log
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems` | List all design problems |
| `GET` | `/api/problems/:id` | Get a single problem by ID |
| `GET` | `/api/problems/:id/attempts` | List all attempts for a problem |
| `GET` | `/api/problems/:id/comparison` | Compare latest two completed attempts |
| `GET` | `/api/attempts/:id` | Get a single attempt with submission and evaluation |
| `POST` | `/api/problems/:id/attempts` | Submit a design for evaluation |
| `POST` | `/api/attempts/:id/evaluation/retry` | Retry a failed evaluation |

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Vanilla HTML / CSS / JS | Zero dependencies, fast iteration, no build step |
| **Backend** | Express.js (v5) | Clean REST routing, middleware ecosystem |
| **LLM Integration** | Groq SDK + Qwen 3.8-27B | Fast inference, structured JSON output, free tier available |
| **Persistence** | JSON file (`db.json`) | No database setup for MVP; trivially replaceable with PostgreSQL |
| **Testing** | Node built-in test runner | No test framework dependency |
| **Typography** | DM Sans + Instrument Serif (Google Fonts) | Modern, editorial feel |

---

## 🔮 Limitations & Next Steps

**Current MVP limitations:**
- Single-user — no authentication or multi-user isolation
- File-based persistence (not production-grade)
- No UML/diagram editor — text-based structured input only
- Three seeded problems (no admin panel to add more)
- No code execution or compilation

**Planned production enhancements:**
- PostgreSQL for durable multi-user storage
- User authentication and session management
- Admin panel for problem management
- Code execution sandbox for optional code submissions
- Analytics dashboard for learning trends
- Additional evaluator providers (OpenAI, Anthropic)

---

## 📄 License

This project was built as an MVP for LLD practice and learning purposes.
