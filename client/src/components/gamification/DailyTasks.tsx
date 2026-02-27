/**
 * DailyTasks
 * Dagliga uppgifter för att öka engagement
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Star, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface Task {
  id: string;
  task_type: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
}

export const DailyTasks: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrCreateTasks();
    }
  }, [user]);

  const fetchOrCreateTasks = async () => {
    try {
      // Försök hämta dagens tasks
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('assigned_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      if (data && data.length > 0) {
        setTasks(data);
      } else {
        // Skapa nya tasks för dagen
        await createDailyTasks();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDailyTasks = async () => {
    const defaultTasks = [
      {
        user_id: user?.id,
        task_type: 'UPDATE_CV',
        title: 'Uppdatera ditt CV',
        description: 'Lägg till ny information eller förbättra din profil',
        points: 10,
        assigned_date: new Date().toISOString().split('T')[0],
      },
      {
        user_id: user?.id,
        task_type: 'SEARCH_JOBS',
        title: 'Sök jobb',
        description: 'Sök minst 3 intressanta jobb',
        points: 15,
        assigned_date: new Date().toISOString().split('T')[0],
      },
      {
        user_id: user?.id,
        task_type: 'COMPLETE_PROFILE',
        title: 'Förbättra profilen',
        description: 'Uppdatera din profilbild eller lägg till kontaktinfo',
        points: 5,
        assigned_date: new Date().toISOString().split('T')[0],
      },
    ];

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert(defaultTasks)
      .select();

    if (!error && data) {
      setTasks(data);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) throw error;

      // Uppdatera lokalt
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, completed: true } : t
      ));

      // Lägg till poäng till användaren
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await supabase.rpc('add_points', {
          user_id: user?.id,
          points: task.points,
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  if (loading) {
    return <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Dagens uppgifter</h3>
        <span className="text-sm text-gray-500">
          {completedCount}/{tasks.length} klara
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              task.completed 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
            }`}
            onClick={() => !task.completed && completeTask(task.id)}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                {task.title}
              </p>
              <p className="text-sm text-gray-500">{task.description}</p>
            </div>

            <div className="flex items-center gap-1 text-amber-600">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">+{task.points}</span>
            </div>
          </div>
        ))}
      </div>

      {completedCount === tasks.length && tasks.length > 0 && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-medium">🎉 Alla uppgifter klara för idag!</p>
        </div>
      )}
    </div>
  );
};
