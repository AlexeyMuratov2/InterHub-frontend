# Figma Make Prompt: Admin Dashboard, Curriculum Subject Filling

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, student dashboard, teacher dashboard, and the earlier administrator dashboard foundations.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the administrator dashboard
- Work only on the curriculum-subject filling flow
- Work only on:
  - /dashboards/admin/programs/curricula/:curriculumId/subjects
  - /dashboards/admin/programs/curricula/:curriculumId/subjects/new
  - /dashboards/admin/programs/curriculum-subjects/:id/edit
- Include the real delete-confirm modal flows that belong to these pages
- Preserve the approved product visual language and extend it into this admin module

Do not redesign in this iteration:
- auth
- dashboard selector
- student dashboard
- teacher dashboard
- admin departments
- admin programs and curricula foundation
- admin subjects master-data module
- admin groups
- admin implementation
- admin invitations
- admin accounts
- admin profile

Important out-of-scope rule for this iteration:
- Do NOT redesign the programs-and-curricula list page itself
- Do NOT redesign the curriculum create page
- Do NOT redesign the curriculum edit page
- Do NOT redesign the admin subjects catalog page
- Do NOT design any implementation pages
- Do NOT design teacher scheduling, lesson generation, slot generation, or implementation tools
- Do NOT create a separate curriculum-subject view page

Real routes that are in scope:
- /dashboards/admin/programs/curricula/:curriculumId/subjects
- /dashboards/admin/programs/curricula/:curriculumId/subjects/new
- /dashboards/admin/programs/curriculum-subjects/:id/edit

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- restrained and academic
- clear data-first hierarchy
- calm white surfaces
- no startup SaaS feel
- no flashy gradients
- no analytics-dashboard styling

Critical product-accuracy rule:
- Do not invent new admin features
- Do not invent new pages
- Do not invent new fields
- Do not invent new filters
- Do not invent new tabs
- Do not invent new workflows
- Do not remove any real functionality that already exists on these screens
- If a backend field exists but is not currently surfaced on these exact pages, do not expose it in the design

Very important anti-hallucination rule:
- This iteration is about filling a curriculum with subjects
- It is not the same as the admin subjects catalog
- It is not the same as the programs-and-curricula foundation page
- It is not the same as the implementation page
- Do not merge these flows
- Do not bring implementation controls, lesson-generation tools, teaching load allocation, semester planning boards, or analytics into this iteration
- Do not redesign the curriculum-subject flow into a spreadsheet app, kanban board, wizard, or multi-tab setup
- Do not add syllabus fields, prerequisites, teacher assignment, attachments, grading rubrics, or publishing workflow

Examples of fields that must NOT be surfaced on these exact screens because the current implementation does not show them here:
- curriculum approvedAt
- curriculum approvedBy
- curriculum notes on the curriculum-subject list page
- program degree level in the curriculum-subject forms
- raw subjectId
- raw assessmentTypeId
- updatedAt on the curriculum-subject edit page
- department data inside the curriculum-subject list or edit page
- subject description as an editable field in the curriculum-subject edit page
- semesterNo as editable on the edit page
- durationWeeks as editable on the edit page
- subject selection as editable on the edit page

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake values
- Example placeholders:
  - [Program Name]
  - [Program Code]
  - [Curriculum Version]
  - [Curriculum Status]
  - [Duration Years]
  - [Subject Code]
  - [Subject Chinese Name]
  - [Subject English Name]
  - [Subject Description]
  - [Course Year]
  - [Semester Number]
  - [Credits]
  - [Duration Weeks]
  - [Hours Total]
  - [Hours Lecture]
  - [Hours Practice]
  - [Hours Lab]
  - [Hours Seminar]
  - [Hours Self Study]
  - [Hours Consultation]
  - [Hours Course Work]
  - [Assessment Type Name]
  - [Created At]
- If you need multiple examples, use numeric suffixes such as [Subject Code 1]

