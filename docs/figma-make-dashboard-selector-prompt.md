# Figma Make Prompt: Dashboard Selector And Role Shells

Use this as a continuation prompt in the same Figma Make file that already contains the approved auth design. The goal is to extend the existing design, not replace it.

```text
Continue the existing Figma Make project for InterHub.

Important:
- This is a continuation of the current approved auth design.
- Do not redesign the existing auth screens from scratch.
- Preserve the current visual language: light academic theme, restrained university blue and white palette, subtle blue atmospheric background, clean white surfaces, soft shadows, calm typography, serious institutional tone.
- Keep the current logo usage, spacing discipline, card language, input language, and header hierarchy.
- This should feel like the next natural step after the current login flow.

Current design direction to preserve:
- Official university portal, not startup SaaS.
- Serious, minimal, clean, and trustworthy.
- No marketing layout, no illustrations, no consumer-product playfulness.
- No dark mode for this stage.
- No fake analytics, loud charts, exaggerated gradients, or flashy widgets.

Goal for this iteration:
- After login, add a dashboard selection screen.
- Add starter dashboard shells for three role-based dashboards:
  - Administrator
  - Teacher
  - Student
- These dashboards do not need real functionality yet, but they must open and establish the foundation for future screens.

Prototype behavior requirements:

1. Login behavior update
- Keep the current login screen visual design almost unchanged.
- For prototype purposes, the login screen should accept any entered email and any entered password.
- After pressing the main sign-in button, redirect to the dashboard selection screen.
- Do not block the prototype flow with mock account-state logic.
- Keep the forgot password link and the existing footer text.
- Keep the screen serious and compact.

2. Routing and navigation to add
- Login route stays: /login
- After successful login, redirect to: /dashboards
- Dashboard selector route: /dashboards
- Admin shell route: /dashboards/admin
- Teacher shell route: /dashboards/teacher
- Student shell route: /dashboards/student
- From each dashboard shell, provide a visible path back to the dashboard selector, ideally through the user menu or a switch-dashboard action.

3. Dashboard selector screen
Create a new screen that sits between login and the role dashboards.

Purpose:
- Let the user choose which workspace to enter.
- For this prototype, all three dashboard choices should always be visible and available.

Visual requirements:
- This screen should feel like a close relative of the auth experience, but slightly broader and more application-like.
- It can still use the same atmospheric background language.
- Use a wider container than the auth card if needed, but keep the same refined visual DNA.
- Keep the university logo and language switcher visible.
- The tone should remain formal and academic.

Required UI:
- Title: Choose dashboard
- Short description explaining that the user can choose a working area
- Three dashboard cards or panels:
  - Administrator dashboard
  - Teacher dashboard
  - Student dashboard
- Each card should include:
  - role icon or symbol
  - role title
  - 1 short descriptive sentence
  - clear entry action
- Each card should navigate to its corresponding dashboard shell

Content guidance for the three selector cards:
- Administrator dashboard:
  Manage academic structure, users, invitations, and system settings.
- Teacher dashboard:
  Work with schedule, subjects, lessons, groups, and absence requests.
- Student dashboard:
  View schedule, lessons, subjects, requests, and personal profile.

Responsive guidance:
- On desktop, show all three dashboard choices in a balanced row or grid.
- On tablet/mobile, stack them vertically with strong spacing and clear touch targets.

4. Shared foundation for future dashboards
Create a common dashboard shell pattern that all three role dashboards inherit from.

Shared shell structure:
- Left sidebar
- Top header
- Main content area

Shared sidebar requirements:
- University branding with the logo
- Product name / brand name
- Role-specific subtitle
- Navigation list
- Subtle footer or version line

Shared header requirements:
- Current page title
- Language switcher
- User avatar / account menu
- Optional notification placeholder area for future use
- A way to switch dashboards or go back to the selector

Shared content area requirements:
- Clean white or very light panels
- Structured spacing
- Room for future cards, lists, tables, and schedules
- Strong sense of information hierarchy
- Still minimal at this stage

Visual tone for dashboard shells:
- More app-like than the auth screens, but clearly from the same design system
- Slightly denser than auth, but still elegant and uncluttered
- Blue and white should remain dominant
- Use restrained neutral surfaces and subtle borders

5. Administrator dashboard shell
Create a landing shell for /dashboards/admin.

Role tone:
- Structured
- Operational
- Authoritative
- System-management oriented

Sidebar navigation items to show:
- Dashboard
- Departments
- Programs & Curricula
- Groups
- Implementation
- Subjects
- Invitations
- Users
- Settings

Main landing screen guidance:
- Add a clean welcome or overview section
- Add a few non-functional placeholder panels that establish future information architecture
- These can be labeled areas such as:
  - Departments
  - Programs & Curricula
  - Groups
  - Invitations
  - Users
  - Settings
- Do not build full tables or complex data views yet
- Do not invent analytics-heavy admin charts

6. Teacher dashboard shell
Create a landing shell for /dashboards/teacher.

Role tone:
- Academic
- Practical
- Task-oriented
- Calm and efficient

Sidebar navigation items to show:
- Dashboard
- Schedule
- Subjects
- Lessons
- Student Groups
- Absence Requests
- Profile

Main landing screen guidance:
- Add a refined welcome block
- Add non-functional placeholder panels for:
  - Schedule
  - Lessons
  - Subjects
  - Student Groups
  - Absence Requests
- Do not design deep lesson pages yet
- Do not add fake charts unless they are extremely restrained and clearly structural

7. Student dashboard shell
Create a landing shell for /dashboards/student.

Role tone:
- Clear
- Supportive
- Academic
- Slightly lighter in feeling than admin, but still formal and serious

Sidebar navigation items to show:
- Dashboard
- Schedule
- Lessons
- Subjects
- Absence Requests
- Profile

Main landing screen guidance:
- Add a simple welcome or overview block
- Add non-functional placeholder panels for:
  - Schedule
  - Lessons
  - Subjects
  - Absence Requests
  - Profile
- Keep this dashboard approachable, simple, and uncluttered

8. Scope control
For this iteration:
- Do create the selector screen
- Do create the three opening dashboard shell pages
- Do preserve the current auth flow styling
- Do make the pages navigable

Do not do these yet:
- Full dashboard feature implementation
- Detailed data tables
- Real charts and analytics
- CRUD forms
- Schedule details
- Subject detail pages
- Lesson pages
- Settings internals

9. Output expectations
Please update the existing Make project so that:
- the login flow moves into the dashboard selector
- the dashboard selector opens all three role dashboards
- each role dashboard has a polished shell and a believable structural foundation for future expansion
- the whole experience feels like one coherent university portal, not a collection of disconnected screens

Use English UI copy for the mockups if needed, but keep the layouts compatible with Russian and Simplified Chinese expansion.
```
