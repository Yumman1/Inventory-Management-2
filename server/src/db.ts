import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Supplier,
  Customer,
  PackingType,
  Location,
  Perfume,
  GateInLog,
  GateOutLog,
  StockTransferLog,
  User,
  StockPosition,
  DatabaseSnapshot,
  UserPermissions
} from './types.js';
import { SupplierType, LocationType, GateOutUsage, UserRole } from './types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

// --- Row types (snake_case from DB)
interface SupplierRow {
  id: string;
  name: string;
  contact_person: string;
  type: string;
  phone: string;
  email: string;
}
interface CustomerRow { id: string; name: string; address: string; phone: string; email: string; }
interface PackingTypeRow { id: string; name: string; description: string; qty_per_packing: number; }
interface LocationRow { id: string; name: string; type: string; parent_id: string | null; }
interface PerfumeRow {
  id: string; name: string; code: string; supplier_id: string; dosage: number;
  price_usd: number; price_pkr: number; low_stock_alert: number;
  remarks: string;
}
interface GateInRow {
  id: string; date: string; perfume_id: string; import_reference: string;
  packing_type_id: string; packing_qty: number; net_weight: number;
  main_location_id: string; sub_location_id: string | null; supplier_invoice: string;
  remarks: string; price_usd: number | null; price_pkr: number | null;
}
interface GateOutRow {
  id: string; date: string; perfume_id: string; packing_type_id: string;
  packing_qty: number; net_weight: number; main_location_id: string;
  sub_location_id: string | null; usage: string; customer_id: string | null;
  remarks: string; batch_number: string;
}
interface TransferRow {
  id: string; date: string; perfume_id: string; packing_type_id: string;
  packing_qty: number; net_weight: number; from_main_location_id: string;
  from_sub_location_id: string | null; to_main_location_id: string;
  to_sub_location_id: string | null; remarks: string; batch_number: string;
}
interface UserRow { id: string; name: string; role: string; permissions: object; email?: string; }

// --- Mappers
const toSupplier = (r: SupplierRow): Supplier => ({
  id: r.id, name: r.name, contactPerson: r.contact_person || '',
  type: r.type as SupplierType, phone: r.phone || '', email: r.email || ''
});
const toCustomer = (r: CustomerRow): Customer => ({
  id: r.id, name: r.name, address: r.address || '', phone: r.phone || '', email: r.email || ''
});
const toPackingType = (r: PackingTypeRow): PackingType => ({
  id: r.id, name: r.name, description: r.description || '', qtyPerPacking: r.qty_per_packing
});
const toLocation = (r: LocationRow): Location => ({
  id: r.id, name: r.name, type: r.type as LocationType, parentId: r.parent_id || undefined
});
const toPerfume = (r: PerfumeRow, notes: string[] = []): Perfume => ({
  id: r.id, name: r.name, code: r.code, supplierId: r.supplier_id, dosage: r.dosage || 0,
  priceUSD: r.price_usd || 0, pricePKR: r.price_pkr || 0, lowStockAlert: r.low_stock_alert || 0,
  olfactiveNotes: notes, remarks: r.remarks || ''
});
const toGateIn = (r: GateInRow): GateInLog => ({
  id: r.id, date: r.date, perfumeId: r.perfume_id, importReference: r.import_reference,
  packingTypeId: r.packing_type_id, packingQty: r.packing_qty, netWeight: r.net_weight,
  mainLocationId: r.main_location_id, subLocationId: r.sub_location_id || undefined,
  supplierInvoice: r.supplier_invoice || '', remarks: r.remarks || '',
  priceUSD: r.price_usd ?? undefined, pricePKR: r.price_pkr ?? undefined
});
const toGateOut = (r: GateOutRow): GateOutLog => ({
  id: r.id, date: r.date, perfumeId: r.perfume_id, packingTypeId: r.packing_type_id,
  packingQty: r.packing_qty, netWeight: r.net_weight, mainLocationId: r.main_location_id,
  subLocationId: r.sub_location_id || undefined, usage: r.usage as GateOutUsage,
  customerId: r.customer_id || undefined, remarks: r.remarks || '', batchNumber: r.batch_number
});
const toTransfer = (r: TransferRow): StockTransferLog => ({
  id: r.id, date: r.date, perfumeId: r.perfume_id, packingTypeId: r.packing_type_id,
  packingQty: r.packing_qty, netWeight: r.net_weight,
  fromMainLocationId: r.from_main_location_id, fromSubLocationId: r.from_sub_location_id || undefined,
  toMainLocationId: r.to_main_location_id, toSubLocationId: r.to_sub_location_id || undefined,
  remarks: r.remarks || '', batchNumber: r.batch_number
});
const toUser = (r: UserRow): User => ({
  id: r.id, name: r.name, role: r.role as UserRole,
  permissions: (r.permissions as UserPermissions) ?? { canViewPrices: false, allowedLocationIds: [] },
  email: r.email
});

