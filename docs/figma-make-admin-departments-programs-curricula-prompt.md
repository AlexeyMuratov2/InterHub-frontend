# Figma Make Prompt: Admin Dashboard, Departments, Programs, And Curricula Foundation

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, teacher dashboard, and student dashboard designs.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the administrator dashboard
- Work only on:
  - /dashboards/admin/departments
  - /dashboards/admin/departments/new
  - /dashboards/admin/departments/:id
  - /dashboards/admin/departments/:id/edit
  - /dashboards/admin/programs
  - /dashboards/admin/programs/new
  - /dashboards/admin/programs/:id
  - /dashboards/admin/programs/:id/edit
  - /dashboards/admin/programs/:programId/curricula/new
  - /dashboards/admin/programs/curricula/:curriculumId/edit
- Include the real delete-confirm modal flows that belong to these pages
- Do not redesign auth
- Do not redesign dashboard selector
- Do not redesign teacher dashboard
- Do not redesign student dashboard
- Preserve the approved product visual language and extend it into the administrator dashboard

Important out-of-scope rule for this iteration:
- Do NOT design the curriculum-subjects pages yet
- Do NOT design the curriculum implementation pages yet
- Specifically do not generate the actual destination screens for:
  - /dashboards/admin/programs/curricula/:curriculumId/subjects
  - /dashboards/admin/programs/curricula/:curriculumId/subjects/new
  - /dashboards/admin/programs/curriculum-subjects/:id/edit
  - /dashboards/admin/implementation
- You may keep the existing visual affordances that point toward the curriculum-subjects route because they already exist in the current app
- But do not expand those routes into full designs in this iteration

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
- If a backend field exists but is not currently surfaced on these exact admin screens, do not expose it in the design

Very important anti-hallucination rule:
- The Programs and Curricula area is not the same as Curriculum Subjects
- The Programs and Curricula area is also not the same as Implementation
- Do not merge these flows
- Do not bring curriculum-subject statistics cards, subject-fill forms, implementation tables, slot generation tools, or lesson-generation tools into this iteration
- This iteration covers only the department module and the programs-and-curricula foundation pages

Examples of backend fields that must NOT be surfaced here because the current pages do not use them:
- department internal id on list/view pages
- program internal id on list/view pages
- curriculum approvedAt
- curriculum approvedBy
- curriculum updatedAt on list tables
- curriculum programId as visible field
- program departmentId as visible raw id
- curriculum-subject data
- implementation data
- delete-role distinctions from config
- hidden permission matrices

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake values
- Example placeholders:
  - [Department Code]
  - [Department Name]
  - [Department Description]
  - [Program Code]
  - [Program Name]
  - [Program Description]
  - [Degree Level]
  - [Department Label]
  - [Curriculum Version]
  - [Duration Years]
  - [Curriculum Notes]
  - [Created At]
  - [Updated At]
- If you need multiple examples, use numeric suffixes such as [Program Name 1]

Do not fabricate:
- realistic department names
- realistic program names
- realistic curriculum versions
- realistic timestamps
- realistic degree-level labels
- realistic notes

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
This is important because the current admin pages support both editable and view-only access.

Real current behavior:
- admin dashboard is available to multiple admin-side roles
- some users can view but cannot create/edit/delete
- list and view pages support a view-only informational state
- direct access to create/edit pages without edit permission redirects back with an action-unavailable notice

Design expectations:
- support editable state
- support view-only informational state on list/view pages
- support action-unavailable notice state after redirect on list pages

Important restrictions:
- do not invent role-management UI here
- do not add permission settings
- do not add inline lock icons on every row unless it directly supports the existing view-only pattern

2. Departments list page
Design /dashboards/admin/departments as the real departments list page.

2a. Real page structure
Required structure:
- page title
- page subtitle
- optional view-only info alert
- optional action-unavailable info alert
- optional error alert
- optional success alert
- toolbar with search and create action
- departments table section

2b. Real page states
Design these states:
- loading
- generic load error
- success after delete
- empty because there are no departments
- empty because current search returned no results
- populated table
- delete confirm open
- view-only mode
- redirected action-unavailable mode

2c. Search behavior
The departments page has exactly one search input.

Real search matching:
- code
- name
- description

