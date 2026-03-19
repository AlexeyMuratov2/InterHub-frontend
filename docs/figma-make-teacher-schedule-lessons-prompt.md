# Figma Make Prompt: Teacher Dashboard, Schedule, And Lessons

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and student dashboard designs.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the teacher dashboard.
- Work only on:
  - /dashboards/teacher/schedule
  - /dashboards/teacher/lessons
  - /dashboards/teacher/lessons/:lessonId
- Include the real modal and dialog flows that belong to these routes.
- Do not redesign auth.
- Do not redesign dashboard selector.
- Do not redesign administrator dashboard.
- Do not redesign student dashboard.
- Preserve the approved design language already used for the student dashboard.

Important design guidance:
- You may reuse the approved student schedule visual system where the behavior is the same.
- The teacher schedule should feel visually related to the student schedule.
- The teacher lesson details page should still feel part of the same product.
- Keep the overall tone serious, academic, restrained, and implementation-friendly.

Critical product-accuracy rule:
- Do not invent new teacher features.
- Do not invent new teacher data.
- Do not invent new tabs, filters, analytics, or workflows.
- Do not remove any real teacher functionality that already exists in the project.
- Every visible block in this design must have technical support in the current codebase.
- If a backend field exists but the current teacher schedule / lesson screens do not actually surface it, do not expose it in the design.

Examples of data that exist in DTOs but must NOT be surfaced here because the current teacher screens do not show them:
- attendance counts summary cards
- roster row teacherComment
- roster row markedAt
- roster row markedBy
- roster row attachedAbsenceNoticeId
- composition group/program/curriculum metadata on the lesson page
- offering notes on the lesson page
- extra teacher profile cards on the lesson page

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake content.
- Example placeholders:
  - [Subject Name]
  - [Group Code]
  - [Group Name]
  - [Room]
  - [Lesson Topic]
  - [Lesson Date]
  - [Start Time]
  - [End Time]
  - [Lesson Type]
  - [Lesson Status]
  - [Student Name]
  - [Student ID]
  - [Lesson Points]
  - [Material Name]
  - [Material Description]
  - [Published At]
  - [Homework Title]
  - [Homework Description]
  - [Homework Points]
  - [File Name]
  - [Submitted At]
  - [Grade Points]

Do not fabricate:
- concrete subject names
- concrete student names
- concrete group codes
- realistic room numbers
- realistic grades
- realistic attendance histories
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

1. Teacher schedule page
Design /dashboards/teacher/schedule as the real teacher weekly schedule page.

This page should stay very close to the student schedule design because the real behavior is almost the same.
The difference is in the lesson block content and the lesson modal details.

1a. Real page states
Design these real states:
- loading
- lessons load error
- semester not found informational state
- empty week
- populated week

1b. Real page structure
Required structure:
- page title area
- schedule toolbar
- semester line
- weekly timetable grid

The toolbar must include:
- anchor-date picker
- current week range
- Today button
- Previous week button
- Next week button

Real behavior:
- the selected anchor date defines the visible ISO week
- the semester line reflects the selected date when available
- if semester is unavailable, show a calm informational state without breaking the layout

1c. Weekly grid
Required layout:
- Monday to Sunday columns
- time axis
- desktop-first timetable
- mobile adaptation that remains usable

Every lesson block must use only the real teacher schedule fields already shown in the project:
- subject name
- lesson date
- start time
- end time
- lesson status
- lesson type
- group line
- room line when available
- lesson topic when available

Important difference from the student schedule:
- teacher lesson cards show the group line instead of a teacher line

Teacher lesson-card content mapping:
- main title: [Subject Name]
- secondary lines, in this order when available:
  - [Group Code] or [Group Code] ([Group Name])
  - [Room]
  - [Lesson Topic]

Support these lesson types:
- LECTURE
- PRACTICE
- LAB
- SEMINAR
- custom fallback when type is missing

Support these lesson statuses:
- PLANNED
- CANCELLED
- DONE

Visual requirements:
- cancelled lessons need a clear cancelled treatment
- done lessons need a different treatment from planned
- lesson type badge should remain visible

Do not add:
- filters by group
- filters by subject
- search
- export
- monthly calendar
- teacher workload charts
- attendance summaries
- grading summaries

1d. Teacher lesson modal from schedule
Clicking a lesson in the weekly schedule opens a read-only teacher lesson modal.

Required content:
- subject title
- lesson status badge
- lesson type badge
- date
- time
- status
- type
- group
- room
- topic
- small details line with lesson ID

Required actions:
- Go to lesson
- Close

Important restrictions:
- this modal is read-only
- do not add edit controls inside the modal
- do not add attendance controls inside the modal
- do not add material or homework editing inside the modal

2. Lessons route behavior
The sidebar contains a Lessons item, but the lessons index route is not a standalone data-rich page.

Important real-project truth:
- /dashboards/teacher/lessons redirects to /dashboards/teacher/schedule