// --- Suppliers
export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await getClient().from('suppliers').select('*');
  if (error) throw error;
  return (data || []).map(toSupplier);
}
export async function createSupplier(s: Partial<Supplier>): Promise<Supplier> {
  const row = {
    name: s.name!, contact_person: s.contactPerson ?? '',
    type: s.type ?? 'Local', phone: s.phone ?? '', email: s.email ?? ''
  };
  const { data, error } = await getClient().from('suppliers').insert(row).select().single();
  if (error) throw error;
  return toSupplier(data);
}
export async function updateSupplier(id: string, s: Partial<Supplier>): Promise<Supplier> {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.contactPerson !== undefined) row.contact_person = s.contactPerson;
  if (s.type !== undefined) row.type = s.type;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.email !== undefined) row.email = s.email;
  const { data, error } = await getClient().from('suppliers').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toSupplier(data);
}
export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await getClient().from('suppliers').delete().eq('id', id);
  if (error) throw error;
}
export async function supplierInUse(id: string): Promise<boolean> {
  const { data } = await getClient().from('perfumes').select('id').eq('supplier_id', id).limit(1);
  return (data?.length ?? 0) > 0;
}

// --- Customers
export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await getClient().from('customers').select('*');
  if (error) throw error;
  return (data || []).map(toCustomer);
}
export async function createCustomer(c: Partial<Customer>): Promise<Customer> {
  const row = { name: c.name!, address: c.address ?? '', phone: c.phone ?? '', email: c.email ?? '' };
  const { data, error } = await getClient().from('customers').insert(row).select().single();
  if (error) throw error;
  return toCustomer(data);
}
export async function updateCustomer(id: string, c: Partial<Customer>): Promise<Customer> {
  const row: Record<string, unknown> = {};
  if (c.name !== undefined) row.name = c.name;
  if (c.address !== undefined) row.address = c.address;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.email !== undefined) row.email = c.email;
  const { data, error } = await getClient().from('customers').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toCustomer(data);
}
export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await getClient().from('customers').delete().eq('id', id);
  if (error) throw error;
}
export async function customerInUse(id: string): Promise<boolean> {
  const { data } = await getClient().from('gate_out_logs').select('id').eq('customer_id', id).limit(1);
  return (data?.length ?? 0) > 0;
}

// --- Packing Types
export async function listPackingTypes(): Promise<PackingType[]> {
  const { data, error } = await getClient().from('packing_types').select('*');
  if (error) throw error;
  return (data || []).map(toPackingType);
}
export async function createPackingType(p: Partial<PackingType>): Promise<PackingType> {
  const row = { name: p.name!, description: p.description ?? '', qty_per_packing: p.qtyPerPacking ?? 0 };
  const { data, error } = await getClient().from('packing_types').insert(row).select().single();
  if (error) throw error;
  return toPackingType(data);
}
export async function updatePackingType(id: string, p: Partial<PackingType>): Promise<PackingType> {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.qtyPerPacking !== undefined) row.qty_per_packing = p.qtyPerPacking;
  const { data, error } = await getClient().from('packing_types').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toPackingType(data);
}
export async function deletePackingType(id: string): Promise<void> {
  const { error } = await getClient().from('packing_types').delete().eq('id', id);
  if (error) throw error;
}
export async function packingTypeInUse(id: string): Promise<boolean> {
  const [a, b, c] = await Promise.all([
    getClient().from('gate_in_logs').select('id').eq('packing_type_id', id).limit(1),
    getClient().from('gate_out_logs').select('id').eq('packing_type_id', id).limit(1),
    getClient().from('transfer_logs').select('id').eq('packing_type_id', id).limit(1)
  ]);
  return (a.data?.length ?? 0) > 0 || (b.data?.length ?? 0) > 0 || (c.data?.length ?? 0) > 0;
}

