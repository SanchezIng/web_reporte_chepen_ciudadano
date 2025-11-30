import { Shield, LogOut, User, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Seguridad Ciudadana</h1>
              <p className="text-xs text-gray-600">Municipalidad Provincial de Chepén</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2">
              {profile?.role === 'authority' && (
                <>
                  <button
                    onClick={() => onTabChange('incidents')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'incidents'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Incidencias
                  </button>
                  <button
                    onClick={() => onTabChange('statistics')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'statistics'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Estadísticas
                  </button>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-600">
                  {profile?.role === 'authority' ? 'Autoridad' : 'Ciudadano'}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {profile?.role === 'authority' && (
          <div className="md:hidden flex gap-2 pb-3">
            <button
              onClick={() => onTabChange('incidents')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'incidents'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-gray-100'
              }`}
            >
              Incidencias
            </button>
            <button
              onClick={() => onTabChange('statistics')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
