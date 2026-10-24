import { LoaderCircle } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import TodosPage from './pages/TodosPage';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { user, checking } = useAuth();
  const { theme, toggle } = useTheme();

  if (checking) {
    return (
      <div className="status full-screen">
        <LoaderCircle className="spin" size={32} />
      </div>
    );
  }

  if (!user) return <AuthPage theme={theme} onToggleTheme={toggle} />;

  // key={user.id}: switching accounts remounts the page, so no TODOs leak between users
  return <TodosPage key={user.id} theme={theme} onToggleTheme={toggle} />;
}
