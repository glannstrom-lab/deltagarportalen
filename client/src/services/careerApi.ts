import { supabase } from '@/lib/supabase';
import { careerOfflineCache, offlineStorage } from './offlineStorage';

// ===== API Error Class =====

export class APIError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code: string = 'UNKNOWN', status: number = 500) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

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

interface PostgrestError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

function handleError(error: unknown, context: string): never {
  console.error(`[CareerAPI] ${context}:`, error);

  const pgError = error as PostgrestError;

  if (pgError?.code === 'PGRST116') {
    throw new APIError('Resursen hittades inte', 'NOT_FOUND', 404);
  }
  if (pgError?.code === '23505') {
    throw new APIError('Denna post finns redan', 'DUPLICATE', 409);
  }
  if (pgError?.code === '23503') {
    throw new APIError('Ogiltig referens', 'FOREIGN_KEY', 400);
  }

  throw new APIError(
    pgError?.message || 'Ett fel uppstod',
    pgError?.code || 'UNKNOWN',
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

    // Check if offline
    if (!offlineStorage.isOnline()) {
      const cached = await careerOfflineCache.getCachedNetworkContacts();
      if (cached.length > 0) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('network_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_contact_date', { ascending: false, nullsFirst: false });

      if (error) handleError(error, 'Failed to fetch network contacts');

      // Cache for offline use
      if (data && data.length > 0) {
        await careerOfflineCache.cacheNetworkContacts(data);
      }

      return data || [];
    } catch (error) {
      // If network error, try offline cache
      const cached = await careerOfflineCache.getCachedNetworkContacts();
      if (cached.length > 0) return cached;
      throw error;
    }
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

// ===== Career Plans API =====

export interface CareerPlan {
  id: string;
  user_id: string;
  current_situation: string;
  goal: string;
  timeframe?: string;
  is_active: boolean;
  total_progress: number;
  created_at: string;
  updated_at: string;
  milestones?: CareerMilestone[];
}

export interface CareerMilestone {
  id: string;
  plan_id: string;
  user_id: string;
  title: string;
  description?: string;
  timeframe?: string;
  target_date?: string;
  steps: string[];
  progress: number;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const careerPlanApi = {
  async getActive(): Promise<CareerPlan | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    // Check if offline
    if (!offlineStorage.isOnline()) {
      const cached = await careerOfflineCache.getCachedCareerPlan();
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('career_plans')
        .select(`
          *,
          milestones:career_milestones(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) handleError(error, 'Failed to fetch active career plan');

      // Cache the data for offline use
      if (data) {
        await careerOfflineCache.cacheCareerPlan(data);
        if (data.milestones) {
          await careerOfflineCache.cacheMilestones(data.milestones);
        }
      }

      return data;
    } catch (error) {
      // If network error, try offline cache
      const cached = await careerOfflineCache.getCachedCareerPlan();
      if (cached) return cached;
      throw error;
    }
  },

  async getAll(): Promise<CareerPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_plans')
      .select(`
        *,
        milestones:career_milestones(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch career plans');
    return data || [];
  },

  async create(plan: { current_situation: string; goal: string; timeframe?: string }): Promise<CareerPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    // Deactivate any existing active plan
    await supabase
      .from('career_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('career_plans')
      .insert([{
        user_id: user.id,
        ...plan,
        is_active: true,
        total_progress: 0
      }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to create career plan');
    return data;
  },

  async update(id: string, updates: Partial<CareerPlan>): Promise<CareerPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update career plan');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('career_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete career plan');
  }
};

// ===== Career Milestones API =====

export const milestonesApi = {
  async getByPlanId(planId: string): Promise<CareerMilestone[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_milestones')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) handleError(error, 'Failed to fetch milestones');
    return data || [];
  },

  async create(milestone: {
    plan_id: string;
    title: string;
    description?: string;
    timeframe?: string;
    target_date?: string;
    steps?: string[];
    sort_order?: number;
  }): Promise<CareerMilestone> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_milestones')
      .insert([{
        user_id: user.id,
        ...milestone,
        steps: milestone.steps || [],
        progress: 0,
        is_completed: false
      }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to create milestone');
    return data;
  },

  async update(id: string, updates: Partial<CareerMilestone>): Promise<CareerMilestone> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('career_milestones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update milestone');
    return data;
  },

  async toggleComplete(id: string): Promise<CareerMilestone> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    // Get current state
    const { data: current } = await supabase
      .from('career_milestones')
      .select('is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const newCompleted = !current?.is_completed;

    const { data, error } = await supabase
      .from('career_milestones')
      .update({
        is_completed: newCompleted,
        progress: newCompleted ? 100 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to toggle milestone');
    return data;
  },

  async updateProgress(id: string, progress: number): Promise<CareerMilestone> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const clampedProgress = Math.min(100, Math.max(0, progress));

    const { data, error } = await supabase
      .from('career_milestones')
      .update({
        progress: clampedProgress,
        is_completed: clampedProgress >= 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update progress');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('career_milestones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete milestone');
  }
};

// ===== Networking Events API =====

export interface NetworkingEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  event_url?: string;
  expected_attendees?: number;
  is_attending: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const networkingEventsApi = {
  async getAll(): Promise<NetworkingEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('networking_events')
      .select('*')
      .eq('user_id', user.id)
      .order('event_date', { ascending: true });

    if (error) handleError(error, 'Failed to fetch networking events');
    return data || [];
  },

  async getUpcoming(): Promise<NetworkingEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('networking_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', today)
      .order('event_date', { ascending: true });

    if (error) handleError(error, 'Failed to fetch upcoming events');
    return data || [];
  },

  async create(event: Omit<NetworkingEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NetworkingEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('networking_events')
      .insert([{
        user_id: user.id,
        ...event,
        is_attending: event.is_attending ?? false
      }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to create networking event');
    return data;
  },

  async update(id: string, updates: Partial<NetworkingEvent>): Promise<NetworkingEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('networking_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update networking event');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('networking_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete networking event');
  },

  async toggleAttending(id: string): Promise<NetworkingEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    // Get current state
    const { data: current } = await supabase
      .from('networking_events')
      .select('is_attending')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { data, error } = await supabase
      .from('networking_events')
      .update({
        is_attending: !current?.is_attending,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to toggle attending');
    return data;
  }
};

// ===== Skills Analyses API =====

export interface SkillComparison {
  name: string;
  current: number;
  target: number;
  gap: 'none' | 'small' | 'medium' | 'large';
}

export interface CourseRecommendation {
  title: string;
  provider: string;
  duration: string;
  type: string;
  cost: string;
  url?: string;
}

export interface ActionPlanItem {
  order: number;
  title: string;
  description: string;
}

export interface SkillsAnalysis {
  id: string;
  user_id: string;
  dream_job: string;
  cv_text?: string;
  match_percentage: number;
  analysis_result?: Record<string, unknown>;
  skills_comparison: SkillComparison[];
  recommended_courses: CourseRecommendation[];
  action_plan: ActionPlanItem[];
  created_at: string;
  updated_at: string;
}

export const skillsAnalysisApi = {
  async getAll(): Promise<SkillsAnalysis[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('skills_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch skills analyses');
    return data || [];
  },

  async getLatest(): Promise<SkillsAnalysis | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    // Check if offline
    if (!offlineStorage.isOnline()) {
      const cached = await careerOfflineCache.getCachedSkillsAnalysis();
      if (cached) return cached;
    }

    try {
      const { data, error } = await supabase
        .from('skills_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) handleError(error, 'Failed to fetch latest analysis');

      // Cache for offline use
      if (data) {
        await careerOfflineCache.cacheSkillsAnalysis(data);
      }

      return data;
    } catch (error) {
      // If network error, try offline cache
      const cached = await careerOfflineCache.getCachedSkillsAnalysis();
      if (cached) return cached;
      throw error;
    }
  },

  async create(analysis: Omit<SkillsAnalysis, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SkillsAnalysis> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('skills_analyses')
      .insert([{
        user_id: user.id,
        ...analysis,
        match_percentage: analysis.match_percentage || 0,
        skills_comparison: analysis.skills_comparison || [],
        recommended_courses: analysis.recommended_courses || [],
        action_plan: analysis.action_plan || []
      }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to create skills analysis');
    return data;
  },

  async update(id: string, updates: Partial<SkillsAnalysis>): Promise<SkillsAnalysis> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('skills_analyses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update skills analysis');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('skills_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete skills analysis');
  }
};

// ===== Favorite Occupations API =====

export interface FavoriteOccupation {
  id: string;
  user_id: string;
  occupation_id: string;
  occupation_title: string;
  occupation_category?: string;
  salary_range?: string;
  demand_level?: string;
  education_required?: string;
  match_percentage?: number;
  notes?: string;
  created_at: string;
}

export const favoriteOccupationsApi = {
  async getAll(): Promise<FavoriteOccupation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('favorite_occupations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch favorite occupations');
    return data || [];
  },

  async add(occupation: Omit<FavoriteOccupation, 'id' | 'user_id' | 'created_at'>): Promise<FavoriteOccupation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('favorite_occupations')
      .insert([{
        user_id: user.id,
        ...occupation
      }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to add favorite occupation');
    return data;
  },

  async remove(occupationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('favorite_occupations')
      .delete()
      .eq('occupation_id', occupationId)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to remove favorite occupation');
  },

  async isFavorite(occupationId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('favorite_occupations')
      .select('id')
      .eq('occupation_id', occupationId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  },

  async toggle(occupation: Omit<FavoriteOccupation, 'id' | 'user_id' | 'created_at'>): Promise<boolean> {
    const isFav = await this.isFavorite(occupation.occupation_id);
    if (isFav) {
      await this.remove(occupation.occupation_id);
      return false;
    } else {
      await this.add(occupation);
      return true;
    }
  }
};

// ===== User Credentials API =====

export interface UserCredential {
  id: string;
  user_id: string;
  name: string;
  issuer?: string;
  type: 'certification' | 'degree' | 'course' | 'license';
  status: 'planned' | 'in-progress' | 'completed';
  target_date?: string;
  completed_date?: string;
  url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const credentialsApi = {
  async getAll(): Promise<UserCredential[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'Failed to fetch credentials');
    return data || [];
  },

  async save(credential: Omit<UserCredential, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserCredential> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_credentials')
      .insert([{ ...credential, user_id: user.id }])
      .select()
      .single();

    if (error) handleError(error, 'Failed to save credential');
    return data;
  },

  async update(id: string, updates: Partial<UserCredential>): Promise<UserCredential> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { data, error } = await supabase
      .from('user_credentials')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) handleError(error, 'Failed to update credential');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401);

    const { error } = await supabase
      .from('user_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) handleError(error, 'Failed to delete credential');
  },

  async updateStatus(id: string, status: UserCredential['status']): Promise<UserCredential> {
    const completedDate = status === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
    return this.update(id, {
      status,
      completed_date: completedDate
    });
  }
};

export default {
  careerPath: careerPathApi,
  salary: salaryApi,
  skills: skillsApi,
  education: educationApi,
  network: networkApi,
  plans: careerPlanApi,
  milestones: milestonesApi,
  events: networkingEventsApi,
  skillsAnalysis: skillsAnalysisApi,
  favoriteOccupations: favoriteOccupationsApi,
  credentials: credentialsApi
};
