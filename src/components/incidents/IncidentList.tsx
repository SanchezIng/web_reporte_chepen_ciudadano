import { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, Filter, Search } from 'lucide-react';
import { incidents as incidentsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Incident } from '../../lib/types';

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  resolved: 'Resuelta',
  rejected: 'Rechazada',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

interface IncidentListProps {
  onSelectIncident?: (incident: Incident) => void;
}

export function IncidentList({ onSelectIncident }: IncidentListProps) {
  const { profile, user } = useAuth();
  const [incidentsList, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    filterIncidents();
  }, [incidentsList, searchTerm, statusFilter, startDate, endDate]);

  const loadIncidents = async () => {
    try {
      const data = await incidentsAPI.list();
      setIncidents(data);
    } catch (err: any) {
      console.error('Error loading incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterIncidents = () => {
    let filtered = [...incidentsList];

    if (profile?.role === 'citizen') {
      filtered = filtered.filter((incident) => incident.user_id === user?.id);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (incident) =>
          incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((incident) => incident.status === statusFilter);
    }

    if (startDate) {
      filtered = filtered.filter((incident) => new Date(incident.incident_date) >= new Date(startDate));
    }

    if (endDate) {
      filtered = filtered.filter((incident) => new Date(incident.incident_date) <= new Date(endDate));
    }

    setFilteredIncidents(filtered);
  };

  const handleSelectIncident = (incident: Incident) => {
    if (onSelectIncident) {
      onSelectIncident(incident);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, descripción o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Proceso</option>
            <option value="resolved">Resuelta</option>
            <option value="rejected">Rechazada</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Desde"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Hasta"
          />

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setStartDate('');
              setEndDate('');
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay incidencias que mostrar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => handleSelectIncident(incident)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{incident.description.substring(0, 100)}...</p>
                </div>
                <div className="ml-4 text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      statusColors[incident.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[incident.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                {incident.category_name && (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: incident.category_color }}
                    ></div>
                    {incident.category_name}
                  </div>
                )}
                {incident.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {incident.address}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.created_at).toLocaleDateString('es-ES')}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    priorityColors[incident.priority as keyof typeof priorityColors]
                  }`}
                >
                  {priorityLabels[incident.priority as keyof typeof priorityLabels]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
