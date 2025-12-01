import { useState } from 'react';
import { X, MessageSquare, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { incidents as incidentsAPI } from '../../lib/api';
import { Incident } from '../../lib/types';

type IncidentWithJoins = Incident;

interface AuthorityDashboardProps {
  incident: IncidentWithJoins;
  onClose: () => void;
  onUpdate: () => void;
}

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  resolved: 'Resuelta',
  rejected: 'Rechazada',
};

export function AuthorityDashboard({ incident, onClose, onUpdate }: AuthorityDashboardProps) {
  const { user } = useAuth();
  const [newStatus, setNewStatus] = useState(incident.status);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdateStatus = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await incidentsAPI.update(incident.id, {
        status: newStatus,
        comment: comment.trim() || undefined,
      });

      setSuccess(true);
      setComment('');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la incidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Gestionar Incidencia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: (incident.category_color || '#3B82F6') + '20', color: incident.category_color || '#3B82F6' }}
              >
                {incident.category_name}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                Prioridad: {incident.priority.toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{incident.title}</h3>
            <p className="text-gray-600">{incident.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reportado por</p>
              <p className="font-semibold">{incident.full_name}</p>
              <p className="text-sm text-gray-600">{incident.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha del incidente</p>
              <p className="font-semibold">
                {new Date(incident.incident_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {incident.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                <p className="font-semibold">{incident.address}</p>
                {incident.latitude && incident.longitude && (
                  <p className="text-sm text-gray-600">
                    Coordenadas: {incident.latitude}, {incident.longitude}
                  </p>
                )}
              </div>
            )}
          </div>

          {incident.images && incident.images.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Evidencias
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {incident.images.map((img) => (
                  <img key={img.id} src={img.image_url} alt="evidencia" className="w-full h-32 object-cover rounded-lg border" />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
              Incidencia actualizada exitosamente
            </div>
          )}

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Actualizar Estado</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('in_progress')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      newStatus === 'in_progress'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">En Proceso</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('resolved')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      newStatus === 'resolved'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Resuelta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('pending')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      newStatus === 'pending'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Pendiente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('rejected')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                      newStatus === 'rejected'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Rechazada</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario <span className="text-gray-500">(opcional)</span>
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agrega notas sobre las acciones tomadas..."
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={loading || newStatus === incident.status}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
