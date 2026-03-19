# Figma Make Prompt: Student Dashboard, Profile, And Absence Requests

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and student dashboard foundations.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the student dashboard.
- Work only on:
  - /dashboards/student/profile
  - /dashboards/student/absence-requests
- Include the student absence-notice edit modal because it is part of the real page flow.
- Do not redesign auth.
- Do not redesign dashboard selector.
- Do not redesign teacher dashboard.
- Do not redesign administrator dashboard.
- Do not redesign student schedule, lessons, or subjects.
- Preserve the already approved student visual language exactly and extend it carefully.

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- calm, clear, academic, trustworthy
- restrained hierarchy
- white surfaces with subtle blue structure
- no startup SaaS look
- no playful illustrations
- no flashy gradients
- no dashboard analytics aesthetic

Critical product-accuracy rule:
- Do not invent new features.
- Do not invent new sections.
- Do not invent new form fields.
- Do not invent new filters.
- Do not invent new tabs.
- Do not invent new settings.
- Do not invent new data values just to make the screens feel richer.
- Do not remove any real student functionality that already exists on these pages.
- If a field exists in backend DTOs but is not actually surfaced on these student pages in the current project, do not suddenly expose it in the design.

Examples of backend fields that must NOT be surfaced here because the current student pages do not use them:
- user status
- user activatedAt
- user lastLoginAt
- student profile createdAt / updatedAt
- absence notice teacherComment
- absence notice respondedAt
- absence notice respondedBy
- absence notice attachedRecordId
- absence notice fileIds

Dynamic-data rule:
- Use structured placeholders in square brackets instead of fabricated realistic values.
- Example placeholders:
  - [Display Name]
  - [Email]
  - [First Name]
  - [Last Name]
  - [Phone]
  - [Birth Date]
  - [Student ID]
  - [Chinese Name]
  - [Faculty]
  - [Course]
  - [Enrollment Year]
  - [Group Name]
  - [Member Since Date]
  - [Date From]
  - [Date To]
  - [Lesson Date]
  - [Lesson Time]
  - [Subject Name]
  - [Notice Period]
  - [Submitted At]
  - [Reason]

Do not fabricate:
- realistic names
- realistic faculties
- realistic phone numbers
- realistic dates
- realistic reason texts
- realistic notice histories

Keep the existing student dashboard shell unchanged:
- Dashboard
- Schedule
- Lessons
- Subjects
- Absence Requests
- Profile

Do not add new navigation items.
Do not create new student subpages.

1. Student Profile page
Design /dashboards/student/profile as the real student profile page.

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
- loaded state without student-profile section when student profile is unavailable

Important behavior:
- if the page is still loading, show a simple loading page state
- if the main user profile fails to load, show an error state with a back action to the student schedule
- if the page is loaded but there is a secondary error, keep the page visible and show the error as an alert at the top

1b. Top header
Required structure:
- page title
- back button

Real behavior:
- the title includes the current display name
- the back button goes to /dashboards/student/schedule

Do not add:
- breadcrumbs
- extra toolbar actions
- export
- password reset button

1c. Summary card
The left-side summary area is real and should stay compact and serious.

Required content:
- avatar circle with one initial
- main display name
- email
- role tags
- member-since line

Exact data mapping:
- avatar initial: first letter from display name or email fallback
- main display name: student display name when available, otherwise user display name
- email: user email
- role tags: user roles
- member since: user createdAt

Important restrictions:
- no avatar upload
- no avatar editor
- no cover image
- no social links
- no biography
- no notification preferences
- no security settings

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

Visual requirement:
- clearly distinguish read-only and editable rows
- keep the page elegant and implementation-friendly
- do not redesign this as a modal form

Do not add:
- global Save button for the whole page
- per-section Save button
- Cancel button row
- multi-field edit mode
- editable email

1e. Student information section
This section exists only when the student profile is available.

Required content:
- section title
- short hint that the fields can be edited
- list of student-profile rows

Real fields in this section:
- studentId
- chineseName
- faculty
- course
- enrollmentYear
- groupName

Editing rules:
- studentId: editable text
- chineseName: editable text
- faculty: editable text
- course: editable text
- enrollmentYear: editable number input
- groupName: editable text

Important behavior:
- this whole section should be absent when there is no student profile
- do not invent fallback student data to keep the layout symmetrical

