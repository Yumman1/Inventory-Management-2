import { Router, Request, Response } from 'express';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  supplierInUse,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  customerInUse,
  listPackingTypes,
  createPackingType,
  updatePackingType,
  deletePackingType,
  packingTypeInUse,
  listLocations,
  getMainLocations,
  getSubLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  locationInUse,
  listPerfumes,
  createPerfume,
  updatePerfume,
  deletePerfume,
  perfumeInUse,
  listOlfactiveNotes,
  createOlfactiveNote,
  renameOlfactiveNote,
  deleteOlfactiveNote,
  listGateInLogs,
  createGateInLog,
  updateGateInLog,
  deleteGateInLog,
  listGateOutLogs,
  createGateOutLog,
  updateGateOutLog,
  deleteGateOutLog,
  listTransferLogs,
  createTransferLog,
  updateTransferLog,
  deleteTransferLog,
  listUsers,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  setCurrentUser,
  verifyUserByEmailPassword,
  clearCurrentUser,
  getBatchStock,
  getPerfumeStockBreakdown,
  getPerfumeMovementHistory,
  getStore,
  loadSnapshot,
  resetDatabase
} from './db.js';
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
  DatabaseSnapshot
} from './types.js';
import { UserRole } from './types.js';

const router = Router();

// Helper to run async handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) => {
  void fn(req, res).catch(err => {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });
};

