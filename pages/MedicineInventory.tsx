import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Medicine } from '../types';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  Save
} from 'lucide-react';

const MedicineInventory: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMed, setCurrentMed] = useState<Partial<Medicine>>({
    medicine_name: '',
    serial_number: '',
    quantity: 0,
    threshold_quantity: 5
  });

  useEffect(() => {
    fetchMedicines();
    
    const channel = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Medicine' }, () => fetchMedicines())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    const { data: meds } = await supabase.from('Medicine').select('*').order('medicine_name');
    setMedicines(meds || []);
    setLoading(false);
  };

  const updateQuantity = async (id: string, current: number, delta: number) => {
    const newQty = Math.max(0, current + delta);
    await supabase.from('Medicine').update({ quantity: newQty }).eq('medicine_id', id);
  };

  const handleSave = async () => {
    if (isEditing && currentMed.medicine_id) {
      await supabase.from('Medicine').update(currentMed).eq('medicine_id', currentMed.medicine_id);
    } else {
      await supabase.from('Medicine').insert([currentMed]);
    }
    setShowModal(false);
    fetchMedicines();
  };

  const deleteMedicine = async (id: string) => {
    if (confirm('Permanently delete this medical item?')) {
      await supabase.from('Medicine').delete().eq('medicine_id', id);
      fetchMedicines();
    }
  };

  const filteredMeds = medicines.filter(m => 
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Medical Inventory</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Pharmacy Control Unit</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Items..." 
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full outline-none focus:ring-4 focus:ring-blue-50 font-bold text-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setIsEditing(false); setCurrentMed({ medicine_name: '', serial_number: '', quantity: 0, threshold_quantity: 5 }); setShowModal(true); }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black shadow-2xl shadow-blue-100 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item / Batch</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Available Units</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Safety Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !medicines.length ? (
                <tr><td colSpan={4} className="px-10 py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 mx-auto"></div></td></tr>
              ) : filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <Package size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xl">Inventory Empty</p>
                  </td>
                </tr>
              ) : filteredMeds.map((med) => {
                const isLowStock = med.quantity <= med.threshold_quantity;
                return (
                  <tr key={med.medicine_id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className={`p-4 rounded-2xl shadow-sm ${isLowStock ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                          <Package size={24} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-none mb-2">{med.medicine_name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial: {med.serial_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-center space-x-6 bg-slate-50 w-fit mx-auto p-2 rounded-2xl border border-slate-100">
                        <button 
                          onClick={() => updateQuantity(med.medicine_id, med.quantity, -1)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 font-black text-lg transition-all"
                        >-</button>
                        <span className={`w-12 text-center font-black text-2xl ${isLowStock ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{med.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(med.medicine_id, med.quantity, 1)}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 font-black text-lg transition-all"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {isLowStock ? (
                        <div className="inline-flex items-center space-x-2 bg-rose-500 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-100">
                          <AlertCircle size={14} /> <span>Critically Low</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">
                          <CheckCircle2 size={14} /> <span>Optimal Level</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => { setIsEditing(true); setCurrentMed(med); setShowModal(true); }}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button 
                          onClick={() => deleteMedicine(med.medicine_id)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-slate-900 mb-8">{isEditing ? 'Edit Item' : 'Register New Item'}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-800"
                  value={currentMed.medicine_name || ''}
                  onChange={(e) => setCurrentMed({...currentMed, medicine_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serial / Batch #</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                  value={currentMed.serial_number || ''}
                  onChange={(e) => setCurrentMed({...currentMed, serial_number: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Qty</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                    value={currentMed.quantity || 0}
                    onChange={(e) => setCurrentMed({...currentMed, quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Safety Threshold</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                    value={currentMed.threshold_quantity || 0}
                    onChange={(e) => setCurrentMed({...currentMed, threshold_quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-12">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-[20px]">Discard</button>
              <button onClick={handleSave} className="flex-1 py-4 font-black bg-blue-600 text-white rounded-[20px] shadow-2xl shadow-blue-100 flex items-center justify-center space-x-2">
                <Save size={20} />
                <span>{isEditing ? 'Update Stock' : 'Create Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;