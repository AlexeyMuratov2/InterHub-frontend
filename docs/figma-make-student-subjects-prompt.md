# Figma Make Prompt: Student Dashboard, Subjects

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and student schedule / lessons design.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the student dashboard.
- Work only on the student Subjects area.
- Do not redesign auth.
- Do not redesign dashboard selector.
- Do not redesign teacher dashboard.
- Do not redesign administrator dashboard.
- Do not redesign student schedule, student lessons, or student absence requests.
- Preserve the current approved visual language exactly and extend it carefully.

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- calm, clean, academic, trustworthy
- restrained typography and hierarchy
- white surfaces, subtle blue structure, low visual noise
- no startup SaaS look
- no playful illustrations
- no flashy gradients
- no fake analytics styling

Critical product-accuracy rule:
- Do not invent any new functionality.
- Do not invent any new sections.
- Do not invent any new data fields.
- Do not invent search, filters, sorting, tabs, charts, progress widgets, or actions that do not exist in the real project.
- Do not remove any real information that already exists on the current student Subjects screens.
- If a value is dynamic, use a structured placeholder in square brackets instead of making up a realistic fake value.
- Example placeholder style:
  - [Subject Name]
  - [Subject Code]
  - [Department Name]
  - [Teacher Name]
  - [Semester Name]
  - [Attendance %]
  - [File Name]
- Do not fabricate concrete course names, teacher names, room numbers, percentages, dates, grades, or comments just to make the mockup feel fuller.

This iteration must design only these real student routes and overlays:
- /dashboards/student/subjects
- /dashboards/student/subjects/:offeringId
- modal opened from Homework statistics
- modal opened from Attendance statistics
- modal opened from Total points statistics

Keep the existing student dashboard shell unchanged:
- Dashboard
- Schedule
- Lessons
- Subjects
- Absence Requests
- Profile

Do not add new navigation items.
Do not add new student subpages.

1. Student Subjects list page
Design /dashboards/student/subjects as the real student subject list page.

This page already has this real structure and should keep it:
- page hero
- error alert area
- semester filter section
- subjects list section

1a. Hero
Required hero content:
- page title for Subjects
- short subtitle for the student subjects area

Keep the hero visually aligned with the already approved student dashboard design.
Do not add counters, KPIs, academic score summaries, or welcome banners here.

1b. Error state
The page can show a load error.

Design requirements:
- show one calm error alert above the content sections
- keep the rest of the page structure intact
- do not replace the whole page with an illustration or a blank screen

1c. Semester filter section
This section is real and must stay simple.

Required content:
- section card
- section title for Semester
- one labeled select input for semester filtering

Real behavior to represent:
- the selected value is a semester number
- the current semester is the default when available
- options come from academic semesters
- the option label is semester name when available
- otherwise fallback is a semester-number label
- an empty option exists via placeholder

Important restrictions:
- do not add year picker
- do not add multi-select
- do not add chips
- do not add search inside the select
- do not add apply/reset buttons
- do not add extra filters

1d. Subjects list section
This is the main content area of the page.

Required states to design:
- loading
- load error already visible above
- empty state
- populated grid state

Loading state:
- keep the section card visible
- inside it show a simple loading text / placeholder state
- do not replace with fake skeleton analytics

Empty state:
- keep the section card visible
- show a simple empty message
- do not add suggestions, onboarding flows, or fabricated recommended actions

Populated state:
- show a grid of subject cards
- each card opens /dashboards/student/subjects/:offeringId

Every subject card must contain only the real fields already present in the project:
- localized subject display name as the main title
- subject code
- department row
- teacher row

Localized subject display name behavior:
- in English/Russian contexts, prefer English name, otherwise Chinese name, otherwise subject code
- in Simplified Chinese context, prefer Chinese name, otherwise English name, otherwise subject code
- do not display both language variants at once unless needed for layout testing

Card field mapping:
- main title: [Localized Subject Name]
- code line: [Subject Code]
- department row label + value: [Department Name]
- teacher row label + value: [Teacher Display Name]

