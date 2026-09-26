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

export interface ActionBreakdownItem {
  typeId: string;
  name: string;
  count: number;
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
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  customerId: string;
  _count?: { plants: number };
}

export interface AssignedStaffRef {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface CustomerDetail extends Customer {
  locations: Location[];
  assignedStaff: AssignedStaffRef[];
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

export interface PlantIdentificationResult {
  name: string;
  species: string;
  description: string;
  careTips: string;
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

export interface RecentMaintenanceLog {
  id: string;
  date: string;
  staff: MaintenanceStaffRef;
  actions: MaintenanceLogActionEntry[];
  plant: {
    id: string;
    plantCode: string;
    name: string;
    location: { name: string; customer: { id: string; name: string } };
  };
}

export interface MaintenanceLogRecord {
  id: string;
  date: string;
  notes: string | null;
  staff: MaintenanceStaffRef;
  actions: MaintenanceLogActionEntry[];
  products: MaintenanceLogProductEntry[];
  photos: MaintenancePhoto[];
  plant: {
    id: string;
    plantCode: string;
    name: string;
    location: { id: string; name: string; customer: { id: string; name: string } };
  };
}

export interface MaintenanceLogListResponse {
  items: MaintenanceLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffInput {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  role?: UserRole;
}

export interface UpdateStaffInput {
  fullName?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ChatContact {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  body: string | null;
  photoUrl: string | null;
  createdAt: string;
  readAt: string | null;
  sender: ChatContact;
  receiver: ChatContact;
}

export interface ChatConversation {
  partner: ChatContact;
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface GroupChatMessage {
  id: string;
  senderId: string;
  body: string | null;
  photoUrl: string | null;
  createdAt: string;
  sender: ChatContact;
}