Design guidance:
- keep the Lessons menu item in the teacher shell
- do not invent a teacher lessons list page
- do not invent lesson archive, filters, or search
- if the prototype needs to represent /dashboards/teacher/lessons, keep it equivalent to the schedule entry point

3. Teacher full lesson details page
Design /dashboards/teacher/lessons/:lessonId as the real teacher lesson working page.

This page is much richer than the student lesson page and is the main teacher operating surface for one lesson.

3a. Real page states
Design these real states:
- loading
- not found / no access
- generic load error
- populated state
- empty materials
- empty homework
- attendance loading
- attendance error
- no students
- homework-submissions empty states

3b. Top area
Required structure:
- back link to /dashboards/teacher/lessons
- hero with subject title and lesson date/time
- Edit lesson button in the hero

Important behavior:
- the back link leads to the teacher lessons entry point, which resolves to the teacher schedule flow

Do not add:
- breadcrumbs
- teacher stats in the hero
- duplicate action bars

3c. Lesson information section
This section exists and must stay compact.

Use an information grid similar to the current UI.

Only include these real fields that are actually shown:
- subject
- date
- time
- room
- teacher
- lesson type, when present
- topic, when present

Important restrictions:
- do not add group tile here
- do not add curriculum details here
- do not add offering details here
- do not add semester / credits / hours
- do not add teacher cards

4. Edit lesson modal
The hero action opens the real lesson-edit modal.

Required states:
- normal edit state
- field validation error
- generic form error
- saving
- delete confirm open
- deleting

This modal must allow editing only the real fields currently supported:
- start time
- end time
- room
- topic
- status

Status options must be exactly:
- PLANNED
- CANCELLED
- DONE

Room behavior:
- room is optional
- room comes from the real list of rooms
- include a no-room option

Validation rules already present in the real project:
- start time is required
- end time is required
- end time must be after start time

Delete behavior:
- the modal contains a Delete lesson action
- deleting opens a confirmation modal

Important restrictions:
- do not allow changing lesson date
- do not allow changing subject
- do not allow changing group
- do not allow changing teachers
- do not add recurring edit tools

5. Lesson materials section
This section is real and teacher-managed.

Required structure:
- section card
- Add material button
- empty state or list of materials

Each material item in the list may show only:
- material name
- material description when present
- file cards for attached files
- edit-material action
- delete-material action

Each attached file card on the page may support:
- download
- delete file from material

Delete material and delete file both use the shared confirmation modal.

5a. Create material modal
The Add material button opens the lesson material modal in create mode.

Create-mode fields must be exactly:
- name
- description
- publishedAt
- multiple file upload area

Real validation / constraints:
- name is required
- name max length is 500
- description is optional
- description max length is 5000
- publishedAt is required
- files are optional
- multiple files are allowed

5b. Edit material modal
The Edit action on a material opens the same modal in edit mode.

Critical technical restriction:
- in the current real project, edit mode does NOT support changing name, description, or publishedAt through the API contract
- edit mode only supports adding files to an existing material

Therefore the design must reflect this truth:
- show name, description, and publishedAt as visible but disabled / read-only in edit mode
- show existing files with download only
- show a separate upload area for adding more files
- do not add editable text fields in practice
- do not add delete-existing-file inside the edit modal

Important restrictions:
- do not add visibility controls
- do not add publish/unpublish switch
- do not add external links
- do not add categories or tags

6. Homework assignment section
This section is real and teacher-managed.

Required structure:
- section card
- Add homework button
- empty state or list of homework items

Each homework item on the page may include only:
- homework title
- homework description when present
- points when present
- attached file cards
- edit homework action
- delete homework action

On the lesson page itself, attached homework files support download.
Delete homework uses the shared confirmation modal.

6a. Homework modal
The Add homework button and the Edit homework action open the homework modal.

Fields must be exactly:
- title
- description
- points
- files

Real validation / constraints:
- title is required
- title max length is 500
- description is optional
- description max length is 5000
- points are optional
- points must be non-negative when provided
- multiple files are allowed

Create mode behavior:
- upload new files

Edit mode behavior:
- show existing files
- existing files can be downloaded
- existing files can be removed from the homework
- new files can be added

Important restrictions:
- do not add due date
- do not add deadline countdown
- do not add rubric builder
- do not add grading scheme editor
- do not add assignment-to-groups controls

7. Shared confirmation modal
There is a real shared confirmation modal pattern on the lesson page.

It is used for:
- deleting a lesson
- deleting a lesson material
- deleting a file from a lesson material
- deleting homework

Design a simple reusable confirm modal with:
- title
- short message
- cancel
- confirm

Do not add extra warning flows or multi-step deletes.

8. Students tab inside the lesson page
The lower lesson-management area has two tabs.
The first tab is the students / attendance tab.

Required tab buttons:
- Students
- Homework submissions

Students tab required states:
- loading
- error
- empty no students
- populated table

8a. Attendance table
Table columns must be exactly:
- Student
- Attendance status
- Points
- Absence notice

