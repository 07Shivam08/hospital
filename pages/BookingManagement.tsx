import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Booking } from '../types';
import { 
  Calendar, 
  Search, 
  Clock, 
  FastForward, 
  X,
  Edit3,
  History,
  Trash2
} from 'lucide-react';

const BookingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'advance'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

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

  const cancelBooking = async (id: string, bedId: string) => {
    if (confirm('Permanently cancel this booking? This will free up the medical unit.')) {
      const { error } = await supabase.from('Booking').delete().eq('booking_id', id);
      if (!error) {
        if (activeTab === 'active') {
          await supabase.from('Bed').update({ status: 'Available' }).eq('bed_id', bedId);
        }
        setBookings(prev => prev.filter(b => b.booking_id !== id));
      }
    }
  };

  const updateDates = async () => {
    if (!editingBooking) return;
    const { error } = await supabase.from('Booking').update({
      booking_start_date: editingBooking.booking_start_date,
      booking_end_date: editingBooking.booking_end_date
    }).eq('booking_id', editingBooking.booking_id);

    if (error) alert(error.message);
    else {
      setShowEditModal(false);
      fetchBookings();
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bed_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-1 p-1.5 bg-slate-200/50 rounded-[24px] w-fit shadow-inner">
          {[
            { id: 'past', label: 'Past', icon: History },
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
        
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Filter by Patient or Bed..." 
            className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[20px] w-full outline-none focus:ring-4 focus:ring-blue-100 shadow-sm font-bold text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden p-8 min-h-[400px]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-6">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-r-4 border-r-transparent"></div>
             <p className="text-slate-900 font-black uppercase tracking-widest">Updating Admissions...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-32 text-center">
            <Calendar className="text-slate-200 mx-auto mb-6" size={64} />
            <p className="text-slate-400 font-black text-2xl uppercase tracking-widest">No matching records</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBookings.map(booking => (
              <div key={booking.booking_id} className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 hover:border-blue-400 hover:shadow-2xl transition-all relative group flex flex-col justify-between">
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
                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest">Unit: {booking.bed_number}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
                      <span className="font-black text-slate-900 text-sm">{new Date(booking.booking_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
                      <span className="font-black text-slate-900 text-sm">{new Date(booking.booking_end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-200/50 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {activeTab === 'advance' && (
                      <button 
                        onClick={() => { setEditingBooking(booking); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center space-x-2 text-xs font-black text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-3 rounded-xl transition-all border border-blue-100"
                      >
                        <Edit3 size={14} /> <span>Reschedule</span>
                      </button>
                    )}
                    {activeTab !== 'past' && (
                      <button 
                        onClick={() => cancelBooking(booking.booking_id, booking.bed_id)}
                        className="flex-1 flex items-center justify-center space-x-2 text-xs font-black text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-4 py-3 rounded-xl transition-all border border-rose-100"
                      >
                        <Trash2 size={14} /> <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Admission Update</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Start Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                  value={editingBooking.booking_start_date.split('T')[0]}
                  onChange={(e) => setEditingBooking({...editingBooking, booking_start_date: new Date(e.target.value).toISOString()})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New End Date</label>
                <input 
                  type="date" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                  value={editingBooking.booking_end_date.split('T')[0]}
                  onChange={(e) => setEditingBooking({...editingBooking, booking_end_date: new Date(e.target.value).toISOString()})}
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-12">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-[20px]">Cancel</button>
              <button onClick={updateDates} className="flex-1 py-4 font-black bg-blue-600 text-white rounded-[20px] shadow-2xl shadow-blue-100">Confirm Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;