/** Модель элемента расписания (frontend) */
export interface ScheduleItem {
  id: string;
  courseId: string;
  lessonId?: string;
  groupId?: string;
  teacherId?: string;
  startAt: string;
  endAt?: string;
}

// --- Buildings (Schedule API) ---

export interface BuildingDto {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingRequest {
  name: string;
  address?: string | null;
}

export interface UpdateBuildingRequest {
  name?: string;
  address?: string | null;
}

// --- Rooms (Schedule API) ---

export interface RoomDto {
  id: string;
  buildingId: string;
  buildingName: string;
  number: string;
  capacity: number | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  buildingId: string;
  number: string;
  capacity?: number | null;
  type?: string | null;
}

export interface UpdateRoomRequest {
  buildingId?: string;
  number?: string;
  capacity?: number | null;
  type?: string | null;
}

// --- Timeslots (Schedule API) ---
// Timeslots are UI hints for selecting time when creating activities; no PUT in API.

export interface TimeslotDto {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateTimeslotRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
