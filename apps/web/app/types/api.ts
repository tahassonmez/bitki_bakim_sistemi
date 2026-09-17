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

export interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  _count?: { locations: number };
}

export interface CustomerInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface Location {
  id: string;
  name: string;
  customerId: string;
  _count?: { plants: number };
}

export interface CustomerDetail extends Customer {
  locations: Location[];
}

export type PlantStatus = 'ACTIVE' | 'REMOVED';

export interface Plant {
  id: string;
  plantCode: string;
  name: string;
  species: string;
  status: PlantStatus;
  nextMaintenanceDate: string | null;
  location: { id: string; name: string; customer?: { id: string; name: string } };
}
