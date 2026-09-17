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
  careFrequencyDays: number;
  locationId: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  location: { id: string; name: string; customer: { id: string; name: string } };
}

export interface PlantDetail extends Plant {
  potInfo: string | null;
  sizeInfo: string | null;
  registeredAt: string;
}

export interface CreatePlantInput {
  name: string;
  species: string;
  locationId: string;
  potInfo?: string | null;
  sizeInfo?: string | null;
  careFrequencyDays: number;
}

export interface CreateBulkPlantsInput extends CreatePlantInput {
  quantity: number;
}

export interface MaintenanceStaffRef {
  id: string;
  fullName: string;
  email: string;
}

export interface MaintenanceTypeRef {
  id: string;
  name: string;
}

export interface MaintenanceProductRef {
  id: string;
  name: string;
  unit: string | null;
}

export interface MaintenanceLogActionEntry {
  id: string;
  typeId: string;
  type: MaintenanceTypeRef;
}

export interface MaintenanceLogProductEntry {
  id: string;
  productId: string;
  product: MaintenanceProductRef;
  quantityUsed: number | null;
}

export interface MaintenancePhoto {
  id: string;
  url: string;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  notes: string | null;
  staff: MaintenanceStaffRef;
  actions: MaintenanceLogActionEntry[];
  products: MaintenanceLogProductEntry[];
  photos: MaintenancePhoto[];
}