Important restrictions for the card:
- do not add attendance percent
- do not add points
- do not add homework count
- do not add schedule preview
- do not add teacher avatar actions
- do not add status chips
- do not add progress bars
- do not add announcements
- do not add bookmarks or favorite buttons

If a real value is missing:
- keep the layout stable
- use a neutral placeholder or dash
- do not invent replacement content

2. Student Subject detail page
Design /dashboards/student/subjects/:offeringId as the real detailed subject page for a student.

This page is informational and read-only except for opening the three history dialogs from statistics cards.

Required page states to design:
- loading
- not found / no access
- generic error
- populated state
- empty teachers section
- empty schedule section
- empty materials section

2a. Top area
Required structure:
- back link to /dashboards/student/subjects
- page hero

Back link:
- simple, clear, aligned with the existing student design system
- do not turn it into breadcrumbs or a large navigation bar

Hero content must include only real fields:
- title: localized subject display name
- subtitle: subject code
- meta line: department name

Do not add:
- semester badge in the hero
- statistics in the hero
- teacher contact actions
- enrollment actions

2b. Subject information section
This section is real and must be shown as structured info tiles or another compact, clean information grid.

Only include these real fields:
- semester number
- course year, only when present
- duration in weeks
- credits, only when present
- total hours, only when present
- offering format, only when present

Offering format must support exactly:
- OFFLINE
- ONLINE
- MIXED

If a field is optional and absent:
- hide that tile
- do not create fake substitute content

Do not add:
- syllabus summary
- prerequisites
- exam date
- curriculum diagram
- department contacts
- assessment breakdown

2c. Teachers section
This section is real and must render the teachers assigned to the offering.

Required states:
- populated list
- empty state

Each teacher card may include only:
- teacher name
- teacher role
- optional teacher position

Teacher role support must include exactly these real role categories:
- MAIN
- LECTURE
- PRACTICE
- LAB
- SEMINAR

If the role is unknown, fall back visually to the default teacher-role presentation.

Do not add:
- email
- phone
- office hours
- profile photo upload
- message button
- meeting button

2d. Weekly schedule section
This section is real, but it is not the big weekly timetable from the schedule page.

Use a compact list or chip layout.

Required states:
- populated list
- empty state

Each schedule item must come only from real slot data:
- day of week
- time range
- lesson type, only when present

Sorting to reflect in the design:
- ordered by day of week
- then by start time

Day support:
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday
- Sunday

Important restrictions:
- do not redesign this section as a calendar grid
- do not add room here
- do not add teacher here
- do not add attendance markers
- do not add join-online-class action

2e. Course materials section
This section is real and must be read-only.

Required states:
- populated list
- empty state

Each material row may include only:
- material title
- material description, when present
- original file name, when file exists
- download action, only when file exists

Do not add:
- upload material
- edit material
- delete material
- material category filters
- preview thumbnails unless they are generic file-row visuals

2f. Your statistics section
This section is real and must contain exactly three statistics cards.

Required statistics:
- Attendance
- Homework
- Total points

Exact data mapping:
- Attendance card: attendance percent, or no-data label when absent
- Homework card: submitted homework count / total homework count
- Total points card: total points

Interaction truth from the real project:
- if studentId exists, these cards are clickable buttons that open dialogs
- if studentId does not exist, these cards are passive display cards

Design requirements:
- show the three cards clearly
- keep them serious and academic
- clickable cards should feel interactive
- passive cards should look read-only

Important restrictions:
- do not add more than three statistics cards
- do not add charts
- do not add breakdown widgets
- do not add semester GPA
- do not add ranking
- do not add progress circles
- do not add attendance trend chart

3. Homework history dialog
This dialog opens from the Homework statistics card on the subject detail page.

It is a read-only history dialog.
It is not a submission form.

Required dialog states:
- loading
- error
- empty
- populated

Required dialog structure:
- modal container
- small hero area
- list of homework history cards

Hero content must include only:
- subject name
- assignments count

Each homework history card may contain only the real fields already used in the project:
- homework title, or untitled fallback
- maximum points, when present
- homework description, when present
- lesson date
- link to lesson details
- submission status
- submitted timestamp, when submission exists
- grade points, when grade exists
- grade type label, when present
- graded timestamp, when grade exists
- teacher comment, when grade description exists
- attached submission file names, when files exist

