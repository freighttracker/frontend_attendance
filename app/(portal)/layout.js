import RequireAuth from '@/components/shell/RequireAuth';
import Topbar from '@/components/shell/Topbar';
import BottomNav from '@/components/shell/BottomNav';

export default function PortalLayout({ children }) {
  return (
    <RequireAuth>
      <div className="shell">
        <Topbar />
        <main className="body">
          <div className="view">{children}</div>
        </main>
        <BottomNav />
      </div>
    </RequireAuth>
  );
}
