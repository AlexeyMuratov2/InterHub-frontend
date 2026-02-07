import { request } from '../../shared/api';
import type {
  ScheduleItem,
  BuildingDto,
  RoomDto,
  CreateBuildingRequest,
  UpdateBuildingRequest,
  CreateRoomRequest,
  UpdateRoomRequest,
  TimeslotDto,
  CreateTimeslotRequest,
} from './model';

const BUILDINGS_BASE = '/api/schedule/buildings';
const ROOMS_BASE = '/api/schedule/rooms';
const TIMESLOTS_BASE = '/api/schedule/timeslots';

type ApiResult<T> = Promise<{
  data?: T;
  error?: { message?: string; status?: number };
}>;

/** Запросы по расписанию — заглушка */
export async function fetchSchedule(params: {
  from?: string;
  to?: string;
  groupId?: string;
}): Promise<{ data?: ScheduleItem[]; error?: unknown }> {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  const result = await request<ScheduleItem[]>(`/api/schedule?${search}`, { method: 'GET' });
  return { data: result.data, error: result.error };
}

// --- Buildings ---

export async function fetchBuildings(): ApiResult<BuildingDto[]> {
  const result = await request<BuildingDto[]>(BUILDINGS_BASE, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchBuildingById(id: string): ApiResult<BuildingDto | null> {
  const result = await request<BuildingDto>(`${BUILDINGS_BASE}/${id}`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createBuilding(body: CreateBuildingRequest): ApiResult<BuildingDto> {
  const result = await request<BuildingDto>(BUILDINGS_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateBuilding(
  id: string,
  body: UpdateBuildingRequest
): ApiResult<BuildingDto> {
  const result = await request<BuildingDto>(`${BUILDINGS_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteBuilding(id: string): ApiResult<void> {
  const result = await request<unknown>(`${BUILDINGS_BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

// --- Rooms ---

export async function fetchRooms(): ApiResult<RoomDto[]> {
  const result = await request<RoomDto[]>(ROOMS_BASE, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchRoomById(id: string): ApiResult<RoomDto | null> {
  const result = await request<RoomDto>(`${ROOMS_BASE}/${id}`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createRoom(body: CreateRoomRequest): ApiResult<RoomDto> {
  const result = await request<RoomDto>(ROOMS_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createRoomsBulk(items: CreateRoomRequest[]): ApiResult<RoomDto[]> {
  const result = await request<RoomDto[]>(`${ROOMS_BASE}/bulk`, {
    method: 'POST',
    body: JSON.stringify(items),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function updateRoom(
  id: string,
  body: UpdateRoomRequest
): ApiResult<RoomDto> {
  const result = await request<RoomDto>(`${ROOMS_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteRoom(id: string): ApiResult<void> {
  const result = await request<unknown>(`${ROOMS_BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

// --- Timeslots ---

export async function fetchTimeslots(): ApiResult<TimeslotDto[]> {
  const result = await request<TimeslotDto[]>(TIMESLOTS_BASE, { method: 'GET' });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function fetchTimeslotById(id: string): ApiResult<TimeslotDto | null> {
  const result = await request<TimeslotDto>(`${TIMESLOTS_BASE}/${id}`, { method: 'GET' });
  if (result.status === 404) return { data: null };
  return {
    data: result.data ?? null,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createTimeslot(body: CreateTimeslotRequest): ApiResult<TimeslotDto> {
  const result = await request<TimeslotDto>(TIMESLOTS_BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function createTimeslotsBulk(items: CreateTimeslotRequest[]): ApiResult<TimeslotDto[]> {
  const result = await request<TimeslotDto[]>(`${TIMESLOTS_BASE}/bulk`, {
    method: 'POST',
    body: JSON.stringify(items),
  });
  return {
    data: result.data,
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteTimeslot(id: string): ApiResult<void> {
  const result = await request<unknown>(`${TIMESLOTS_BASE}/${id}`, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}

export async function deleteTimeslotsAll(): ApiResult<void> {
  const result = await request<unknown>(TIMESLOTS_BASE, { method: 'DELETE' });
  return {
    error: result.error ? { ...result.error, status: result.status } : undefined,
  };
}
