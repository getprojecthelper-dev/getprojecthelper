# Get project Helper

Build a modern SaaS web application called "Project Helper".

PROJECT HELPER is an AI-powered project development workspace designed primarily for students. It helps users take a project from initial idea through planning, requirements, development, testing, documentation, presentation, viva preparation, and final portfolio/showcase.

The platform should support multiple project domains including:

- Software Development

- Data Science

- Machine Learning / AI

- Data Analytics

- Cybersecurity

- Cloud Computing

- Research

- Business / Management

- Mobile Development

- Web Development

- IoT

- Engineering

- Custom Projects

IMPORTANT PRODUCT PRINCIPLE:

Do NOT build this as a generic project-management dashboard with an AI chatbot attached.

The application should be PROJECT-CENTRIC and GUIDE the student through the lifecycle of their specific project.

The system should continuously answer:

1. Where am I in my project?

2. How am I doing?

3. What should I do next?

--------------------------------------------------

CORE USER JOURNEY

--------------------------------------------------

The primary workflow is:

Sign Up

→ Create Project

→ Select Domain

→ Define Objective

→ Generate Project Plan

→ Requirements

→ Research

→ Build

→ Testing

→ Documentation

→ Review

→ Presentation

→ Viva Preparation

→ Portfolio / Showcase

The user should always be able to see their current project stage and recommended next action.

--------------------------------------------------

APPLICATION STRUCTURE

--------------------------------------------------

Create the following main areas:

1. Landing Page

2. Authentication

3. Onboarding

4. Dashboard

5. Project Workspace

6. Project Plan

7. Requirements

8. Tasks

9. Research

10. Build / Development

11. Data / Experiments

12. Testing

13. Documents

14. AI Mentor

15. Project Review

16. Presentation

17. Viva Preparation

18. Portfolio / Showcase

19. Settings

--------------------------------------------------

DESIGN DIRECTION

--------------------------------------------------

Create a premium, modern SaaS interface.

Visual style:

- Clean

- Professional

- Minimal

- Modern

- Technical

- Student-friendly

- High readability

- Strong visual hierarchy

- Spacious layouts

- Subtle animations

- Professional cards

- Clear status indicators

Do NOT make it look like a generic university portal.

Do NOT overuse gradients.

Do NOT overload screens with unnecessary cards.

The interface should feel similar in quality to modern productivity and developer platforms.

Use a responsive design for:

- Desktop

- Laptop

- Tablet

- Mobile

Desktop should be the primary experience.

--------------------------------------------------

GLOBAL NAVIGATION

--------------------------------------------------

Use a left sidebar for the project workspace.

Navigation:

PROJECT

Overview

Plan

Requirements

Tasks

Research

Build

Data / Experiments

Testing

Documents

AI Mentor

Review

Showcase

Account:

Settings

Profile

Logout

The sidebar should clearly indicate the current section.

--------------------------------------------------

LANDING PAGE

--------------------------------------------------

Create a strong landing page.

Hero headline:

"Build Better Projects. From Idea to Final Submission."

Supporting text:

"Plan, build, analyse, document and showcase your academic or personal projects in one intelligent workspace."

Primary CTA:

"Start Your Project"

Secondary CTA:

"Explore How It Works"

Show the complete workflow visually:

IDEA

→ PLAN

→ BUILD

→ TEST

→ DOCUMENT

→ PRESENT

→ SHOWCASE

Add sections explaining:

- Project Planning

- AI Mentor

- Requirements Management

- Development Tracking

- Data Science Support

- Documentation

- Testing

- Portfolio Creation

--------------------------------------------------

AUTHENTICATION

--------------------------------------------------

Create:

- Sign Up

- Login

- Forgot Password

- Logout

Keep authentication UI simple.

Do not ask for unnecessary information during signup.

--------------------------------------------------

ONBOARDING

--------------------------------------------------

After registration, guide the user through:

1. What are you building?

2. Select domain

3. Select project type

4. Academic / Personal / Professional

5. Project deadline

6. Optional project description

7. Optional assignment brief upload

Allow the user to skip optional fields.

--------------------------------------------------

PROJECT CREATION

--------------------------------------------------

Project fields:

- Project Name

- Description

- Domain

- Project Type

- Academic Level

- Deadline

- Status

- Current Stage

- Progress

- Health Score

Allow the user to select a template.

Templates should initially include:

- Software Development

- Data Science / Machine Learning

- Data Analytics

- Cybersecurity

- Research

- Cloud Computing

- Custom Project

--------------------------------------------------

PROJECT DASHBOARD

--------------------------------------------------

The dashboard should be the main control centre.

Display:

Project Name

Current Stage

Progress

Project Health

Deadline

Next Recommended Action

Active Tasks

Overdue Tasks

Major Risks

Recent Activity

Example:

PROJECT:

Flight Delay Prediction

Progress:

72%

Health:

76%

Deadline:

21 days remaining

Current Stage:

Model Evaluation

NEXT RECOMMENDED ACTION:

Complete model evaluation.

Reason:

