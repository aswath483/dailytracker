import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',         icon: '🏠', label: 'Today'   },
  { to: '/add',      icon: '➕', label: 'Log'      },
  { to: '/progress', icon: '📈', label: 'Progress' },
  { to: '/profile',  icon: '👤', label: 'Profile'  },
];

export default function Navbar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl transition-all ${
                isActive ? 'text-violet-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={`text-xs font-semibold ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && <span className="w-1 h-1 rounded-full bg-violet-600" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
