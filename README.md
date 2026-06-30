<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4e72faf1-a7c0-4ecf-a841-d64355184bcc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
🚀 DueNow — AI Executive Operating System
A Voice-First Intelligent Executive Companion that transforms planning into execution through Explainable AI, Workspace Intelligence™, and Google Workspace Integration.
📌 Project Overview

Modern productivity tools excel at storing information but often leave users responsible for organizing, prioritizing, and deciding what to do next. As a result, students, professionals, researchers, startup founders, and creators spend a significant portion of their time switching between multiple applications, manually planning schedules, searching for documents, and managing deadlines instead of focusing on meaningful work.

DueNow addresses this challenge by introducing a completely new paradigm: an AI Executive Operating System. Rather than functioning as a traditional task manager or chatbot, DueNow acts as an intelligent executive companion that continuously understands the user's work, reasons across multiple data sources, proactively identifies risks, and recommends the most effective actions to maximize productivity.

The system combines Voice-First Interaction, Explainable AI, Workspace Intelligence™, Success Probability™, Submission Readiness™, and deep Google Workspace Integration into a single cohesive platform that transforms fragmented information into clear, actionable decisions.

🎯 Problem Statement

Current productivity ecosystems suffer from several limitations:

Users manually organize tasks, documents, meetings, and deadlines.
Productivity data is fragmented across multiple applications.
AI assistants respond only when asked and rarely understand complete project context.
Existing tools cannot evaluate project readiness or execution quality.
Users often miss deadlines despite using calendars and reminders.
Decision-making remains entirely dependent on the user.

DueNow solves these limitations by introducing an intelligent, context-aware executive assistant capable of proactive planning, reasoning, and execution guidance.

💡 Solution

Instead of acting as another productivity application, DueNow becomes the user's Executive AI Companion.

The platform continuously gathers context from connected workspaces, documents, calendars, tasks, emails, goals, and execution history. Using Explainable AI, it analyzes the user's workload, predicts execution risks, calculates success probabilities, and proactively recommends optimized actions before problems occur.

Rather than simply reminding users about deadlines, the AI explains:

Why a task matters
How it impacts overall success
What should be done next
Which alternative strategies exist
How confidence levels change after every decision

This transforms productivity from passive organization into intelligent execution.

🏗️ System Architecture
                        User
                          │
                          ▼
                Voice / Text Commands
                          │
                          ▼
          Executive Intelligence Engine
                          │
      ┌──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼
Planning AI    Workspace AI   Google Context AI
      │              │              │
      └──────────────┼──────────────┘
                     ▼
          Explainable AI Reasoning
                     │
         Success Probability™ Engine
                     │
          Workspace Health™ Engine
                     │
         Submission Readiness™ Engine
                     │
                     ▼
             Personalized Recommendations
                     │
                     ▼
                 User Dashboard
⚡ Core Innovations
🧠 Executive Intelligence Engine

The central intelligence layer responsible for coordinating all platform services. It gathers context from every module, performs multi-stage reasoning, generates recommendations, explains every decision, and updates all affected systems after execution.

🎙️ Voice-First Interaction

Unlike traditional productivity software that prioritizes manual input, DueNow allows users to interact naturally using voice.

Examples include:

"Prepare my interview schedule."
"Summarize today's emails."
"Analyze my project workspace."
"Create a meeting tomorrow."
"Show my highest priority task."

This enables hands-free productivity while maintaining conversational AI interactions.

📂 Workspace Intelligence™

One of DueNow's most innovative capabilities.

Rather than merely storing uploaded files, the AI understands their semantic meaning and automatically:

Generates summaries
Extracts deadlines
Detects action items
Identifies missing deliverables
Creates related tasks
Evaluates documentation quality
Suggests improvements

Every workspace evolves into an intelligent knowledge environment.

📈 Success Probability™

A proprietary decision-support system that continuously estimates the likelihood of successful task or project completion based on:

Current workload
Time remaining
Dependencies
Workspace organization
Documentation quality
Historical execution performance

Whenever the user modifies plans, the probability is recalculated instantly.

🩺 Workspace Health™

Evaluates project organization by analyzing:

Documentation completeness
Missing files
Project structure
Workspace activity
Task completion
Readiness indicators

The result is presented as a comprehensive health score with actionable recommendations.

✅ Submission Readiness™

Designed specifically for hackathons, research projects, startup pitches, and interviews.

The AI automatically verifies whether essential deliverables exist.

Example:

✔ README

✔ Source Code

✔ Presentation

✘ Demo Video Missing

✘ Architecture Diagram Missing

The system then estimates completion effort and recommends the fastest path toward submission readiness.

🔗 Google Workspace Integration

DueNow seamlessly integrates with multiple Google services while respecting explicit user permissions.

Integrated services include:

Google Calendar
Google Drive
Gmail
Google Docs
Google Slides
Google Tasks
Google Contacts
Google Keep

These services operate as a unified ecosystem, allowing the AI to reason across meetings, emails, documents, tasks, and notes instead of treating them as isolated resources.

🤖 Explainable AI

Unlike many AI systems that provide recommendations without justification, DueNow follows an Explainable AI approach.

Every important recommendation includes:

Reasoning
Context analyzed
Expected impact
Alternative options
Confidence score

This improves transparency and user trust while enabling informed decision-making.

🔄 Intelligent Workflow
User Request
      │
      ▼
Understand Intent
      │
      ▼
Gather Context
(Calendar • Gmail • Drive • Tasks • Workspaces)
      │
      ▼
AI Multi-Stage Reasoning
      │
      ▼
Risk Analysis
      │
      ▼
Success Probability™
      │
      ▼
Recommendation Generation
      │
      ▼
Explainable Decision
      │
      ▼
User Confirmation
      │
      ▼
Execution
      │
      ▼
System Updates
🛠️ Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Web Speech API
Backend
Node.js
Express.js
Firebase Authentication
Cloud Firestore
Firebase Storage
Artificial Intelligence
Google Gemini
Explainable AI Reasoning Pipeline
Executive Intelligence Engine
Workspace Intelligence™
Success Probability™ Algorithms
Integrations
Google Calendar API
Gmail API
Google Drive API
Google Tasks
Google Docs
Google Slides
Google Contacts
Google Keep
🌍 Target Users

DueNow has been designed to support a broad range of users, including:

Students
Professionals
Startup Founders
Researchers
Software Developers
Project Managers
Freelancers
Content Creators

The architecture is modular and scalable, allowing future expansion into enterprise environments.

🚀 Future Vision

The long-term vision for DueNow is to evolve beyond a productivity application into a complete AI Executive Operating System capable of orchestrating an individual's digital workspace across multiple platforms while maintaining transparency, privacy, and explainable decision-making.

Future enhancements include enterprise collaboration, desktop integration, advanced workflow automation, multi-agent orchestration, and deeper AI reasoning capabilities.

⭐ Why DueNow Stands Out

DueNow is not simply another AI chatbot or task management platform.

It represents a shift from passive productivity tools to proactive executive intelligence.

By combining Voice-First Interaction, Workspace Intelligence™, Explainable AI, Success Probability™, Submission Readiness™, and deep Google Workspace integration, DueNow empowers users to spend less time managing work and more time accomplishing it.

Our vision is simple yet ambitious: to build an AI Executive Companion that doesn't just organize work—it understands it, reasons about it, and helps users execute it with confidence.
