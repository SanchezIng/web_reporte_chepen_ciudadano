export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'authority';
  created_at: string;
  updated_at: string;
}

export interface IncidentCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Incident {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  incident_date: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  category_name: string;
  category_color: string;
  full_name: string;
  email: string;
  images?: IncidentImage[];
  first_image_url?: string | null;
}

export interface IncidentImage {
  id: string;
  incident_id: string;
  image_url: string;
  uploaded_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  user_id: string;
  old_status?: string;
  new_status: string;
  comment?: string;
  created_at: string;
}
