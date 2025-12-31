
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Booking, Bed, Patient } from '../types';
import { 
  Calendar, 
  Search, 
  Clock, 
  FastForward, 
  Plus,
  Edit3,
  History,
  Trash2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

const BookingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'advance'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  
  // Data for Adding Booking
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newBooking, setNewBooking] = useState({
    patient_id: '',
    bed_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchBookings();
    if (showAddModal) {
      fetchRequiredData();
    }
  }, [activeTab, showAddModal]);

  const fetchBookings = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    let query = supabase.from('Booking').select('*');

    if (activeTab === 'past') {
      query = query.lt('booking_end_date', now);
    } else if (activeTab === 'active') {
      query = query.lte('booking_start_date', now).gte('booking_end_date', now);
    } else {
      query = query.gt('booking_start_date', now);
    }

    const { data } = await query.order('booking_start_date', { ascending: activeTab !== 'past' });
    setBookings(data || []);
    setLoading(false);
  };

  const fetchRequiredData = async () => {
    // Use ilike for case-insensitive matching to find 'AVAILABLE' or 'Available'
    const [bedsRes, patientsRes] = await Promise.all([
      supabase.from('Bed').select('*').ilike('status', 'available'),
      supabase.from('Patient').select('*').order('p_name')
    ]);
    setAvailableBeds(bedsRes.data || []);
    setPatients(patientsRes.data || []);
  };

  const handleCreateBooking = async () => {
    const selectedBed = availableBeds.find(b => b.bed_id === newBooking.bed_id);
    const selectedPatient = patients.find(p => p.patient_id === newBooking.patient_id);

    if (!selectedBed || !selectedPatient) {
      alert("Please select both a patient and an available bed.");
      return;
    }

    const bookingPayload = {
      patient_id: selectedPatient.patient_id,
      patient_name: selectedPatient.p_name,
      bed_id: selectedBed.bed_id,
      bed_number: selectedBed.bed_number,
      booking_start_date: new Date(newBooking.start_date).toISOString(),
      booking_end_date: new Date(newBooking.end_date).toISOString(),
      payment_status: false,
      booking_date: new Date().toISOString()
    };

    const { error } = await supabase.from('Booking').insert([bookingPayload]);

    if (error) {
      alert(error.message);
    } else {
      // If booking starts today, update bed status using uppercase for consistency
      const today = new Date().toISOString().split('T')[0];
      if (newBooking.start_date <= today) {
        await supabase.from('Bed').update({ 
          status: 'OCCUPIED',
          patient_id: selectedPatient.patient_id,
          patient_name: selectedPatient.p_name 
        }).eq('bed_id', selectedBed.bed_id);
      }
      
      setShowAddModal(false);
      fetchBookings();
    }
  };

  const cancelBooking = async (id: string, bedId: string) => {
    if (confirm('Permanently cancel this booking? This will free up the medical unit.')) {
      const { error } = await supabase.from('Booking').delete().eq('booking_id', id);
      if (!error) {
        if (activeTab === 'active') {
          // Reset bed to AVAILABLE (uppercase)
          await supabase.from('Bed').update({ 
            status: 'AVAILABLE', 
            patient_id: null, 
            patient_name: null 
          }).eq('bed_id', bedId);
        }
        setBookings(prev => prev.filter(b => b.booking_id !== id));
      }
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bed_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center space-x-1 p-1.5 bg-slate-200/50 rounded-[24px] w-fit shadow-inner">
          {[
            { id: 'past', label: 'History', icon: History },
            { id: 'active', label: 'Admitted', icon: Clock },
            { id: 'advance', label: 'Future', icon: FastForward },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-[20px] transition-all duration-300 text-sm font-black ${
                  isActive ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search Admissions..." 
              className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] w-full outline-none focus:ring-4 focus:ring-blue-100 shadow-sm font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[20px] font-black shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden p-8 min-h-[500px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-6">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-r-4 border-r-transparent"></div>
             <p className="text-slate-900 font-black uppercase tracking-widest text-xs">Updating Patient Records...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-32 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-slate-200" size={48} />
            </div>
            <p className="text-slate-400 font-black text-2xl uppercase tracking-widest leading-none">Zero Admissions</p>
            <p className="text-slate-400 mt-2 font-bold text-sm">No records found for the current selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBookings.map(booking => (
              <div key={booking.booking_id} className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all relative group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      booking.payment_status ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {booking.payment_status ? 'Settled' : 'Unpaid'}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="font-black text-slate-900 text-2xl mb-1">{booking.patient_name}</h4>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center">
                      <CheckCircle2 size={14} className="mr-2" />
                      Unit: {booking.bed_number}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Admission</span>
                      <span className="font-black text-slate-900 text-sm">{new Date(booking.booking_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Discharge</span>
                      <span className="font-black text-slate-900 text-sm">{new Date(booking.booking_end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200/50 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {activeTab === 'advance' && (
                      <button 
                        onClick={() => { setEditingBooking(booking); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center space-x-2 text-xs font-black text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-4 rounded-xl transition-all border border-blue-100"
                      >
                        <Edit3 size={14} /> <span>Reschedule</span>
                      </button>
                    )}
                    {activeTab !== 'past' && (
                      <button 
                        onClick={() => cancelBooking(booking.booking_id, booking.bed_id)}
                        className="flex-1 flex items-center justify-center space-x-2 text-xs font-black text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-4 py-4 rounded-xl transition-all border border-rose-100"
                      >
                        <Trash2 size={14} /> <span>Cancel Admission</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW BOOKING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">New Admission</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Registered Patient</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 appearance-none"
                  value={newBooking.patient_id}
                  onChange={(e) => setNewBooking({...newBooking, patient_id: e.target.value})}
                >
                  <option value="">Choose Patient...</option>
                  {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.p_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Available Bed Unit</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 appearance-none"
                  value={newBooking.bed_id}
                  onChange={(e) => setNewBooking({...newBooking, bed_id: e.target.value})}
                >
                  <option value="">Choose Available Bed...</option>
                  {availableBeds.map(b => <option key={b.bed_id} value={b.bed_id}>Unit {b.bed_number} (Room {b.room_number})</option>)}
                </select>
                {availableBeds.length === 0 && <p className="text-[10px] text-rose-500 font-bold mt-2 uppercase">No beds available for immediate admission</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                    value={newBooking.start_date}
                    onChange={(e) => setNewBooking({...newBooking, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date (Discharge)</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                    value={newBooking.end_date}
                    onChange={(e) => setNewBooking({...newBooking, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-12">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black text-slate-500 hover:bg-slate-100 rounded-[24px] transition-all">Discard</button>
              <button 
                onClick={handleCreateBooking}
                disabled={!newBooking.patient_id || !newBooking.bed_id}
                className="flex-1 py-5 font-black bg-blue-600 text-white rounded-[24px] shadow-2xl shadow-blue-100 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
              >
                <Save size={20} />
                <span>Confirm Admission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Reschedule Admission</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Start Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                  value={editingBooking.booking_start_date.split('T')[0]}
                  onChange={(e) => setEditingBooking({...editingBooking, booking_start_date: new Date(e.target.value).toISOString()})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Discharge Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900"
                  value={editingBooking.booking_end_date.split('T')[0]}
                  onChange={(e) => setEditingBooking({...editingBooking, booking_end_date: new Date(e.target.value).toISOString()})}
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-12">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-[20px]">Cancel</button>
              <button 
                onClick={async () => {
                  const { error } = await supabase.from('Booking').update({
                    booking_start_date: editingBooking.booking_start_date,
                    booking_end_date: editingBooking.booking_end_date
                  }).eq('booking_id', editingBooking.booking_id);
                  if (!error) { setShowEditModal(false); fetchBookings(); }
                }}
                className="flex-1 py-4 font-black bg-blue-600 text-white rounded-[20px] shadow-2xl shadow-blue-100"
              >Confirm Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
