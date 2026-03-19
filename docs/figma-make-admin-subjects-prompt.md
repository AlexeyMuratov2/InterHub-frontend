# Figma Make Prompt: Admin Dashboard, Subjects, And Assessment Types

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, student dashboard, teacher dashboard, and the earlier administrator dashboard foundations.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the administrator dashboard
- Work only on:
  - /dashboards/admin/subjects
  - /dashboards/admin/subjects/new
  - /dashboards/admin/subjects/:id
  - /dashboards/admin/subjects/:id/edit
  - /dashboards/admin/subjects/assessment-types/new
  - /dashboards/admin/subjects/assessment-types/:id/edit
- Include the real delete-confirm modal flows that belong to these pages
- Preserve the approved product visual language and extend it into this admin module

Do not redesign in this iteration:
- auth
- dashboard selector
- student dashboard
- teacher dashboard
- admin departments
- admin programs and curricula foundation
- admin groups
- admin implementation
- admin invitations
- admin accounts
- admin profile

Important out-of-scope rule for this iteration:
- Do NOT design curriculum-subjects pages here
- Do NOT design implementation pages here
- Do NOT create any new destination screens for:
  - /dashboards/admin/programs/curricula/:curriculumId/subjects
  - /dashboards/admin/programs/curricula/:curriculumId/subjects/new
  - /dashboards/admin/programs/curriculum-subjects/:id/edit
  - /dashboards/admin/implementation
- Do NOT create a separate assessment-type view page
- Do NOT create any extra subject detail tabs

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
- This admin Subjects module is not the same thing as Curriculum Subjects
- This admin Subjects module is also not the same thing as Implementation
- Do not merge these flows
- Do not bring curriculum-subject fill forms, hour-distribution forms, implementation tables, lesson-generation tools, or schedule-management tools into this iteration
- Do not add subject analytics, charts, KPI cards, bulk actions, export, pagination, or advanced filters
- Do not add subject categories, prerequisite trees, syllabi, teacher assignment, semester defaults, active/inactive toggles, archive flows, or attachments
- Do not add credits, total hours, semester, assessment, or curriculum fields into the create/edit forms for subjects themselves
- Do not create any read-only assessment-type details page because the current implementation does not have one

Examples of fields that must NOT be surfaced on these exact screens because the current implementation does not show them here:
- subject internal id on list or view
- raw departmentId on list or view
- assessment type internal id
- assessment type createdAt on the list
- assessment type updatedAt anywhere
- subject credits
- subject total hours
- subject semester
- prerequisite subject ids
- syllabus text
- teacher assignment
- curriculum subject rows as part of the subject create or edit form
- implementation-related fields

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake values
- Example placeholders:
  - [Subject Code]
  - [Subject Chinese Name]
  - [Subject English Name]
  - [Subject Description]
  - [Department Label]
  - [Department Name]
  - [Department Code]
  - [Assessment Type Code]
  - [Assessment Type Display Name]
  - [Is Graded]
  - [Is Final]
  - [Sort Order]
  - [Program Name]
  - [Program Code]
  - [Curriculum Version]
  - [Semester Number]
  - [Credits]
  - [Created At]
  - [Updated At]
- If you need multiple examples, use numeric suffixes such as [Subject Code 1]

Do not fabricate:
- realistic subject names
- realistic assessment type labels
- realistic department names
- realistic program names
- realistic curriculum versions
- realistic timestamps
- realistic credits

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
This is important because the current admin pages support both editable and view-only behavior.

Real current behavior:
- admin dashboard is available to multiple admin-side roles
- some users can view but cannot create, edit, or delete
- list and subject-view pages support a view-only informational state
- direct access to create/edit pages without edit permission redirects back to the subjects list with an action-unavailable notice

Design expectations:
- support editable state
- support view-only informational state on the list page
- support view-only informational state on the subject view page
- support action-unavailable notice state on the list page after redirect

Important restrictions:
- do not invent role-management UI
- do not add permission settings
- do not add a separate read-only assessment-type page
- do not convert the current permission behavior into a different workflow

2. Subjects management list page
Design /dashboards/admin/subjects as the real combined management page.

2a. Real page structure
This page has two real sections on the same page:
- Disciplines section
- Assessment Types section

Required top-level structure:
- page title
- page subtitle
- optional view-only info alert
- optional action-unavailable info alert
- optional error alert
- optional success alert
- disciplines section header
- disciplines section subtitle
- disciplines toolbar
- disciplines table area
- assessment-types section header
- assessment-types section subtitle
- assessment-types toolbar
- assessment-types table area

Important restrictions:
- do not redesign this page into tabs
- do not split it into separate pages
- do not add a single global toolbar for the whole page
- do not add a global create button in the page header