// --- Locations
export async function listLocations(): Promise<Location[]> {
  const { data, error } = await getClient().from('locations').select('*');
  if (error) throw error;
  return (data || []).map(toLocation);
}
export function getMainLocations(locations: Location[]): Location[] {
  return locations.filter(l => l.type === 'Main Location');
}
export function getSubLocations(locations: Location[], mainId: string): Location[] {
  return locations.filter(l => l.type === 'Sub Location' && l.parentId === mainId);
}
export async function createLocation(l: Partial<Location>): Promise<Location> {
  const row = {
    name: l.name!,
    type: l.type ?? 'Main Location',
    parent_id: l.parentId ?? null
  };
  const { data, error } = await getClient().from('locations').insert(row).select().single();
  if (error) throw error;
  return toLocation(data);
}
export async function updateLocation(id: string, l: Partial<Location>): Promise<Location> {
  const row: Record<string, unknown> = {};
  if (l.name !== undefined) row.name = l.name;
  if (l.type !== undefined) row.type = l.type;
  if (l.parentId !== undefined) row.parent_id = l.parentId;
  const { data, error } = await getClient().from('locations').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toLocation(data);
}
export async function deleteLocation(id: string): Promise<void> {
  const { error } = await getClient().from('locations').delete().eq('id', id);
  if (error) throw error;
}
export async function locationInUse(id: string): Promise<boolean> {
  const [gi, go, tr, loc] = await Promise.all([
    getClient().from('gate_in_logs').select('id').or(`main_location_id.eq.${id},sub_location_id.eq.${id}`).limit(1),
    getClient().from('gate_out_logs').select('id').or(`main_location_id.eq.${id},sub_location_id.eq.${id}`).limit(1),
    getClient().from('transfer_logs').select('id').or(`from_main_location_id.eq.${id},from_sub_location_id.eq.${id},to_main_location_id.eq.${id},to_sub_location_id.eq.${id}`).limit(1),
    getClient().from('locations').select('id').eq('parent_id', id).limit(1)
  ]);
  return (gi.data?.length ?? 0) > 0 || (go.data?.length ?? 0) > 0 || (tr.data?.length ?? 0) > 0 || (loc.data?.length ?? 0) > 0;
}

// --- Perfumes (with junction table for olfactive notes)
async function getPerfumeOlfactiveNotes(perfumeIds: string[]): Promise<Record<string, string[]>> {
  if (perfumeIds.length === 0) return {};
  const { data: links, error: e1 } = await getClient()
    .from('perfume_olfactive_notes')
    .select('perfume_id, olfactive_note_id')
    .in('perfume_id', perfumeIds);
  if (e1) throw e1;
  const noteIds = [...new Set((links || []).map((l: { olfactive_note_id: string }) => l.olfactive_note_id))];
  if (noteIds.length === 0) return Object.fromEntries(perfumeIds.map(id => [id, []]));
  const { data: notes, error: e2 } = await getClient()
    .from('olfactive_notes')
    .select('id, name')
    .in('id', noteIds);
  if (e2) throw e2;
  const idToName = Object.fromEntries((notes || []).map((n: { id: string; name: string }) => [n.id, n.name]));
  const map: Record<string, string[]> = {};
  for (const id of perfumeIds) map[id] = [];
  for (const l of links || []) {
    const name = idToName[l.olfactive_note_id];
    if (name && l.perfume_id) (map[l.perfume_id] ??= []).push(name);
  }
  Object.keys(map).forEach(k => map[k].sort());
  return map;
}

export async function listPerfumes(): Promise<Perfume[]> {
  const { data, error } = await getClient().from('perfumes').select('*');
  if (error) throw error;
  const ids = (data || []).map((r: PerfumeRow) => r.id);
  const notesMap = await getPerfumeOlfactiveNotes(ids);
  return (data || []).map((r: PerfumeRow) => toPerfume(r, notesMap[r.id] ?? []));
}
export async function createPerfume(p: Partial<Perfume>): Promise<Perfume> {
  const row = {
    name: p.name!, code: p.code!, supplier_id: p.supplierId!,
    dosage: p.dosage ?? 0, price_usd: p.priceUSD ?? 0, price_pkr: p.pricePKR ?? 0,
    low_stock_alert: p.lowStockAlert ?? 0, remarks: p.remarks ?? ''
  };
  const { data, error } = await getClient().from('perfumes').insert(row).select().single();
  if (error) throw error;
  const noteNames = Array.isArray(p.olfactiveNotes) ? p.olfactiveNotes : [];
  if (noteNames.length > 0) {
    const { data: notes } = await getClient().from('olfactive_notes').select('id, name').in('name', noteNames);
    const noteIds = (notes || []).map((n: { id: string }) => n.id);
    if (noteIds.length) {
      await getClient().from('perfume_olfactive_notes').insert(
        noteIds.map((oid: string) => ({ perfume_id: data.id, olfactive_note_id: oid }))
      );
    }
  }
  return toPerfume(data, noteNames);
}
export async function updatePerfume(id: string, p: Partial<Perfume>): Promise<Perfume> {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.code !== undefined) row.code = p.code;
  if (p.supplierId !== undefined) row.supplier_id = p.supplierId;
  if (p.dosage !== undefined) row.dosage = p.dosage;
  if (p.priceUSD !== undefined) row.price_usd = p.priceUSD;
  if (p.pricePKR !== undefined) row.price_pkr = p.pricePKR;
  if (p.lowStockAlert !== undefined) row.low_stock_alert = p.lowStockAlert;
  if (p.remarks !== undefined) row.remarks = p.remarks;
  if (Object.keys(row).length) {
    const { error } = await getClient().from('perfumes').update(row).eq('id', id);
    if (error) throw error;
  }
  if (p.olfactiveNotes !== undefined) {
    await getClient().from('perfume_olfactive_notes').delete().eq('perfume_id', id);
    if (p.olfactiveNotes.length > 0) {
      const { data: notes } = await getClient().from('olfactive_notes').select('id').in('name', p.olfactiveNotes);
      if ((notes || []).length) {
        await getClient().from('perfume_olfactive_notes').insert(
          (notes || []).map((n: { id: string }) => ({ perfume_id: id, olfactive_note_id: n.id }))
        );
      }
    }
  }
  const { data: perf, error } = await getClient().from('perfumes').select('*').eq('id', id).single();
  if (error) throw error;
  const notesMap = await getPerfumeOlfactiveNotes([id]);
  return toPerfume(perf, notesMap[id] ?? []);
}
export async function deletePerfume(id: string): Promise<void> {
  const { error } = await getClient().from('perfumes').delete().eq('id', id);
  if (error) throw error;
}
export async function perfumeInUse(id: string): Promise<boolean> {
  const [gi, go, tr] = await Promise.all([
    getClient().from('gate_in_logs').select('id').eq('perfume_id', id).limit(1),
    getClient().from('gate_out_logs').select('id').eq('perfume_id', id).limit(1),
    getClient().from('transfer_logs').select('id').eq('perfume_id', id).limit(1)
  ]);
  return (gi.data?.length ?? 0) > 0 || (go.data?.length ?? 0) > 0 || (tr.data?.length ?? 0) > 0;
}

