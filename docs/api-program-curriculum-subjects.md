# API: Связь предметов и учебных планов (Curriculum Subjects)

Полный контракт для фронтенда по управлению связью между учебными планами (curricula) и предметами (subjects).

---

## 1. Общая информация

- **Base URL**: `/api`
  - Программы и учебные планы: `/api/programs`
  - Предметы: `/api/subjects`
- **Content-Type**: `application/json`
- **Авторизация**: все запросы — с учётом JWT (cookie path `/api`).
  - **Запись** (POST/PUT/DELETE) — роли `MODERATOR`, `ADMIN`, `SUPER_ADMIN`
  - **Чтение** (GET) — любой аутентифицированный пользователь

---

## 2. Структура ответа об ошибке (единая для всех эндпоинтов)

Все ошибки возвращают JSON:

```json
{
  "code": "string",
  "message": "string",
  "timestamp": "ISO-8601",
  "details": null | object
}
```

| Поле        | Тип             | Описание                                                                                   |
|-------------|-----------------|--------------------------------------------------------------------------------------------|
| `code`      | string          | Код ошибки: `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_FAILED`, `FORBIDDEN`, `UNAUTHORIZED` |
| `message`   | string          | Текст для пользователя                                                                     |
| `timestamp` | string (ISO-8601) | Момент ошибки (Instant)                                                                   |
| `details`   | object \| null  | При валидации: `{ "fieldName": "сообщение" }`, иначе часто `null`                         |

### Типичные HTTP-коды ошибок

| Код  | Значение          | Когда возвращается                                      |
|------|-------------------|---------------------------------------------------------|
| 400  | BAD_REQUEST       | Некорректные данные, нарушены ограничения               |
| 400  | VALIDATION_FAILED | Ошибка валидации полей (details содержит поля)          |
| 401  | UNAUTHORIZED      | Не авторизован                                          |
| 403  | FORBIDDEN         | Нет прав на операцию                                    |
| 404  | NOT_FOUND         | Ресурс не найден                                        |
| 409  | CONFLICT          | Конфликт (например, дубликат связи)                     |

---

## 3. Эндпоинты для связи «учебный план — предмет»

### 3.1 Список учебных планов программы (выбор curriculum)

Получение списка учебных планов для конкретной программы.

- **Метод**: `GET`
- **URL**: `/api/programs/{programId}/curricula`
- **Path параметры**:
  - `programId` — UUID программы

#### Запрос

Тело запроса отсутствует.

#### Ответ (200 OK)

Массив объектов `CurriculumDto`:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "programId": "550e8400-e29b-41d4-a716-446655440001",
    "version": "2024",
    "startYear": 2024,
    "endYear": 2028,
    "isActive": true,
    "status": "DRAFT",
    "approvedAt": null,
    "approvedBy": null,
    "notes": "Основной план для бакалавриата",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Поля CurriculumDto

| Поле         | Тип              | Описание                                                |
|--------------|------------------|---------------------------------------------------------|
| `id`         | UUID             | Уникальный идентификатор учебного плана                 |
| `programId`  | UUID             | ID программы                                            |
| `version`    | string           | Версия плана (например, "2024")                         |
| `startYear`  | number           | Год начала действия                                     |
| `endYear`    | number \| null   | Год окончания действия                                  |
| `isActive`   | boolean          | Активен ли план                                         |
| `status`     | string           | Статус: `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `ARCHIVED` |
| `approvedAt` | string \| null   | Дата утверждения (ISO-8601)                             |
| `approvedBy` | UUID \| null     | ID пользователя, утвердившего план                      |
| `notes`      | string \| null   | Примечания                                              |
| `createdAt`  | string           | Дата создания (ISO-8601)                                |
| `updatedAt`  | string           | Дата обновления (ISO-8601)                              |

#### Коды ответа

| Код | Описание                    |
|-----|-----------------------------|
| 200 | Успех                       |
| 401 | Не авторизован              |
| 403 | Нет доступа                 |
| 404 | Программа не найдена        |

---

### 3.2 Один учебный план по ID

Получение конкретного учебного плана.

- **Метод**: `GET`
- **URL**: `/api/programs/curricula/{id}`
- **Path параметры**:
  - `id` — UUID учебного плана

#### Запрос

Тело запроса отсутствует.

#### Ответ (200 OK)

Один объект `CurriculumDto` (структура как в 3.1).

#### Коды ответа

| Код | Описание                    |
|-----|-----------------------------|
| 200 | Успех                       |
| 401 | Не авторизован              |
| 403 | Нет доступа                 |
| 404 | Учебный план не найден      |

---

### 3.3 Список предметов каталога (выбор subject)

Получение всех предметов из каталога для выбора при создании связи.

- **Метод**: `GET`
- **URL**: `/api/subjects`

#### Запрос

Тело запроса отсутствует.

#### Ответ (200 OK)

Массив объектов `SubjectDto`:

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "code": "MATH101",
    "chineseName": "高等数学",
    "englishName": "Advanced Mathematics",
    "description": "Основы математического анализа",
    "departmentId": "770e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-10T08:00:00Z"
  }
]
```

