# 🕯️ Lumina: The Cognitive Load Balancer

**Lumina** is an innovative AI research hub designed to distill complexity into clarity. It solves the real-world problem of information overload by synthesizing multiple conflicting sources into a single "Unified Truth," highlighting "Tension Points" where sources disagree, and visualizing the data in an interactive Knowledge Graph.

![Screenshot](https://github.com/mr-mister007/lumina/blob/main/src/Screenshot%20From%202026-03-16%2022-25-42.png)
![Screeshot](https://github.com/mr-mister007/lumina/blob/main/src/Screenshot%20From%202026-03-13%2023-41-43.png)
![Screeshot](https://github.com/mr-mister007/lumina/blob/main/src/Screenshot%20From%202026-03-13%2023-42-22.png)
## 🚀 The Problem & Solution

**The Problem:** Modern research often involves managing dozens of open tabs, each with slightly different or even contradictory information. This lead to high cognitive load and analysis paralysis.

**The Solution:** Lumina acts as a cognitive filter:
1.  **De-duplication:** Automatically merges redundant claims from different sources.
2.  **Conflict Detection:** Flags "Tension Points" where sources provide conflicting data.
3.  **Visual Synthesis:** Maps the relationships between claims in a dynamic Knowledge Graph using `react-flow`.
4.  **Zen UI:** A distraction-free environment focused on clarity and synthesis.

## ✨ Key Features

-   **Multi-Source Synthesis:** Paste snippets from various articles, papers, or notes.
-   **Tension Point Alerts:** Immediate visibility into where your sources disagree.
-   **Interactive Knowledge Graph:** Explore the connections between synthesized facts.
-   **High-Speed AI Processing:** Powered by Gemini 2.5 Flash for rapid analysis.

## 🛠️ Tech Stack

-   **Frontend:** Next.js 16 (App Router), Tailwind CSS, Framer Motion
-   **Visuals:** React Flow (Knowledge Graph), Lucide Icons
-   **Backend:** Node.js API Routes
-   **AI:** Google Gemini 2.5 Flash

## 🚦 Getting Started

### Prerequisites

-   Node.js 18+
-   Google AI Studio API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mr-mister007/lumina.git
    cd lumina
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

*Built for clarity in a world of noise.*
