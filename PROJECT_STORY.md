## 🌟 Internal AI Assistant

**An embeddable, AI-powered Employee Operations Hub that bridges the gap between static company knowledge and automated real-world actions.**

### 💡 Inspiration
The modern workplace is fragmented. Employees waste countless hours searching through scattered PDF policies or navigating clunky HR portals just to answer simple questions like *"How many leave days do I have left?"* or *"What is the procedure to request sick leave?"*. On the administration side, HR teams are overwhelmed by repetitive inquiries and manual data entry. 

We realized that while LLM-powered chatbots are great at answering questions, they are terrible at **taking action**. We wanted to build something beyond a standard Q&A bot. We envisioned a proactive "Employee Experience (EX) Assistant" that doesn't just tell you the rules, but actively helps you execute them by triggering automated workflows across the tools your company already uses.

### ⚙️ What it does
**Internal AI Assistant** is a complete BaaS (Backend-as-a-Service) solution that provides companies with an intelligent, embeddable widget for their internal websites. 

1. **Anti-Hallucination RAG (Knowledge Base):** Employees can ask any question about company policies. The AI searches an isolated Vector Database and answers *strictly* based on internal documents, guaranteeing 100% accurate, hallucination-free answers.
2. **Action-Oriented Intent Parsing:** When an employee types *"I want to take a day off from Mar 25 to Mar 27 because I'm sick"*, our custom AI router instantly parses the intent, extracts the exact dates and reasons, and triggers a multi-turn confirmation sequence.
3. **Workflow Automation (n8n Integration):** Once confirmed, the assistant talks to **n8n webhooks** to execute real-world actions. It can instantly append the leave request to the HR Google Sheet and generate a ready-to-send draft in Gmail pre-filled with the manager's email.
4. **AI Content Moderation:** A silent shield that actively monitors chat for toxic, spammy, or sensitive data, flags it, and logs it for administrator review.
5. **Multi-Tenant Admin Dashboard:** Companies can sign up, get their unique `clientId`, upload their policy texts to train their isolated AI, configure their manager's email, and monitor all employee interactions and moderation logs—all from a sleek management portal.
6. **Zero-friction Integration:** All of this power is injected into any corporate intranet with a single `<script>` tag.

### 🛠️ How we built it
We adopted a modular, API-first architecture:
* **The Intelligence Layer:** We integrated the **OpenAI API** (`gpt-4o-mini` & `text-embedding-3-small`) to process natural language and generate embeddings.
* **The Memory & Auth Layer:** We utilized **Supabase**. We leveraged **Supabase Auth** for secure Dashboard logins, and **PostgreSQL with `pgvector`** to store document embeddings. We wrote custom RPC functions (`match_documents`) to perform high-speed cosine similarity searches while strictly filtering by `client_id` (enabling our multi-tenant architecture).
* **The Orchestration Layer:** **Express.js (Node.js)** serves as the central nervous system. It handles the API routes, manages stateful conversation sessions, parses sophisticated user intents, and routes them to the correct workflows.
* **The Execution Layer:** We deployed **n8n** to handle the heavy lifting of API integrations. Our Node backend sends structured JSON payloads to n8n webhooks, which then orchestrate the flow of data into Google Sheets and Gmail.
* **The Presentation Layer:** A vanilla **HTML/CSS/JS frontend** using modern Glassmorphism aesthetics ensures a premium, lightweight UI for both the client embeddable widget and the Admin Dashboard.

### 🚧 Challenges we ran into
* **The RAG & Routing Dilemma:** We struggled initially with the AI trying to force general questions into strict workflow forms, or vice-versa. We solved this by developing a dual-layer prompt architecture: an Intent Classifier that confidently distinguishes between "actionable workflows" (like leave requests) and "general inquiries", routing the latter to a highly restrictive, low-threshold Vector Search mechanism.
* **Multi-tenant Data Isolation:** Ensuring Company A's employees never receive answers derived from Company B's policies. Writing optimized Postgres RPCs in Supabase to calculate vector distances while applying row-level SQL filtering was a steep but rewarding learning curve.
* **Preserving Payload Context in n8n:** Moving complex data objects through extensive visual n8n pipelines often resulted in data loss at the final nodes (e.g., Google Sheet appends). We had to dive deep into n8n's expression engine to back-reference origin webhooks securely.

### 🏆 Accomplishments that we're proud of
* Successfully building a fully functioning **Multi-Tenant SaaS platform** from scratch within the hackathon timeframe.
* Achieving a sub-second response time for complex vector searches and LLM summaries.
* Delivering a truly "Actionable AI" that crosses the boundary from the chat window into third-party software (Gmail, Google Sheets) autonomously.

### 📚 What we learned
* **Vector databases** are incredibly powerful but require precise threshold tuning (`match_threshold`) to balance between strict accuracy and conversational flexibility.
* **LLMs are brilliant orchestrators.** By constraining the LLM to output structured JSON (Intent Parsing) rather than just text, you unlock a completely new dimension of programmable software.

### 🚀 What's next for Internal AI Assistant
* **Voice-to-Text Input:** Allowing deskless or frontline workers to request leave simply by holding a mic button on their mobile devices.
* **Expansive Integration Marketplace:** Adding instant n8n templates for Jira (IT Helpdesk ticket creation), BambooHR, and Slack/Teams notifications.
* **Agentic Document Ingestion:** Supporting direct uploads of massive PDF handbooks, utilizing advanced OCR and semantic chunking to build the ultimate, omniscient corporate brain.

***

### 💻 Built with
* `javascript`
* `node.js`
* `express.js`
* `openai`
* `supabase`
* `postgresql`
* `pgvector`
* `n8n`
* `html5`
* `css3`
