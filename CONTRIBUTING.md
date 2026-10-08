# Contributing to 30 MINUTE

Thank you for your interest in contributing to **30 MINUTE**! We welcome community contributions to challenge topics, code improvements, accessibility enhancements, and design refinements.

---

## 🧭 Code of Conduct

This project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code and foster an inclusive, welcoming environment.

---

## 🛠 Getting Started

### Prerequisites

- **Node.js**: `>=20.0.0`
- **npm**: `>=10.0.0`
- **Git**

### Local Setup

1. Fork the repository on GitHub and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/pitch-scroll.git
   cd pitch-scroll
   ```

2. Install dependencies cleanly:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📚 Contributing New Challenges

We love expanding the challenge catalog! Each challenge represents a real company, architecture, open-source technology, or engineering case study.

### Challenge Requirements

When adding a topic to `data/challenges.ts`, ensure it satisfies the following schema:
- **`title`**: Concise topic name (e.g. `ClickHouse`, `Fly.io`, `Kafka`).
- **`slug`**: URL-safe unique lowercase string (e.g. `clickhouse`).
- **`type`**: One of `Company`, `Startup`, `Product`, `Technology`, `AI`, `Open Source`, `Engineering`, `Business Model`, `Failure`, `Cybersecurity`, `Infrastructure`.
- **`category`**: One of `AI`, `Developer Tools`, `Infrastructure`, `Open Source`, `Consumer Tech`, `Indian Tech`, `Engineering Systems`, `Cybersecurity`, `Failure Cases`, `Business Models`.
- **`difficulty`**: `Easy`, `Medium`, `Hard`, or `Insane`.
- **`description`**: 1–2 sentence summary of what the entity does.
- **`mission`**: A clear prompt explaining what the creator must uncover in 30 minutes.
- **`researchQuestions`**: Exactly 10 progressive questions that guide research from pain point to technical architecture and unit economics.
- **`sources`**: At least 2–4 high-quality primary documentation links, technical blog posts, or architectural writeups.
- **`keywords`**: 4–8 relevant search tags.

---

## 🧪 Verification & Testing

Before submitting a pull request, verify that all test suites and typechecks pass:

```bash
# Run unit and journey tests
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Verify production build
npm run build
```

---

## 🚀 Pull Request Guidelines

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/add-clickhouse-challenge
   ```
2. Commit your changes using conventional commit messages (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`).
3. Push to your fork and submit a PR against `main`.
4. Provide a clear summary of what was added or changed in the PR description.
