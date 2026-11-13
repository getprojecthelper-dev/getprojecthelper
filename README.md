# Project Helper

**Project Helper** is a student-focused platform that turns a project idea into a complete, portfolio-ready project — with real code files, documentation, and guidance at every step.

Live site: https://www.getprojecthelper.com

## What it does

### For students

- **Guided project creation** — Describe an idea (or pick a problem statement) and the platform plans a full project: roadmap, folder structure, and every file the project needs.
- **Project workspace** — A split-screen builder: the implementation roadmap on one side, a VS Code-style code editor (file tree + editor) on the other. Click **Generate** on any step and the code is written live into the right file in front of you.
- **Real, editable files** — Every project file is saved to your workspace. You can edit code directly in the editor, and your changes are preserved — regeneration never overwrites your edits.
- **Notebooks** — Jupyter notebooks (`.ipynb`) open as readable Python with cell markers, and edits save back as valid notebooks.
- **Three code levels** — Choose how the code is written:
  - **Essential** — simple, readable code for beginners
  - **Intermediate** — clean, modular, professional code
  - **Production** — robust, efficient, real-world engineering
- **AI Mentor** — Ask questions about your project and get help debugging or understanding the code.
- **Documentation & Viva prep** — Generate project documentation, README files, reports, and viva (oral exam) question-and-answer material.
- **Downloads** — Export your finished project as a ZIP.
- **Project domains** — Software Development, Project Management, and Data Science, with dataset recommendations for data projects.
- **Buy projects (store)** — A premade-projects store where complete projects can be purchased (currently locked — "Launching soon").

### Plans & credits

AI usage is metered in credits based on actual model token usage:

| Plan         | Price   | Monthly credits                          | Active projects |
| ------------ | ------- | ---------------------------------------- | --------------- |
| Free         | ₹0      | 100K token-equivalent (one-time welcome) | 1               |
| Starter      | ₹199/mo | 1M token-equivalent                      | 2               |
| Student      | ₹399/mo | 3M token-equivalent                      | 5               |
| Professional | ₹999/mo | 10M token-equivalent                     | 15              |

- Credits settle at real model rates (1,000 input tokens = 1 credit; 1,000 output tokens = 5 credits).
- When credits run out, AI features pause until the next monthly reset or an upgrade.
- Prices adapt to the visitor's region (₹ in India, local currency elsewhere).
- Subscriptions are handled through Paddle checkout with webhook-based activation.

### For admins

An admin panel with a dedicated sidebar:

- **User Info** — registered users, credits used, subscriptions purchased, projects created, newest registrations, redeem codes, heaviest consumers
- **Credits** — credit usage over days/weeks/months and usage broken down by feature
- **Building** — see what users are building and open their projects
- **Token Tracker** — GPT Luna 6 token and cost tracking (internal pricing tool)
- **Premade Project Listing** — manage store listings and open/lock the store
- **Website availability** — switch the public site between live and maintenance mode (admins keep access)

## Tech stack

- **Frontend:** React 19 + TanStack Start (SSR), Tailwind CSS v4, shadcn components
- **Editor:** Monaco (the editor engine behind VS Code), lazy-loaded after hydration
- **Backend:** Lovable Cloud (auth, database, row-level security)
- **AI:** Direct OpenAI integration (GPT Luna 6 model) for the builder, mentor, and PM tools
- **Payments:** Paddle subscriptions
- **Email:** Transactional email via notify.getprojecthelper.com

## Key behaviors

- Users only ever see their own projects; admin views are role-checked server-side.
- Project creation enforces the plan's active-project limit at the database level.
- Credit holds reserve an estimate before a run; settlement charges only actual usage.
- The site can be put in maintenance mode without locking out admins or sign-in.

## Project scope and principles

## Product scope

Students can create and manage projects across domains such as software development, data science, research, business, cybersecurity, cloud, engineering, and custom projects. The product includes:

- A guided project lifecycle and project workspace
- Plans, requirements, tasks, research, build support, testing, documents, review, presentation, and showcase areas
- A project-aware AI mentor
- Documentation and portfolio-oriented project outputs
- Credits and subscription plans for AI usage
- An admin area for operational and availability controls

When adding a feature, keep it connected to a specific project and its lifecycle. Do not add placeholder interactions or make unsupported claims about generated results, citations, metrics, or progress.

## Tech stack

- React 19 with TanStack Start and TanStack Router
- TypeScript
- Tailwind CSS v4 and Radix-based UI primitives
- Drizzle ORM and Postgres-backed Lovable Cloud services
- OpenAI-powered server-side AI features
- Paddle subscriptions
- Bun for package management and scripts
