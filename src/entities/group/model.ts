/** Группа студенческая (StudentGroupDto) */
export interface StudentGroupDto {
  id: string;
  programId: string;
  curriculumId: string;
  code: string;
  name: string | null;
  description: string | null;
  startYear: number;
  graduationYear: number | null;
  curatorUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Запрос на создание группы */
export interface CreateGroupRequest {
  programId: string;
  curriculumId: string;
  code: string;
  name?: string;
  description?: string;
  startYear: number;
  graduationYear?: number | null;
  curatorUserId?: string | null;
}

/** Запрос на обновление группы (все поля опциональны) */
export interface UpdateGroupRequest {
  name?: string | null;
  description?: string | null;
  graduationYear?: number | null;
  curatorUserId?: string | null;
}

/** Участник группы (профиль студента из GET /api/groups/{groupId}/members) */
export interface GroupMemberDto {
  id: string;
  userId?: string;
  studentId?: string | null;
  chineseName?: string | null;
  email?: string | null;
  fullName?: string | null;
  [key: string]: unknown;
}

/** Запись старосты (GroupLeaderDto) */
export interface GroupLeaderDto {
  id: string;
  groupId: string;
  studentId: string;
  role: 'headman' | 'deputy';
  fromDate: string | null;
  toDate: string | null;
  createdAt: string;
}

/** Запрос на добавление старосты/заместителя */
export interface AddGroupLeaderRequest {
  studentId: string;
  role: 'headman' | 'deputy';
  fromDate?: string;
  toDate?: string;
}

/** @deprecated Use StudentGroupDto */
export interface Group {
  id: string;
  name: string;
  code?: string;
}