Do not add:
- major
- minor
- GPA
- passport data
- document uploads
- academic transcript
- advisor information

1f. Inline edit feedback
This part is important because it is real behavior.

When a field is being edited:
- show an input directly inside the row
- show a small hint that Enter saves

When saving:
- show a lightweight saving message on the section

When validation or update fails:
- show a top alert with the error

Do not add:
- success toast for every field
- complex validation panels
- confirmation modal before saving

1g. What must not appear on Student Profile
Do not add any of the following:
- change password form
- notification settings
- theme settings
- privacy settings
- two-factor auth
- linked devices
- file uploads
- editable roles
- academic statistics
- attendance widgets
- lesson calendar
- tabs inside profile

2. Student Absence Requests page
Design /dashboards/student/absence-requests as the real student absence-notice page.

This page has three real parts:
- page hero
- create-notice section
- filters bar
- notices table section

It also has one real modal:
- edit existing notice modal

This student page is different from the lesson-specific absence-request dialog on the lesson page.
Do not merge those two flows.
This page supports range-based and single-lesson notice creation.

2a. Hero
Required content:
- page title
- page subtitle

Keep the hero aligned with the approved student dashboard style.
Do not add summary KPIs here.

2b. Create notice section
This is a real in-page form section, not a modal.

Required structure:
- section card
- section title
- section subtitle
- error alert area
- success alert area
- create form

Design these real states:
- normal empty form
- invalid date range error
- lessons loading
- no lessons available in selected range
- no lessons selected error
- duplicate-notice conflict error
- create success
- submitting state

2c. Create form: selection mode
The form supports exactly two creation modes:
- RANGE
- SINGLE

Required UI:
- mode label
- two toggle chips or buttons

Behavior:
- RANGE mode is the default
- SINGLE mode is the second option

Do not add:
- weekly mode
- custom recurrence
- bulk action wizard
- calendar view selection

2d. Create form: date range
Required fields:
- date from
- date to

Real behavior to represent:
- both are date inputs
- default from date is today
- default to date is today plus 14 days
- from date cannot be after to date
- range longer than 60 days is invalid

Important restrictions:
- do not add time pickers
- do not add semester quick filters
- do not add month view calendars

2e. Create form: lesson selection
Lessons are loaded from the student's schedule based on the selected date range.

Important data behavior:
- only lessons within the selected date range are eligible
- cancelled lessons are excluded
- lessons are deduplicated by lesson id
- lessons are sorted by date, then start time

In SINGLE mode:
- show one select control with available lessons
- each option should represent only the real fields used in the project:
  - lesson date
  - time range
  - subject name
- if there are no lessons, show the real empty option state

In RANGE mode:
- show grouped lessons by date
- show each lesson as a checkbox row
- each checkbox row should contain only:
  - time range
  - subject name
- show selected-count text
- show Select all action
- show Clear selection action

Real behavior:
- when lessons load successfully in range mode and no previous selection remains valid, all available lessons become selected by default

Important restrictions:
- do not add lesson cards with room, teacher, or lesson type
- do not add drag selection
- do not add search
- do not add subject grouping
- do not add filters by subject or teacher

2f. Create form: notice type
Required notice types:
- ABSENT
- LATE

Required UI:
- label
- two large selectable options
- each option has a label and short description

Important restrictions:
- do not add custom notice types
- do not add medical / personal / official document categories

2g. Create form: reason
Required UI:
- optional textarea
- helper text
- visible character counter

Real behavior:
- reason is optional
- max length is 2000 characters
- over-limit state must be supported visually

Important restrictions:
- do not add rich text editor
- do not add attachments
- do not add file upload
- do not add teacher recipient selection

2h. Create form: submit
Required UI:
- one primary submit button

Real behavior:
- submit is disabled while loading lessons
- submit is disabled while submitting
- submit is disabled when reason length exceeds 2000
- submit fails if no lessons are selected

Do not add:
- draft save
- secondary submit variants
- approval preview

2i. Conflict error state
This state is important and must be designed.

If the student tries to submit for lessons that already have a non-canceled notice:
- show a create error alert
- show a conflict list inside the alert

Each conflict item may include only:
- link to the lesson details page
- lesson date
- time range
- subject name
- current notice status, when available

If lesson metadata is unavailable for a conflict item:
- show the fallback lesson-id-based text state
- do not invent the missing lesson details