Do not fabricate:
- realistic program names
- realistic curriculum versions
- realistic subject names
- realistic hour counts
- realistic credits
- realistic timestamps

Keep the existing admin dashboard shell unchanged:
- Dashboard
- Departments
- Programs and Curricula
- Groups
- Implementation
- Subjects
- Invitations
- Accounts
- System Settings

Important navigation rule:
- Profile exists in the user menu, not in the left sidebar menu
- Do not add Profile into the main admin sidebar

Do not add new navigation items.
Do not create new admin subpages beyond the real routes listed above.

1. Permission model and access behavior
This is important because the current curriculum-subject flow does not use one single permission pattern on every page.

Real current behavior:
- the curriculum-subject list page supports both editable and view-only states
- the curriculum-subject list page still allows opening the edit route from a row even when the user is view-only, because that edit route also serves as a read-only inspection screen
- the create page does not redirect; when the user lacks edit permission it shows an action-unavailable error page with a back button
- the edit page does not redirect; it renders a view-only informational state with disabled controls and without the delete action

Design expectations:
- support editable state
- support list-page view-only informational state
- support create-page action-unavailable error state
- support edit-page read-only visual state

Important restrictions:
- do not invent permission settings
- do not invent role-management UI
- do not convert the current permission behavior into a different workflow

2. Curriculum subjects list page
Design /dashboards/admin/programs/curricula/:curriculumId/subjects as the real curriculum-filling page.

2a. Real page structure
Required structure:
- breadcrumb
- page title
- page subtitle
- four compact summary stat cards
- optional view-only info alert
- optional error alert
- optional success alert
- toolbar with search, semester filter, add action, and back action
- empty or no-results state
- grouped curriculum-subject sections
- delete confirm modal

2b. Breadcrumb and header
Required breadcrumb pattern:
- Programs & Curricula
- Program page link when program data is available
- Curriculum Subjects current location

Required header content:
- title based on curriculum version
- subtitle combining:
  - program name
  - curriculum duration
  - curriculum status

Important restrictions:
- do not add department name
- do not add notes block
- do not add edit-curriculum action in this header

2c. Real summary cards
This page really has four summary cards and they must stay.

Cards must be exactly:
- Total subjects
- Total credits
- Total hours
- Semesters

Important restriction:
- these are summary cards only
- do not turn them into analytics widgets
- do not add charts, trends, percentages, or comparisons

2d. Real page states
Design these states:
- loading
- not found curriculum
- generic load error
- populated list
- empty because curriculum has no subjects
- empty because current filters returned no results
- success after delete
- delete confirm open
- view-only mode

2e. Toolbar and filters
Required toolbar content:
- one search input
- one semester select filter
- one Add subject button only when editing is allowed
- one Back to program secondary action

Real search matching:
- subject code
- subject chineseName
- subject englishName

Real filter behavior:
- one semester filter only
- options:
  - All semesters
  - Semester 1
  - Semester 2

Important restrictions:
- do not add course-year filter
- do not add assessment-type filter
- do not add sorting dropdown
- do not add pagination
- do not add bulk actions
- do not add export

2f. Empty states
If the curriculum has no subjects at all:
- show the empty icon/state
- show the empty title
- show the empty hint text
- show the Add first subject action only when editing is allowed

If subjects exist but the current search/filter returns none:
- show only the no-results message

2g. Grouped list structure
The populated page is grouped by courseYear plus semesterNo.

Required section structure for each group:
- group heading
- badge-like semester label using course year and semester number
- count of items in the group
- one table under the heading

Important grouping rule:
- do not redesign this as cards-only
- do not redesign this as a giant single flat table

2h. Curriculum subjects table
Table columns must be exactly:
- Code
- Name
- Credits
- Total hours
- Lectures
- Practice
- Assessment
- Actions

Important restriction:
- even though the create/edit forms include more hour fields, the list table does not show all of them
- do not add Lab, Seminar, Self-study, Consultation, or Course work as extra list columns