Important restrictions:
- do not add filters
- do not add sorting controls
- do not add pagination

2d. Toolbar
Required content:
- one search input
- one create button only when editing is allowed

Important restrictions:
- do not add export
- do not add bulk actions
- do not add advanced filters

2e. Departments table
Table columns must be exactly:
- Code
- Name
- Description
- Created At
- Actions

Row behavior:
- the whole row is clickable and opens the department view page
- keyboard Enter and Space also open the department view page

Row content mapping:
- Code = department code
- Name = department name
- Description = truncated description preview
- Created At = formatted created date
- Actions = row actions area

Action buttons:
- View
- Edit only when editing is allowed
- Delete only when editing is allowed

Important restriction:
- even though delete permissions are stricter in shared config, the current page shows delete based on the general admin-edit capability used by this page
- reflect the current page behavior, not an idealized permission model

2f. Empty states
If the full list is empty:
- show the empty message
- show create action inside the empty state only when editing is allowed

If the search result is empty but the original list is not:
- show only the no-results message

2g. Delete confirm modal
Departments use the shared confirm modal.

Required content:
- title
- short confirm text
- cancel
- destructive confirm

Important restrictions:
- do not add a second delete step
- do not add inline delete inside the row

3. Department view page
Design /dashboards/admin/departments/:id as the real department view page.

3a. Real page states
Design these states:
- loading
- not found
- generic load error
- populated view
- populated view in view-only mode

3b. Page structure
Required structure:
- optional view-only info alert
- header with page title and actions
- content card with definition-list details

Header actions:
- Edit only when editing is allowed
- Back

Important restriction:
- there is no delete action on the department view page
- do not invent one

3c. Detail content
Only include these real fields:
- code
- name
- description
- createdAt

Important restrictions:
- do not add updatedAt
- do not add related programs list
- do not add head of department
- do not add statistics

4. Department create page
Design /dashboards/admin/departments/new as the real department create form.

4a. Real page states
Design these states:
- normal empty form
- validation error
- generic create error
- conflict code-already-exists error
- submitting

4b. Form fields
Fields must be exactly:
- code
- name
- description

Validation rules:
- code is required
- code max length is 50
- name is required
- name max length is 255
- description is optional

Important restrictions:
- do not add department head
- do not add color
- do not add faculty count
- do not add tags

4c. Actions
Required actions:
- Create
- Cancel back to departments list

5. Department edit page
Design /dashboards/admin/departments/:id/edit as the real department edit form.

5a. Real page states
Design these states:
- loading
- not found
- populated edit form
- validation error
- generic update error
- submitting

5b. Form fields
Fields must be exactly:
- code as read-only field
- name
- description

Validation rules:
- name is required
- name max length is 255
- description is optional

Important restrictions:
- code is not editable
- do not redesign this into a full multi-step form

5c. Actions
Required actions:
- Save
- Cancel back to departments list

6. Programs and Curricula list page
Design /dashboards/admin/programs as the real combined programs-and-curricula management page.

This page has two real sections:
- Programs section
- Curricula section

Do not redesign this page into tabs.
Do not split it into two separate pages in this iteration.

6a. Real page structure
Required structure:
- page title
- page subtitle
- optional view-only info alert
- optional action-unavailable info alert
- optional error alert
- optional success alert
- toolbar for programs section
- programs table
- separate curricula section header
- separate curricula subtitle
- optional curricula error alert
- separate curricula toolbar
- curricula table

6b. Real page states
Design these states:
- programs loading
- programs load error
- programs empty
- programs no-results
- programs populated
- curricula loading
- curricula error
- curricula empty when there are no curricula
- curricula no-results
- delete-program confirm open
- delete-curriculum confirm open
- view-only mode
- redirected action-unavailable mode

6c. Programs section toolbar
Required content:
- one search input
- one create-program button only when editing is allowed

Programs search matches:
- program code
- program name
- program description
- degree level

Important restrictions:
- no filters
- no pagination
- no sort dropdown

6d. Programs table
Programs table columns must be exactly:
- Code
- Name
- Description
- Degree Level
- Created At
- Actions

Row behavior:
- whole row is clickable and opens the program view page
- keyboard Enter and Space also open the program view page

