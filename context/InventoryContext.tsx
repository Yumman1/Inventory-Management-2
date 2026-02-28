import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Supplier, Customer, PackingType, Location, Perfume,
  GateInLog, GateOutLog, StockTransferLog,
  User, UserRole
} from '../types';
import { api } from '../lib/apiClient';

interface StockPosition {
  mainLocationId: string;
  subLocationId?: string;
  batch: string;
  weight: number;
}

interface InventoryContextType {
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
  
  addSupplier: (s: Supplier) => Promise<void>;
  updateSupplier: (id: string, s: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addCustomer: (c: Customer) => Promise<void>;
  updateCustomer: (id: string, c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addPackingType: (p: PackingType) => Promise<void>;
  updatePackingType: (id: string, p: PackingType) => Promise<void>;
  deletePackingType: (id: string) => Promise<void>;
  addLocation: (l: Location) => Promise<void>;
  updateLocation: (id: string, l: Location) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  addPerfume: (p: Perfume) => Promise<void>;
  updatePerfume: (id: string, p: Perfume) => Promise<void>;
  deletePerfume: (id: string) => Promise<void>;
  
  // Tag Management
  addOlfactiveNote: (name: string) => Promise<void>;
  updateOlfactiveNote: (oldName: string, newName: string) => Promise<void>;
  deleteOlfactiveNote: (name: string) => Promise<void>;

  addGateInLog: (l: GateInLog) => Promise<void>;
  updateGateInLog: (id: string, l: GateInLog) => Promise<void>;
  deleteGateInLog: (id: string) => Promise<void>;

  addGateOutLog: (l: GateOutLog) => Promise<void>;
  updateGateOutLog: (id: string, l: GateOutLog) => Promise<void>;
  deleteGateOutLog: (id: string) => Promise<void>;

  addTransferLog: (l: StockTransferLog) => Promise<void>;
  updateTransferLog: (id: string, l: StockTransferLog) => Promise<void>;
  deleteTransferLog: (id: string) => Promise<void>;
  
  addUser: (u: User & { password?: string }) => Promise<void>;
  updateUser: (id: string, u: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setCurrentUser: (u: User) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;

  exportDatabase: () => Promise<void>;
  importDatabase: (jsonData: string) => Promise<void>;
  resetDatabase: () => Promise<void>;

  isLoading: boolean;
  apiError: string | null;

  getMainLocations: () => Location[];
  getSubLocations: (mainLocationId: string) => Location[];
  hasPermission: (permission: 'view_prices' | 'manage_users' | 'manage_master_data') => boolean;
  
  getBatchStock: (perfumeId: string, locationId: string, subLocationId?: string, excludeLogId?: string) => { batch: string; weight: number }[];
  getPerfumeStockBreakdown: (perfumeId: string) => StockPosition[];
  getPerfumeMovementHistory: (perfumeId: string) => any[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packingTypes, setPackingTypes] = useState<PackingType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [olfactiveNotes, setOlfactiveNotes] = useState<string[]>(['Fruity', 'Floral', 'Oud', 'Woody', 'Citrus']);
  const [gateInLogs, setGateInLogs] = useState<GateInLog[]>([]);
  const [gateOutLogs, setGateOutLogs] = useState<GateOutLog[]>([]);
  const [transferLogs, setTransferLogs] = useState<StockTransferLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    api.data()
      .then(data => {
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.customers) setCustomers(data.customers);
        if (data.packingTypes) setPackingTypes(data.packingTypes);
        if (data.locations) setLocations(data.locations);
        if (data.perfumes) setPerfumes(data.perfumes);
        if (data.olfactiveNotes) setOlfactiveNotes(data.olfactiveNotes);
        if (data.gateInLogs) setGateInLogs(data.gateInLogs);
        if (data.gateOutLogs) setGateOutLogs(data.gateOutLogs);
        if (data.transferLogs) setTransferLogs(data.transferLogs);
        if (data.users?.length) setUsers(data.users);
        setCurrentUser(data.currentUser || null);
        setApiError(null);
      })
      .catch(err => setApiError(err.message || 'Failed to connect to backend'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const user = await api.auth.login(email, password);
    setCurrentUser(user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const user = await api.auth.signup(email, password, name);
    setCurrentUser(user);
  };

  const logout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
  };

  const addSupplier = async (s: Supplier) => {
    const created = await api.suppliers.create(s);
    setSuppliers(prev => [...prev, created]);
  };
  const updateSupplier = async (id: string, s: Supplier) => {
    await api.suppliers.update(id, { ...s, id });
    setSuppliers(prev => prev.map(item => item.id === id ? { ...s, id } : item));
  };
  const deleteSupplier = async (id: string) => {
    await api.suppliers.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };
  const addCustomer = async (c: Customer) => {
    const created = await api.customers.create(c);
    setCustomers(prev => [...prev, created]);
  };
  const updateCustomer = async (id: string, c: Customer) => {
    await api.customers.update(id, { ...c, id });
    setCustomers(prev => prev.map(item => item.id === id ? { ...c, id } : item));
  };
  const deleteCustomer = async (id: string) => {
    await api.customers.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  };
  const addPackingType = async (p: PackingType) => {
    const created = await api.packingTypes.create(p);
    setPackingTypes(prev => [...prev, created]);
  };
  const updatePackingType = async (id: string, p: PackingType) => {
    await api.packingTypes.update(id, { ...p, id });
    setPackingTypes(prev => prev.map(item => item.id === id ? { ...p, id } : item));
  };
  const deletePackingType = async (id: string) => {
    await api.packingTypes.delete(id);
    setPackingTypes(prev => prev.filter(p => p.id !== id));
  };
  const addLocation = async (l: Location) => {
    const created = await api.locations.create(l);
    setLocations(prev => [...prev, created]);
  };
  const updateLocation = async (id: string, l: Location) => {
    await api.locations.update(id, { ...l, id });
    setLocations(prev => prev.map(item => item.id === id ? { ...l, id } : item));
  };
  const deleteLocation = async (id: string) => {
    await api.locations.delete(id);
    setLocations(prev => prev.filter(l => l.id !== id));
  };
  const addPerfume = async (p: Perfume) => {
    const created = await api.perfumes.create(p);
    setPerfumes(prev => [...prev, created]);
  };
  const updatePerfume = async (id: string, p: Perfume) => {
    await api.perfumes.update(id, { ...p, id });
    setPerfumes(prev => prev.map(item => item.id === id ? { ...p, id } : item));
  };
  const deletePerfume = async (id: string) => {
    await api.perfumes.delete(id);
    setPerfumes(prev => prev.filter(p => p.id !== id));
  };

  const addOlfactiveNote = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const updated = await api.olfactiveNotes.add(cleanName);
    setOlfactiveNotes(updated);
  };

  const updateOlfactiveNote = async (oldName: string, newName: string) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName || oldName === cleanNewName) return;
    const updated = await api.olfactiveNotes.update(oldName, cleanNewName);
    setOlfactiveNotes(updated);
    setPerfumes(prev => prev.map(p => {
      if ((p.olfactiveNotes || []).includes(oldName)) {
        return { ...p, olfactiveNotes: p.olfactiveNotes.map(n => n === oldName ? cleanNewName : n) };
      }
      return p;
    }));
  };