2b. Real page states
Design these states:
- subjects loading
- subjects empty because there are no subjects
- subjects empty because current search returned no results
- subjects populated
- assessment types loading
- assessment types empty because there are no assessment types
- assessment types empty because current search returned no results
- assessment types populated
- generic top-level load error
- success after subject delete
- success after assessment-type delete
- delete-subject confirm modal open
- delete-assessment-type confirm modal open
- view-only mode
- redirected action-unavailable mode

2c. Disciplines section toolbar
Required content:
- one search input
- one create-discipline button only when editing is allowed

Real search matching:
- subject code
- subject chineseName
- subject englishName

Important restrictions:
- do not add filters
- do not add sort controls
- do not add pagination
- do not add export
- do not add bulk actions

2d. Disciplines table
Table columns must be exactly:
- Code
- Chinese Name
- English Name
- Description
- Created At
- Actions

Row behavior:
- the whole row is clickable and opens the subject view page
- keyboard Enter and Space also open the subject view page

Row content mapping:
- Code = subject.code
- Chinese Name = subject.chineseName
- English Name = subject.englishName or dash when absent
- Description = truncated description preview
- Created At = formatted created date
- Actions = row action buttons

Action buttons:
- View
- Edit only when editing is allowed
- Delete only when editing is allowed

2e. Disciplines empty states
If the full subjects list is empty:
- show the empty message
- show the small create action inside the empty state only when editing is allowed

If the search result is empty but the original subjects list is not:
- show only the no-results message

2f. Assessment Types section toolbar
Required content:
- one search input
- one create-assessment-type button only when editing is allowed

Real search matching:
- assessment type code
- assessment type chineseName
- assessment type englishName

Important restrictions:
- do not add filters
- do not add sort dropdowns
- do not add pagination
- do not add bulk actions

2g. Assessment Types table
Table columns must be exactly:
- Code
- Name
- Graded
- Final
- Actions

Row behavior:
- the whole row is clickable
- it opens the assessment-type edit page
- keyboard Enter and Space also open the assessment-type edit page

Important behavior rule:
- there is no dedicated assessment-type view page in the current implementation
- do not invent one
- the only detailed screen for an assessment type in this module is the edit page

Name column behavior:
- show the assessment type display name, not separate chinese and english columns
- for known standard codes, the display name is the translated label for that code
- for non-standard codes, the display name falls back to chineseName, then englishName, then code

Boolean columns:
- Graded = yes or no
- Final = yes or no

Actions:
- Edit
- Delete only when editing is allowed

Important restriction:
- do not add a View action for assessment types

2h. Assessment Types empty states
If the full assessment-type list is empty:
- show the empty message
- show the create action inside the empty state only when editing is allowed

If the search result is empty but the original assessment-type list is not:
- show only the no-results message

2i. Delete confirm modals
The page uses the shared confirm modal for both destructive flows.

Required modal content:
- title
- short confirm text
- cancel
- destructive confirm

Do not add:
- a second delete step
- inline delete without confirmation
- different custom modal logic for each entity

3. Subject create page
Design /dashboards/admin/subjects/new as the real discipline create form.

3a. Real page states
Design these states:
- normal empty form
- validation error
- generic create error
- code-already-exists conflict error
- department-not-found error
- forbidden error
- invalid-data error
- departments-loading hint
- submitting

3b. Form fields
Fields must be exactly:
- code
- chineseName
- englishName
- description
- departmentId select

Validation rules:
- code is required
- code max length is 50
- chineseName is required
- englishName is optional
- description is optional
- department is optional

Department select behavior:
- options are loaded from departments
- include a None option
- show a lightweight loading hint while departments are loading
- visible option labels use department name and code together

Important restrictions:
- do not add credits
- do not add hours
- do not add semester
- do not add assessment type here
- do not add subject status
- do not add tags or category

3c. Actions
Required actions:
- Create
- Cancel back to /dashboards/admin/subjects

4. Subject view page
Design /dashboards/admin/subjects/:id as the real subject view page.

4a. Real page states
Design these states:
- loading
- not found
- generic load error
- populated subject view
- populated subject view in view-only mode
- usages loading
- usages empty
- usages populated

Important restriction:
- do not invent a separate usages error panel because the current page does not present one

4b. Page structure
Required structure:
- optional view-only info alert
- header with page title and actions
- primary details card
- usage-in-curricula section card

Header actions:
- Back
- Edit only when editing is allowed

Important restriction:
- there is no delete action on the subject view page
- do not invent one

4c. Subject details card
Only include these real fields:
- code
- chineseName
- englishName
- description
- department name
- createdAt
- updatedAt

Important restrictions:
- department must be shown as a resolved department name when available
- do not show raw departmentId
- do not add credits, hours, semester, syllabus, or teacher assignment

4d. Usage in curricula section
This section is real and must be included.

