# Figma Make Prompt: Teacher Lesson Details Extension

Use this as a continuation prompt in the same Figma Make project that already contains the approved teacher schedule / lessons design.

```text
Continue the existing InterHub Figma Make project.

This is a refinement iteration for the already approved teacher lesson-details design.
Do not redesign the teacher dashboard from scratch.
Do not change the approved general style.

Scope for this iteration:
- Work only on /dashboards/teacher/lessons/:lessonId
- Refine only the teacher lesson-details page that already exists in the mockup
- Add concrete populated designs for:
  - the lesson materials section
  - the homework assignment section
  - the lower students / homework-submissions management area
  - the absence notices dialog opened from the students area
  - the homework-submission files modal
  - the homework grade dialog
- Keep the already approved teacher shell, page hero, lesson information section, and overall layout language consistent
- Do not redesign /dashboards/teacher/schedule
- Do not redesign /dashboards/teacher/subjects
- Do not redesign other teacher routes

Critical anti-hallucination rule:
- Do not invent any new teacher-lesson features
- Do not invent any new tabs, slides, panels, or routes
- Do not invent any new fields
- Do not invent any new actions
- Do not remove any real functionality that already exists on the current teacher lesson page
- Every visible block in this design must map to something that is already implemented on the real page
- If a field exists in DTOs but is not actually rendered on the current teacher lesson screens, do not show it

Very important clarification:
- This prompt extends the teacher lesson-details page, not the teacher subject-details page
- Do not merge /dashboards/teacher/subjects/:id with /dashboards/teacher/lessons/:lessonId
- The lower area in the real app is a two-view management block
- If the current approved mockup visually presents that lower area as a carousel-like container, keep the approved visual container if needed, but the real content inside it must still map to exactly these two real views and nothing else:
  - Students
  - Homework submissions
- Do not add a third view
- Do not add a different navigation model for this area

Data-accuracy rule:
- Use structured placeholders in square brackets instead of realistic fake values
- If you need multiple example rows or items, add numeric suffixes
- Good examples:
  - [Subject Name]
  - [Lesson Date]
  - [Start Time]
  - [End Time]
  - [Material Name 1]
  - [Material Description 1]
  - [Homework Title 1]
  - [Homework Description 1]
  - [Homework Points 1]
  - [Student Name 1]
  - [Student ID 1]
  - [File Name 1]
  - [Uploaded At 1]
  - [Submitted At 1]
  - [Grade Points 1]
- Do not replace placeholders with realistic names, real-looking student IDs, real-looking room numbers, real-looking filenames, or realistic timestamps

Preserve the approved visual direction:
- serious university portal
- blue and white dominant palette
- restrained and academic
- calm white surfaces
- clear information hierarchy
- no startup SaaS feel
- no analytics-dashboard styling
- no flashy gradients

1. General rule for this iteration
The goal is to make the teacher lesson page feel implementation-ready by showing how the real populated states look.

Keep the top part of the page aligned with the already approved design:
- back link
- hero
- lesson information section
- edit lesson flow

This iteration should primarily extend the populated working states below that top area.

2. Lesson materials section: show the real populated state
This page already has a teacher-managed lesson materials section.
Do not turn it into a library page or resource center.

Required section structure:
- section card
- Add material button in the section header area
- populated list of lesson materials

Populate this section with a real-looking structural example, using placeholders only.

Each material item may include only the fields and actions that already exist on the real teacher lesson page:
- material name
- material description when present
- attached file cards
- edit material action
- delete material action

Each attached file card on the page may include only:
- file title
- file size
- uploadedAt
- content type when present
- download action
- delete action

Design request:
- show at least two populated material items so the final mockup demonstrates the real card/list behavior
- show one material item with a description
- show one material item without a description
- show at least one material item with more than one attached file so the file-card grouping is visible
- keep the list practical and compact, not gallery-like

Important restrictions:
- do not add categories
- do not add visibility badges
- do not add publish/unpublish switches
- do not add author names
- do not add version history
- do not add comments
- do not add preview thumbnails
- do not add a separate material details page

3. Add / edit material flow must remain technically accurate
The teacher lesson page already has add-material and edit-material modal flows.
Do not replace them with a different editing model.

Keep the existing real behavior:
- create mode allows:
  - name
  - description
  - publishedAt
  - multiple file upload
- edit mode does not truly edit the core metadata through the current API
- in edit mode, name / description / publishedAt must stay visible but read-only
- edit mode focuses on adding more files to an existing material
- existing files in the edit modal are visible with download only
- do not add delete-existing-file inside the edit modal

If the mockup already contains the add/edit material dialogs, preserve them and make the populated list visually consistent with those dialogs.

4. Homework assignment section: show the real populated state
This page already has a teacher-managed homework assignment section.
Do not redesign it into a grading dashboard or assignment center.

Required section structure:
- section card
- Add homework button in the section header area
- populated list of homework items

Each homework item may include only the fields and actions that already exist on the real teacher lesson page:
- homework title
- homework description when present
- homework points when present
- attached file cards
- edit homework action
- delete homework action

Attached homework files on the lesson page may support only:
- download

Design request:
- show at least two populated homework items so the mockup demonstrates the real list behavior
- show one homework item with points
- show one homework item without points
- show one homework item with attached files
- show one homework item without attached files
- keep the layout obviously related to the already approved add/edit homework dialog

Important restrictions:
- do not add due date
- do not add deadline
- do not add late-submission status
- do not add assignment categories
- do not add submission counters
- do not add grading summaries
- do not add rubric controls
- do not add feedback threads
- do not add per-homework analytics

5. Lower lesson-management area: extend the real populated states
The lower area of the teacher lesson page must represent only the two real views already implemented on the project:
- Students
- Homework submissions

Do not add more views.
Do not add overview cards above these views.
Do not add summaries, charts, or KPI strips.

If the current approved design already has a bottom carousel-like block, keep its visual style if needed, but fill it only with the real content of these two views.

6. Students view: exact real table
Design the Students view as the real attendance / lesson-points table.

Required states to support visually:
- loading
- error
- empty no-students state
- populated table

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

Attendance status select options must be exactly:
- Unmarked
- Present
- Absent
- Late
- Excused

Lesson points behavior to reflect:
- numeric input
- minimum 0
- decimal step support
- value saves on blur

Absence notice cell behavior to reflect:
- when there are no active notices, show muted no-notice text
- when there are active notices, show the notice button
- the button label depends on active absent / late notice counts
- the visual emphasis changes depending on whether the active notice mix is absent-focused or late-focused
- clicking the button opens the absence notices dialog

Design request for the populated table:
- show several example rows using placeholders only
- make sure the populated design demonstrates:
  - a row with no notice
  - a row with at least one active absent notice
  - a row with at least one active late notice
  - different attendance values across rows
- keep the row design compact and operational, not decorative

Important restrictions:
- do not add student avatars
- do not add email
- do not add teacher comments
- do not add marked-at metadata
- do not add marked-by metadata
- do not add attached notice IDs
- do not add bulk attendance actions
- do not add attendance summary cards
- do not add student profile shortcuts

7. Absence notices dialog: show the real populated state
The Students table can open the absence notices dialog for one student.

Required dialog states:
- empty
- populated list

For each notice, include only the real fields already shown:
- withdrawn banner when status is CANCELED
- notice type badge
- notice status badge when not withdrawn
- submittedAt info tile
- reason block when present
- attachments list when fileIds exist

Supported notice statuses:
- SUBMITTED
- APPROVED
- REJECTED
- CANCELED

Supported notice types:
- ABSENT
- LATE

Attachment behavior:
- attachments are shown as a simple list of file rows
- each file row supports download

Design request:
- show a populated example that demonstrates at least:
  - one active notice
  - one canceled notice with the withdrawn treatment
  - one attachment row
- use placeholders only for reason text, date-time, and file labels

Important restrictions:
- do not add approve / reject buttons
- do not add teacher response form
- do not add internal notes
- do not add editing controls
- do not add extra notice metadata beyond what the current dialog actually shows

8. Homework submissions view: exact real matrix
Design the Homework submissions view as the real matrix table already implemented in the project.

Required states to support visually:
- loading
- error
- no homework
- no students
- populated matrix

Critical layout rule:
- this must remain a matrix table
- do not redesign it into cards
- do not redesign it into kanban
- do not redesign it into nested accordions

Top header row:
- first column: Student
- then one grouped header per homework

Inside each homework header, include only:
- homework title
- Download archive button

Second header row for each homework:
- Files
- Points
- Description

Student first column content:
- student display name
- student ID

Files cell behavior:
- no files: muted dash
- one file: direct download button using the file name
- more than one file: button that opens the files modal

Points cell behavior:
- when a submission exists, show the points button with pencil icon
- clicking it opens the homework grade dialog
- when no submission exists, do not invent a grading control

Description cell behavior:
- show submission description text when present
- long text is truncated by default
- support Show full / Show less
- show submitted timestamp when a submission exists

Design request for the populated matrix:
- show at least two homework columns
- show at least two student rows
- make sure the example demonstrates:
  - one cell with no submission
  - one cell with one downloadable file
  - one cell with multiple files that open the files modal
  - one cell with a points button that already has a value
  - one cell with a points button that is still ungraded
  - one description cell with truncated text and Show full
- keep the design readable and implementation-friendly on desktop
- provide a realistic mobile adaptation that still respects the matrix logic instead of inventing unrelated cards

Important restrictions:
- do not add submission-status chips
- do not add plagiarism score
- do not add preview thumbnails
- do not add feedback thread
- do not add bulk grading
- do not add search
- do not add sorting controls
- do not add extra export actions beyond the real Download archive button per homework

9. Homework-submission files modal
When a submission contains multiple files, the real UI opens a files modal.

Required modal content:
- list of file cards
- file title
- file size
- uploadedAt
- content type when present
- download action

Design request:
- include one populated modal example linked from the matrix state
- keep it visually aligned with the existing file-card system already used elsewhere in the project

Important restrictions:
- no delete
- no rename
- no annotation
- no file previewer

10. Homework grade dialog
Clicking the points button opens the real homework grade dialog.

Required dialog states:
- loading existing grade
- error
- normal edit/create form
- saving

Required dialog content:
- dialog title
- compact context line with student display name and homework title
- points input
- optional description textarea
- cancel action
- save action

Real grading behavior to reflect:
- this dialog either creates a new grade entry or updates an existing one
- the grade type is fixed by the implementation
- the user does not choose grade type in the UI
- max points must be visible when available

Design request:
- show one concrete populated dialog example with placeholders only
- make the dialog feel consistent with the already approved modals on the teacher lesson page

Important restrictions:
- do not add grade type selector
- do not add rubric
- do not add pass/fail toggle
- do not add grade history
- do not add private multi-field feedback system
- do not add any extra grading metadata outside the current single description field

11. What must not appear anywhere in this iteration
Do not add any of the following:
- teacher analytics
- lesson KPI cards
- grading dashboard
- attendance charts
- average score summaries
- material categories
- homework deadlines
- homework status chips
- student avatars
- student email / phone
- chat or comments
- plagiarism tools
- AI recommendations
- extra tabs
- extra routes
- separate material details page
- separate homework details page
- separate student details drawer

12. Output expectations
Produce polished desktop and mobile refinements for:
- teacher lesson-details page with populated materials state
- teacher lesson-details page with populated homework state
- teacher lesson-details page with populated Students view
- teacher lesson-details page with populated Homework submissions view
- absence notices dialog
- homework-submission files modal
- homework grade dialog
- relevant loading / error / empty states for these areas

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
Treat this as an extension of the existing lesson-page design, not a fresh redesign.
```