2j. Filters bar
Below the create section, keep the real filters bar for the student notices list.

Student page must include only these filters:
- status select
- date from
- date to

Status options on the student page:
- All statuses
- Submitted
- Canceled

Important restriction:
- do not show subject filter on the student page
- do not show group filter on the student page

2k. Notices list section
This is the real notices-history list for the student page.

Required states:
- loading
- global load error alert above the section
- empty because there are no notices at all
- empty because current filters returned no results
- populated table
- load more state

Required structure:
- section card
- table layout on desktop
- mobile adaptation that still preserves the same information

Table columns must be exactly:
- Date
- Notice type
- Reason
- Submitted at
- Actions

Row content mapping:
- Date column: formatted notice period
- Notice type: absent or late
- Reason: reason text or empty placeholder
- Submitted at: notice submittedAt
- Actions:
  - editable notice -> Edit action
  - non-editable notice -> muted unavailable text

Real manageability rule:
- only notices with status SUBMITTED are manageable
- notices with status CANCELED cannot be edited and must show unavailable action text

Important restriction:
- do not add a visible Status column
- do not add subject column
- do not add file column
- do not add approval column
- do not add lesson count column

2l. Pagination
The page supports loading more notices.

Required UI:
- Load more button below the table section when nextCursor exists
- loading state for the button

Do not redesign this as infinite scroll.

2m. Edit notice modal
This modal is real and must be included in the design.

Required states:
- closed state
- open state
- save submitting
- cancel submitting
- validation / request error

Required structure:
- modal title
- two metadata blocks
  - Date
  - Submitted at
- error alert area
- notice type selector
- optional reason textarea with helper text and counter
- action row

Important real behavior:
- the modal edits only:
  - notice type
  - reason
- the modal does not allow changing lesson selection
- the modal does not allow changing dates
- the modal does not allow file attachments

Actions in the modal must be exactly:
- Close
- Save
- Cancel notice

Real behavior:
- Save updates the existing notice
- Cancel notice changes the notice status to canceled
- there is no separate confirmation modal in the current flow

Important restrictions:
- do not add delete confirmation dialog
- do not add lesson picker in the edit modal
- do not add attachment controls
- do not add teacher comment thread

2n. Success messages
There are two real success-message contexts:
- create success inside the create section
- action success above the list after edit or cancel

Design both, but keep them simple and calm.
Do not turn them into large celebratory banners.

2o. What must not appear on Student Absence Requests
Do not add any of the following:
- file attachments
- evidence upload
- teacher comments
- teacher response history
- approval timeline
- subject filter
- group filter
- search bar
- tabs
- kanban states
- analytics charts
- attendance heatmaps
- reason templates
- mass edit of existing notices
- notice detail page

3. Prototype interactions to include
In the prototype, support only these real interactions:
- click editable profile field -> inline edit state
- blur profile field -> save
- press Enter in profile input -> save
- press Escape in profile input -> cancel
- click back on profile -> go to /dashboards/student/schedule
- switch absence create mode between RANGE and SINGLE
- change date range
- select lessons in RANGE mode
- select one lesson in SINGLE mode
- choose notice type
- submit create form
- open Edit modal from manageable notice row
- close Edit modal
- save Edit modal
- cancel notice from Edit modal
- click lesson link in conflict state -> go to /dashboards/student/lessons/:lessonId
- click Load more on notices list

Do not create any other prototype flows.

4. Dynamic placeholder policy
Use structured placeholders for every dynamic value instead of fabricated content.

Profile placeholders:
- [Display Name]
- [Email]
- [Role]
- [Member Since Date]
- [First Name]
- [Last Name]
- [Phone]
- [Birth Date]
- [Student ID]
- [Chinese Name]
- [Faculty]
- [Course]
- [Enrollment Year]
- [Group Name]

Absence-request placeholders:
- [Date From]
- [Date To]
- [Lesson Date]
- [Start Time]
- [End Time]
- [Subject Name]
- [Notice Period]
- [Submitted At]
- [Reason]
- [Conflict Status]

Do not replace them with realistic fake examples.

5. Output expectations
Produce polished desktop and mobile designs for:
- student Profile page
- student Absence Requests page
- student absence-notice Edit modal
- key loading, error, empty, validation, success, and submitting states

Preserve the approved student-dashboard visual language.
Keep the layouts implementation-friendly.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
