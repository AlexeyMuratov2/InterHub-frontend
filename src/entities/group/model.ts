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

import type { AccountUserDto } from '../../shared/api/types';
import type { StudentDto } from '../../shared/api/types';

/** Участник группы (GET /api/groups/{groupId}/members): студент + пользователь для отображения имени и email */
export interface GroupMemberDto {
  student: StudentDto;
  user: AccountUserDto;
}

/** Запись старосты (ответ POST /api/groups/{groupId}/leaders — без вложенных student/user) */
export interface GroupLeaderDto {
  id: string;
  groupId: string;
  studentId: string;
  role: 'headman' | 'deputy';
  fromDate: string | null;
  toDate: string | null;
  createdAt: string;
}

/** Запись старосты с данными студента и пользователя (GET /api/groups/{groupId}/leaders) */
export interface GroupLeaderDetailDto {
  id: string;
  groupId: string;
  studentId: string;
  role: 'headman' | 'deputy';
  fromDate: string | null;
  toDate: string | null;
  createdAt: string;
  student: StudentDto | null;
  user: AccountUserDto | null;
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
