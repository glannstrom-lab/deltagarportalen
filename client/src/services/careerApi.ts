import { supabase } from '@/lib/supabase';
import { APIError } from './api';

// ===== Types =====

export interface SavedCareerPath {
  id: string;
  user_id: string;
  current_occupation: string;
  target_occupation: string;
  experience_years: number;
  current_salary: number;
  target_salary: number;
  salary_increase: number;
  timeline_months: number;
  demand_level: 'high' | 'medium' | 'low';
  job_count: number;
  steps: CareerStep[];
  created_at: string;
}

export interface CareerStep {
  order: number;
  title: string;
  description: string;
  timeframe: string;
  actions: string[];
  education?: string[];
}

export interface SavedSalarySearch {
  id: string;
  user_id: string;
  occupation: string;
  median_salary: number;
  percentile_25: number;
  percentile_75: number;
  region_data: RegionSalary[];
  experience_data: ExperienceSalary[];
  trends: {
    growth: number;
    job_count: number;
    competition: number;
  };
  created_at: string;
}

export interface RegionSalary {
  region: string;
  median: number;
  job_count: number;
}

export interface ExperienceSalary {
  years: string;
  median: number;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  category: 'technical' | 'soft' | 'certification' | 'language';
  frequency: number;
  target_occupation: string;
  status: 'interested' | 'learning' | 'acquired';
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface SavedEducation {
  id: string;
  user_id: string;
  education_code: string;
  title: string;
  type: string;
  description?: string;
  duration_months?: number;
  location?: string;
  url?: string;
  provider?: string;
  target_occupation: string;
  status: 'interested' | 'applied' | 'enrolled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkContact {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  linkedin_url?: string;
  relationship: 'colleague' | 'friend' | 'mentor' | 'recruiter' | 'other';
  last_contact_date?: string;
  next_contact_date?: string;
  notes?: string;
  status: 'active' | 'dormant' | 'reconnect';
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ===== Error Handler =====

function handleError(error: any, context: string): never {
  console.error(`[CareerAPI] ${context}:`, error);
  
  if (error?.code === 'PGRST116') {
    throw new APIError('Resursen hittades inte', 'NOT_FOUND', 404);
  }
  if (error?.code === '23505') {
    throw new APIError('Denna post finns redan', 'DUPLICATE', 409);
  }
  if (error?.code === '23503') {
    throw new APIError('Ogiltig referens', 'FOREIGN_KEY', 400);
  }
  
  throw new APIError(
    error?.message || 'Ett fel uppstod',
    error?.code || 'UNKNOWN',
    500
  );
}

// ===== Career Path API =====

export const careerPathApi = {
  async getAll(): Promise<SavedCareerPath[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_paths')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch career paths');
    return data || [];
  },

  async save(path: Omit<SavedCareerPath, 'id' | 'user_id' | 'created_at'>): Promise<SavedCareerPath> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_paths')
      .insert([{ ...path, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save career path');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('career_paths')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete career path');
  }
};

// ===== Salary API =====

export const salaryApi = {
  async getAll(): Promise<SavedSalarySearch[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('salary_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch salary searches');
    return data || [];
  },

  async save(search: Omit<SavedSalarySearch, 'id' | 'user_id' | 'created_at'>): Promise<SavedSalarySearch> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('salary_searches')
      .insert([{ ...search, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save salary search');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('salary_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete salary search');
  }
};

// ===== Skills API =====

export const skillsApi = {
  async getAll(): Promise<UserSkill[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) handleError(error, 'Failed to fetch skills');
    return data || [];
  },

  async getByOccupation(occupation: string): Promise<UserSkill[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_occupation', occupation)
      .order('priority', { ascending: true });

    if (error) handleError(error, 'Failed to fetch skills by occupation');
    return data || [];
  },

  async save(skill: Omit<UserSkill, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserSkill> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_skills')
      .insert([{ ...skill, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save skill');
    return data;
  },

  async update(id: string, updates: Partial<UserSkill>): Promise<UserSkill> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_skills')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update skill');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete skill');
  }
};

// ===== Education API =====

export const educationApi = {
  async getAll(): Promise<SavedEducation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('saved_educations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch saved educations');
    return data || [];
  },

  async getByStatus(status: SavedEducation['status']): Promise<SavedEducation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('saved_educations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch educations by status');
    return data || [];
  },

  async save(education: Omit<SavedEducation, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SavedEducation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('saved_educations')
      .insert([{ ...education, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save education');
    return data;
  },

  async update(id: string, updates: Partial<SavedEducation>): Promise<SavedEducation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('saved_educations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update education');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('saved_educations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete education');
  }
};

// ===== Network Contacts API =====

export const networkApi = {
  async getAll(): Promise<NetworkContact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('network_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('last_contact_date', { ascending: false, nullsFirst: false });

    if (error) handleError(error, 'Failed to fetch network contacts');
    return data || [];
  },

  async getByStatus(status: NetworkContact['status']): Promise<NetworkContact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('network_contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('last_contact_date', { ascending: false, nullsFirst: false });

    if (error) handleError(error, 'Failed to fetch contacts by status');
    return data || [];
  },

  async save(contact: Omit<NetworkContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NetworkContact> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('network_contacts')
      .insert([{ ...contact, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save contact');
    return data;
  },

  async update(id: string, updates: Partial<NetworkContact>): Promise<NetworkContact> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('network_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update contact');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('network_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete contact');
  },

  // Mark contact as contacted today
  async markContacted(id: string): Promise<NetworkContact> {
    const today = new Date().toISOString().split('T')[0];
    const nextContactDate = new Date();
    nextContactDate.setMonth(nextContactDate.getMonth() + 3); // Remind in 3 months

    return this.update(id, {
      last_contact_date: today,
      next_contact_date: nextContactDate.toISOString().split('T')[0],
      status: 'active'
    });
  }
};

export default {
  careerPath: careerPathApi,
  salary: salaryApi,
  skills: skillsApi,
  education: educationApi,
  network: networkApi
};
