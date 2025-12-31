import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Patient } from '../types';
import { Plus, Search, Mail, Phone, ExternalLink, Edit2, Trash2, History, X, Save, Users } from 'lucide-react';

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Partial<Patient>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from('Patient').select('*').order('p_name');
    setPatients(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    const payload = {
      p_name: currentPatient.p_name,
      p_email: currentPatient.p_email,
      p_phone: parseInt(currentPatient.p_phone as any),
      amount_spent: currentPatient.amount_spent || '0'
    };

    if (isEditing && currentPatient.patient_id) {
      const { error } = await supabase.from('Patient').update(payload).eq('patient_id', currentPatient.patient_id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('Patient').insert([payload]);
      if (error) alert(error.message);
    }
    
    setShowModal(false);
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove patient record?')) {
      const { error } = await supabase.from('Patient').delete().eq('patient_id', id);
      if (!error) fetchPatients();
    }
  };

  const openModal = (patient?: Patient) => {
    if (patient) {
      setCurrentPatient(patient);
      setIsEditing(true);
    } else {
      setCurrentPatient({ p_name: '', p_email: '', p_phone: undefined, amount_spent: '0' });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const filteredPatients = patients.filter(p => 
    p.p_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.p_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.p_phone.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Email or Phone..." 
            className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] w-full outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-all text-slate-900 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] font-black shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Add New Patient</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[32px]"></div>)
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-slate-200">
             <Users size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-black text-xl">NO PATIENTS REGISTERED</p>
          </div>
        ) : filteredPatients.map(patient => (
          <div key={patient.patient_id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">
                {patient.p_name.charAt(0)}
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => openModal(patient)}
                  className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(patient.patient_id)}
                  className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">{patient.p_name}</h3>
            
            <div className="space-y-3 mt-6">
              <div className="flex items-center text-slate-600 font-bold text-sm">
                <Mail size={16} className="mr-3 text-slate-400" />
                <span className="truncate">{patient.p_email}</span>
              </div>
              <div className="flex items-center text-slate-600 font-bold text-sm">
                <Phone size={16} className="mr-3 text-slate-400" />
                <span>{patient.p_phone}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Billing Account</p>
                <p className="text-2xl font-black text-slate-900">₹{patient.amount_spent}</p>
              </div>
              <button 
                onClick={() => alert(`Showing full profile for ${patient.p_name}`)}
                className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">{isEditing ? 'Edit Profile' : 'New Patient'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-bold text-slate-900"
                  value={currentPatient.p_name || ''}
                  onChange={(e) => setCurrentPatient({...currentPatient, p_name: e.target.value})}
                  placeholder="Enter full name..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                    value={currentPatient.p_email || ''}
                    onChange={(e) => setCurrentPatient({...currentPatient, p_email: e.target.value})}
                    placeholder="email@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                    value={currentPatient.p_phone || ''}
                    onChange={(e) => setCurrentPatient({...currentPatient, p_phone: e.target.value as any})}
                    placeholder="9998887776"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount Spent (₹)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                  value={currentPatient.amount_spent || ''}
                  onChange={(e) => setCurrentPatient({...currentPatient, amount_spent: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-12">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-[20px] transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 font-black bg-blue-600 text-white rounded-[20px] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>{isEditing ? 'Update Record' : 'Save Patient'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;