Testing is currently incomplete and is blocking documentation.

Provide CTA:

"Start Task"

--------------------------------------------------

PROJECT PROGRESS

--------------------------------------------------

Use meaningful project stages:

Planning

Requirements

Research

Development

Testing

Documentation

Review

Presentation

Showcase

Display progress visually.

Do NOT simply allow users to enter arbitrary percentages.

Progress should eventually be calculated from actual project completion.

--------------------------------------------------

PROJECT HEALTH

--------------------------------------------------

Keep Project Progress and Project Health separate.

Example:

Progress: 72%

Health: 61%

Health can consider:

- Overdue tasks

- Unresolved risks

- Testing completion

- Documentation completion

- Deadline pressure

- Requirement completion

For the MVP, use a simple deterministic calculation.

--------------------------------------------------

TASK MANAGEMENT

--------------------------------------------------

Users should be able to:

- Create task

- Edit task

- Delete task

- Assign priority

- Set due date

- Set status

- Add description

- Add dependencies

- Mark complete

Statuses:

Not Started

In Progress

Blocked

Completed

Priorities:

Low

Medium

High

Critical

Display tasks in:

- List

- Kanban

- Timeline where appropriate

--------------------------------------------------

REQUIREMENTS

--------------------------------------------------

Create a requirements management system.

Each requirement should support:

- ID

- Title

- Description

- Type

- Priority

- Status

- Acceptance Criteria

- Related Tasks

- Related Tests

Types:

Functional

Non-Functional

Business

Technical

Example:

FR-01

User Authentication

High

Completed

--------------------------------------------------

TRACEABILITY

--------------------------------------------------

Support the relationship:

Requirement

→ Task

→ Implementation

→ Test

→ Evidence

→ Documentation

Create a visual traceability view where practical.

--------------------------------------------------

PROJECT TEMPLATES

--------------------------------------------------

Templates should generate an initial project workflow.

SOFTWARE DEVELOPMENT:

Requirements

→ Architecture

→ Development

→ Testing

→ Deployment

→ Documentation

DATA SCIENCE:

Problem

→ Dataset

→ Cleaning

→ EDA

→ Feature Engineering

→ Modelling

→ Evaluation

→ Documentation

CYBERSECURITY:

Scope

→ Assets

→ Threat Model

→ Risk Assessment

→ Controlled Testing

→ Findings

→ Mitigation

→ Validation

→ Report

RESEARCH:

Problem

→ Literature Review

→ Research Question

→ Methodology

→ Data Collection

→ Analysis

→ Findings

→ Discussion

→ Conclusion

Allow users to customise templates after creation.

--------------------------------------------------

RESEARCH WORKSPACE

--------------------------------------------------

Allow users to manage:

- Research questions

- Sources

- Notes

- Themes

- Findings

- Project decisions

Documents should be connected to the project.

--------------------------------------------------

DATA / EXPERIMENT WORKSPACE

--------------------------------------------------

For Data Science / ML projects provide:

Dataset

EDA

Experiments

Models

Metrics

Results

Allow users to record:

- Model name

- Dataset

- Experiment name

- Parameters

- Metrics

- Results

- Notes

Do not build a fake ML training system.

This MVP should focus on PROJECT MANAGEMENT and RECORDING ANALYSIS RESULTS.

--------------------------------------------------

TESTING

--------------------------------------------------

Create a testing workspace.

Allow:

- Test cases

- Test status

- Expected result

- Actual result

- Evidence

- Related requirement

Statuses:

Not Run

Passed

Failed

Blocked

Display testing coverage.

--------------------------------------------------

DOCUMENTATION

--------------------------------------------------

Create a document/report workspace.

Default structure:

1. Introduction

2. Literature Review

3. Methodology

4. System Design

5. Implementation

6. Results

7. Discussion

8. Conclusion

9. References

Show completion status for each section.

Example:

Introduction ✓

Literature Review ✓

Methodology ✓

Implementation ◐

Results ○

Discussion ○

Conclusion ○

--------------------------------------------------

AI MENTOR

--------------------------------------------------

Create an AI Mentor interface.

IMPORTANT:

The AI Mentor must be PROJECT-AWARE.

It should eventually understand:

- Project

- Domain

- Requirements

- Tasks

- Documents

- Research

- Experiments

- Testing

- Project progress

- Deadline

The AI should help with:

- Planning

- Explaining concepts

- Breaking tasks into subtasks

- Reviewing work

- Debugging guidance

- Documentation

- Research organisation

- Project review

- Viva preparation

The AI should NOT blindly agree with the student.

It should challenge incorrect assumptions and identify weaknesses.

Example:

Student:

"My model has 96% accuracy so it is excellent."

AI:

"Accuracy alone does not establish that. Check class balance, precision, recall, F1-score and the confusion matrix before concluding that the model performs well."

--------------------------------------------------

AI ACTIONS

--------------------------------------------------

AI suggestions should be actionable.

Examples:

On Task:

"Break into subtasks"

On Requirement:

"Generate acceptance criteria"

On Dataset:

"Identify potential data quality issues"