// ============= AUTH: Login =============
router.post('/auth/login', asyncHandler(async (req: Request<object, object, { email: string; password: string }>, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await verifyUserByEmailPassword(email.trim(), password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  await setCurrentUser(user.id);
  res.json(user);
}));

router.post('/auth/signup', asyncHandler(async (req: Request<object, object, { email: string; password: string; name: string }>, res) => {
  const { email, password, name } = req.body;
  if (!email?.trim() || !password || !name?.trim()) return res.status(400).json({ error: 'Email, password and name required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const user = await createUser({ name: name.trim(), email: email.trim(), password, role: UserRole.Operator, permissions: { canViewPrices: false, allowedLocationIds: [] } });
    await setCurrentUser(user.id);
    res.status(201).json(user);
  } catch (e: any) {
    const msg = e?.message || '';
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already exists')) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    throw e;
  }
}));

router.post('/auth/logout', asyncHandler(async (_, res) => {
  await clearCurrentUser();
  res.status(204).send();
}));

// ============= SUPPLIERS =============
router.get('/suppliers', asyncHandler(async (_, res) => {
  const data = await listSuppliers();
  res.json(data);
}));
router.post('/suppliers', asyncHandler(async (req: Request<object, object, Supplier>, res) => {
  const s = await createSupplier(req.body);
  res.status(201).json(s);
}));
router.put('/suppliers/:id', asyncHandler(async (req, res) => {
  res.json(await updateSupplier(req.params.id, req.body));
}));
router.delete('/suppliers/:id', asyncHandler(async (req, res) => {
  const inUse = await supplierInUse(req.params.id);
  if (inUse) return res.status(400).json({ error: 'Cannot delete: supplier is used by perfumes' });
  await deleteSupplier(req.params.id);
  res.status(204).send();
}));

// ============= CUSTOMERS =============
router.get('/customers', asyncHandler(async (_, res) => {
  res.json(await listCustomers());
}));
router.post('/customers', asyncHandler(async (req: Request<object, object, Customer>, res) => {
  const c = await createCustomer(req.body);
  res.status(201).json(c);
}));
router.put('/customers/:id', asyncHandler(async (req, res) => {
  res.json(await updateCustomer(req.params.id, req.body));
}));
router.delete('/customers/:id', asyncHandler(async (req, res) => {
  if (await customerInUse(req.params.id)) return res.status(400).json({ error: 'Cannot delete: customer is used in gate-out records' });
  await deleteCustomer(req.params.id);
  res.status(204).send();
}));

// ============= PACKING TYPES =============
router.get('/packing-types', asyncHandler(async (_, res) => {
  res.json(await listPackingTypes());
}));
router.post('/packing-types', asyncHandler(async (req: Request<object, object, PackingType>, res) => {
  const p = await createPackingType(req.body);
  res.status(201).json(p);
}));
router.put('/packing-types/:id', asyncHandler(async (req, res) => {
  res.json(await updatePackingType(req.params.id, req.body));
}));
router.delete('/packing-types/:id', asyncHandler(async (req, res) => {
  if (await packingTypeInUse(req.params.id)) return res.status(400).json({ error: 'Cannot delete: packing type is used in transactions' });
  await deletePackingType(req.params.id);
  res.status(204).send();
}));

// ============= LOCATIONS =============
router.get('/locations', asyncHandler(async (_, res) => {
  res.json(await listLocations());
}));
router.get('/locations/main', asyncHandler(async (_, res) => {
  const locs = await listLocations();
  res.json(getMainLocations(locs));
}));
router.get('/locations/sub/:mainId', asyncHandler(async (req, res) => {
  const locs = await listLocations();
  res.json(getSubLocations(locs, req.params.mainId));
}));
router.post('/locations', asyncHandler(async (req: Request<object, object, Location>, res) => {
  const l = await createLocation(req.body);
  res.status(201).json(l);
}));
router.put('/locations/:id', asyncHandler(async (req, res) => {
  res.json(await updateLocation(req.params.id, req.body));
}));
router.delete('/locations/:id', asyncHandler(async (req, res) => {
  if (await locationInUse(req.params.id)) return res.status(400).json({ error: 'Cannot delete: location is used in transactions or has sub-locations' });
  await deleteLocation(req.params.id);
  res.status(204).send();
}));

// ============= PERFUMES =============
router.get('/perfumes', asyncHandler(async (_, res) => {
  res.json(await listPerfumes());
}));
router.post('/perfumes', asyncHandler(async (req: Request<object, object, Perfume>, res) => {
  const p = await createPerfume(req.body);
  res.status(201).json(p);
}));
router.put('/perfumes/:id', asyncHandler(async (req, res) => {
  res.json(await updatePerfume(req.params.id, req.body));
}));
router.delete('/perfumes/:id', asyncHandler(async (req, res) => {
  if (await perfumeInUse(req.params.id)) return res.status(400).json({ error: 'Cannot delete: perfume has stock or transaction history' });
  await deletePerfume(req.params.id);
  res.status(204).send();
}));

// ============= OLFACTIVE NOTES =============
router.get('/olfactive-notes', asyncHandler(async (_, res) => {
  res.json(await listOlfactiveNotes());
}));
router.post('/olfactive-notes', asyncHandler(async (req: Request<object, object, { name: string }>, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name required' });
  res.status(201).json(await createOlfactiveNote(name));
}));
router.put('/olfactive-notes', asyncHandler(async (req: Request<object, object, { oldName: string; newName: string }>, res) => {
  const { oldName, newName } = req.body;
  const cleanNew = (newName || '').trim();
  if (!cleanNew || oldName === cleanNew) return res.status(400).json({ error: 'Invalid update' });
  res.json(await renameOlfactiveNote(oldName, cleanNew));
}));
router.delete('/olfactive-notes/:name', asyncHandler(async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  res.json(await deleteOlfactiveNote(name));
}));

// ============= GATE IN LOGS =============
router.get('/gate-in', asyncHandler(async (_, res) => {
  res.json(await listGateInLogs());
}));
router.post('/gate-in', asyncHandler(async (req: Request<object, object, GateInLog>, res) => {
  const l = await createGateInLog(req.body);
  res.status(201).json(l);
}));
router.put('/gate-in/:id', asyncHandler(async (req, res) => {
  res.json(await updateGateInLog(req.params.id, req.body));
}));
router.delete('/gate-in/:id', asyncHandler(async (req, res) => {
  await deleteGateInLog(req.params.id);
  res.status(204).send();
}));

// ============= GATE OUT LOGS =============
router.get('/gate-out', asyncHandler(async (_, res) => {
  res.json(await listGateOutLogs());
}));
router.post('/gate-out', asyncHandler(async (req: Request<object, object, GateOutLog>, res) => {
  const l = await createGateOutLog(req.body);
  res.status(201).json(l);
}));
router.put('/gate-out/:id', asyncHandler(async (req, res) => {
  res.json(await updateGateOutLog(req.params.id, req.body));
}));
router.delete('/gate-out/:id', asyncHandler(async (req, res) => {
  await deleteGateOutLog(req.params.id);
  res.status(204).send();
}));

// ============= TRANSFER LOGS =============
router.get('/transfers', asyncHandler(async (_, res) => {
  res.json(await listTransferLogs());
}));
router.post('/transfers', asyncHandler(async (req: Request<object, object, StockTransferLog>, res) => {
  const l = await createTransferLog(req.body);
  res.status(201).json(l);
}));
router.put('/transfers/:id', asyncHandler(async (req, res) => {
  res.json(await updateTransferLog(req.params.id, req.body));
}));
router.delete('/transfers/:id', asyncHandler(async (req, res) => {
  await deleteTransferLog(req.params.id);
  res.status(204).send();
}));

// ============= USERS =============
router.get('/users', asyncHandler(async (_, res) => {
  res.json(await listUsers());
}));
router.get('/users/current', asyncHandler(async (_, res) => {
  res.json(await getCurrentUser());
}));
router.post('/users', asyncHandler(async (req: Request<object, object, User>, res) => {
  const u = await createUser(req.body);
  res.status(201).json(u);
}));
router.put('/users/:id', asyncHandler(async (req, res) => {
  res.json(await updateUser(req.params.id, req.body));
}));
router.delete('/users/:id', asyncHandler(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(204).send();
}));
router.post('/users/current', asyncHandler(async (req: Request<object, object, User>, res) => {
  res.json(await setCurrentUser(req.body.id));
}));

