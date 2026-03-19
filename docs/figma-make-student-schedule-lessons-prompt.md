# Figma Make Prompt: Student Dashboard, Schedule, And Lessons

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow and dashboard foundations. This prompt should extend only the student dashboard.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the student dashboard.
- Do not redesign the auth flow.
- Do not redesign the teacher dashboard.
- Do not redesign the administrator dashboard.
- Preserve the current visual language and continue it faithfully.

Design direction to preserve:
- Official university portal
- Light academic theme
- Blue and white dominant palette
- Restrained, calm, serious, trustworthy
- Clean white surfaces, subtle blue atmosphere, refined hierarchy
- No startup SaaS styling
- No heavy gradients, no flashy analytics, no playful illustrations

Important product accuracy rule:
- Do not invent new features.
- Do not invent data that does not exist in the real project.
- Do not remove existing student functionality.
- If something is not implemented in the real project yet, keep it as a neutral placeholder instead of faking real content.

Student dashboard routes to support in the design:
- /dashboards/student
- /dashboards/student/schedule
- /dashboards/student/lessons
- /dashboards/student/lessons/:lessonId

Important routing truth from the real project:
- The current real student dashboard route /dashboards/student does not have a finished home page yet.
- The current real lessons index route /dashboards/student/lessons is not a separate data-rich page yet; it redirects to /dashboards/student/schedule.
- The real student lesson experience is:
  weekly schedule -> lesson modal -> full lesson details page

Because of that, design the student area like this:

1. Student dashboard home: placeholder only
Create a lightweight placeholder landing page for /dashboards/student.

Requirements:
- This page should establish structure only.
- Do not use fake KPI numbers.
- Do not use fake attendance percentages.
- Do not use fake deadlines, fake announcements, fake upcoming lessons, or fake charts.
- Keep it honest and minimal.

Allowed content:
- A welcome block for the student dashboard
- A short descriptive message that this area will expand later
- Neutral structural cards linking to real student sections:
  - Schedule
  - Lessons
  - Subjects
  - Absence Requests
  - Profile

These cards must be structural only:
- no counts
- no fabricated dates
- no fabricated task lists
- no fabricated teacher names

Sidebar and shell for the student dashboard must stay aligned with the real project:
- Dashboard
- Schedule
- Lessons
- Subjects
- Absence Requests
- Profile

2. Student schedule page
Design /dashboards/student/schedule as the main real student working screen.

This page is a weekly schedule view.

Required top-level structure:
- Keep the existing student dashboard shell
- Page hero / page title area for Schedule
- Main schedule section card
- Weekly toolbar
- Semester context line or semester info state
- Weekly schedule grid

Schedule toolbar behavior:
- A date picker controls the anchor date
- The selected date defines the visible ISO week
- Show the week range for the selected week
- Provide three controls:
  - Today
  - Previous week
  - Next week
- The selected date should feel persistent, but do not add extra settings UI for this

Semester behavior:
- Show semester information for the selected date when available
- Use a single semester line near the top of the schedule section
- The semester line should support:
  - semester name when available
  - otherwise a fallback based on semester number
  - semester start date
  - semester end date
- If the semester is not found for the selected date, show a calm informational state instead of breaking the layout

Schedule page states to design:
- loading state
- weekly lessons load error
- semester not found informational state
- empty week state
- normal populated state

Weekly schedule grid requirements:
- Monday to Sunday columns
- time axis vertically
- desktop-first weekly timetable layout
- mobile adaptation that still remains usable and clear
- weekends remain visible
- clicking or tapping a lesson opens a student lesson modal

Every lesson item in the grid must be built only from real data already available in the project:
- subject name
- lesson date
- lesson start time
- lesson end time
- lesson status
- lesson type
- room line when available
- teacher line when available
- lesson topic when available

Visual requirements for each lesson block:
- show time range
- show subject name as the main title
- show lesson type badge
- show a cancelled badge if status is CANCELLED
- visually differentiate DONE and CANCELLED states from PLANNED
- show secondary lines only from real data:
  - room
  - teacher
  - topic

Lesson type values that must be supported:
- Lecture
- Practice
- Lab
- Seminar
- Custom fallback when type is missing

Lesson status values that must be supported:
- Planned
- Cancelled
- Done

Do not add to the schedule page:
- subject filters
- teacher filters
- search
- export
- attendance statistics
- grade summaries
- homework summaries
- notifications feed inside the page
- month calendar view
- fake upcoming tasks

3. Student lesson modal from the schedule page
When a lesson is selected in the schedule, open a read-only modal.

This modal must not become an editing surface.

Required content in the student lesson modal:
- subject title
- lesson date
- lesson time
- lesson status
- lesson type
- teacher
- group
- room
- topic
- a small technical details line with the lesson ID

Required actions:
- View full lesson details
- Close

Behavior notes:
- This modal is read-only for students
- Do not add edit or delete controls
- Support missing values gracefully with empty-state placeholders, not broken layout

4. Student lessons route behavior
Keep the Lessons item in the sidebar because it exists in the real project.

But do not invent a standalone student lessons index page with fake content.

Important real-project constraint:
- /dashboards/student/lessons currently redirects to /dashboards/student/schedule

Design guidance:
- If you need to represent /dashboards/student/lessons in the prototype, keep it equivalent to the schedule entry point or a lightweight bridge state
- Do not add a fabricated lesson list, filters, or lesson archive page
- The real lesson exploration path for the student is still:
  schedule -> lesson modal -> full lesson details

5. Full student lesson details page
Design /dashboards/student/lessons/:lessonId as a detailed, student-facing lesson page.