Required content:
- section title
- section subtitle
- loading state
- empty state with hint
- populated table state

Empty-state meaning:
- the subject is not used in any curriculum yet

Usage table columns must be exactly:
- Program
- Version
- Semester
- Credits
- Assessment Type
- Actions

Usage row behavior:
- the whole row is clickable
- row click opens /dashboards/admin/programs/curricula/:curriculumId/subjects
- keyboard Enter and Space do the same

Cell content mapping:
- Program = link-like label with program name and program code
- Version = curriculum version
- Semester = semester number badge
- Credits = credits badge
- Assessment Type = assessment type badge
- Actions = one button that opens the curriculum-subjects page

Important linked-navigation rule:
- inside the Program cell, the program name/code link opens /dashboards/admin/programs/:programId
- the row itself opens the curriculum-subjects route

Secondary action below usages:
- show a secondary "go to Programs & Curricula" style action only when editing is allowed and the usages list is not empty

Critical restriction:
- keep the real visual affordances that point to curriculum-subjects
- but do not design the destination curriculum-subjects screens in this iteration

5. Subject edit page
Design /dashboards/admin/subjects/:id/edit as the real subject edit form.

5a. Real page states
Design these states:
- loading
- not found
- populated edit form
- validation error
- department-not-found error
- forbidden error
- invalid-data error
- generic update error
- departments-loading hint
- submitting

5b. Form fields
Fields must be exactly:
- code as read-only
- chineseName
- englishName
- description
- departmentId select

Validation rules:
- chineseName is required
- englishName is optional
- description is optional
- department is optional and can be set to none

Important restrictions:
- code is not editable
- do not add duplicate subject action
- do not add archive action
- do not turn this into a multi-step form

5c. Actions
Required actions:
- Save
- Cancel back to /dashboards/admin/subjects

6. Assessment Type create page
Design /dashboards/admin/subjects/assessment-types/new as the real assessment-type create form.

6a. Real page states
Design these states:
- normal empty form
- validation error
- code-already-exists conflict error
- forbidden error
- invalid-data error
- generic create error
- submitting

6b. Form fields
Fields must be exactly:
- code
- chineseName
- englishName
- isGraded select
- isFinal select
- sortOrder number input

Validation rules:
- code is required
- code max length is 50
- chineseName is required
- englishName is optional
- sortOrder must be numeric when provided

Default values:
- isGraded defaults to true
- isFinal defaults to false
- sortOrder defaults to 0

Important restrictions:
- do not add description
- do not add icon
- do not add color
- do not add weight percentage
- do not add visibility toggle

6c. Actions
Required actions:
- Create
- Cancel back to /dashboards/admin/subjects

7. Assessment Type edit page
Design /dashboards/admin/subjects/assessment-types/:id/edit as the real assessment-type edit form.

7a. Real page states
Design these states:
- loading
- not found
- populated edit form
- validation error
- forbidden error
- invalid-data error
- generic update error
- submitting

7b. Form fields
Fields must be exactly:
- code as read-only
- chineseName
- englishName
- isGraded select
- isFinal select
- sortOrder number input

Validation rules:
- chineseName is required
- englishName is optional
- sortOrder must be numeric when provided

Important restrictions:
- code is not editable
- there is no separate assessment-type view page
- do not add delete action on the edit page
- do not add relationships or usage stats on this page

7c. Actions
Required actions:
- Save
- Cancel back to /dashboards/admin/subjects

8. What must not appear anywhere in this iteration
Do not add any of the following:
- curriculum-subjects pages
- implementation pages
- analytics cards
- charts
- bulk actions
- export
- advanced filters
- pagination controls
- tabs
- assessment-type view page
- subject prerequisites
- syllabus or materials
- teacher-assignment UI
- credits or hours fields on subject create/edit
- subject activation or archive controls
- drag-and-drop ordering UI
- audit log panels

9. Prototype interactions to include
Support only these real interactions:
- search subjects list
- open subject view from a subject row
- open subject edit
- open subject delete confirm
- submit subject create form
- submit subject edit form
- search assessment-types list
- open assessment-type create form
- open assessment-type edit form
- open assessment-type delete confirm
- submit assessment-type create form
- submit assessment-type edit form
- from subject view, open program view from the program link inside usages
- from subject view, open curriculum-subjects route from a usage row or action button

Important prototype restriction:
- keep links and row interactions that already exist
- but do not create extra frames for routes that are out of scope

10. Output expectations
Produce polished desktop and mobile designs for:
- subjects management list page
- subject create page
- subject view page
- subject edit page
- assessment-type create page
- assessment-type edit page
- shared delete confirm modal
- relevant loading, error, empty, success, view-only, and action-unavailable states

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
Treat this as the admin subjects iteration only.
```
