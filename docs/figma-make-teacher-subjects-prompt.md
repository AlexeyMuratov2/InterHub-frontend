# Figma Make Prompt: Teacher Dashboard, Subjects

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and teacher schedule / lessons design.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the teacher dashboard.
- Work only on:
  - /dashboards/teacher/subjects
  - /dashboards/teacher/subjects/:id
- Include the add-material modal flow because it is part of the real subject-details page.
- Do not redesign auth.
- Do not redesign dashboard selector.
- Do not redesign administrator dashboard.
- Do not redesign student dashboard.
- Do not redesign teacher schedule / lessons.
- Preserve the already approved teacher-dashboard visual language.

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- restrained, academic, trustworthy
- clean white surfaces
- calm hierarchy
- no startup SaaS styling
- no flashy gradients
- no KPI-dashboard look

Critical product-accuracy rule:
- Do not invent new teacher-subject features.
- Do not invent new routes.
- Do not invent new tabs.
- Do not invent new filters.
- Do not invent new management tools.
- Do not remove any real functionality that already exists on the current teacher Subjects screens.
- If a field exists in backend DTOs but is not actually shown on these teacher Subjects pages, do not surface it in the design.

Very important anti-hallucination rule:
- The teacher Subjects pages are not the same as the teacher Student Groups pages.
- Do not merge these two flows.
- Do not bring student tables, attendance statistics, homework-history dialogs, grade-history dialogs, group leaders, curriculum overview panels, or per-student controls into teacher Subjects.
- Those belong to other teacher routes, not to /dashboards/teacher/subjects.

Examples of real data that exist in DTOs but must NOT be surfaced here because the current teacher Subjects pages do not show them:
- assessments list from TeacherSubjectDetailDto
- offering format
- offering notes
- offering roomName
- offering teacherId
- authorName on course materials
- curriculum courseYear
- curriculum semesterNo as a visible badge
- detailed hours breakdown such as lecture/practice/lab/seminar/self-study
- subject createdAt / updatedAt
- offering createdAt / updatedAt

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake values.
- Example placeholders:
  - [Localized Subject Name]
  - [Subject Code]
  - [Department Name]
  - [Group Code]
  - [Group Name]
  - [Credits]
  - [Total Hours]
  - [Assessment Type]
  - [Subject Description]
  - [Material Title]
  - [Material Description]
  - [File Size]
  - [Uploaded Date]
  - [Offering Label]

Do not fabricate:
- realistic subject names
- realistic department names
- realistic group codes
- realistic descriptions
- realistic filenames
- realistic timestamps

Keep the existing teacher dashboard shell unchanged:
- Dashboard
- Schedule
- Subjects
- Lessons
- Student Groups
- Absence Requests
- Profile

Do not add new navigation items.
Do not create new teacher subpages.

1. Teacher Subjects list page
Design /dashboards/teacher/subjects as the real teacher subject-list page.

1a. Real page structure
This page must keep the current real structure:
- page hero
- error alert area
- semester filter section
- subjects list section

1b. Real page states
Design these states:
- loading
- error alert above the content
- empty subjects list
- populated grid

Do not replace loading with fake skeleton dashboards.
Do not replace error with illustration-heavy empty screens.

1c. Hero
Required content:
- page title for teacher subjects
- short subtitle

Do not add:
- counters
- active groups count
- total materials count
- teacher performance stats

1d. Semester filter section
This section is real and must stay simple.

Required content:
- section card
- section title for Semester
- one labeled semester select

Real behavior to represent:
- selected value is semester number
- current semester is the default when available
- select options come from academic semesters
- option label uses semester name when available
- otherwise fallback is a semester-number label
- empty placeholder option exists

Important restrictions:
- do not add year filter
- do not add chips
- do not add search
- do not add multiple selects
- do not add apply/reset buttons

1e. Subjects list section
Required states:
- loading
- empty
- populated

Populated layout:
- grid of subject cards
- each card opens /dashboards/teacher/subjects/:id

Every subject card must contain only the real fields currently shown:
- localized subject display name
- subject code
- department row
- groups row

Localized subject display name behavior:
- in English/Russian contexts, prefer English name, otherwise Chinese name, otherwise subject code
- in Simplified Chinese context, prefer Chinese name, otherwise English name, otherwise subject code

Department row mapping:
- label + value for department name

Groups row mapping:
- each group display uses:
  - group code
  - group name
- when both exist, display them together in one short string
- multiple groups are joined into one compact comma-separated line

Important restrictions for the subject card:
- do not add semester badge
- do not add course year
- do not add credits
- do not add assessment type
- do not add subject description preview
- do not add materials count
- do not add student count
- do not add schedule preview
- do not add action menus

2. Teacher Subject details page
Design /dashboards/teacher/subjects/:id as the real teacher subject-details page.

This page is not the lesson-management page and not the student-groups page.
Its real scope is:
- subject overview
- course materials for offerings of this subject

2a. Real page states
Design these states:
- loading
- not found / no access
- generic error
- populated state
- no offerings state
- selected offering with no materials
- selected offering with materials
- add-material modal closed/open/error/uploading

