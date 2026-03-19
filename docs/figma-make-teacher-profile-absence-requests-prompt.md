# Figma Make Prompt: Teacher Dashboard, Profile, And Absence Requests

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and teacher dashboard foundations.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the teacher dashboard
- Work only on:
  - /dashboards/teacher/profile
  - /dashboards/teacher/absence-requests
- Include the teacher absence-request view modal because it is part of the real page flow
- Do not redesign auth
- Do not redesign dashboard selector
- Do not redesign student dashboard
- Do not redesign administrator dashboard
- Do not redesign teacher schedule, lessons, subjects, or student groups
- Preserve the already approved teacher visual language exactly and extend it carefully

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- calm, clear, academic, trustworthy
- restrained hierarchy
- white surfaces with subtle blue structure
- no startup SaaS look
- no playful illustrations
- no flashy gradients
- no analytics-dashboard aesthetic

Critical product-accuracy rule:
- Do not invent new teacher features
- Do not invent new sections
- Do not invent new form fields
- Do not invent new filters
- Do not invent new tabs
- Do not invent new settings
- Do not invent new review workflows
- Do not invent new data values just to make the screens feel richer
- Do not remove any real teacher functionality that already exists on these pages
- If a field exists in backend DTOs but is not actually surfaced on these teacher pages in the current project, do not suddenly expose it in the design

Examples of backend fields that must NOT be surfaced here because the current teacher pages do not use them:
- user status
- user activatedAt
- user lastLoginAt
- teacher profile createdAt / updatedAt
- teacher profile internal id
- teacher profile userId
- absence notice teacherComment
- absence notice respondedAt
- absence notice respondedBy
- absence notice attachedRecordId
- absence notice canceledAt
- absence notice raw lessonSessionIds list
- absence notice fileIds as downloadable files
- notice offering format
- notice offering notes
- lesson status on the absence-requests page
- lesson type on the absence-requests page
- slot details on the absence-requests page

Dynamic-data rule:
- Use structured placeholders in square brackets instead of fabricated realistic values
- Example placeholders:
  - [Display Name]
  - [Teacher Display Name]
  - [Email]
  - [Role]
  - [Member Since Date]
  - [First Name]
  - [Last Name]
  - [Phone]
  - [Birth Date]
  - [Teacher ID]
  - [Faculty]
  - [English Name]
  - [Position]
  - [Student Name]
  - [Student ID]
  - [Group Name]
  - [Lesson Date]
  - [Start Time]
  - [End Time]
  - [Notice Period]
  - [Subject Name]
  - [Reason]
  - [Submitted At]
  - [Attachments Count]

Do not fabricate:
- realistic names
- realistic faculties
- realistic phone numbers
- realistic dates
- realistic reason texts
- realistic notice histories
- realistic teacher IDs

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

1. Teacher Profile page
Design /dashboards/teacher/profile as the real teacher profile page.

This page is not a settings hub.
It is a profile page with inline editing for specific fields only.

1a. Real page states
Design these real states:
- loading
- fatal load error when the main user profile cannot be loaded
- loaded state
- loaded state with a top error alert
- loaded state with a top field-validation error alert
- saving state during inline update
- loaded state without teacher-profile section when the teacher profile is unavailable

Important behavior:
- if the page is still loading, show a simple full-page loading state
- if the main user profile fails to load, show a full-page error state with a back action to the teacher schedule
- if the main user profile is loaded but a secondary request fails, keep the page visible and show the error as a top alert
- if the teacher profile request returns 404, keep the page visible and simply omit the teacher-specific section

1b. Top header
Required structure:
- page title
- back button

Real behavior:
- the title includes the current display name
- the back button goes to /dashboards/teacher/schedule

Do not add:
- breadcrumbs
- extra toolbar actions
- export
- password reset button
- notification button

1c. Summary card
The left-side summary area is real and should stay compact and serious.

Required content:
- avatar circle with one initial
- main display name
- email
- role tags
- member-since line

Exact data mapping:
- avatar initial: first letter from the visible display name, with email fallback, with final fallback to T
- main display name: teacher display name when available, otherwise user display name
- email: user email
- role tags: user roles
- member since: user createdAt

Important restrictions:
- no avatar upload
- no avatar editor
- no cover image
- no biography
- no social links
- no security settings
- no notification preferences
- no password form

