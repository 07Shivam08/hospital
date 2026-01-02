
import React from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  CalendarCheck, 
  Users, 
  Pill, 
  ShoppingCart,
  Activity,
  X
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms & Beds', icon: Bed },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medicines', label: 'Pharmacy', icon: Pill },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 
        flex flex-col h-full shadow-2xl md:shadow-none z-[50] transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Medisync</span>
          </div>
          <button onClick={onClose} className="p-2 md:hidden hover:bg-slate-100 rounded-xl text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-black text-sm uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Service Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-black text-slate-700 uppercase">System Ready</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
