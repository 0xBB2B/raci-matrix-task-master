# RACI Matrix Task Master

![License](https://img.shields.io/badge/license-MIT-blue.svg)

RACI Matrix Task Master represents a modern approach to task management, specifically designed to clarify roles and responsibilities within teams. By integrating the RACI model (Responsible, Accountable, Consulted, Informed) directly into a Kanban-style board, this tool ensures that every task has clear ownership and communication lines.

Additionally, it leverages AI to help break down high-level project goals into actionable tasks with suggested role assignments.

## Features

- **🛡️ RACI Matrix Integration**: Assign Responsible, Accountable, Consulted, and Informed roles to every task to eliminate ambiguity.
- **📋 Kanban Task Management**: Visualize workflow with Todo, In Progress, Done, and Archived columns.
- **✨ AI-Powered Planning**: Use the built-in AI assistant (powered by Google Gemini) to generate project plans and automatically suggest RACI roles.
- **👥 Team Roster Management**: Easily manage your team members and assign them to roles.
- **🌓 Dark/Light Mode**: Fully supported themes for comfortable viewing in any environment.
- **💾 Local Storage Persistence**: Your data is saved locally in your browser, so you never lose track of your work.
- **📤 Import/Export**: Backup your data to JSON or migrate it to another device.

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (Gemini)
- **Icons**: Heroicons

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd raci-matrix-task-master
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**

    Create a `.env.local` file in the root directory and add your Gemini API key:

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

    > **Note**: The application looks for the API key in `.env.local`. Ensure this file is not committed to version control.

4.  **Run the Development Server**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

## Usage Guide

### Creating Tasks

Click "New Task" to open the creation modal. Fill in the title, description, due date, and assign team members to their respective RACI roles.

### Using AI Assist

Click the "AI Assist" button to open the prompt window. Describe your project (e.g., "Plan a marketing launch for a new coffee brand"), and the AI will generate a list of tasks with suggested roles.

### Managing Roles

- **Responsible (R)**: Those who do the work to achieve the task.
- **Accountable (A)**: The one ultimately answerable for the correct and thorough completion of the deliverable or task (Sign-off).
- **Consulted (C)**: Those whose opinions are sought, typically subject matter experts; and with whom there is two-way communication.
- **Informed (I)**: Those who are kept up-to-date on progress, often only on completion of the task or deliverable; and with whom there is just one-way communication.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