#### Поля SubjectDto

| Поле           | Тип            | Описание                        |
|----------------|----------------|---------------------------------|
| `id`           | UUID           | Уникальный идентификатор        |
| `code`         | string         | Код предмета                    |
| `chineseName`  | string         | Название на китайском           |
| `englishName`  | string \| null | Название на английском          |
| `description`  | string \| null | Описание                        |
| `departmentId` | UUID \| null   | ID кафедры                      |
| `createdAt`    | string         | Дата создания (ISO-8601)        |
| `updatedAt`    | string         | Дата обновления (ISO-8601)      |

---

### 3.4 Предметы учебного плана (связь curriculum — subject)

Получение списка предметов, привязанных к учебному плану.

- **Метод**: `GET`
- **URL**: `/api/programs/curricula/{curriculumId}/subjects`
- **Path параметры**:
  - `curriculumId` — UUID учебного плана

#### Запрос

Тело запроса отсутствует.

#### Ответ (200 OK)

Массив объектов `CurriculumSubjectDto`:

```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "curriculumId": "550e8400-e29b-41d4-a716-446655440000",
    "subjectId": "660e8400-e29b-41d4-a716-446655440000",
    "semesterNo": 1,
    "courseYear": 1,
    "durationWeeks": 18,
    "hoursTotal": 72,
    "hoursLecture": 36,
    "hoursPractice": 18,
    "hoursLab": null,
    "hoursSeminar": null,
    "hoursSelfStudy": null,
    "hoursConsultation": null,
    "hoursCourseWork": null,
    "assessmentTypeId": "990e8400-e29b-41d4-a716-446655440000",
    "credits": "3.5",
    "createdAt": "2024-01-20T12:00:00Z",
    "updatedAt": "2024-01-20T12:00:00Z"
  }
]
```

#### Поля CurriculumSubjectDto

| Поле               | Тип            | Описание                                           |
|--------------------|----------------|----------------------------------------------------|
| `id`               | UUID           | Уникальный идентификатор связи                     |
| `curriculumId`     | UUID           | ID учебного плана                                  |
| `subjectId`        | UUID           | ID предмета из каталога                            |
| `semesterNo`       | number         | Номер семестра (>= 1)                              |
| `courseYear`       | number \| null | Курс (год обучения)                                |
| `durationWeeks`    | number         | Длительность в неделях                             |
| `hoursTotal`       | number \| null | Всего часов                                        |
| `hoursLecture`     | number \| null | Часы лекций                                        |
| `hoursPractice`    | number \| null | Часы практики                                      |
| `hoursLab`         | number \| null | Часы лабораторных                                  |
| `hoursSeminar`     | number \| null | Часы семинаров                                     |
| `hoursSelfStudy`   | number \| null | Часы самостоятельной работы                        |
| `hoursConsultation`| number \| null | Часы консультаций                                  |
| `hoursCourseWork`  | number \| null | Часы курсовой работы                               |
| `assessmentTypeId` | UUID           | ID типа контроля                                   |
| `credits`          | string         | Зачётные единицы (кредиты), BigDecimal как строка  |
| `createdAt`        | string         | Дата создания (ISO-8601)                           |
| `updatedAt`        | string         | Дата обновления (ISO-8601)                         |

#### Коды ответа

| Код | Описание                    |
|-----|-----------------------------|
| 200 | Успех                       |
| 401 | Не авторизован              |
| 403 | Нет доступа                 |