Row behavior:
- the whole row is clickable
- row click opens /dashboards/admin/programs/curriculum-subjects/:id/edit
- keyboard Enter and Space do the same

Important navigation rule:
- keep row-click behavior even in view-only mode because the edit route is also used as the read-only inspection route

Cell content mapping:
- Code = subjectCode
- Name = chinese name primary line plus english name secondary line when available
- Credits = credits badge
- Total hours = hoursTotal
- Lectures = hoursLecture
- Practice = hoursPractice
- Assessment = assessment type badge

Actions:
- View subject details button
- Edit button only when editing is allowed
- Delete button only when editing is allowed

Action destinations:
- View subject details opens /dashboards/admin/subjects/:subjectId
- Edit opens /dashboards/admin/programs/curriculum-subjects/:id/edit
- Delete opens the shared confirm modal

2i. Delete confirm modal on the list page
This page uses the shared confirm modal.

Required content:
- title
- short destructive-confirm text
- cancel
- destructive confirm

Do not add:
- a second delete step
- inline delete without confirmation
- extra warning drawers

3. Curriculum subject create page
Design /dashboards/admin/programs/curricula/:curriculumId/subjects/new as the real add-subject-to-curriculum form.

3a. Real page states
Design these states:
- loading
- curriculum not found
- action unavailable for non-edit users
- normal empty form
- validation error
- conflict error when this subject already exists in this semester
- subject-or-assessment-type not found error
- forbidden error
- generic create error
- submitting

3b. Breadcrumb and page header
Required breadcrumb pattern:
- Programs & Curricula
- Program page link when available
- Curriculum Subjects link
- Add subject to curriculum current location

Header content:
- page title
- one subtitle line with:
  - program name
  - curriculum version
  - curriculum duration

3c. Real form structure
The create page has three real sections:
- Select subject
- Basic parameters
- Hours distribution

Do not redesign this into tabs or accordion-only navigation.

3d. Select subject section
Required content:
- subject search input
- required subject select
- selected-subject preview card when a subject has been chosen

Real search matching:
- subject code
- subject chineseName
- subject englishName

Subject select behavior:
- one placeholder option
- options filtered by the search input
- option labels show:
  - subject code
  - chinese name
  - english name in parentheses when present

Selected-subject preview behavior:
- appears only when a subject is selected
- shows:
  - subject code
  - chinese name
  - english name when present
  - subject description when present

Important restrictions:
- do not replace this with a modal picker
- do not add table selection
- do not add department info
- do not add curriculum usage info for the subject

3e. Basic parameters section
Fields must be exactly:
- semesterNo select
- courseYear number input
- durationWeeks number input
- assessmentTypeId select
- credits number input

Validation and behavior rules:
- semesterNo is required
- allowed semester values are only 1 or 2
- courseYear is optional
- courseYear input uses numeric constraints but is not locally required
- durationWeeks is required
- durationWeeks must be at least 1
- assessmentTypeId is required
- credits is optional

Assessment type select behavior:
- one placeholder option
- options come from the loaded assessment-type list
- labels use the real display-name logic:
  - translated name for known standard codes
  - otherwise chineseName, then englishName, then code

Important restrictions:
- do not add status
- do not add subject type
- do not add department
- do not add teacher
- do not add grading policy beyond the assessment-type select

3f. Hours distribution section
Fields must be exactly:
- hoursTotal
- hoursLecture
- hoursPractice
- hoursLab
- hoursSeminar
- hoursSelfStudy
- hoursConsultation
- hoursCourseWork

Behavior:
- all hour fields are optional
- numeric inputs only

Important restriction:
- do not add derived totals, formulas, or automatic validation summaries unless directly needed to present the existing fields

3g. Form actions
Required actions:
- Add subject
- Cancel back to /dashboards/admin/programs/curricula/:curriculumId/subjects

4. Curriculum subject edit page
Design /dashboards/admin/programs/curriculum-subjects/:id/edit as the real edit page for one curriculum-subject record.

