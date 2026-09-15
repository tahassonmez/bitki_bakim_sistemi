export type UserRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  staff: AuthUser;
}

export interface DashboardSummary {
  customerCount: number;
  plantCount: number;
  staffCount: number;
  todayMaintenanceCount: number;
}

export interface PlantTask {
  id: string;
  plantCode: string;
  name: string;
  species: string;
  nextMaintenanceDate: string | null;
  location: { name: string; customer: { name: string } };
}