This is the most important page in this iteration after the schedule itself.

Required page structure:
- Back link to the student lesson entry point
- Hero section with subject name and lesson date/time
- Prominent action button: Submit absence request
- Subject / lesson information section
- Teachers section
- Lesson materials section
- Homework assignment section
- Homework submission section

Full lesson page states to design:
- loading
- not found / no access
- generic load error
- normal populated state
- empty materials state
- empty homework state

Use only real data already available for full lesson details.

Real lesson data available in the project:
- lesson:
  - id
  - date
  - startTime
  - endTime
  - topic
  - status
- subject:
  - code
  - chineseName
  - englishName
  - description
- group:
  - code
  - name
  - startYear
  - graduationYear
- offering:
  - format
  - notes
- offeringSlot:
  - dayOfWeek
  - startTime
  - endTime
  - lessonType
- curriculumSubject:
  - semesterNo
  - courseYear
  - durationWeeks
  - credits
  - hoursTotal
  - hoursLecture
  - hoursPractice
  - hoursLab
  - hoursSeminar
  - hoursSelfStudy
  - hoursConsultation
  - hoursCourseWork
- room:
  - buildingName
  - number
- teachers:
  - display name
  - role
  - optional position
- materials:
  - material name
  - material description
  - files
- homework:
  - title
  - description
  - points
  - files

5a. Hero
Required hero content:
- subject name as the main title
- lesson date and time as the subtitle

5b. Subject / lesson information section
Use clean info tiles or a similar structured layout.

This section must include the real lesson-facing fields:
- subject
- date
- time
- room
- lesson type
- topic if present

Because the full details payload also already contains more academic context, add a compact secondary metadata area so this data is not lost, but keep it secondary and unobtrusive.

Secondary metadata may include only already-available real fields:
- group code / group name
- offering format
- offering notes
- curriculum semester number
- curriculum course year
- duration weeks
- credits
- available hour breakdown fields when present

Do not turn this into a heavy admin-style table.
Keep it readable and student-friendly.

5c. Teachers section
Display the teachers assigned to the lesson / offering.

Each teacher card may include only real fields:
- teacher name
- teacher role
- optional teacher position

Support role labels:
- Main teacher
- Lectures
- Practice
- Lab
- Seminar

If the full teacher list is missing, still support the main teacher fallback.

5d. Lesson materials section
This section is student read-only.

For each material, display:
- material name
- material description if present
- attached files

For each attached file, display only real file data:
- file name
- file size
- download action

Do not add:
- edit material
- delete material
- upload material
- teacher notes panel

5e. Homework assignment section
This section is also read-only for the assignment definition itself.

For each homework item, display:
- homework title
- homework description if present
- points if present
- attached files with download action

Do not add fields that are not present on this screen:
- no due date unless real data is available here
- no teacher grading UI
- no fake rubric
- no submission deadline countdown

5f. Homework submission section
This is student-actionable and must be detailed carefully.

There can be multiple homework assignments on one lesson page.
The student can have at most one submission per homework, and a new submission replaces the previous one.

For each homework, support these states:
- no submission yet
- submission exists
- replacing an existing submission
- delete confirmation
- submit loading
- submit error
- delete error

No-submission state UI:
- optional comment textarea
- attachments area
- drag and drop upload area
- ability to add multiple files
- ability to remove files before submit
- primary action: Submit solution

Existing-submission state UI:
- submitted timestamp
- student comment if present
- attached submitted files
- file download action
- Replace action
- Delete action

Form and behavior rules already present in the real project:
- comment is optional
- comment field supports long text up to 5000 characters
- file upload is supported
- multiple files are allowed
- submission creation uploads files first, then sends stored file IDs
- deleting a submission requires confirmation
- replacing a submission uses the same one-submission-per-homework model

Do not add:
- grade editing
- teacher feedback entry form
- score editing
- peer comments
- discussion thread

6. Absence request action and dialog
The full lesson page must include a prominent action for the student:
- Submit absence request

This opens a lesson-specific absence request dialog.

Important accuracy rule:
- In this lesson-specific student dialog, do not add file upload
- Even though the broader API supports file IDs, this exact dialog currently submits with an empty file list
- Keep the dialog faithful to the real student lesson flow

Required absence request dialog content:
- title for an absence request for this lesson
- lesson subject
- lesson date/time
- notice type selector with exactly two options:
  - Absent
  - Late
- optional reason textarea
- reason helper text
- visible character counter
- cancel action
- submit action

Behavior rules already present in the real project:
- this dialog is for one lesson only
- notice type defaults to Absent
- reason is optional
- reason length limit is 2000 characters
- show submitting state
- show success state
- show error state
- after success, the dialog can close automatically

Do not add:
- multi-lesson selection
- date range selection
- file attachments
- teacher approval workflow UI inside this dialog

7. What not to invent anywhere in this iteration
Do not add any of the following unless they already exist in the real student schedule / lesson flow:
- fake attendance percentages on the dashboard home
- fake GPA or fake point totals
- fake lesson reminders
- fake course progress rings
- fake charts
- chat with teacher
- lesson comments feed
- grade editing
- attendance marking controls
- lesson editing
- material editing
- homework creation
- separate lesson search and filtering system
- standalone lessons list with fabricated content

8. Output expectations
Update only the student dashboard design so that it includes:
- a placeholder student dashboard home
- a real schedule page
- a real student lesson modal
- a real full lesson details page
- key loading, error, empty, submission, and absence-request states
- desktop and mobile adaptations

Use English UI copy if needed, but keep the layout compatible with Russian and Simplified Chinese expansion.
```