Important architectural rule:
- there is no separate curriculum-subject view page in the current implementation
- this edit route also serves as the read-only inspection page when the user lacks edit permission
- do not invent an extra view page

4a. Real page states
Design these states:
- loading
- not found
- populated editable page
- populated read-only page
- validation error
- no-changes success state
- update success state
- delete confirm open
- forbidden error
- generic update error
- delete error
- submitting

4b. Breadcrumb and page title
Required breadcrumb pattern:
- Programs & Curricula
- Program page link when available
- Curriculum Subjects link
- Edit curriculum subject current location

Required page title:
- Edit curriculum subject

4c. Read-only subject information card
This page includes a real info card before the editable fields.

Required card structure:
- card header
- card title
- link to subject details
- read-only subject metadata rows

Fields in this card must be exactly:
- Code
- Name
- Semester badge using course year plus semester number
- Duration weeks
- Created At

Important restrictions:
- do not add updatedAt
- do not add subject description here
- do not add department
- do not add curriculum notes

4d. Editable parameters section
The edit page does NOT allow editing every field from the create page.

Only these fields are editable here:
- courseYear
- assessmentTypeId
- credits
- hoursTotal
- hoursLecture
- hoursPractice
- hoursLab
- hoursSeminar
- hoursSelfStudy
- hoursConsultation
- hoursCourseWork

Important restriction:
- subjectId is not editable here
- semesterNo is not editable here
- durationWeeks is not editable here
- do not invent controls for editing those values

4e. View-only behavior on the edit route
When the user cannot edit:
- show the view-only informational alert
- keep the same page structure
- keep the subject information card
- disable all editable inputs and selects
- hide the delete button
- do not redesign this into a separate static detail page

Important restriction:
- preserve the current shape of the page instead of creating a new read-only variant with new sections or actions

4f. Success and no-changes states
This page has two different success-style outcomes and both should be represented:
- successful update
- no changes to save

Do not collapse them into one generic success state.

4g. Footer actions
Required footer area:
- Delete button only when editing is allowed
- Save action
- Secondary back-style action returning to the curriculum-subjects list route

Important restriction:
- do not add duplicate action
- do not add archive action
- do not add separate close action beyond the existing back-style action

4h. Delete confirm modal on the edit page
This page also uses the shared confirm modal.

Required content:
- title
- short destructive-confirm text
- cancel
- destructive confirm

Important restriction:
- use the same delete concept as the list page
- do not invent a different delete workflow here

5. What must not appear anywhere in this iteration
Do not add any of the following:
- implementation page
- lesson generation
- slot generation
- teacher assignment
- analytics cards beyond the four real summary cards on the list page
- charts
- bulk actions
- export
- advanced filters
- pagination controls
- tabs
- separate curriculum-subject view page
- prerequisite trees
- syllabus fields
- attachments
- grading rubrics
- publish/approve workflow
- audit log panels

6. Prototype interactions to include
Support only these real interactions:
- open the curriculum-subjects list from the earlier programs-and-curricula area
- search curriculum subjects
- filter curriculum subjects by semester
- open curriculum-subject edit from a row
- open subject master details from a row action
- open delete confirm from the list
- open create page from Add subject
- search subjects inside the create page
- choose a subject from the select
- show selected-subject preview
- choose semester
- choose assessment type
- fill optional hours and credits
- submit create form
- open edit page
- edit course year, assessment type, credits, and hours
- submit edit form
- show no-changes state on edit when nothing changed
- open delete confirm from the edit page
- return to the curriculum-subjects list

Important prototype restriction:
- keep navigation targets and interaction patterns faithful to the current routes
- do not create extra destination frames for out-of-scope routes

7. Output expectations
Produce polished desktop and mobile designs for:
- curriculum-subjects list page
- curriculum-subject create page
- curriculum-subject edit page
- shared delete confirm modal
- relevant loading, error, empty, success, view-only, read-only, and action-unavailable states

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
Treat this as the curriculum-filling iteration only.
```
