import { useState } from 'react'
import { CheckSquare, Square, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { CalendarTask, TaskStatus } from '@/services/calendarData'

interface TaskManagerProps {
  eventId: string
  tasks: CalendarTask[]
  onTasksChange: (tasks: CalendarTask[]) => void
}

export function TaskManager({ eventId, tasks, onTasksChange }: TaskManagerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const completedCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    
    const newTask: CalendarTask = {
      id: `task-${Date.now()}`,
      eventId,
      title: newTaskTitle.trim(),
      status: 'todo',
      order: tasks.length,
    }
    
    onTasksChange([...tasks, newTask])
    setNewTaskTitle('')
  }

  const toggleTask = (taskId: string) => {
    onTasksChange(tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'done' ? 'todo' : 'done' as TaskStatus }
        : t
    ))
  }

  const deleteTask = (taskId: string) => {
    onTasksChange(tasks.filter(t => t.id !== taskId))
  }

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === tasks.length - 1) return
    
    const newTasks = [...tasks]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]]
    
    // Uppdatera order
    newTasks.forEach((t, i) => t.order = i)
    onTasksChange(newTasks)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-slate-900">Att göra</h3>
          <span className="text-sm text-slate-500">
            ({completedCount}/{tasks.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-100">
          {/* Add new task */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Lägg till ny uppgift..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Task list */}
          <div className="space-y-2 mt-4">
            {tasks.sort((a, b) => a.order - b.order).map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center gap-2 p-2 rounded-lg group transition-colors ${
                  task.status === 'done' ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0"
                >
                  {task.status === 'done' ? (
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-purple-600 transition-colors" />
                  )}
                </button>
                
                <span className={`flex-1 text-sm ${
                  task.status === 'done' 
                    ? 'text-slate-400 line-through' 
                    : 'text-slate-700'
                }`}>
                  {task.title}
                </span>

                {/* Reorder buttons */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => moveTask(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                  >
                    <ChevronUp size={14} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => moveTask(index, 'down')}
                    disabled={index === tasks.length - 1}
                    className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                  >
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">
              Inga uppgifter ännu. Lägg till en för att komma igång!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