// ============= BATCH STOCK =============
router.get('/batch-stock', asyncHandler(async (req, res) => {
  const { perfumeId, mainLocId, subLocId, excludeLogId } = req.query;
  if (!perfumeId || !mainLocId) return res.status(400).json({ error: 'perfumeId and mainLocId required' });
  const result = await getBatchStock(perfumeId as string, mainLocId as string, (subLocId as string) || undefined, (excludeLogId as string) || undefined);
  res.json(result);
}));

// ============= STOCK BREAKDOWN =============
router.get('/stock-breakdown/:perfumeId', asyncHandler(async (req, res) => {
  const breakdown = await getPerfumeStockBreakdown(req.params.perfumeId);
  res.json(breakdown);
}));

// ============= MOVEMENT HISTORY =============
router.get('/movement-history/:perfumeId', asyncHandler(async (req, res) => {
  const history = await getPerfumeMovementHistory(req.params.perfumeId);
  res.json(history);
}));

// ============= REPORTS: Full inventory data with filters =============
router.get('/reports/inventory', asyncHandler(async (req, res) => {
  const {
    search, location, subLocation, supplier, olfactive,
    priceUSDMin, priceUSDMax, lowStockOnly, allowedLocationIds
  } = req.query;

  const allowedIds = allowedLocationIds ? (typeof allowedLocationIds === 'string' ? allowedLocationIds.split(',') : []) : [];
  const isLocationRestricted = allowedIds.length > 0;
  const checkLocationPermission = (mainLocId?: string) => {
    if (!isLocationRestricted) return true;
    if (mainLocId && allowedIds.includes(mainLocId)) return true;
    return false;
  };

  const searchTerm = (search as string) || '';
  const filterLocation = (location as string) || '';
  const filterSubLocation = (subLocation as string) || '';
  const filterSupplier = (supplier as string) || '';
  const filterOlfactive = (olfactive as string) || '';
  const filterPriceUSDMin = (priceUSDMin as string) || '';
  const filterPriceUSDMax = (priceUSDMax as string) || '';
  const lowStockOnlyFlag = lowStockOnly === 'true';
  const checkPriceFilter = (priceUSD: number | undefined) => {
    const usd = priceUSD || 0;
    if (filterPriceUSDMin && usd < Number(filterPriceUSDMin)) return false;
    if (filterPriceUSDMax && usd > Number(filterPriceUSDMax)) return false;
    return true;
  };

  const perfumes = await listPerfumes();
  const suppliers = await listSuppliers();

  const inventoryData: Array<Record<string, unknown>> = [];
  for (const p of perfumes) {
    const breakdown = await getPerfumeStockBreakdown(p.id);
    const filteredBreakdown = breakdown.filter(pos => {
      if (!checkLocationPermission(pos.mainLocationId)) return false;
      if (filterLocation && pos.mainLocationId !== filterLocation) return false;
      if (filterSubLocation && pos.subLocationId !== filterSubLocation) return false;
      return true;
    });
    const totalWeight = filteredBreakdown.reduce((acc, b) => acc + b.weight, 0);
    const supplierObj = suppliers.find(s => s.id === p.supplierId);
    const batchEntries = filteredBreakdown.filter(b => b.weight > 0.001).sort((a, b) => b.weight - a.weight);
    const primaryBatch = batchEntries[0]?.batch || '-';
    const activeBatches = batchEntries.map(b => b.batch).sort().join(', ');
    if (filterSupplier && p.supplierId !== filterSupplier) continue;
    if (filterOlfactive && !(p.olfactiveNotes || []).includes(filterOlfactive)) continue;
    if (!checkPriceFilter(p.priceUSD)) continue;
    const isLowStock = totalWeight <= (p.lowStockAlert || 0);
    const isCritical = totalWeight <= ((p.lowStockAlert || 0) * 0.5);
    if (lowStockOnlyFlag && !isLowStock) continue;
    const matchesSearch = !searchTerm || (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) continue;
    inventoryData.push({
      id: p.id, code: p.code, name: p.name, supplierName: supplierObj?.name || 'Unknown',
      currentWeight: totalWeight, primaryBatch, activeBatches: activeBatches || '-',
      unitPriceUSD: p.priceUSD, unitPricePKR: p.pricePKR || 0,
      totalValueUSD: totalWeight * (p.priceUSD || 0), totalValuePKR: totalWeight * (p.pricePKR || 0),
      lowStockAlert: p.lowStockAlert, isLowStock, isCritical, fullBreakdown: filteredBreakdown
    });
  }
  res.json(inventoryData);
}));

// ============= DATABASE: Export, Import, Reset =============
router.get('/database/export', asyncHandler(async (_, res) => {
  const data = await getStore();
  res.json(data);
}));
router.post('/database/import', asyncHandler(async (req: Request<object, object, DatabaseSnapshot>, res) => {
  await loadSnapshot(req.body);
  res.json({ success: true, message: 'Database imported successfully' });
}));
router.post('/database/reset', asyncHandler(async (_, res) => {
  await resetDatabase();
  res.json({ success: true, message: 'Database reset' });
}));

// ============= FULL DATA =============
router.get('/data', asyncHandler(async (_, res) => {
  res.json(await getStore());
}));

export default router;