1d. Personal information section
This section is real and must support inline editing.

Required content:
- section title
- short hint that the fields can be edited
- list of profile rows

Real fields in this section:
- firstName
- lastName
- email
- phone
- birthDate

Editing rules:
- firstName: editable text
- lastName: editable text
- email: read-only
- phone: editable text
- birthDate: editable date input

Real interaction behavior:
- one field is edited at a time
- double click on the value enters edit mode
- keyboard Enter or Space on the value also enters edit mode
- when edit mode opens, the input is focused
- on blur, the field saves automatically
- Enter saves
- Escape cancels
- if the value was not changed, exit edit mode without saving

Visual requirements:
- clearly distinguish read-only and editable rows
- keep the page elegant and implementation-friendly
- do not redesign this as a modal form

Do not add:
- global Save button for the whole page
- per-section Save button
- Cancel button row
- multi-field edit mode
- editable email

1e. Teacher information section
This section exists only when the teacher profile is available.

Required content:
- section title
- short hint that the fields can be edited
- list of teacher-profile rows

Real fields in this section:
- teacherId
- faculty
- englishName
- position

Important permission rule:
- teacherId is editable only when the current user roles include SUPER_ADMIN
- for a normal teacher user, teacherId must be shown as a read-only value row
- the other teacher fields remain editable when the teacher profile exists

Editing rules:
- teacherId: editable text only for SUPER_ADMIN, otherwise read-only
- faculty: editable text
- englishName: editable text
- position: editable text

Important implementation truth:
- although the UI edits one field at a time, the teacher-profile PATCH request carries the current teacherId and faculty values together with the changed field
- do not redesign this into a multi-field form with Save / Cancel actions

Do not add:
- department
- office
- biography
- academic degree
- research interests
- certificates
- subject assignments

1f. Inline edit feedback
This part is important because it is real behavior.

When a field is being edited:
- show an input directly inside the row
- show a small hint that Enter saves

When saving:
- show a lightweight submitting message on the page sections

When validation or update fails:
- show a top alert with the error
- keep the page visible
- do not move the user to a separate error screen

Important restrictions:
- do not add success toast for every field
- do not add complex validation panels
- do not add confirmation modal before saving
- do not add inline per-field error blocks unless they remain visually secondary to the real top-alert pattern

1g. What must not appear on Teacher Profile
Do not add any of the following:
- change password form
- notification settings
- theme settings
- privacy settings
- linked devices
- file uploads
- editable roles
- teacher analytics
- attendance widgets
- lesson calendar
- tabs inside profile

2. Teacher Absence Requests page
Design /dashboards/teacher/absence-requests as the real teacher absence-notices page.

This page is a read-and-review list with filtering and one view-only modal.
It is not an approval workspace.

Very important accuracy rule:
- the codebase contains approve / reject APIs, but this page does not use them
- do not add approve actions
- do not add reject actions
- do not add teacher response form
- do not add moderation workflow UI

2a. Real page structure
This page has four real parts:
- page hero
- filters bar
- optional global error alert
- notices table section

It also has one real modal:
- view notice modal

2b. Real page states
Design these real states:
- loading list
- global load error alert above the list section
- empty because there are no notices at all
- empty because the current filters returned no results
- populated table
- loading more state
- modal closed
- modal open

2c. Hero
Required content:
- page title
- page subtitle

Keep the hero aligned with the approved teacher dashboard style.
Do not add summary KPI cards here.

2d. Filters bar
The teacher absence-requests page uses the shared absence-filters bar, but with more controls than the student page.

Required teacher filters:
- subject select
- group select
- status select
- date from
- date to

Important behavior:
- filters update immediately
- there is no Apply button
- there is no Reset button
- subject and group options are derived from the currently loaded notice items
- the date inputs are native date inputs with calendar triggers

Status options on the teacher page must be exactly:
- All statuses
- Submitted
- Canceled

Important default-status behavior:
- if no dateFrom/dateTo query values are present, the initial status filter is Submitted
- if dateFrom or dateTo query values are present, the initial status filter is All statuses

Important restrictions:
- do not add student filter
- do not add notice-type filter
- do not add search
- do not add sorting controls
- do not add chips summary
- do not add saved views

2e. Notices list section
This is the real notices-history section for the teacher page.

Required structure:
- section card
- desktop table layout
- mobile adaptation that still preserves the same information