Each student row may include only:
- student display name
- attendance status select
- lesson points numeric input
- absence-notice cell

Attendance status select must include exactly these visible options:
- Unmarked
- Present
- Absent
- Late
- Excused

Lesson points behavior:
- numeric input
- min 0
- step 0.01
- save on blur

Absence notice cell behavior:
- if there are no active notices, show muted “no notice” text
- if there are active notices, show a button with a label based on active absent / late counts
- button highlight changes depending on the notice type mix
- clicking opens the absence notices dialog for that student

Important restrictions:
- do not add bulk attendance actions
- do not add teacher comments column
- do not add marked-at column
- do not add attached notice id column
- do not add attendance summary cards

9. Absence notices view dialog
This dialog opens from the attendance table.

Required states:
- empty
- populated list

Required content per notice:
- withdrawn banner when status is CANCELED
- notice type badge
- notice status badge when not withdrawn
- submittedAt info tile
- reason block when present
- attachments list when fileIds exist

Status support must include:
- SUBMITTED
- APPROVED
- REJECTED
- CANCELED

Notice type support must include:
- ABSENT
- LATE

Attachment behavior:
- attachments are shown as a list of generic file rows
- each file row supports download

Required action:
- Close

Important restrictions:
- do not add approve / reject actions here
- do not add teacher response form here
- do not add notice editing here

10. Homework submissions tab
The second tab on the lesson page is the homework-submissions matrix.

Required states:
- loading
- error
- no homework
- no students
- populated table

10a. Table structure
This is a matrix table, not cards or kanban.

Top header row:
- first column: Student
- then one grouped header per homework

Each homework header must contain only:
- homework title
- Download archive button

Second header row for each homework:
- Files
- Points
- Description

Important restrictions:
- do not add search
- do not add sorting controls
- do not add submission-status column
- do not add bulk grading
- do not add export other than the real archive button per homework

10b. Student row
The first cell in each row must include:
- student display name
- student ID

For each homework cell group:

Files cell:
- no files -> muted dash
- exactly one file -> direct file download button using the real file name
- multiple files -> button showing files count and opening the files modal

Points cell:
- if submission exists, show a button with current points and pencil icon
- clicking opens the grade dialog
- if there is no submission, do not invent grading controls

Description cell:
- show submission description text when present
- truncate long text by default
- support Show full / Show less toggle
- show submitted timestamp when submission exists

Important restrictions:
- do not add student avatars here
- do not add submission status chips
- do not add submission preview thumbnails
- do not add teacher feedback thread inside the table

10c. Files modal
When a homework submission has multiple files, open a files modal.

Required content:
- list of file cards
- file title
- file size
- uploadedAt
- content type when present
- download action

Important restrictions:
- no delete
- no rename
- no annotate

10d. Grade dialog
Clicking the points button opens the real homework grade dialog.

Required states:
- loading existing grade state
- error
- edit/create form
- saving

Required content:
- dialog title
- compact context line with student display name and homework title
- points input
- optional description textarea
- cancel
- save

Real grading behavior:
- this dialog either creates a new grade entry or updates an existing one
- grade type is fixed by the implementation and should not be editable in the UI
- max points from the homework should be visible when available

Important restrictions:
- do not add grade type selector
- do not add rubric
- do not add pass/fail toggle
- do not add private note fields beyond the single description field
- do not add grade history in this dialog

11. What must not appear anywhere in this iteration
Do not add any of the following unless they already exist in these teacher schedule / lesson flows, which they do not:
- separate lessons list page
- search on schedule
- analytics or KPI cards
- workload charts
- attendance summary donut charts
- grading dashboard
- AI recommendations
- teacher chat
- announcements feed
- recurring lesson editor
- lesson duplication
- syllabus panel
- student profile side drawer
- attendance bulk import
- CSV export
- rubric designer
- assignment deadline controls
- approval controls inside absence dialog

12. Prototype interactions to include
Support only these real interactions:
- click lesson block in schedule -> open teacher lesson modal
- click Go to lesson in the modal -> open /dashboards/teacher/lessons/:lessonId
- click Lessons in sidebar -> equivalent schedule entry point
- click Edit lesson -> open lesson edit modal
- save lesson edits
- open lesson delete confirm
- add material
- edit material
- delete material
- delete material file
- add homework
- edit homework
- delete homework
- switch between Students and Homework submissions tabs
- change attendance status
- change lesson points and blur
- open absence notices dialog
- open multi-file submissions modal
- open grade dialog from points cell
- save grade dialog
- click Download archive in homework header

Do not create any other prototype flows.

13. Output expectations
Produce polished desktop and mobile designs for:
- teacher Schedule page
- teacher lesson modal
- teacher full lesson details page
- lesson edit modal
- lesson material create mode
- lesson material edit mode
- homework create/edit modal
- shared delete confirm modal
- absence notices view dialog
- homework submissions tab
- submissions files modal
- homework grade dialog
- key loading, error, empty, and saving states

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