  const deleteOlfactiveNote = async (name: string) => {
    const updated = await api.olfactiveNotes.delete(name);
    setOlfactiveNotes(updated);
    setPerfumes(prev => prev.map(p => ({
      ...p,
      olfactiveNotes: (p.olfactiveNotes || []).filter(n => n !== name)
    })));
  };

  const addGateInLog = async (l: GateInLog) => {
    const created = await api.gateIn.create(l);
    setGateInLogs(prev => [...prev, created]);
  };
  const updateGateInLog = async (id: string, l: GateInLog) => {
    await api.gateIn.update(id, { ...l, id });
    setGateInLogs(prev => prev.map(item => item.id === id ? { ...l, id } : item));
  };
  const deleteGateInLog = async (id: string) => {
    await api.gateIn.delete(id);
    setGateInLogs(prev => prev.filter(item => item.id !== id));
  };
  const addGateOutLog = async (l: GateOutLog) => {
    const created = await api.gateOut.create(l);
    setGateOutLogs(prev => [...prev, created]);
  };
  const updateGateOutLog = async (id: string, l: GateOutLog) => {
    await api.gateOut.update(id, { ...l, id });
    setGateOutLogs(prev => prev.map(item => item.id === id ? { ...l, id } : item));
  };
  const deleteGateOutLog = async (id: string) => {
    await api.gateOut.delete(id);
    setGateOutLogs(prev => prev.filter(item => item.id !== id));
  };
  const addTransferLog = async (l: StockTransferLog) => {
    const created = await api.transfers.create(l);
    setTransferLogs(prev => [...prev, created]);
  };
  const updateTransferLog = async (id: string, l: StockTransferLog) => {
    await api.transfers.update(id, { ...l, id });
    setTransferLogs(prev => prev.map(item => item.id === id ? { ...l, id } : item));
  };
  const deleteTransferLog = async (id: string) => {
    await api.transfers.delete(id);
    setTransferLogs(prev => prev.filter(item => item.id !== id));
  };
  const addUser = async (u: User & { password?: string }) => {
    const created = await api.users.create(u);
    setUsers(prev => [...prev, created]);
  };
  const updateUser = async (id: string, u: Partial<User> & { password?: string }) => {
    const updated = await api.users.update(id, { ...u, id });
    setUsers(prev => prev.map(item => item.id === id ? updated : item));
    if (currentUser?.id === id) setCurrentUser(updated);
  };
  const deleteUser = async (id: string) => {
    await api.users.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const exportDatabase = async () => {
    const data = await api.database.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scentvault_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importDatabase = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      await api.database.import(data);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.customers) setCustomers(data.customers);
      if (data.packingTypes) setPackingTypes(data.packingTypes);
      if (data.locations) setLocations(data.locations);
      if (data.perfumes) setPerfumes(data.perfumes);
      if (data.olfactiveNotes) setOlfactiveNotes(data.olfactiveNotes);
      if (data.gateInLogs) setGateInLogs(data.gateInLogs);
      if (data.gateOutLogs) setGateOutLogs(data.gateOutLogs);
      if (data.transferLogs) setTransferLogs(data.transferLogs);
      if (data.users) setUsers(data.users);
      if (data.currentUser) setCurrentUser(data.currentUser);
    } catch (e) {
      alert("Error importing database. Invalid file format.");
    }
  };

  const resetDatabase = async () => {
    await api.database.reset();
    setSuppliers([]);
    setCustomers([]);
    setPackingTypes([]);
    setLocations([]);
    setPerfumes([]);
    setOlfactiveNotes(['Fruity', 'Floral', 'Oud', 'Woody', 'Citrus']);
    setGateInLogs([]);
    setGateOutLogs([]);
    setTransferLogs([]);
    setUsers([]);
    setCurrentUser(null);
  };

  const setCurrentUserAsync = async (u: User) => {
    await api.users.setCurrent(u);
    setCurrentUser(u);
  };

  const getMainLocations = useCallback(() => locations.filter(l => l.type === 'Main Location'), [locations]);
  const getSubLocations = useCallback((mainId: string) => locations.filter(l => l.type === 'Sub Location' && l.parentId === mainId), [locations]);

  const hasPermission = (permission: 'view_prices' | 'manage_users' | 'manage_master_data') => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.Admin) return true;
    if (permission === 'view_prices') return !!currentUser.permissions?.canViewPrices;
    return false;
  };

  const getPerfumeStockBreakdown = useCallback((perfumeId: string): StockPosition[] => {
    const stockMap: Record<string, number> = {};
    const normalizeBatch = (s: string) => (s || 'Unknown Batch').trim();
    const getKey = (main: string, sub: string, batch: string) => `${main}|${sub || ''}|${batch}`;

    gateInLogs.forEach(l => {
      if (l.perfumeId === perfumeId) {
        const k = getKey(l.mainLocationId, l.subLocationId || '', normalizeBatch(l.importReference));
        stockMap[k] = (stockMap[k] || 0) + Number(l.netWeight);
      }
    });

    gateOutLogs.forEach(l => {
      if (l.perfumeId === perfumeId) {
        const k = getKey(l.mainLocationId, l.subLocationId || '', normalizeBatch(l.batchNumber));
        stockMap[k] = (stockMap[k] || 0) - Number(l.netWeight);
      }
    });

    transferLogs.forEach(l => {
      if (l.perfumeId === perfumeId) {
        const batch = normalizeBatch(l.batchNumber);
        const fromKey = getKey(l.fromMainLocationId, l.fromSubLocationId || '', batch);
        const toKey = getKey(l.toMainLocationId, l.toSubLocationId || '', batch);
        stockMap[fromKey] = (stockMap[fromKey] || 0) - Number(l.netWeight);
        stockMap[toKey] = (stockMap[toKey] || 0) + Number(l.netWeight);
      }
    });

    return Object.entries(stockMap)
      .map(([key, weight]) => {
        const [mainLocId, subLocId, batch] = key.split('|');
        return { mainLocationId: mainLocId, subLocationId: subLocId || undefined, batch, weight };
      })
      .filter(item => Math.abs(item.weight) > 0.001);
  }, [gateInLogs, gateOutLogs, transferLogs]);

  const getPerfumeMovementHistory = useCallback((perfumeId: string) => {
      const history: any[] = [];
      gateInLogs.filter(l => l.perfumeId === perfumeId).forEach(l => history.push({ ...l, type: 'IN' }));
      gateOutLogs.filter(l => l.perfumeId === perfumeId).forEach(l => history.push({ ...l, type: 'OUT' }));
      transferLogs.filter(l => l.perfumeId === perfumeId).forEach(l => history.push({ ...l, type: 'TRANSFER' }));
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [gateInLogs, gateOutLogs, transferLogs]);

  const getBatchStock = useCallback((perfumeId: string, mainLocId: string, subLocId?: string, excludeLogId?: string) => {
    const batchMap: Record<string, number> = {};
    const normalizeBatch = (s: string) => (s || '').trim();

    const isTargetLoc = (mId: string, sId?: string) => {
        if (mId !== mainLocId) return false;
        if (subLocId && sId !== subLocId) return false;
        return true;
    };

    gateInLogs.forEach(l => {
      if (l.perfumeId === perfumeId && isTargetLoc(l.mainLocationId, l.subLocationId)) {
        const b = normalizeBatch(l.importReference);
        if (b) batchMap[b] = (batchMap[b] || 0) + Number(l.netWeight);
      }
    });

    gateOutLogs.forEach(l => {
      if (l.id === excludeLogId) return;
      if (l.perfumeId === perfumeId && isTargetLoc(l.mainLocationId, l.subLocationId)) {
        const b = normalizeBatch(l.batchNumber);
        if (b) batchMap[b] = (batchMap[b] || 0) - Number(l.netWeight);
      }
    });

    transferLogs.forEach(l => {
      if (l.id === excludeLogId) return;
      if (l.perfumeId === perfumeId) {
        const b = normalizeBatch(l.batchNumber);
        if (b) {
          if (isTargetLoc(l.fromMainLocationId, l.fromSubLocationId)) batchMap[b] = (batchMap[b] || 0) - Number(l.netWeight);
          if (isTargetLoc(l.toMainLocationId, l.toSubLocationId)) batchMap[b] = (batchMap[b] || 0) + Number(l.netWeight);
        }
      }
    });

    return Object.entries(batchMap)
      .map(([batch, weight]) => ({ batch, weight }))
      .filter(item => item.weight > 0.001)
      .sort((a, b) => b.weight - a.weight);
  }, [gateInLogs, gateOutLogs, transferLogs]);

  return (
    <InventoryContext.Provider value={{
      suppliers, customers, packingTypes, locations, perfumes, olfactiveNotes,
      gateInLogs, gateOutLogs, transferLogs, users, currentUser,
      addSupplier, updateSupplier, deleteSupplier,
      addCustomer, updateCustomer, deleteCustomer,
      addPackingType, updatePackingType, deletePackingType,
      addLocation, updateLocation, deleteLocation,
      addPerfume, updatePerfume, deletePerfume,
      addOlfactiveNote, updateOlfactiveNote, deleteOlfactiveNote,
      addGateInLog, updateGateInLog, deleteGateInLog,
      addGateOutLog, updateGateOutLog, deleteGateOutLog,
      addTransferLog, updateTransferLog, deleteTransferLog,
      addUser, updateUser, deleteUser, setCurrentUser: setCurrentUserAsync,
      login, signup, logout,
      exportDatabase, importDatabase, resetDatabase,
      getMainLocations, getSubLocations, hasPermission,
      getBatchStock,
      getPerfumeStockBreakdown,
      getPerfumeMovementHistory,
      isLoading, apiError
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};