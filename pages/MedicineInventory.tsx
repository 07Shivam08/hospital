
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
  
  const [currentMed, setCurrentMed] = useState<any>({
    medicine_name: '',
    serial_number: '',
    quantity: '',
    threshold_quantity: ''
  });

  useEffect(() => {
    fetchMedicines();
    const channel = supabase.channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Medicine' }, () => fetchMedicines())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    if (!currentMed.medicine_name || !currentMed.serial_number) {
      alert("Required fields missing.");
      return;
    }

    const payload = {
      ...currentMed,
      quantity: parseInt(currentMed.quantity) || 0,
      threshold_quantity: parseInt(currentMed.threshold_quantity) || 0
    };

    if (isEditing && currentMed.medicine_id) {
      await supabase.from('Medicine').update(payload).eq('medicine_id', currentMed.medicine_id);
    } else {
      await supabase.from('Medicine').insert([payload]);
    }
    setShowModal(false);
    fetchMedicines();
  };

  const filteredMeds = medicines.filter(m => 
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-100">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Inventory</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Stock Control</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { 
              setIsEditing(false); 
              setCurrentMed({ medicine_name: '', serial_number: '', quantity: '', threshold_quantity: '' }); 
              setShowModal(true); 
            }}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Level</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto"></div></td></tr>
              ) : filteredMeds.map((med) => {
                const isLow = med.quantity <= med.threshold_quantity;
                return (
                  <tr key={med.medicine_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-900">{med.medicine_name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Serial: {med.serial_number}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center space-x-4 bg-slate-50 border border-slate-200 p-1.5 rounded-xl w-fit mx-auto">
                        <button onClick={() => updateQuantity(med.medicine_id, med.quantity, -1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">-</button>
                        <span className={`w-8 text-center font-black ${isLow ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{med.quantity}</span>
                        <button onClick={() => updateQuantity(med.medicine_id, med.quantity, 1)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isLow ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                        <span>{isLow ? 'Low Stock' : 'Secure'}</span>
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setIsEditing(true); setCurrentMed(med); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                        <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('Medicine').delete().eq('medicine_id', med.medicine_id); fetchMedicines(); } }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">{isEditing ? 'Modify' : 'Register'} Item</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Brand Name</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                  placeholder="e.g. Amoxicillin"
                  value={currentMed.medicine_name || ''}
                  onChange={(e) => setCurrentMed({...currentMed, medicine_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Serial / Batch</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                  placeholder="MED000"
                  value={currentMed.serial_number || ''}
                  onChange={(e) => setCurrentMed({...currentMed, serial_number: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Opening Stock</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                    placeholder="e.g. 50"
                    value={currentMed.quantity}
                    onChange={(e) => setCurrentMed({...currentMed, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Threshold</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                    placeholder="e.g. 10"
                    value={currentMed.threshold_quantity}
                    onChange={(e) => setCurrentMed({...currentMed, threshold_quantity: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
              <button onClick={handleSave} className="flex-1 py-4 font-black bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Save size={18} /> <span>Save Item</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;