On Experiment:

"Interpret results"

On Documentation:

"Improve this section"

The AI must not silently modify important project data.

Use confirmation before write actions.

--------------------------------------------------

AI SAFETY

--------------------------------------------------

The AI must:

- Never fabricate project results

- Never invent citations

- Never invent metrics

- Clearly distinguish assumptions

- Admit when information is unavailable

- Respect project permissions

- Never expose other users' project information

Example:

If project accuracy is not recorded:

Correct:

"I don't have a recorded accuracy value."

Incorrect:

"Your model achieved 94% accuracy."

--------------------------------------------------

VIVA PREPARATION

--------------------------------------------------

Create a Viva section.

Allow the AI to generate questions based on the actual project.

Categories:

Project Overview

Technical Decisions

Methodology

Implementation

Results

Limitations

Future Work

Support mock viva conversations.

--------------------------------------------------

PROJECT REVIEW

--------------------------------------------------

Create a final project review dashboard.

Display:

Planning

Requirements

Development

Testing

Documentation

Research

Presentation

Each should have a status.

Show:

Completed

Needs Attention

At Risk

Also show major project risks.

--------------------------------------------------

SHOWCASE

--------------------------------------------------

Create a project showcase area.

Generate/manage:

- GitHub README

- Portfolio Case Study

- CV Project Description

- LinkedIn Project Summary

- Presentation

- Demo information

Only use verified project information.

Do not exaggerate skills or results.

--------------------------------------------------

DATABASE

--------------------------------------------------

Design the application around these entities:

Users

Projects

ProjectTemplates

ProjectStages

Tasks

Requirements

AcceptanceCriteria

ResearchSources

ResearchNotes

Documents

DocumentSections

Experiments

Datasets

Models

Metrics

TestCases

Risks

Milestones

AIConversations

AIContext

Deliverables

PortfolioItems

Maintain proper relationships between entities.

Projects belong to users.

Tasks belong to projects.

Requirements belong to projects.

Documents belong to projects.

Experiments belong to projects.

AI conversations belong to users and projects.

--------------------------------------------------

SECURITY

--------------------------------------------------

Implement proper authorization.

A user must only access their own projects and project-related data.

Never rely on the frontend for authorization.

Backend/database access must enforce ownership.

Protect:

- User data

- Project data

- Uploaded files

- AI conversations

- API credentials

Do not expose API keys in frontend code.

--------------------------------------------------

ERROR STATES

--------------------------------------------------

Every major feature needs:

- Loading state

- Empty state

- Error state

- Success state

Do not show generic "Error 500" messages to users.

Use helpful messages and recovery actions.

--------------------------------------------------

RESPONSIVE DESIGN

--------------------------------------------------

Desktop:

Full sidebar + dashboard.

Tablet:

Collapsible sidebar.

Mobile:

Bottom navigation or collapsible navigation.

Mobile should prioritise:

- Tasks

- AI Mentor

- Progress

- Deadlines

- Notifications

--------------------------------------------------

DESIGN SYSTEM

--------------------------------------------------

Create reusable components for:

Buttons

Cards

Tables

Forms

Badges

Tabs

Modals

Dialogs

Progress Bars

Charts

Sidebar

Navbar

Empty States

Loading States

Notifications

Maintain consistent:

Typography

Spacing

Border Radius

Shadows

Colours

Icons

--------------------------------------------------

IMPORTANT MVP CONSTRAINT

--------------------------------------------------

Do NOT attempt to implement the entire long-term architecture immediately.

Build a strong MVP first.

MVP PRIORITIES:

1. Authentication

2. Project creation

3. Project templates

4. Dashboard

5. Tasks

6. Requirements

7. Project progress

8. Basic research/document management

9. Testing

10. AI Mentor

11. Documentation tracking

12. Project review

13. Showcase

Advanced functionality such as:

- Complex multi-agent AI

- Advanced RAG

- Automated ML training

- Full AWS infrastructure

- Kubernetes

- Advanced analytics

- University integrations

- Marketplace

- Advanced collaboration

should be architected for future expansion but NOT unnecessarily implemented in the first version.

--------------------------------------------------

CODE QUALITY

--------------------------------------------------

Use reusable components.

Avoid duplicated code.

Use clean naming conventions.

Keep business logic separate from UI.

Use proper loading and error handling.

Use typed data structures where possible.

Create maintainable folder structures.

Do not create fake functionality that looks functional but does nothing.

If a feature is not implemented, clearly indicate it as coming soon rather than pretending it works.

--------------------------------------------------

FINAL PRODUCT EXPERIENCE

--------------------------------------------------

The finished MVP should feel like:

"An intelligent project operating system for students."

Not:

"A task manager with ChatGPT."

The central experience should be:

PROJECT

→ PLAN

→ BUILD

→ TEST

→ DOCUMENT

→ REVIEW

→ SHOWCASE

Every feature should support this lifecycle.

I have Added the Image For Homepage

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://getprojecthelper.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/340a8cfe-0ebb-47c8-8fe1-b3be45e9420d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