2b. Top area
Required structure:
- back link to /dashboards/teacher/subjects
- hero with subject title, subject code, and meta line

Hero content mapping:
- title: localized subject display name
- subtitle: subject code
- meta:
  - department name when available
  - credits when available
  - if both exist, combine them in one compact meta line

Do not add:
- assessment badges in hero
- offerings count in hero
- management toolbar in hero

2c. Subject information section
This section is real and must stay compact.

Required content:
- section card
- info tiles
- optional description block

Only include these real fields that are actually shown on the current page:
- department
- credits
- total hours
- duration
- assessment type

Important duration accuracy rule:
- the current page does not show duration simply as “[X] weeks”
- it renders a week-range style value derived from semesterNo and durationWeeks
- keep the design compatible with that real output
- do not redesign it into a semester badge or generic duration pill

Description block:
- show it only when subject.description exists
- keep it as a calm text block below the info tiles

Important restrictions:
- do not add assessments panel
- do not add curriculum table
- do not add hours breakdown cards
- do not add course-year tile if it is not currently shown
- do not add prerequisites
- do not add grading breakdown

3. Course materials section
This is the main teacher-managed area of the subject-details page.

Required structure:
- section card
- Add material button in the section header when offerings exist
- optional offering selector when multiple offerings exist
- materials list or empty state

3a. Offering-selection behavior
Important real behavior:
- the page works against one selected offering at a time
- when the subject has offerings, the first offering becomes selected by default
- if there is more than one offering, show a single select control
- if there is exactly one offering, do not show the select

Offering selector content:
- each option label uses:
  - groupCode
  - or groupName
  - or offering id fallback

Important restrictions:
- do not redesign offerings as tabs
- do not show offering cards
- do not surface offering format / notes / room in this section

3b. No offerings state
If the subject has no offerings:
- show a simple empty message
- do not show Add material action
- do not invent setup instructions

3c. Empty materials state for selected offering
If the selected offering exists but has no materials:
- show a simple empty message
- show the small Add material action inside the empty state

Do not add:
- recommendations
- example materials
- onboarding checklist

3d. Materials list
For the selected offering, render the real materials list.

Important real-model rule:
- each course material item corresponds to exactly one file
- do not redesign this into a single material item with multiple attachments
- do not group multiple uploaded files into one multi-file material card

Each material card may include only the currently shown fields:
- material title
- meta line with file size and uploaded date
- material description when present
- download action
- delete action

Important restrictions:
- do not show author name
- do not show original filename separately
- do not show file type badges unless they are purely generic decoration
- do not add edit action
- do not add duplicate action

Delete behavior:
- keep delete as a direct destructive action on the material card
- do not invent a complex app-level delete wizard
- do not create new multi-step delete flows specific to Figma

4. Add material modal
This modal is real and must be included in the design.

4a. Modal structure
Required content:
- modal title
- close icon
- optional error alert
- title field
- description field
- multi-file upload area
- cancel action
- add material action

4b. Real validation / enablement rules
The current page supports these real constraints:
- selected offering must exist
- material title is required
- at least one file must be selected
- description is optional

The primary action is disabled until:
- a non-empty material title exists
- at least one file is selected

4c. File upload area
The file area supports:
- drag and drop
- click to upload
- multiple file selection
- showing the selected files list
- removing queued files before submit

Important restrictions:
- do not add file previews
- do not add per-file title fields
- do not add per-file description fields
- do not add tags or categories

4d. Upload behavior accuracy
This part is critical for technical faithfulness.

Real current behavior:
- when submitting, each selected file is uploaded first
- after that, for each uploaded file, a separate course-material record is created
- the same title and description are reused for each selected file

Therefore the design must not imply:
- one course-material record with multiple attachments
- one title per file
- per-file metadata editing during this flow

The design should feel clean, but it must stay compatible with the real implementation model.

4e. Modal states
Design these real states:
- idle
- validation blocked
- upload in progress
- inline upload/create error

On success:
- the modal closes
- the list refreshes
- do not add a new success screen
- do not add celebratory toasts

5. What must not appear anywhere in this iteration
Do not add any of the following:
- student table
- attendance statistics
- homework statistics
- grade statistics
- subject analytics
- assessment schedule
- per-group student management
- group leader badges
- offerings tabs
- schedule preview
- lesson preview
- search
- sort dropdown
- filters other than semester and offering select
- edit material flow
- bulk material delete
- author management
- comments
- subject settings

6. Prototype interactions to include
Support only these real interactions:
- change semester filter
- click a subject card -> open /dashboards/teacher/subjects/:id
- click back link -> return to /dashboards/teacher/subjects
- change selected offering when multiple offerings exist
- open Add material modal
- add files in modal
- remove queued files in modal
- close modal
- submit Add material flow
- download existing material
- trigger delete on existing material

Do not create any other prototype flows.

7. Output expectations
Produce polished desktop and mobile designs for:
- teacher Subjects list page
- teacher Subject details page
- add-material modal
- loading, error, empty, no-offerings, and uploading states

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
