import { NavLink, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div>
          <div className="text-2xl font-semibold tracking-tight">CasaPerks</div>
          <div className="text-sm text-slate-400">Resident Rewards Portal</div>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded px-3 py-2 transition ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `rounded px-3 py-2 transition ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            🧾 History
          </NavLink>
          <NavLink
            to="/rewards"
            className={({ isActive }) =>
              `rounded px-3 py-2 transition ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            🎁 Rewards
          </NavLink>
        </nav>
        <button
          type="button"
          className="mt-auto inline-flex items-center justify-center rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Log Out
        </button>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