Row content:
- Code = program code
- Name = program name
- Description = truncated description preview
- Degree Level = degreeLevel or dash
- Created At = formatted created date

Actions:
- View
- Edit only when editing is allowed
- Delete only when editing is allowed

Important restriction:
- do not add department column in the programs list table
- it is not shown in the current implementation

6e. Curricula section header
This section is real and distinct from the programs table.

Required content:
- section title
- section subtitle

Do not add summary KPI cards.

6f. Curricula toolbar
Required content:
- one curriculum search input
- one program select control for choosing the target program when creating a curriculum
- one Add curriculum link/button

Real behavior:
- the add-curriculum link is visually present only when editing is allowed
- the add-curriculum link is disabled until a program is selected
- the select options come from the already loaded programs list

Curricula search matches:
- program code
- program name
- curriculum version
- curriculum notes

Important restrictions:
- do not add separate curriculum filters
- do not add semester filters
- do not add status chips above the table

6g. Curricula table on the programs page
Table columns must be exactly:
- Program
- Version
- Duration Years
- Is Active
- Status
- Notes
- Created At
- Actions

Row behavior:
- the whole row is clickable
- in the real app, it opens the curriculum-subjects page for that curriculum
- keep the row visually actionable
- but do not design the destination curriculum-subjects screen in this iteration

Cell content mapping:
- Program = link-like program label using program name and program code
- Version = curriculum version
- Duration Years = formatted duration
- Is Active = yes / no
- Status = raw curriculum status value
- Notes = truncated notes preview
- Created At = formatted created date

Actions:
- Edit only when editing is allowed
- Delete only when editing is allowed

Important restrictions:
- there is no standalone curriculum view page in the current implementation
- do not invent one
- do not add a separate View action for curriculum beyond the existing open-to-subjects affordance

6h. Curricula empty states
If there are no curricula at all:
- show the empty message
- when at least one program exists, show the small add-hint text

If the search result is empty but curricula exist:
- show only the no-results message

7. Program view page
Design /dashboards/admin/programs/:id as the real program view page.

7a. Real page states
Design these states:
- loading
- not found
- generic load error
- populated view
- populated view in view-only mode
- curricula loading
- curricula error
- no curricula
- curricula populated
- delete-curriculum confirm open

7b. Page structure
Required structure:
- optional view-only info alert
- header with page title and actions
- program detail card
- curricula section card

Header actions:
- Edit only when editing is allowed
- Back

Important restriction:
- there is no delete-program action on the program view page
- do not invent one

7c. Program details card
Only include these real fields:
- code
- name
- description
- degreeLevel
- department
- createdAt
- updatedAt

Important restriction:
- department is resolved to a department name when possible
- do not show raw department id

7d. Curricula section inside program view
Required content:
- section title
- optional curricula error alert
- Add curriculum button only when editing is allowed
- empty or table state

Curricula table columns must be exactly:
- Version
- Duration Years
- Is Active
- Status
- Notes
- Created At
- Actions

Row behavior:
- the whole row is clickable
- in the real app, it opens the curriculum-subjects page
- keep the row actionable but do not design the destination page in this iteration

Actions:
- primary open/view curriculum-subjects button
- Edit only when editing is allowed
- Delete only when editing is allowed

Important restrictions:
- do not add curriculum detail page
- do not add approve button
- do not add archive button here

8. Program create page
Design /dashboards/admin/programs/new as the real program create form.

8a. Real page states
Design these states:
- normal empty form
- validation error
- generic create error
- code-already-exists conflict error
- department-not-found error
- forbidden error
- departments-loading hint
- submitting

8b. Form fields
Fields must be exactly:
- code
- name
- description
- degreeLevel
- departmentId select

Validation rules:
- code is required
- code max length is 50
- name is required
- name max length is 255
- degreeLevel is optional
- degreeLevel max length is 50
- description is optional
- department is optional

Department select behavior:
- options are loaded from departments
- include a None option
- show a lightweight loading hint while departments are loading

Important restrictions:
- do not add curriculum creation inside this form
- do not add separate degree-level picker if the current page uses text input

8c. Actions
Required actions:
- Create
- Cancel back to programs list

9. Program edit page
Design /dashboards/admin/programs/:id/edit as the real program edit form.

