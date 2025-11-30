import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, MapPin, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { incidents, categories } from '../../lib/api';
import { IncidentCategory } from '../../lib/types';

interface IncidentFormProps {
  onSuccess?: () => void;
}

export function IncidentForm({ onSuccess }: IncidentFormProps) {
  const { user } = useAuth();
  const [categoriesList, setCategoriesList] = useState<IncidentCategory[]>([]);
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    address: '',
    incident_date: new Date().toISOString().slice(0, 16),
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categories.list();
      setCategoriesList(data);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('No se pudieron cargar las categorías');
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          setError('No se pudo obtener la ubicación. Por favor, ingresa la dirección manualmente.');
        }
      );
    } else {
      setGettingLocation(false);
      setError('Tu navegador no soporta geolocalización.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!user) {
      setError('Debes iniciar sesión para reportar incidencias');
      return;
    }

    setLoading(true);

    try {
      await incidents.create({
        category_id: formData.category_id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        incident_date: formData.incident_date,
        priority: formData.priority,
      });

      setSuccess(true);
      setFormData({
        category_id: categoriesList[0]?.id || '',
        title: '',
        description: '',
        address: '',
        incident_date: new Date().toISOString().slice(0, 16),
        priority: 'medium',
      });
      setLocation(null);

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar la incidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reportar Incidencia</h2>
        <p className="text-gray-600 mt-1">Completa el formulario con los detalles del incidente</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">Incidencia registrada exitosamente</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Incidencia
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categoriesList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Breve descripción del incidente"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción Detallada
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe lo que sucedió con el mayor detalle posible..."
            required
          />
        </div>

        <div>
          <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora del Incidente
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="incident_date"
              name="incident_date"
              type="datetime-local"
              value={formData.incident_date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Calle, número, referencia..."
              required
            />
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            {gettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
          </button>
          {location && (
            <p className="mt-2 text-sm text-green-600">
              Ubicación registrada: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Registrando...'
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              Reportar Incidencia
            </>
          )}
        </button>
      </form>
    </div>
  );
}