---

### 3.5 Один элемент связи (предмет в плане) по ID

- **Метод**: `GET`
- **URL**: `/api/programs/curriculum-subjects/{id}`
- **Path параметры**:
  - `id` — UUID записи curriculum_subject

#### Запрос

Тело запроса отсутствует.

#### Ответ (200 OK)

Один объект `CurriculumSubjectDto` (структура как в 3.4).

#### Коды ответа

| Код | Описание                    |
|-----|-----------------------------|
| 200 | Успех                       |
| 401 | Не авторизован              |
| 403 | Нет доступа                 |
| 404 | Запись не найдена           |

---

### 3.6 Добавить предмет в учебный план (создать связь)

- **Метод**: `POST`
- **URL**: `/api/programs/curricula/{curriculumId}/subjects`
- **Path параметры**:
  - `curriculumId` — UUID учебного плана

#### Тело запроса (JSON)

```json
{
  "subjectId": "660e8400-e29b-41d4-a716-446655440000",
  "semesterNo": 1,
  "courseYear": 1,
  "durationWeeks": 18,
  "hoursTotal": 72,
  "hoursLecture": 36,
  "hoursPractice": 18,
  "hoursLab": null,
  "hoursSeminar": null,
  "hoursSelfStudy": null,
  "hoursConsultation": null,
  "hoursCourseWork": null,
  "assessmentTypeId": "990e8400-e29b-41d4-a716-446655440000",
  "credits": 3.5
}
```

#### Поля запроса CreateCurriculumSubjectRequest

| Поле               | Тип              | Обязательное | Ограничения | Описание                                              |
|--------------------|------------------|--------------|-------------|-------------------------------------------------------|
| `subjectId`        | UUID             | **Да**       | —           | ID предмета из каталога (`/api/subjects`)             |
| `semesterNo`       | number (int)     | **Да**       | >= 1        | Номер семестра                                        |
| `courseYear`       | number (int)     | Нет          | —           | Курс (год обучения)                                   |
| `durationWeeks`    | number (int)     | **Да**       | >= 1        | Длительность в неделях                                |
| `hoursTotal`       | number (int)     | Нет          | >= 0        | Всего часов                                           |
| `hoursLecture`     | number (int)     | Нет          | >= 0        | Лекции                                                |
| `hoursPractice`    | number (int)     | Нет          | >= 0        | Практика                                              |
| `hoursLab`         | number (int)     | Нет          | >= 0        | Лабораторные                                          |
| `hoursSeminar`     | number (int)     | Нет          | >= 0        | Семинары                                              |
| `hoursSelfStudy`   | number (int)     | Нет          | >= 0        | Самостоятельная работа                                |
| `hoursConsultation`| number (int)     | Нет          | >= 0        | Консультации                                          |
| `hoursCourseWork`  | number (int)     | Нет          | >= 0        | Курсовая работа                                       |
| `assessmentTypeId` | UUID             | **Да**       | —           | ID типа контроля (`/api/subjects/assessment-types`)   |
| `credits`          | number (decimal) | Нет          | —           | Зачётные единицы (кредиты)                            |

#### Ответ (201 Created)

Объект `CurriculumSubjectDto` с заполненными `id`, `curriculumId`, `createdAt`, `updatedAt`.

#### Коды ответа

| Код | Описание                                                                              |
|-----|---------------------------------------------------------------------------------------|
| 201 | Связь создана                                                                         |
| 400 | Не хватает обязательных полей или нарушены ограничения (например `semesterNo < 1`)    |
| 401 | Не авторизован                                                                        |
| 403 | Нет прав                                                                              |
| 404 | Curriculum / Subject / AssessmentType не найден                                       |
| 409 | Конфликт — связь уже существует (curriculum + subject + semesterNo уникальны)         |

#### Пример ошибки 409 Conflict

```json
{
  "code": "CONFLICT",
  "message": "Curriculum subject already exists for curriculum, subject, semester 1",
  "timestamp": "2024-01-20T12:00:00Z",
  "details": null
}
```

---

### 3.7 Обновить связь (предмет в плане)

- **Метод**: `PUT`
- **URL**: `/api/programs/curriculum-subjects/{id}`
- **Path параметры**:
  - `id` — UUID записи curriculum_subject

