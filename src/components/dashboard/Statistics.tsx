import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { incidents as incidentsAPI } from '../../lib/api';
import { Incident } from '../../lib/types';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  byCategory: { name: string; count: number; color: string }[];
  byPriority: { priority: string; count: number }[];
}

export function Statistics() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    byCategory: [],
    byPriority: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const incidents: Incident[] = await incidentsAPI.list();

      const total = incidents.length;
      const pending = incidents.filter((i) => i.status === 'pending').length;
      const inProgress = incidents.filter((i) => i.status === 'in_progress').length;
      const resolved = incidents.filter((i) => i.status === 'resolved').length;
      const rejected = incidents.filter((i) => i.status === 'rejected').length;

      const categoryMap = new Map<string, { count: number; color: string }>();
      incidents.forEach((incident) => {
        const categoryName = incident.category_name || 'Sin categoría';
        const categoryColor = incident.category_color || '#6B7280';
        const current = categoryMap.get(categoryName) || { count: 0, color: categoryColor };
        categoryMap.set(categoryName, { count: current.count + 1, color: categoryColor });
      });

      const byCategory = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, count: data.count, color: data.color }))
        .sort((a, b) => b.count - a.count);

      const priorityMap = new Map<string, number>();
      incidents.forEach((incident) => {
        const priority = incident.priority;
        priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
      });

      const byPriority = Array.from(priorityMap.entries())
        .map(([priority, count]) => ({ priority, count }))
        .sort((a, b) => {
          const order = { urgent: 0, high: 1, medium: 2, low: 3 };
          return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
        });

      setStats({
        total,
        pending,
        inProgress,
        resolved,
        rejected,
        byCategory,
        byPriority,
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const priorityLabels = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas de Incidencias</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-3xl font-bold text-yellow-900">{stats.pending}</span>
          </div>
          <p className="text-yellow-800 font-semibold">Pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-900">{stats.inProgress}</span>
          </div>
          <p className="text-blue-800 font-semibold">En Proceso</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-900">{stats.resolved}</span>
          </div>
          <p className="text-green-800 font-semibold">Resueltas</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold text-red-900">{stats.rejected}</span>
          </div>
          <p className="text-red-800 font-semibold">Rechazadas</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Incidencias por Categoría</h3>
          </div>
          <div className="space-y-4">
            {stats.byCategory.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-sm font-bold text-gray-900">{category.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(category.count / stats.total) * 100}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-6 h-6 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Incidencias por Prioridad</h3>
          </div>
          <div className="space-y-4">
            {stats.byPriority.map((item) => (
              <div key={item.priority}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {priorityLabels[item.priority as keyof typeof priorityLabels]}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(item.count / stats.total) * 100}%`,
                      backgroundColor:
                        item.priority === 'urgent'
                          ? '#DC2626'
                          : item.priority === 'high'
                          ? '#F59E0B'
                          : item.priority === 'medium'
                          ? '#3B82F6'
                          : '#6B7280',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-900 mb-2">{stats.total}</p>
          <p className="text-gray-600 font-medium">Total de Incidencias Registradas</p>
        </div>
      </div>
    </div>
  );
}
