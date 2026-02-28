export enum SupplierType {
  Local = 'Local',
  International = 'International'
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  type: SupplierType;
  phone: string;
  email: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface PackingType {
  id: string;
  name: string;
  description: string;
  qtyPerPacking: number;
}

export enum LocationType {
  Main = 'Main Location',
  Sub = 'Sub Location'
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId?: string;
}

export interface Perfume {
  id: string;
  name: string;
  code: string;
  supplierId: string;
  dosage: number;
  priceUSD: number;
  pricePKR: number;
  lowStockAlert: number;
  olfactiveNotes: string[];
  remarks: string;
}

export interface GateInLog {
  id: string;
  date: string;
  perfumeId: string;
  importReference: string;
  packingTypeId: string;
  packingQty: number;
  netWeight: number;
  mainLocationId: string;
  subLocationId?: string;
  supplierInvoice: string;
  remarks: string;
  priceUSD?: number;
  pricePKR?: number;
}

export enum GateOutUsage {
  Production = 'Production',
  Sale = 'Sale'
}

export interface GateOutLog {
  id: string;
  date: string;
  perfumeId: string;
  packingTypeId: string;
  packingQty: number;
  netWeight: number;
  mainLocationId: string;
  subLocationId?: string;
  usage: GateOutUsage;
  customerId?: string;
  remarks: string;
  batchNumber: string;
}

export interface StockTransferLog {
  id: string;
  date: string;
  perfumeId: string;
  packingTypeId: string;
  packingQty: number;
  netWeight: number;
  fromMainLocationId: string;
  fromSubLocationId?: string;
  toMainLocationId: string;
  toSubLocationId?: string;
  remarks: string;
  batchNumber: string;
}

export enum UserRole {
  Admin = 'Admin',
  Operator = 'Operator',
  Viewer = 'Viewer'
}

export interface UserPermissions {
  canViewPrices: boolean;
  allowedLocationIds: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions?: UserPermissions;
  email?: string;
}

export interface StockPosition {
  mainLocationId: string;
  subLocationId?: string;
  batch: string;
  weight: number;
}

export interface DatabaseSnapshot {
  suppliers: Supplier[];
  customers: Customer[];
  packingTypes: PackingType[];
  locations: Location[];
  perfumes: Perfume[];
  olfactiveNotes: string[];
  gateInLogs: GateInLog[];
  gateOutLogs: GateOutLog[];
  transferLogs: StockTransferLog[];
  users: User[];
  currentUser: User | null;
  exportDate?: string;
}