// --- Olfactive Notes
export async function listOlfactiveNotes(): Promise<string[]> {
  const { data, error } = await getClient().from('olfactive_notes').select('name').order('name');
  if (error) throw error;
  return (data || []).map(r => r.name as string);
}
export async function createOlfactiveNote(name: string): Promise<string[]> {
  const n = (name || '').trim();
  if (!n) return listOlfactiveNotes();
  const existing = await listOlfactiveNotes();
  if (existing.includes(n)) return existing;
  await getClient().from('olfactive_notes').insert({ name: n });
  return listOlfactiveNotes();
}
export async function renameOlfactiveNote(oldName: string, newName: string): Promise<string[]> {
  const clean = (newName || '').trim();
  if (!clean || oldName === clean) throw new Error('Invalid update');
  await getClient().from('olfactive_notes').update({ name: clean }).eq('name', oldName);
  return listOlfactiveNotes();
}
export async function deleteOlfactiveNote(name: string): Promise<string[]> {
  await getClient().from('olfactive_notes').delete().eq('name', name);
  return listOlfactiveNotes();
}

// --- Gate In
export async function listGateInLogs(): Promise<GateInLog[]> {
  const { data, error } = await getClient().from('gate_in_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toGateIn);
}
export async function createGateInLog(l: Partial<GateInLog>): Promise<GateInLog> {
  const row = {
    date: l.date!, perfume_id: l.perfumeId!, import_reference: l.importReference!,
    packing_type_id: l.packingTypeId!, packing_qty: l.packingQty!, net_weight: l.netWeight!,
    main_location_id: l.mainLocationId!, sub_location_id: l.subLocationId ?? null,
    supplier_invoice: l.supplierInvoice ?? '', remarks: l.remarks ?? '',
    price_usd: l.priceUSD ?? null, price_pkr: l.pricePKR ?? null
  };
  const { data, error } = await getClient().from('gate_in_logs').insert(row).select().single();
  if (error) throw error;
  return toGateIn(data);
}
export async function updateGateInLog(id: string, l: Partial<GateInLog>): Promise<GateInLog> {
  const row: Record<string, unknown> = {};
  if (l.date !== undefined) row.date = l.date;
  if (l.perfumeId !== undefined) row.perfume_id = l.perfumeId;
  if (l.importReference !== undefined) row.import_reference = l.importReference;
  if (l.packingTypeId !== undefined) row.packing_type_id = l.packingTypeId;
  if (l.packingQty !== undefined) row.packing_qty = l.packingQty;
  if (l.netWeight !== undefined) row.net_weight = l.netWeight;
  if (l.mainLocationId !== undefined) row.main_location_id = l.mainLocationId;
  if (l.subLocationId !== undefined) row.sub_location_id = l.subLocationId;
  if (l.supplierInvoice !== undefined) row.supplier_invoice = l.supplierInvoice;
  if (l.remarks !== undefined) row.remarks = l.remarks;
  if (l.priceUSD !== undefined) row.price_usd = l.priceUSD;
  if (l.pricePKR !== undefined) row.price_pkr = l.pricePKR;
  const { data, error } = await getClient().from('gate_in_logs').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toGateIn(data);
}
export async function deleteGateInLog(id: string): Promise<void> {
  const { error } = await getClient().from('gate_in_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Gate Out
export async function listGateOutLogs(): Promise<GateOutLog[]> {
  const { data, error } = await getClient().from('gate_out_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toGateOut);
}
export async function createGateOutLog(l: Partial<GateOutLog>): Promise<GateOutLog> {
  const row = {
    date: l.date!, perfume_id: l.perfumeId!, packing_type_id: l.packingTypeId!,
    packing_qty: l.packingQty!, net_weight: l.netWeight!,
    main_location_id: l.mainLocationId!, sub_location_id: l.subLocationId ?? null,
    usage: l.usage!, customer_id: l.customerId ?? null,
    remarks: l.remarks ?? '', batch_number: l.batchNumber!
  };
  const { data, error } = await getClient().from('gate_out_logs').insert(row).select().single();
  if (error) throw error;
  return toGateOut(data);
}
export async function updateGateOutLog(id: string, l: Partial<GateOutLog>): Promise<GateOutLog> {
  const row: Record<string, unknown> = {};
  if (l.date !== undefined) row.date = l.date;
  if (l.perfumeId !== undefined) row.perfume_id = l.perfumeId;
  if (l.packingTypeId !== undefined) row.packing_type_id = l.packingTypeId;
  if (l.packingQty !== undefined) row.packing_qty = l.packingQty;
  if (l.netWeight !== undefined) row.net_weight = l.netWeight;
  if (l.mainLocationId !== undefined) row.main_location_id = l.mainLocationId;
  if (l.subLocationId !== undefined) row.sub_location_id = l.subLocationId;
  if (l.usage !== undefined) row.usage = l.usage;
  if (l.customerId !== undefined) row.customer_id = l.customerId;
  if (l.remarks !== undefined) row.remarks = l.remarks;
  if (l.batchNumber !== undefined) row.batch_number = l.batchNumber;
  const { data, error } = await getClient().from('gate_out_logs').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toGateOut(data);
}
export async function deleteGateOutLog(id: string): Promise<void> {
  const { error } = await getClient().from('gate_out_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- Transfers
export async function listTransferLogs(): Promise<StockTransferLog[]> {
  const { data, error } = await getClient().from('transfer_logs').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(toTransfer);
}
export async function createTransferLog(l: Partial<StockTransferLog>): Promise<StockTransferLog> {
  const row = {
    date: l.date!, perfume_id: l.perfumeId!, packing_type_id: l.packingTypeId!,
    packing_qty: l.packingQty!, net_weight: l.netWeight!,
    from_main_location_id: l.fromMainLocationId!, from_sub_location_id: l.fromSubLocationId ?? null,
    to_main_location_id: l.toMainLocationId!, to_sub_location_id: l.toSubLocationId ?? null,
    remarks: l.remarks ?? '', batch_number: l.batchNumber!
  };
  const { data, error } = await getClient().from('transfer_logs').insert(row).select().single();
  if (error) throw error;
  return toTransfer(data);
}
export async function updateTransferLog(id: string, l: Partial<StockTransferLog>): Promise<StockTransferLog> {
  const row: Record<string, unknown> = {};
  if (l.date !== undefined) row.date = l.date;
  if (l.perfumeId !== undefined) row.perfume_id = l.perfumeId;
  if (l.packingTypeId !== undefined) row.packing_type_id = l.packingTypeId;
  if (l.packingQty !== undefined) row.packing_qty = l.packingQty;
  if (l.netWeight !== undefined) row.net_weight = l.netWeight;
  if (l.fromMainLocationId !== undefined) row.from_main_location_id = l.fromMainLocationId;
  if (l.fromSubLocationId !== undefined) row.from_sub_location_id = l.fromSubLocationId;
  if (l.toMainLocationId !== undefined) row.to_main_location_id = l.toMainLocationId;
  if (l.toSubLocationId !== undefined) row.to_sub_location_id = l.toSubLocationId;
  if (l.remarks !== undefined) row.remarks = l.remarks;
  if (l.batchNumber !== undefined) row.batch_number = l.batchNumber;
  const { data, error } = await getClient().from('transfer_logs').update(row).eq('id', id).select().single();
  if (error) throw error;
  return toTransfer(data);
}
export async function deleteTransferLog(id: string): Promise<void> {
  const { error } = await getClient().from('transfer_logs').delete().eq('id', id);
  if (error) throw error;
}

const USER_COLS = 'id, name, role, permissions, email';

// --- Users
export async function listUsers(): Promise<User[]> {
  const { data, error } = await getClient().from('users').select(USER_COLS);
  if (error) throw error;
  return (data || []).map(toUser);
}
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await getClient().from('app_state').select('value').eq('key', 'current_user_id').single();
  const id = data?.value as string | undefined;
  if (!id) return null;
  const { data: u } = await getClient().from('users').select(USER_COLS).eq('id', id).single();
  return u ? toUser(u) : null;
}

export async function verifyUserByEmailPassword(email: string, password: string): Promise<User | null> {
  const { data, error } = await getClient()
    .from('users')
    .select('id, name, role, permissions, email, password_hash')
    .eq('email', email)
    .single();
  if (error || !data?.password_hash) return null;
  const bcrypt = await import('bcrypt');
  const ok = await bcrypt.compare(password, data.password_hash as string);
  if (!ok) return null;
  return toUser(data);
}
export async function createUser(u: Partial<User> & { password?: string }): Promise<User> {
  const perms = u.permissions ?? { canViewPrices: false, allowedLocationIds: [] };
  const row: Record<string, unknown> = { name: u.name!, role: u.role!, permissions: perms };
  if (u.email) row.email = u.email;
  if (u.password) {
    const bcrypt = await import('bcrypt');
    row.password_hash = await bcrypt.hash(u.password, 10);
  }
  const { data, error } = await getClient().from('users').insert(row).select(USER_COLS).single();
  if (error) throw error;
  return toUser(data);
}
export async function updateUser(id: string, u: Partial<User> & { password?: string }): Promise<User> {
  const row: Record<string, unknown> = {};
  if (u.name !== undefined) row.name = u.name;
  if (u.role !== undefined) row.role = u.role;
  if (u.permissions !== undefined) row.permissions = u.permissions;
  if (u.email !== undefined) row.email = u.email;
  if (u.password !== undefined) {
    const bcrypt = await import('bcrypt');
    row.password_hash = await bcrypt.hash(u.password, 10);
  }
  if (Object.keys(row).length) {
    const { error } = await getClient().from('users').update(row).eq('id', id);
    if (error) throw error;
  }
  const { data, error } = await getClient().from('users').select(USER_COLS).eq('id', id).single();
  if (error) throw error;
  return toUser(data);
}
export async function deleteUser(id: string): Promise<void> {
  const { error } = await getClient().from('users').delete().eq('id', id);
  if (error) throw error;
}
export async function clearCurrentUser(): Promise<void> {
  await getClient().from('app_state').delete().eq('key', 'current_user_id');
}

export async function setCurrentUser(id: string): Promise<User> {
  const { data, error } = await getClient().from('users').select(USER_COLS).eq('id', id).single();
  if (error || !data) throw new Error('User not found');
  await getClient().from('app_state').upsert({ key: 'current_user_id', value: id, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return toUser(data);
}

// --- Stock calculations (load all logs, compute in memory - same logic as store)
export async function getPerfumeStockBreakdown(perfumeId: string): Promise<StockPosition[]> {
  const [gateIn, gateOut, transfers] = await Promise.all([
    getClient().from('gate_in_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('gate_out_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('transfer_logs').select('*').eq('perfume_id', perfumeId)
  ]);
  const stockMap: Record<string, number> = {};
  const normalizeBatch = (s: string) => (s || 'Unknown Batch').trim();
  const getKey = (main: string, sub: string, batch: string) => `${main}|${sub || ''}|${batch}`;

  (gateIn.data || []).forEach((l: GateInRow) => {
    const k = getKey(l.main_location_id, l.sub_location_id || '', normalizeBatch(l.import_reference));
    stockMap[k] = (stockMap[k] || 0) + Number(l.net_weight);
  });
  (gateOut.data || []).forEach((l: GateOutRow) => {
    const k = getKey(l.main_location_id, l.sub_location_id || '', normalizeBatch(l.batch_number));
    stockMap[k] = (stockMap[k] || 0) - Number(l.net_weight);
  });
  (transfers.data || []).forEach((l: TransferRow) => {
    const batch = normalizeBatch(l.batch_number);
    const fromKey = getKey(l.from_main_location_id, l.from_sub_location_id || '', batch);
    const toKey = getKey(l.to_main_location_id, l.to_sub_location_id || '', batch);
    stockMap[fromKey] = (stockMap[fromKey] || 0) - Number(l.net_weight);
    stockMap[toKey] = (stockMap[toKey] || 0) + Number(l.net_weight);
  });

  return Object.entries(stockMap)
    .map(([key, weight]) => {
      const [mainLocId, subLocId, batch] = key.split('|');
      return { mainLocationId: mainLocId, subLocationId: subLocId || undefined, batch, weight };
    })
    .filter(item => Math.abs(item.weight) > 0.001);
}

export async function getBatchStock(
  perfumeId: string,
  mainLocId: string,
  subLocId?: string,
  excludeLogId?: string
): Promise<{ batch: string; weight: number }[]> {
  const [gateIn, gateOut, transfers] = await Promise.all([
    getClient().from('gate_in_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('gate_out_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('transfer_logs').select('*').eq('perfume_id', perfumeId)
  ]);
  const batchMap: Record<string, number> = {};
  const normalizeBatch = (s: string) => (s || '').trim();
  const isTargetLoc = (mId: string, sId?: string | null) => {
    if (mId !== mainLocId) return false;
    if (subLocId && sId !== subLocId) return false;
    return true;
  };

  (gateIn.data || []).forEach((l: GateInRow) => {
    if (isTargetLoc(l.main_location_id, l.sub_location_id)) {
      const b = normalizeBatch(l.import_reference);
      if (b) batchMap[b] = (batchMap[b] || 0) + Number(l.net_weight);
    }
  });
  (gateOut.data || []).forEach((l: GateOutRow) => {
    if (l.id === excludeLogId) return;
    if (isTargetLoc(l.main_location_id, l.sub_location_id)) {
      const b = normalizeBatch(l.batch_number);
      if (b) batchMap[b] = (batchMap[b] || 0) - Number(l.net_weight);
    }
  });
  (transfers.data || []).forEach((l: TransferRow) => {
    if (l.id === excludeLogId) return;
    const b = normalizeBatch(l.batch_number);
    if (b) {
      if (isTargetLoc(l.from_main_location_id, l.from_sub_location_id))
        batchMap[b] = (batchMap[b] || 0) - Number(l.net_weight);
      if (isTargetLoc(l.to_main_location_id, l.to_sub_location_id))
        batchMap[b] = (batchMap[b] || 0) + Number(l.net_weight);
    }
  });

  return Object.entries(batchMap)
    .map(([batch, weight]) => ({ batch, weight }))
    .filter(item => item.weight > 0.001)
    .sort((a, b) => b.weight - a.weight);
}

export async function getPerfumeMovementHistory(perfumeId: string) {
  const [gateIn, gateOut, transfers] = await Promise.all([
    getClient().from('gate_in_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('gate_out_logs').select('*').eq('perfume_id', perfumeId),
    getClient().from('transfer_logs').select('*').eq('perfume_id', perfumeId)
  ]);
  const history: Array<{ type: string } & Record<string, unknown>> = [];
  (gateIn.data || []).forEach((l: GateInRow) => history.push({ ...toGateIn(l), type: 'IN' }));
  (gateOut.data || []).forEach((l: GateOutRow) => history.push({ ...toGateOut(l), type: 'OUT' }));
  (transfers.data || []).forEach((l: TransferRow) => history.push({ ...toTransfer(l), type: 'TRANSFER' }));
  return history.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
}

// --- Full store / export / import / reset
export async function getStore(): Promise<DatabaseSnapshot> {
  const [
    suppliers, customers, packingTypes, locations, perfumes, olfactiveNotes,
    gateInLogs, gateOutLogs, transferLogs, users
  ] = await Promise.all([
    listSuppliers(), listCustomers(), listPackingTypes(), listLocations(),
    listPerfumes(), listOlfactiveNotes(), listGateInLogs(), listGateOutLogs(),
    listTransferLogs(), listUsers()
  ]);
  // Always return null for currentUser so app starts at login page; user must sign in
  const currentUser = null;
  return {
    suppliers, customers, packingTypes, locations, perfumes, olfactiveNotes,
    gateInLogs, gateOutLogs, transferLogs, users, currentUser,
    exportDate: new Date().toISOString()
  };
}

export async function loadSnapshot(data: DatabaseSnapshot): Promise<void> {
  const client = getClient();
  await client.from('gate_in_logs').delete().neq('id', '');
  await client.from('gate_out_logs').delete().neq('id', '');
  await client.from('transfer_logs').delete().neq('id', '');
  await client.from('perfume_olfactive_notes').delete().neq('perfume_id', '');
  await client.from('perfumes').delete().neq('id', '');
  await client.from('suppliers').delete().neq('id', '');
  await client.from('customers').delete().neq('id', '');
  await client.from('packing_types').delete().neq('id', '');
  await client.from('locations').delete().neq('id', '');
  await client.from('users').delete().neq('id', '');
  await client.from('olfactive_notes').delete().neq('id', '');

  if (data.suppliers?.length) {
    await client.from('suppliers').insert(data.suppliers.map(s => ({
      id: s.id, name: s.name, contact_person: s.contactPerson ?? '',
      type: s.type, phone: s.phone ?? '', email: s.email ?? ''
    })));
  }
  if (data.customers?.length) {
    await client.from('customers').insert(data.customers.map(c => ({
      id: c.id, name: c.name, address: c.address ?? '', phone: c.phone ?? '', email: c.email ?? ''
    })));
  }
  if (data.packingTypes?.length) {
    await client.from('packing_types').insert(data.packingTypes.map(p => ({
      id: p.id, name: p.name, description: p.description ?? '', qty_per_packing: p.qtyPerPacking
    })));
  }
  if (data.locations?.length) {
    await client.from('locations').insert(data.locations.map(l => ({
      id: l.id, name: l.name, type: l.type, parent_id: l.parentId ?? null
    })));
  }
  if (data.perfumes?.length) {
    await client.from('perfumes').insert(data.perfumes.map(p => ({
      id: p.id, name: p.name, code: p.code, supplier_id: p.supplierId,
      dosage: p.dosage ?? 0, price_usd: p.priceUSD ?? 0, price_pkr: p.pricePKR ?? 0,
      low_stock_alert: p.lowStockAlert ?? 0, remarks: p.remarks ?? ''
    })));
    for (const p of data.perfumes) {
      const noteNames = p.olfactiveNotes ?? [];
      if (noteNames.length) {
        const { data: notes } = await client.from('olfactive_notes').select('id').in('name', noteNames);
        if ((notes || []).length) {
          await client.from('perfume_olfactive_notes').insert(
            (notes || []).map((n: { id: string }) => ({ perfume_id: p.id, olfactive_note_id: n.id }))
          );
        }
      }
    }
  }
  if (data.olfactiveNotes?.length) {
    const existing = await listOlfactiveNotes();
    const toAdd = data.olfactiveNotes.filter(n => !existing.includes(n));
    if (toAdd.length) await client.from('olfactive_notes').insert(toAdd.map(name => ({ name })));
  }
  if (data.gateInLogs?.length) {
    await client.from('gate_in_logs').insert(data.gateInLogs.map(l => ({
      id: l.id, date: l.date, perfume_id: l.perfumeId, import_reference: l.importReference,
      packing_type_id: l.packingTypeId, packing_qty: l.packingQty, net_weight: l.netWeight,
      main_location_id: l.mainLocationId, sub_location_id: l.subLocationId ?? null,
      supplier_invoice: l.supplierInvoice ?? '', remarks: l.remarks ?? '',
      price_usd: l.priceUSD ?? null, price_pkr: l.pricePKR ?? null
    })));
  }
  if (data.gateOutLogs?.length) {
    await client.from('gate_out_logs').insert(data.gateOutLogs.map(l => ({
      id: l.id, date: l.date, perfume_id: l.perfumeId, packing_type_id: l.packingTypeId,
      packing_qty: l.packingQty, net_weight: l.netWeight,
      main_location_id: l.mainLocationId, sub_location_id: l.subLocationId ?? null,
      usage: l.usage, customer_id: l.customerId ?? null,
      remarks: l.remarks ?? '', batch_number: l.batchNumber
    })));
  }
  if (data.transferLogs?.length) {
    await client.from('transfer_logs').insert(data.transferLogs.map(l => ({
      id: l.id, date: l.date, perfume_id: l.perfumeId, packing_type_id: l.packingTypeId,
      packing_qty: l.packingQty, net_weight: l.netWeight,
      from_main_location_id: l.fromMainLocationId, from_sub_location_id: l.fromSubLocationId ?? null,
      to_main_location_id: l.toMainLocationId, to_sub_location_id: l.toSubLocationId ?? null,
      remarks: l.remarks ?? '', batch_number: l.batchNumber
    })));
  }
  if (data.users?.length) {
    await client.from('users').insert(data.users.map((u: User & { email?: string; password_hash?: string }) => {
      const row: Record<string, unknown> = {
        id: u.id, name: u.name, role: u.role,
        permissions: u.permissions ?? { canViewPrices: false, allowedLocationIds: [] }
      };
      if (u.email) row.email = u.email;
      if ((u as { password_hash?: string }).password_hash) row.password_hash = (u as { password_hash: string }).password_hash;
      return row;
    }));
  }
  if (data.currentUser?.id) {
    await client.from('app_state').upsert(
      { key: 'current_user_id', value: data.currentUser.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  }
}

export async function resetDatabase(): Promise<void> {
  const client = getClient();
  await client.from('gate_in_logs').delete().neq('id', '');
  await client.from('gate_out_logs').delete().neq('id', '');
  await client.from('transfer_logs').delete().neq('id', '');
  await client.from('perfume_olfactive_notes').delete().neq('perfume_id', '');
  await client.from('perfumes').delete().neq('id', '');
  await client.from('suppliers').delete().neq('id', '');
  await client.from('customers').delete().neq('id', '');
  await client.from('packing_types').delete().neq('id', '');
  await client.from('locations').delete().neq('id', '');
  await client.from('users').delete().neq('id', '');
  await client.from('olfactive_notes').delete().neq('id', '');
  await client.from('app_state').delete().eq('key', 'current_user_id');
  const bcrypt = await import('bcrypt');
  const adminHash = await bcrypt.hash('admin123', 10);
  const adminUser = {
    id: 'admin-1', name: 'Super Admin', role: UserRole.Admin,
    permissions: { canViewPrices: true, allowedLocationIds: [] },
    email: 'admin@scentvault.local',
    password_hash: adminHash
  } as User & { password_hash: string };
  await loadSnapshot({
    suppliers: [], customers: [], packingTypes: [], locations: [], perfumes: [], olfactiveNotes: ['Fruity', 'Floral', 'Oud', 'Woody', 'Citrus'],
    gateInLogs: [], gateOutLogs: [], transferLogs: [], users: [adminUser],
    currentUser: { id: 'admin-1', name: 'Super Admin', role: UserRole.Admin, permissions: { canViewPrices: true, allowedLocationIds: [] } }
  });
}
