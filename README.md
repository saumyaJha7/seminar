# CogniAgents — Multi-Agent Student Cognitive Assessment System

An intelligent pair of 4 specialized AI agents coordinating via an **Orchestrator** to design cognitive reasoning items, evaluate student answers with evidence-based diagnosis, and provide personalized growth roadmaps.

Inspired by the original [n8n Multi-Agent Workflow](https://saumyajha07.app.n8n.cloud/form-test/student-assessment) and rebuilt as a custom, high-performance web application with real-time agent workflow visualization and interactive inspection.

---

## 🏗️ Multi-Agent Architecture

```text
               User / Student Input
                        |
                        v
          🧠 Orchestrator Agent (Groq)
                        |
  +---------------------+---------------------+
  |                     |                     |
  v                     v                     v
Agent 1:              Agent 2:              Agent 3:
Assessment Designer   Cognitive Analyzer    Feedback Coach
  |                     |                     |
  +---------------------+---------------------+
                        |
                        v
          🧠 Orchestrator Synthesis
                        |
                        v
     Final Student Cognitive Assessment Report
```

### Agent Roles & Responsibilities

1. **Orchestrator Agent** (`llama-3.3-70b-versatile` on Groq)
   - Coordinates workflow sequencing and passes structured data between specialist agents.
   - Synthesizes findings across all 3 agents into an Executive Cognitive Profile and strategic educator takeaway.

2. **Agent 1: Assessment Designer**
   - Formulates 3 calibrated reasoning questions:
     - **Logical Reasoning** (deductive / conditional logic)
     - **Pattern Recognition** (sequences / geometrical progression)
     - **Problem Solving** (multi-step constraint satisfaction)
   - Calibrates difficulty (Beginner, Intermediate, Advanced) and student grade level.

3. **Agent 2: Cognitive Response Analyzer**
   - Compares student answers and articulated reasoning against expected logical deductions.
   - Identifies whether deductions are sound, partially sound, or flawed.
   - Diagnoses cognitive mechanisms using evidence from student submissions.
   - *Strict Guardrail:* If the student provides only final answers, it does not speculate or pretend to know their internal mental process.

4. **Agent 3: Feedback Coach**
   - Formulates a constructive growth roadmap:
     - Observed Cognitive Strengths.
     - Targeted Areas for Improvement.
     - 3 Actionable Practice Modules with concrete puzzle drills.
   - *Strict Guardrail:* Non-clinical framing without claiming to measure fixed general intelligence.

---

## ⚡ Quick Start

### 1. Configure Your Groq API Key
Open `.env` in the project root and paste your Groq API key:

```env
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

> **Tip:** You can get a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).
> If no API key is supplied, the application automatically runs in **High-Fidelity Simulation Mode** with realistic latency and cognitive responses, so you can test everything right away!

### 2. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌟 Key Features

- **Live Agent Pipeline Visualizer**: See nodes pulse and transition states in real time (Standby → Active → Completed).
- **Inspect Agent Nodes**: Click on any agent card to inspect its exact system prompt, parameters, runtime inputs, and parsed structured JSON outputs.
- **Streaming Live Terminal Console**: Watch logs, thought traces, and action events stream over Server-Sent Events (SSE).
- **One-Click Student Presets**: Test with preset cognitive profiles:
  - *Maya Chen*: High performer with detailed reasoning chains.
  - *Jordan Taylor*: Final answers only (tests Agent 2's evidence guardrail).
  - *Samira Khan*: Intuitive thinker who falls into common heuristic traps.
- **Cognitive Report View**:
  - Composite Cognitive Index (0–100).
  - 4 Dimension scores (Logic, Pattern, Problem-Solving, Reasoning Clarity).
  - Evidence-based question diagnostics.
  - Personalized Coaching Roadmap & Practice Drills.
  - Print / Export PDF & Copy Markdown.
