# Figma Make Prompt: Teacher Dashboard, Student Groups

Use this as a continuation prompt in the same Figma Make project that already contains the approved auth flow, dashboard selector, and teacher schedule / lessons / subjects design.

```text
Continue the existing InterHub Figma Make project.

Scope for this iteration:
- Work only on the teacher dashboard
- Work only on:
  - /dashboards/teacher/student-groups
  - /dashboards/teacher/student-groups/:groupId
- Include the real dialogs that can be opened from the group details page
- Do not redesign auth
- Do not redesign dashboard selector
- Do not redesign administrator dashboard
- Do not redesign student dashboard
- Do not redesign teacher schedule / lessons
- Do not redesign teacher subjects
- Preserve the already approved teacher-dashboard visual language

Visual direction to preserve:
- serious university portal
- blue and white dominant palette
- restrained and academic
- calm white surfaces
- clean hierarchy
- no startup SaaS styling
- no flashy gradients
- no KPI-dashboard look

Critical product-accuracy rule:
- Do not invent new teacher student-groups features
- Do not invent new routes
- Do not invent new tabs
- Do not invent new filters
- Do not invent new analytics blocks
- Do not invent new management actions
- Do not remove any real functionality that already exists on these screens
- If a backend field exists in DTOs but is not actually shown on the current teacher student-groups screens, do not surface it in the design

Very important anti-hallucination rule:
- The teacher Student Groups area is not the same as teacher Subjects
- It is also not the same as teacher Lessons
- Do not merge these flows
- Do not bring lesson materials management, homework creation, attendance editing, grading dialogs, subject materials upload, or schedule editing into teacher Student Groups
- This area is a read-and-drill-down monitoring view with history dialogs, not an editing workspace

Examples of data that exist in DTOs but must NOT be surfaced here because the current teacher student-groups screens do not show them:
- group description
- program code
- program description
- program degree level
- curriculum durationYears
- curriculum status
- curriculum notes
- semester startDate / endDate
- subject description
- subject departmentId
- group semesters as visible chips on cards
- offering format
- offering notes
- offering roomId
- offering teacherId
- slots schedule list
- teachers list
- curriculumSubjects array
- leader fromDate / toDate
- student faculty
- student course
- student enrollment year
- student groupName
- student user email
- grade-history breakdownByType
- raw homework submission ids

Dynamic-data rule:
- Use structured placeholders in square brackets instead of realistic fake values
- Example placeholders:
  - [Group Code]
  - [Group Name]
  - [Program Name]
  - [Curriculum Version]
  - [Curator Name]
  - [Students Count]
  - [Academic Year Name]
  - [Semester Name]
  - [Subject Name]
  - [Student English Name]
  - [Student Chinese Name]
  - [Student ID]
  - [Total Points]
  - [Attendance Percent]
  - [Homework Submitted Count]
  - [Lesson Date]
  - [Submitted At]
  - [Grade Points]
  - [Comment Text]
  - [Attachment Name]
- If you need multiple examples, add numeric suffixes such as [Student English Name 1]

Do not fabricate:
- realistic group codes
- realistic subject names
- realistic student IDs
- realistic curator names
- realistic comments
- realistic timestamps
- realistic percentages

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

1. Teacher Student Groups list page
Design /dashboards/teacher/student-groups as the real teacher student-groups list page.

1a. Real page structure
This page must keep the current real structure:
- page hero
- optional error alert area
- optional filters section
- groups list section

1b. Real page states
Design these states:
- loading
- generic load error
- empty list without active filters
- empty list after filters
- populated list

Important visibility rule:
- the filters section is shown only when loading is finished, there is no error, and there is at least one available filter dataset among academic years, semesters, or subjects
- do not force the filters section to appear when those datasets are all empty

1c. Hero
Required content:
- page title for teacher student groups
- short subtitle

Do not add:
- totals bar
- KPI cards
- average attendance
- top-performing group summary

2. Filters section on the list page
This section is real and must stay simple.

Required structure:
- section card
- section title
- three filter controls stacked in the current straightforward style:
  - academic year select
  - semester select
  - subject select

2a. Academic year filter
Required behavior:
- empty option for All
- options come from academicYears
- selected academic year filters groups by whether the group has at least one semester in that academic year

2b. Semester filter
Required behavior:
- empty option for All
- semester options come from semesters
- if an academic year is selected, the semester dropdown shows only semesters belonging to that academic year
- if the selected academic year changes and the current semester no longer belongs to it, the semester selection resets
- visible option label uses semester.name when available
- otherwise fallback uses semester number

2c. Subject filter
Required behavior:
- empty option for All
- options come from the distinct subjects list
- selected subject filters groups by subjectIds membership
- subject label must use localized display logic:
  - in Simplified Chinese context prefer Chinese name
  - otherwise prefer English name
  - fallback to the other localized name
  - final fallback is subject code or subject id

Important restrictions:
- do not add search
- do not add chips
- do not add multi-select
- do not add apply/reset buttons
- do not add sort controls
- do not add date-range controls

3. Groups list section
This section is real and must remain a simple card grid.

Required states:
- loading
- empty without filters
- empty with active filters
- populated grid

3a. Group card structure
Each group card navigates to /dashboards/teacher/student-groups/:groupId

Each card must contain only the real information currently shown:
- group display name
- student-count line
- program row
- curator row
- curriculum row

Group display name behavior:
- combine group code and group name into one title when available
- when both exist, display them together
- fallback to group id if needed

Student-count line behavior:
- the current implementation renders the student count as the short secondary line directly under the title
- do not redesign this into a rich stats block
- keep it compact and implementation-friendly

Program row:
- label + value
- value uses program.name or fallback to program.code

Curator row:
- label + value
- value uses curator firstName + lastName when available
- fallback to curator email
- fallback to dash when curator is absent

Curriculum row:
- label + value
- value uses curriculum.version
- fallback to dash

Important restrictions:
- do not add subject previews on the card
- do not add semesters chips
- do not add attendance stats
- do not add homework stats
- do not add leader badges on the card
- do not add quick actions
- do not add overflow menus

4. Group details page
Design /dashboards/teacher/student-groups/:groupId as the real group details page.

This page is not a teacher subject-details page and not a lesson page.
Its real scope is:
- group overview
- subject selection within this group for this teacher
- student performance overview table for the selected subject
- three drill-down history dialogs

4a. Real page states
Design these states:
- invalid / missing route param
- loading group data
- group not found
- populated page with no subjects
- populated page with one subject
- populated page with multiple subjects
- subject-info loading
- subject-info load error
- no subject-info data
- students table with empty rows
- students table with rows

4b. Top area
Required structure:
- back link to /dashboards/teacher/student-groups
- page hero

Hero content mapping:
- title: group display name
- subtitle: group code when available
- meta: program name or program code

Do not add:
- breadcrumbs
- edit buttons
- export buttons
- group-management actions

5. Group overview section
This section is real and must stay compact.

Required structure:
- section card
- info-tile grid

Only include these real fields that are actually shown:
- program
- years of study
- current course
- curriculum
- curator
- students count when available

5a. Years of study
Display a compact range using:
- start year
- graduation year when available
- plus-sign fallback when graduation year is absent

5b. Current course
The current implementation calculates a 1-based current course from group start year and the current date using academic-year logic.
Represent it as a single numeric info tile.
Do not redesign it into a timeline.

Important restrictions:
- do not add group description
- do not add program degree level
- do not add curriculum status
- do not add curriculum notes
- do not add semesters list
- do not add schedules

6. Subject section inside the group page
This section is real and controls which subject's student overview is shown.

Required structure:
- section card
- section title
- one of these states:
  - no subjects message
  - chip list when more than one subject exists
  - single subject text when exactly one subject exists

Subject display logic:
- in Simplified Chinese context prefer Chinese name
- otherwise prefer English name
- fallback to the other localized name
- final fallback is subject code or subject id

Important restrictions:
- do not redesign subject switching into tabs with icons and counters
- do not add semester selector here
- do not add subject description
- do not add subject statistics here

7. Error alert area on the group page
There is a real generic error alert that can appear before the students section.
Keep it simple and implementation-friendly.

Important accuracy note:
- this error can coexist with a selected subject and an empty/no-data students block
- do not replace it with a full-screen empty illustration

8. Students overview section for the selected subject
This is the main functional section of the group details page.

Required structure:
- section card
- section title
- semester header row inside the card when subject info is available
- total homework count line inside that header row
- data table or empty/no-data/loading content

8a. Header row above the table
When subject info is loaded, show only:
- semester display name
- total homework count

Semester label behavior:
- use semester.name when available
- otherwise fallback to semester number label

Important restrictions:
- do not add average points
- do not add average attendance
- do not add charts
- do not add teacher list
- do not add room / slot summaries

8b. Students table states
Required states:
- loading
- no subject data
- no students rows
- populated table

8c. Table columns
Table columns must be exactly:
- Student English name
- Student Chinese name
- Student ID
- Points
- Attendance
- Homework submitted
- Role

8d. Row content
Each row may include only:
- student English display name
- student Chinese name
- student ID
- points button
- attendance button
- homework-submitted button or static value when total homework count is zero
- optional leader badge for headman or deputy

Student English name behavior:
- use user firstName + lastName when available
- fallback to user email
- fallback to dash

Student Chinese name behavior:
- use student.chineseName
- fallback to dash

Student ID behavior:
- use student.studentId
- fallback to dash
- keep it visually concise and suitable for mono-style rendering

9. Stat buttons in the students table
The three metric columns are interactive drill-down triggers.
They are not editable inputs.

9a. Points button
Required behavior:
- clicking opens the grade history dialog for that student in the current offering
- visible value is totalPoints only

9b. Attendance button
Required behavior:
- clicking opens the attendance history dialog for that student in the current offering
- visible value is attendancePercent rounded to an integer percent when available
- fallback to dash when attendancePercent is null
- accent color depends on percent:
  - high > 85 = green
  - medium > 65 = amber
  - low = red

9c. Homework-submitted button
Required behavior:
- when totalHomeworkCount is greater than zero, show a button that opens the homework history dialog
- visible value is submittedHomeworkCount / totalHomeworkCount
- also show the rounded percent in parentheses
- accent color uses the same threshold logic as attendance
- when totalHomeworkCount is zero, show a static non-interactive value instead of a dialog trigger

Important restrictions:
- do not make these editable
- do not add inline tooltips with extra data
- do not add sparkline charts
- do not add secondary badges for trend

10. Leader role column
This column is real and must stay narrow and explicit.

Supported states:
- headman badge
- deputy badge
- dash when student has no leader role

Important restrictions:
- do not add any other roles
- do not show from/to dates
- do not add role-management actions

11. Grade history dialog
Clicking the Points button opens the real grade history dialog.

Required states:
- loading
- error
- empty history
- populated chronological list

Required dialog structure:
- modal
- hero block
- total points summary
- chronological list of grade-entry cards

For each grade card, include only the real content currently shown:
- points
- type label when present
- source type:
  - lesson
  - homework
- homework title when the source is homework
- homework description when present
- homework max points when present
- lesson date when available
- link to lesson
- grade comment when present
- graded by
- graded at

Important restrictions:
- do not add breakdown charts by grade type
- do not add editing actions
- do not add grade deletion
- do not add grade timeline filters
- do not add downloadable reports

12. Attendance history dialog
Clicking the Attendance button opens the real attendance history dialog.

Required states:
- loading
- error
- no lessons
- populated chronological list

Required dialog structure:
- modal
- hero block
- missed-count summary
- absence-notices-submitted summary
- list of lesson cards

For each lesson card, include only the real content currently shown:
- lesson date/time
- attendance-status badge
- lesson topic when present
- link to lesson
- notices toggle only when notices exist
- expandable notices area

Attendance status support must include:
- Unmarked
- Present
- Absent
- Late
- Excused

Card visual variants must remain tied to status:
- present = green family
- absent/excused = red family
- late = yellow family
- unmarked = neutral family

Notice cards inside the expanded area may include only:
- notice type
- notice status
- reason text when present
- submittedAt
- attachments count when fileIds exist

Important restrictions:
- do not add file download rows in this dialog
- do not add approve / reject actions
- do not add attendance editing
- do not add lesson-room details if they are not already shown

13. Homework history dialog
Clicking the Homework submitted button opens the real homework history dialog.

Required states:
- loading
- error
- no homework
- populated chronological list

Required dialog structure:
- modal
- hero block
- subject label / assignments count line
- list of homework cards

Each homework card may include only the real fields currently shown:
- homework title
- max points when present
- homework description when present
- lesson date
- link to lesson
- submission status:
  - submitted at
  - not submitted
- grade block when a grade exists
- grade comment when present
- attachments list of submission file names when files exist

Important restrictions:
- do not add file download actions in this dialog
- do not add file previews
- do not add resubmission actions
- do not add teacher feedback thread
- do not add late / on-time badges

14. What must not appear anywhere in this iteration
Do not add any of the following unless they already exist on these exact teacher student-groups screens, which they do not:
- lesson materials management
- homework creation
- attendance editing controls
- grading dialog for changing grades
- schedule preview
- subject materials upload
- search
- sorting controls
- export
- charts
- KPI cards
- analytics dashboard
- teacher notes
- student profile drawer
- messaging
- AI recommendations
- bulk actions

15. Prototype interactions to include
Support only these real interactions:
- change academic year filter
- change semester filter
- change subject filter
- click a group card -> open /dashboards/teacher/student-groups/:groupId
- click back link -> return to /dashboards/teacher/student-groups
- switch selected subject via chips when multiple subjects exist
- click points button -> open grade history dialog
- click attendance button -> open attendance history dialog
- click homework submitted button when total homework count > 0 -> open homework history dialog
- expand / collapse attendance notices inside the attendance history dialog
- click lesson links inside dialogs

Do not create any other prototype flows.

16. Output expectations
Produce polished desktop and mobile designs for:
- teacher Student Groups list page
- teacher group details page
- grade history dialog
- attendance history dialog
- homework history dialog
- loading, error, empty, no-subjects, and no-data states relevant to these screens

Preserve the approved academic blue-and-white visual language.
Keep the layouts faithful to the current implementation.
Use English UI copy if needed, but keep spacing compatible with Russian and Simplified Chinese expansion.
```