#### Тело запроса (JSON)

Все поля опциональны — передаются только изменяемые:

```json
{
  "hoursTotal": 80,
  "hoursLecture": 40,
  "assessmentTypeId": "990e8400-e29b-41d4-a716-446655440001",
  "credits": 4
}
```

#### Поля запроса UpdateCurriculumSubjectRequest

| Поле               | Тип              | Обязательное | Ограничения                         |
|--------------------|------------------|--------------|-------------------------------------|
| `courseYear`       | number (int)     | Нет          | —                                   |
| `hoursTotal`       | number (int)     | Нет          | >= 0                                |
| `hoursLecture`     | number (int)     | Нет          | >= 0                                |
| `hoursPractice`    | number (int)     | Нет          | >= 0                                |
| `hoursLab`         | number (int)     | Нет          | >= 0                                |
| `hoursSeminar`     | number (int)     | Нет          | >= 0                                |
| `hoursSelfStudy`   | number (int)     | Нет          | >= 0                                |
| `hoursConsultation`| number (int)     | Нет          | >= 0                                |
| `hoursCourseWork`  | number (int)     | Нет          | >= 0                                |
| `assessmentTypeId` | UUID             | Нет          | Должен существовать в справочнике   |
| `credits`          | number (decimal) | Нет          | —                                   |

> **Примечание**: `subjectId`, `semesterNo`, `durationWeeks` не изменяются через PUT. Для изменения этих полей нужно удалить связь и создать новую.

#### Ответ (200 OK)

Обновлённый объект `CurriculumSubjectDto`.

#### Коды ответа

| Код | Описание                                   |
|-----|--------------------------------------------|
| 200 | Успех                                      |
| 400 | Отрицательные часы или некорректные данные |
| 401 | Не авторизован                             |
| 403 | Нет прав                                   |
| 404 | Curriculum subject или AssessmentType не найден |

---

### 3.8 Удалить связь (убрать предмет из плана)

- **Метод**: `DELETE`
- **URL**: `/api/programs/curriculum-subjects/{id}`
- **Path параметры**:
  - `id` — UUID записи curriculum_subject

#### Запрос

Тело запроса отсутствует.

#### Ответ (204 No Content)

Тело пустое.

#### Коды ответа

| Код | Описание                    |
|-----|-----------------------------|
| 204 | Успех                       |
| 401 | Не авторизован              |
| 403 | Нет прав                    |
| 404 | Запись не найдена           |

---

## 4. Вспомогательные эндпоинты

### 4.1 Типы контроля (для assessmentTypeId)

Список типов контроля для выпадающего списка при создании/редактировании связи.

- **Метод**: `GET`
- **URL**: `/api/subjects/assessment-types`

#### Ответ (200 OK)

```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "code": "EXAM",
    "chineseName": "考试",
    "englishName": "Exam",
    "isGraded": true,
    "isFinal": true,
    "sortOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Поля AssessmentTypeDto

| Поле          | Тип            | Описание                        |
|---------------|----------------|---------------------------------|
| `id`          | UUID           | Уникальный идентификатор        |
| `code`        | string         | Код типа (EXAM, PASS и т.д.)    |
| `chineseName` | string         | Название на китайском           |
| `englishName` | string \| null | Название на английском          |
| `isGraded`    | boolean        | С оценкой                       |
| `isFinal`     | boolean        | Итоговый контроль               |
| `sortOrder`   | number         | Порядок сортировки              |
| `createdAt`   | string         | Дата создания (ISO-8601)        |

---

### 4.2 Один предмет по ID

При необходимости показать название предмета по `subjectId` из `CurriculumSubjectDto`.

- **Метод**: `GET`
- **URL**: `/api/subjects/{id}`
- **Path параметры**:
  - `id` — UUID предмета

#### Ответ (200 OK)

Объект `SubjectDto` (структура как в 3.3).

---

## 5. Таблица исходов по операциям

| Операция                          | 200/201/204 | 400 | 401 | 403 | 404                | 409           |
|-----------------------------------|-------------|-----|-----|-----|--------------------|---------------|
| GET списков/одного                | ✓           | —   | ✓   | ✓   | ✓ (для get by id)  | —             |
| POST создать связь                | 201         | ✓   | ✓   | ✓   | ✓                  | ✓ (дубликат)  |
| PUT обновить связь                | ✓           | ✓   | ✓   | ✓   | ✓                  | —             |
| DELETE удалить связь              | 204         | —   | ✓   | ✓   | ✓                  | —             |

---

## 6. Валидация (Bean Validation) и сообщения в details

При ошибке валидации (HTTP 400) приходит:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Ошибка проверки данных. Проверьте правильность заполнения полей.",
  "timestamp": "2024-01-20T12:00:00Z",
  "details": {
    "subjectId": "Subject id is required",
    "semesterNo": "semesterNo must be at least 1",
    "durationWeeks": "durationWeeks is required"
  }
}
```

