import { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, Filter, Search, Pencil, Trash2 } from 'lucide-react';
import { categories as categoriesAPI } from '../../lib/api';
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
  const [editing, setEditing] = useState<Incident | null>(null);
  const [deleting, setDeleting] = useState<Incident | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    address: '',
    incident_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const getVideoPoster = (url?: string | null) => {
    if (!url) return undefined;
    try {
      if (!url.includes('/video/upload/')) return undefined;
      const jpg = url.replace('/video/upload/', '/video/upload/so_0/').replace(/\.(mp4|webm|ogg)(\?.*)?$/i, '.jpg');
      return jpg;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    loadIncidents();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.list();
      setCategoriesList(data);
    } catch {}
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

  const openEdit = (incident: Incident) => {
    setEditing(incident);
    setEditForm({
      title: incident.title,
      description: incident.description,
      address: incident.address || '',
      incident_date: new Date(incident.incident_date).toISOString().slice(0, 16),
      priority: incident.priority,
    });
    setSelectedCategory(incident.category_id);
    setImagePreview(incident.first_image_url || null);
    setImageFile(null);
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploadingImage(true);
        const form = new FormData();
        form.append('file', imageFile);
        form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Error subiendo imagen');
        imageUrl = data.secure_url as string;
        setUploadingImage(false);
      }

      await incidentsAPI.edit(editing.id, {
        category_id: selectedCategory || editing.category_id,
        title: editForm.title,
        description: editForm.description,
        address: editForm.address || null,
        incident_date: editForm.incident_date,
        priority: editForm.priority,
        images: imageUrl ? [imageUrl] : undefined,
      });
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      await loadIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await incidentsAPI.remove(deleting.id);
      setDeleting(null);
      await loadIncidents();
    } catch (err) {
      console.error(err);
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
                <div className="ml-4 flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {incident.first_image_url && (
                      <img src={incident.first_image_url} alt="evidencia" className="w-20 h-20 object-cover rounded" />
                    )}
                    {incident.first_video_url && (
                      <video
                        src={incident.first_video_url}
                        poster={getVideoPoster(incident.first_video_url)}
                        className="w-20 h-20 object-cover rounded"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    )}
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      statusColors[incident.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[incident.status as keyof typeof statusLabels]}
                  </span>
                  {profile?.role === 'citizen' && incident.user_id === user?.id && incident.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(incident); }}
                        className="p-1 rounded border hover:bg-gray-50"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleting(incident); }}
                        className="p-1 rounded border hover:bg-gray-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
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

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Editar Incidencia</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input className="w-full px-4 py-2 border rounded-lg" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea className="w-full px-4 py-2 border rounded-lg" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input className="w-full px-4 py-2 border rounded-lg" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
                  <input type="datetime-local" className="w-full px-4 py-2 border rounded-lg" value={editForm.incident_date} onChange={(e) => setEditForm({ ...editForm, incident_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (opcional)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setImageFile(f);
                    setImagePreview(f ? URL.createObjectURL(f) : editing.first_image_url || null);
                  }} />
                  {imagePreview && <img src={imagePreview} className="h-16 w-16 object-cover rounded border" />}
                </div>
                {uploadingImage && <p className="mt-2 text-sm text-blue-600">Subiendo imagen...</p>}
              </div>
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 border rounded-lg" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={submitEdit}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Eliminar Incidencia</h3>
              <p className="text-sm text-gray-600">¿Seguro que deseas eliminar este reporte? Solo es posible si está en estado Pendiente.</p>
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 border rounded-lg" onClick={() => setDeleting(null)}>Cancelar</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg" onClick={confirmDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