9a. Real page states
Design these states:
- loading
- not found
- populated edit form
- validation error
- generic update error
- department-not-found error
- forbidden error
- departments-loading hint
- submitting

9b. Form fields
Fields must be exactly:
- code as read-only
- name
- description
- degreeLevel
- departmentId select

Validation rules:
- name is required
- name max length is 255
- degreeLevel max length is 50
- description is optional
- department is optional and can be set to none

Important restrictions:
- code is not editable
- do not add duplicate-program action
- do not add archive-program action

9c. Actions
Required actions:
- Save
- Cancel back to programs list

10. Curriculum create page
Design /dashboards/admin/programs/:programId/curricula/new as the real curriculum create form.

This page creates a curriculum under one already selected program.
It is not the curriculum-subject filling page.

10a. Real page states
Design these states:
- normal form
- validation error
- version-already-exists conflict error
- program-not-found error
- forbidden error
- generic create error
- missing programId route-param error
- submitting

10b. Form fields
Fields must be exactly:
- version
- durationYears
- isActive checkbox
- notes

Validation rules:
- version is required
- version max length is 50
- durationYears is required
- durationYears must be between 1 and 10
- isActive defaults to true
- notes are optional

Important restrictions:
- do not add status selector on create page
- do not add approvedAt / approvedBy
- do not add curriculum-subject editing on this page

10c. Actions
Required actions:
- Create
- Cancel back to the current program view page

11. Curriculum edit page
Design /dashboards/admin/programs/curricula/:curriculumId/edit as the real curriculum edit form.

There is no separate curriculum view page in the current implementation.
This edit page is the only dedicated curriculum page in scope for this iteration.

11a. Real page states
Design these states:
- loading
- not found
- populated edit form
- validation error
- forbidden error
- generic update error
- submitting

11b. Form fields
Fields must be exactly:
- version
- durationYears
- isActive checkbox
- status select
- notes

Status options must be exactly:
- DRAFT
- UNDER_REVIEW
- APPROVED
- ARCHIVED

Validation rules:
- durationYears must be between 1 and 10
- version has max length 50 on edit
- the current form does not enforce version as required in the same way as create

Important restrictions:
- do not add approve button
- do not add separate archive workflow
- do not add subject-fill controls here
- do not add delete button on this page

11c. Actions
Required actions:
- Save
- Cancel back to the owning program view page when programId is known
- fallback cancel/back to programs list when needed

12. Shared confirm modal usage in this iteration
The shared confirm modal is used on these screens for destructive actions:
- delete department from departments list
- delete program from programs list
- delete curriculum from programs list
- delete curriculum from program view

Required modal content:
- title
- short message
- cancel
- destructive confirm

Do not add extra warning flows or multi-step delete wizards.

13. What must not appear anywhere in this iteration
Do not add any of the following:
- curriculum subjects page
- curriculum subject create page
- curriculum subject edit page
- implementation page
- analytics cards
- charts
- bulk actions
- export
- advanced filters
- pagination controls
- tabs for programs vs curricula
- separate curriculum detail page
- curriculum approval workflow UI
- slot generation UI
- lesson generation UI
- staff assignment UI
- audit log panels

14. Prototype interactions to include
Support only these real interactions:
- search departments list
- open department view from a row
- open department edit
- open department delete confirm
- submit department create form
- submit department edit form
- search programs list
- open program view from a row
- open program edit
- open program delete confirm
- search curricula on the programs page
- choose a program in the add-curriculum select
- activate add-curriculum once a program is selected
- open curriculum edit from curricula tables
- open curriculum delete confirm from curricula tables
- open curriculum create from the programs page and from the program view
- submit program create form
- submit program edit form
- submit curriculum create form
- submit curriculum edit form

Important prototype restriction:
- keep the existing visual affordances that point to curriculum-subjects routes
- but do not create those destination frames in this iteration

15. Output expectations
Produce polished desktop and mobile designs for:
- departments list page
- department view page
- department create page
- department edit page
- programs-and-curricula list page
- program view page
- program create page
- program edit page
- curriculum create page
- curriculum edit page
- shared delete confirm modal
- relevant loading, error, empty, success, view-only, and action-unavailable states

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
Treat this as the admin foundation iteration, not the curriculum-subjects or implementation iteration.
```