Table columns must be exactly:
- Student
- Dates
- Subject
- Status
- Reason
- Submitted at
- Actions

2f. Row content mapping
Each row may include only the real information currently shown:

Student column:
- student display name
- fallback to student ID when display name is missing
- when a concrete lesson exists and a lesson id is available, the student name becomes a link to the teacher lesson page
- otherwise keep it plain text

Dates column:
- for a single lesson notice, show the lesson date
- for a period notice, show the formatted start-to-end range
- if neither lesson nor period is available, fallback to submitted date

Subject column:
- subject display comes from:
  - offering.subjectName when available
  - otherwise lesson.topic
  - otherwise group.name
  - otherwise group.code
  - final fallback to dash

Status column:
- if notice status is CANCELED, show a canceled badge
- otherwise show the notice type badge:
  - Absent
  - Late

Important status restriction:
- do not display a separate generic Submitted badge in active rows
- active rows visually communicate type, not a separate submitted-status pill

Reason column:
- show reason text
- if reason is missing, show dash
- if reason length is greater than 80 characters, support expand / collapse inside the cell

Submitted at column:
- notice submittedAt

Actions column:
- View action
- Go to lesson action only when a lesson link is available

Important restrictions:
- do not add approve / reject buttons
- do not add student profile links
- do not add attachment preview buttons
- do not add edit action
- do not add delete action

2g. Reason expansion behavior
This is a real behavior and must be represented.

When the reason text is long:
- show a shortened preview in the cell
- show an expand action
- when expanded, show the full text and a collapse action

Do not redesign long reasons as separate popovers or side drawers.

2h. Pagination
The page supports loading more notices.

Required UI:
- Load more button below the section when nextCursor exists
- loading state for that button

Important restrictions:
- do not redesign this as infinite scroll
- do not add page-number pagination

2i. View notice modal
This modal is real and must be included in the design.

Required states:
- closed
- open

Required structure:
- modal title
- definition-list style details
- actions row

The modal may include only these fields:
- student
- group when available
- dates
- subject name
- status
- reason
- submitted at
- attachments count when fileIds exist

Status display rule inside the modal:
- if the notice is canceled, show Canceled
- otherwise show the notice type:
  - Late
  - Absent

Actions in the modal must be exactly:
- Go to lesson when lesson exists
- Close

Important restrictions:
- do not add approve action
- do not add reject action
- do not add teacher comment form
- do not add attachment list or downloads
- do not add audit history

2j. What must not appear on Teacher Absence Requests
Do not add any of the following:
- approve / reject controls
- teacher response form
- attachment downloads
- file previews
- student profile side panel
- subject analytics
- charts
- tabs
- kanban states
- bulk actions
- moderation summary cards
- search bar
- export

3. Prototype interactions to include
In the prototype, support only these real interactions:
- click editable teacher profile field -> inline edit state
- blur profile field -> save
- press Enter in profile input -> save
- press Escape in profile input -> cancel
- click back on profile -> go to /dashboards/teacher/schedule
- change absence-request subject filter
- change absence-request group filter
- change absence-request status filter
- change absence-request date range
- expand / collapse long reason text inside the table
- open View modal from a notice row
- close View modal
- click Go to lesson from the table when available
- click Go to lesson from the modal when available
- click Load more on the notices list

Do not create any other prototype flows.

4. Dynamic placeholder policy
Use structured placeholders for every dynamic value instead of fabricated content.

Profile placeholders:
- [Display Name]
- [Teacher Display Name]
- [Email]
- [Role]
- [Member Since Date]
- [First Name]
- [Last Name]
- [Phone]
- [Birth Date]
- [Teacher ID]
- [Faculty]
- [English Name]
- [Position]

Absence-request placeholders:
- [Student Name]
- [Student ID]
- [Group Name]
- [Lesson Date]
- [Start Time]
- [End Time]
- [Notice Period]
- [Subject Name]
- [Reason]
- [Submitted At]
- [Attachments Count]

Do not replace them with realistic fake examples.

5. Output expectations
Produce polished desktop and mobile designs for:
- teacher Profile page
- teacher Absence Requests page
- teacher absence-request View modal
- key loading, error, empty, expand/collapse, and submitting states

Preserve the approved teacher-dashboard visual language.
Keep the layouts implementation-friendly.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
