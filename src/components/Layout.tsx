import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  MessageSquare,
  Info,
  Menu,
  X,
} from 'lucide-react';
import { useData } from '@/lib/DataContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  const { alerts, projects } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const criticalCount = alerts.filter((a) => a.level === 'CRITICAL' || a.level === 'HIGH').length;
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="flex flex-col h-screen bg-gov-gray">
      {/* Gov Official Header Banner */}
      <header className="shrink-0 z-50 flex flex-col border-b-4 border-gov-red">
        <div className="w-full bg-gov-navy-dark text-white py-2 px-4 md:px-8 flex justify-between items-center text-xs font-bold tracking-wide">
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="w-4 h-6 invert brightness-0" />
            <span className="text-white">MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION</span>
            <span className="hidden md:inline text-white/50">|</span>
            <span className="hidden md:inline text-white/90">GOVERNMENT OF INDIA</span>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <span>PAIMANA</span>
          </div>
        </div>

        {/* Main Application Navbar */}
        <div className="bg-gov-blue px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-white hover:bg-white/10 border-2 border-transparent focus:border-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white leading-none">ProjectSaarthi</h1>
              <p className="text-xs text-white/90 font-bold uppercase mt-1">AI Project Monitoring & Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 transition-colors ${
                    isActive
                      ? 'bg-white text-gov-navy border-white'
                      : 'text-white border-transparent hover:border-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                    <span>{label}</span>
                    {to === '/alerts' && criticalCount > 0 && (
                      <span className={`ml-1.5 px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-gov-red text-white' : 'bg-white text-gov-red'}`}>
                        {criticalCount}
                      </span>
                    )}
                    {to === '/projects' && projects.length > 0 && (
                      <span className={`ml-1 text-xs font-bold ${isActive ? 'text-gov-navy/70' : 'text-white/70'}`}>
                        ({projects.length})
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-gov-navy-dark/80 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-gov-navy-dark border-r-4 border-gov-blue flex flex-col transition-transform duration-200 ease-in-out shadow-2xl`}
        >
          <div className="px-6 py-6 border-b border-white/20 flex items-center justify-between">
            <span className="font-bold text-white text-lg">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-white hover:bg-white/10 border-2 border-transparent focus:border-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-base font-bold border-l-4 transition-colors ${
                    isActive
                      ? 'bg-gov-blue text-white border-white'
                      : 'text-white/90 border-transparent hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                <span>{label}</span>
                {to === '/alerts' && criticalCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-gov-red text-white">
                    {criticalCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto w-full relative">
          <div className="absolute inset-0 bg-gov-gray -z-10" />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