### Типичные сообщения валидации

| Поле               | Сообщение                              |
|--------------------|----------------------------------------|
| `subjectId`        | "Subject id is required"               |
| `semesterNo`       | "semesterNo must be at least 1"        |
| `durationWeeks`    | "durationWeeks is required"            |
| `durationWeeks`    | "durationWeeks must be at least 1"     |
| `assessmentTypeId` | "Assessment type id is required"       |
| `hoursTotal`       | "hoursTotal must be at least 0"        |
| `hoursLecture`     | "hoursLecture must be at least 0"      |

> **Рекомендация**: Фронтенд должен парсить `details` и отображать ошибки рядом с соответствующими полями формы.

---

## 7. Примеры использования

### 7.1 Получить все предметы учебного плана

```http
GET /api/programs/curricula/550e8400-e29b-41d4-a716-446655440000/subjects
Authorization: Bearer <token>
```

### 7.2 Добавить предмет в учебный план

```http
POST /api/programs/curricula/550e8400-e29b-41d4-a716-446655440000/subjects
Content-Type: application/json
Authorization: Bearer <token>

{
  "subjectId": "660e8400-e29b-41d4-a716-446655440000",
  "semesterNo": 1,
  "durationWeeks": 18,
  "hoursTotal": 72,
  "hoursLecture": 36,
  "hoursPractice": 18,
  "assessmentTypeId": "990e8400-e29b-41d4-a716-446655440000",
  "credits": 3.5
}
```

### 7.3 Обновить часы предмета

```http
PUT /api/programs/curriculum-subjects/880e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer <token>

{
  "hoursTotal": 80,
  "hoursLecture": 40
}
```

### 7.4 Удалить предмет из учебного плана

```http
DELETE /api/programs/curriculum-subjects/880e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

---

## 8. TypeScript типы (для фронтенда)

```typescript
// Связь предмет-учебный план
export interface CurriculumSubjectDto {
  id: string;
  curriculumId: string;
  subjectId: string;
  semesterNo: number;
  courseYear: number | null;
  durationWeeks: number;
  hoursTotal: number | null;
  hoursLecture: number | null;
  hoursPractice: number | null;
  hoursLab: number | null;
  hoursSeminar: number | null;
  hoursSelfStudy: number | null;
  hoursConsultation: number | null;
  hoursCourseWork: number | null;
  assessmentTypeId: string;
  credits: string; // BigDecimal как строка
  createdAt: string;
  updatedAt: string;
}

// Запрос на создание
export interface CreateCurriculumSubjectRequest {
  subjectId: string;
  semesterNo: number;
  courseYear?: number | null;
  durationWeeks: number;
  hoursTotal?: number | null;
  hoursLecture?: number | null;
  hoursPractice?: number | null;
  hoursLab?: number | null;
  hoursSeminar?: number | null;
  hoursSelfStudy?: number | null;
  hoursConsultation?: number | null;
  hoursCourseWork?: number | null;
  assessmentTypeId: string;
  credits?: number | null;
}

// Запрос на обновление
export interface UpdateCurriculumSubjectRequest {
  courseYear?: number | null;
  hoursTotal?: number | null;
  hoursLecture?: number | null;
  hoursPractice?: number | null;
  hoursLab?: number | null;
  hoursSeminar?: number | null;
  hoursSelfStudy?: number | null;
  hoursConsultation?: number | null;
  hoursCourseWork?: number | null;
  assessmentTypeId?: string;
  credits?: number | null;
}
```