Submission-state support:
- submitted
- not submitted

Important restrictions:
- do not add submit / resubmit UI here
- do not add file upload UI here
- do not add delete submission UI here
- do not add grade charts
- do not add due dates unless they already exist on this dialog, which they do not

4. Attendance history dialog
This dialog opens from the Attendance statistics card on the subject detail page.

Required dialog states:
- loading
- error
- empty
- populated

Required dialog structure:
- modal container
- small hero area
- chronological lesson list
- expandable notice area only when notices exist

Hero content must include only:
- subject name
- missed count
- submitted absence notices count

Each lesson card may contain only:
- lesson date/time
- attendance badge/status
- lesson topic, when present
- link to lesson details
- notices toggle, only when notices exist

Attendance status support must include exactly:
- PRESENT
- ABSENT
- LATE
- EXCUSED
- UNMARKED

If absence notices exist for a lesson, each notice card may contain only:
- notice type: Absent or Late
- notice status
- reason text, when present
- submitted timestamp
- attachment count, when attachments exist

Important restrictions:
- do not add attendance editing
- do not add approve / reject controls
- do not add file preview gallery
- do not add new absence-request form here
- do not add analytics

5. Grade history dialog
This dialog opens from the Total points statistics card on the subject detail page.

Required dialog states:
- loading
- error
- empty
- populated

Required dialog structure:
- modal container
- small hero area
- chronological list of grade entries

Hero content must include only:
- subject title
- total points

Each grade entry card may include only:
- earned points
- grade type label, when present
- source context: lesson or homework
- homework title, when the entry is homework-based
- homework description, when present
- homework maximum points, when present
- lesson date, when present
- link to lesson details, when possible
- teacher comment / description, when present
- graded-by display name
- graded timestamp

Important restrictions:
- do not add points charts
- do not add grading rubric
- do not add category breakdown visualization
- do not add editable grading
- do not add comparison with classmates

6. Prototype interactions to include
In the prototype, support these real navigation and overlay interactions:
- click a subject card -> open /dashboards/student/subjects/:offeringId
- click Attendance card -> open Attendance history dialog
- click Homework card -> open Homework history dialog
- click Total points card -> open Grade history dialog
- click lesson link inside dialogs -> go to the existing student lesson details route
- click back link -> return to /dashboards/student/subjects

Do not create any other prototype flows.

7. Dynamic placeholder policy
Because this design must transfer cleanly into the real project, all dynamic data should be represented with explicit structured placeholders instead of invented realistic content.

Use placeholders such as:
- [Localized Subject Name]
- [Subject Code]
- [Department Name]
- [Teacher Display Name]
- [Semester Number]
- [Course Year]
- [Duration Weeks]
- [Credits]
- [Total Hours]
- [Format]
- [Lesson Day]
- [Lesson Time]
- [Lesson Type]
- [Material Title]
- [Material Description]
- [Original File Name]
- [Attendance %]
- [Submitted Count]
- [Total Homework Count]
- [Total Points]
- [Homework Title]
- [Lesson Date]
- [Submission Timestamp]
- [Grade Points]
- [Grade Type]
- [Teacher Comment]

Do not replace these with invented domain-specific examples like:
- named professors
- named faculties
- realistic percentages
- specific dates
- fictional file names
- fictional grades

8. What must not appear anywhere in this iteration
Do not add any of the following:
- dashboard-wide analytics
- KPI banners
- charts
- search
- sort dropdowns
- tab systems
- syllabus panels
- announcements
- chat with teacher
- teacher contact actions
- edit subject actions
- edit teacher actions
- add material actions
- attendance marking controls
- grade appeal flow
- homework submission forms on the subject page
- lesson calendar redesign inside Subjects
- performance heatmaps
- recommended resources
- achievements or gamification

9. Output expectations
Produce polished desktop and mobile designs for:
- student Subjects list page
- student Subject detail page
- Homework history dialog
- Attendance history dialog
- Grade history dialog

Preserve the approved student-dashboard visual language.
Keep the layouts implementation-friendly.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
