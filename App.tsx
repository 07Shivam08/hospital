
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import RoomManagement from './pages/RoomManagement';
import BookingManagement from './pages/BookingManagement';
import PatientManagement from './pages/PatientManagement';
import MedicineInventory from './pages/MedicineInventory';
import OrderManagement from './pages/OrderManagement';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [connectionTime, setConnectionTime] = useState(0);

  useEffect(() => {
    let mounted = true;
    console.log('Medisync: App Initializing...');

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) throw error;
          setSession(session);
          setLoading(false);
          console.log('Medisync: Auth connected.');
        }
      } catch (err) {
        console.error('Medisync: Auth Error', err);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Medisync: Auth Event -', _event);
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    // Track time for slow connection warning
    const timer = setInterval(() => {
      setConnectionTime(prev => prev + 1);
    }, 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-10 text-center">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 border-r-4 border-r-blue-100"></div>
          {connectionTime > 8 && (
            <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-lg animate-bounce">
              <WifiOff size={20} />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-3">
          {connectionTime > 8 ? 'Slow Connection Detected' : 'Connecting to Medisync'}
        </h2>
        
        <p className="text-slate-500 max-w-sm mx-auto mb-10 text-sm leading-relaxed">
          {connectionTime > 8 
            ? 'We are having difficulty reaching the database at bjcgrmjtxdkonkoixkup.supabase.co. Please check your network.' 
            : 'Synchronizing with hospital administrative records...'}
        </p>

        {connectionTime > 8 && (
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 w-full px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              <RefreshCw size={20} />
              <span>Retry Connection</span>
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Project ID: bjcgrmjtxdkonkoixkup
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'rooms': return <RoomManagement />;
      case 'bookings': return <BookingManagement />;
      case 'patients': return <PatientManagement />;
      case 'medicines': return <MedicineInventory />;
      case 'orders': return <OrderManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-10 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">{activePage}</h1>
            <p className="text-slate-500 font-medium">Administrator Panel v1.0</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{session.user.email}</p>
              <p className="text-[10px] font-black text-green-600 uppercase">System Active</p>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              Log Out
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
