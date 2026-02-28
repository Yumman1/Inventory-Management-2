import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { SupplierType, LocationType, Supplier, Customer, PackingType, Location } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Pencil, X, Plus, Save, Trash2 } from 'lucide-react';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- SUPPLIER FORM ---
export const SupplierForm = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm = { name: '', contactPerson: '', type: SupplierType.Local, phone: '', email: '' };
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSupplier(editingId, { ...formData, id: editingId });
        setEditingId(null);
        alert('Supplier Updated');
      } else {
        await addSupplier({ ...formData, id: generateId() });
        alert('Supplier Added');
      }
      setFormData(initialForm);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEdit = (item: Supplier) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier(id);
      if (editingId === id) handleCancel();
      alert('Supplier deleted');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-8">
      <form id="supplier-form" onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Supplier' : 'New Supplier'}</h3>
            <div className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="text-xs flex items-center gap-1"><X size={14}/> Cancel Edit</Button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                    <Save size={14}/> Update Supplier
                  </button>
                </>
              ) : (
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                  <Plus size={14}/> Add Supplier
                </button>
              )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
          <Select 
            label="Supplier Type" 
            options={Object.values(SupplierType).map(t => ({ value: t, label: t }))}
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value as SupplierType })} 
          />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-md">
            {editingId ? <><Save size={16}/> Update Supplier</> : <><Plus size={16}/> Add Supplier</>}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-gray-100 font-medium text-gray-700 bg-gray-50">Registered Suppliers</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {suppliers.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                            <td className="px-6 py-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{s.type}</span></td>
                            <td className="px-6 py-3">{s.contactPerson}</td>
                            <td className="px-6 py-3">{s.phone}</td>
                            <td className="px-6 py-3">{s.email}</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(s)} className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                                        <Pencil size={14}/>
                                    </button>
                                    <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {suppliers.length === 0 && <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-400">No suppliers found.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOMER FORM ---
export const CustomerForm = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = { name: '', address: '', phone: '', email: '' };
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCustomer(editingId, { ...formData, id: editingId });
        setEditingId(null);
        alert('Customer Updated');
      } else {
        await addCustomer({ ...formData, id: generateId() });
        alert('Customer Added');
      }
      setFormData(initialForm);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEdit = (item: Customer) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await deleteCustomer(id);
      if (editingId === id) handleCancel();
      alert('Customer deleted');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-8">
      <form id="customer-form" onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Customer' : 'New Customer'}</h3>
            <div className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="text-xs flex items-center gap-1"><X size={14}/> Cancel Edit</Button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                    <Save size={14}/> Update Customer
                  </button>
                </>
              ) : (
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                  <Plus size={14}/> Add Customer
                </button>
              )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-md">
            {editingId ? <><Save size={16}/> Update Customer</> : <><Plus size={16}/> Add Customer</>}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-gray-100 font-medium text-gray-700 bg-gray-50">Registered Customers</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Address</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {customers.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                            <td className="px-6 py-3">{c.address}</td>
                            <td className="px-6 py-3">{c.phone}</td>
                            <td className="px-6 py-3">{c.email}</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(c)} className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                                        <Pencil size={14}/>
                                    </button>
                                    <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {customers.length === 0 && <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-400">No customers found.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

// --- PACKING TYPE FORM ---
export const PackingTypeForm = () => {
  const { packingTypes, addPackingType, updatePackingType, deletePackingType } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = { name: '', description: '', qtyPerPacking: '' };
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
        name: formData.name, 
        description: formData.description, 
        qtyPerPacking: Number(formData.qtyPerPacking)
    };

    try {
      if (editingId) {
        await updatePackingType(editingId, { ...data, id: editingId });
        setEditingId(null);
        alert('Packing Type Updated');
      } else {
        await addPackingType({ ...data, id: generateId() });
        alert('Packing Type Added');
      }
      setFormData(initialForm);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEdit = (item: PackingType) => {
    setFormData({
        name: item.name,
        description: item.description,
        qtyPerPacking: item.qtyPerPacking.toString()
    });
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete packing type "${name}"?`)) return;
    try {
      await deletePackingType(id);
      if (editingId === id) handleCancel();
      alert('Packing type deleted');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-8">
      <form id="packing-form" onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Packing Type' : 'New Packing Type'}</h3>
            <div className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="text-xs flex items-center gap-1"><X size={14}/> Cancel Edit</Button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                    <Save size={14}/> Update Packing Type
                  </button>
                </>
              ) : (
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                  <Plus size={14}/> Add Packing Type
                </button>
              )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Packing Type Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <Input 
            label="Qty per Packing" 
            type="number" 
            value={formData.qtyPerPacking} 
            onChange={e => setFormData({ ...formData, qtyPerPacking: e.target.value })} 
            placeholder="e.g., 200 (for 200kg drum)"
            required 
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-md">
            {editingId ? <><Save size={16}/> Update Packing Type</> : <><Plus size={16}/> Add Packing Type</>}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-gray-100 font-medium text-gray-700 bg-gray-50">Registered Packing Types</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Standard Qty</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {packingTypes.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                            <td className="px-6 py-3">{p.description}</td>
                            <td className="px-6 py-3 font-mono">{p.qtyPerPacking}</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(p)} className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                                        <Pencil size={14}/>
                                    </button>
                                    <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {packingTypes.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-400">No packing types defined.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

// --- LOCATION FORM ---
export const LocationForm = () => {
  const { locations, addLocation, updateLocation, deleteLocation, getMainLocations } = useInventory();
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = { name: '', type: LocationType.Main, parentId: '' };
  const [formData, setFormData] = useState(initialForm);

  const mainLocations = getMainLocations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
        name: formData.name, 
        type: formData.type, 
        parentId: formData.type === LocationType.Sub ? formData.parentId : undefined 
    };

    try {
      if (editingId) {
        await updateLocation(editingId, { ...data, id: editingId });
        setEditingId(null);
        alert('Location Updated');
      } else {
        await addLocation({ ...data, id: generateId() });
        alert('Location Added');
      }
      setFormData(initialForm);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleEdit = (item: Location) => {
    setFormData({
        name: item.name,
        type: item.type,
        parentId: item.parentId || ''
    });
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const getParentName = (parentId?: string) => {
      if (!parentId) return '-';
      return locations.find(l => l.id === parentId)?.name || 'Unknown';
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete location "${name}"?`)) return;
    try {
      await deleteLocation(id);
      if (editingId === id) handleCancel();
      alert('Location deleted');
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="space-y-8">
      <form id="location-form" onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Location' : 'New Location'}</h3>
            <div className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleCancel} className="text-xs flex items-center gap-1"><X size={14}/> Cancel Edit</Button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                    <Save size={14}/> Update Location
                  </button>
                </>
              ) : (
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                  <Plus size={14}/> Add Location
                </button>
              )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Location Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Select 
            label="Location Type" 
            options={Object.values(LocationType).map(t => ({ value: t, label: t }))}
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value as LocationType })} 
          />
          {formData.type === LocationType.Sub && (
            <Select 
              label="Link to Main Location" 
              options={mainLocations.map(l => ({ value: l.id, label: l.name }))}
              value={formData.parentId} 
              onChange={e => setFormData({ ...formData, parentId: e.target.value })} 
              required
            />
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-md">
            {editingId ? <><Save size={16}/> Update Location</> : <><Plus size={16}/> Add Location</>}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="px-6 py-4 border-b border-gray-100 font-medium text-gray-700 bg-gray-50">Registered Locations</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Parent Location</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {locations.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{l.name}</td>
                            <td className="px-6 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${l.type === LocationType.Main ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{l.type}</span></td>
                            <td className="px-6 py-3 text-gray-500">{getParentName(l.parentId)}</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(l)} className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                                        <Pencil size={14}/>
                                    </button>
                                    <button onClick={() => handleDelete(l.id, l.name)} className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {locations.length === 0 && <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-400">No locations defined.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};