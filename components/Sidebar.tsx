
import React from 'react';
import { 
  LayoutDashboard, 
  Bed, 
  CalendarCheck, 
  Users, 
  Pill, 
  Settings,
  Activity,
  ShoppingCart
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms & Beds', icon: Bed },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medicines', label: 'Pharmacy', icon: Pill },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Activity className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-blue-900 tracking-tight">Medisync</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-blue-200 shadow-md translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600">Live Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
