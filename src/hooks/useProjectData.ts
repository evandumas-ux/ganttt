import { useCurrentDate } from './useCurrentDate';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  Milestone,
  ProjectFilters,
  MemberId,
  ActiveView,
  OWNER_TBC,
} from '../types/project';
import {
  loadStoredData,
  saveStoredData,
  resetStoredData,
  parseCSVToTasks,
  migrateProjectData,
} from '../utils/storage';
import { calculateCriticalPath, getAffectedDependentTasks } from '../utils/criticalPath';
import { evaluateSafetyRules } from '../utils/safetyRules';
import { addDays, getTaskDurationDays, isTaskDelayed, getTaskDaysLate } from '../utils/dates';
import { MEMBER_IDS } from '../data/team';

export const INITIAL_FILTERS: ProjectFilters = {
  search: '',
  member: 'all',
  pole: 'all',
  priority: 'all',
  status: 'all',
  period: 'all',
  onlyCritical: false,
  onlySensitive: false,
  onlyDelayed: false,
};

export function useProjectData() {
  const today = useCurrentDate();
  const [data, setData] = useState<{ tasks: Task[]; milestones: Milestone[] }>(() => loadStoredData());
  const [filters, setFiltersState] = useState<ProjectFilters>(INITIAL_FILTERS);
  const [activeView, setActiveView] = useState<ActiveView>('gantt');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | 'saving'>('saving');

  // Auto-save on data change
  useEffect(() => {
    setSaveStatus(saveStoredData(data.tasks, data.milestones) ? 'saved' : 'error');
  }, [data]);

  // Critical path calculation
  const criticalPath = useMemo(() => {
    return calculateCriticalPath(data.tasks, today);
  }, [data.tasks, today]);

  // Safety rules evaluation
  const safetyChecks = useMemo(() => {
    return evaluateSafetyRules(data.tasks);
  }, [data.tasks]);

  // Charges recalculées pour les trois membres actifs.
  const workload = useMemo(() => {
    const members = Object.fromEntries(
      MEMBER_IDS.map(m => [m, { hours: 0, percentage: 0, count: 0 }])
    ) as Record<MemberId, { hours: number; percentage: number; count: number }>;
    let totalHours = 0;
    let hoursToConfirm = 0;
    let ownerToConfirmCount = 0;

    data.tasks.forEach(t => {
      if (t.owner === OWNER_TBC) ownerToConfirmCount += 1;
      else if (members[t.owner]) members[t.owner].count += 1;
      MEMBER_IDS.forEach(m => {
        members[m].hours += t.hours[m] || 0;
        totalHours += t.hours[m] || 0;
      });
      hoursToConfirm += t.hoursToConfirm || 0;
    });
    MEMBER_IDS.forEach(m => {
      members[m].percentage = totalHours > 0 ? (members[m].hours / totalHours) * 100 : 0;
    });

    return { members, totalHours, hoursToConfirm, ownerToConfirmCount, totalTasks: data.tasks.length };
  }, [data.tasks]);

  // Retards à date et dépassements de la date limite finale.
  const delayedTasks = useMemo(() => {
    return data.tasks.filter(t => isTaskDelayed(t, today)).map(t => ({
      task: t,
      daysLate: getTaskDaysLate(t, today),
      affectedTasks: getAffectedDependentTasks(t.id, data.tasks),
    }));
  }, [data.tasks, today]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return data.tasks.filter(t => {
      // Text search
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchId = t.id.toLowerCase().includes(query);
        const matchPole = t.pole.toLowerCase().includes(query);
        const matchSupport = (t.support || '').toLowerCase().includes(query);
        const matchTags = (t.tags || []).some(tag => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchId && !matchPole && !matchSupport && !matchTags) return false;
      }

      // Member filter (as owner or contributor)
      if (filters.member !== 'all') {
        const isOwner = t.owner === filters.member;
        const isContributor = filters.member !== OWNER_TBC && (t.hours[filters.member] || 0) > 0;
        if (!isOwner && !isContributor) return false;
      }

      // Pole filter
      if (filters.pole !== 'all' && t.pole !== filters.pole) return false;

      // Priority filter
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;

      // Status filter
      if (filters.status !== 'all' && t.status !== filters.status) return false;

      // Critical path toggle
      if (filters.onlyCritical && !criticalPath.criticalTaskIds.has(t.id)) return false;

      // Sensitive tasks toggle
      if (filters.onlySensitive && !t.isSensitive) return false;

      // Delayed tasks toggle
      if (filters.onlyDelayed && !isTaskDelayed(t, today)) return false;

      // Period filter
      if (filters.period !== 'all') {
        const start = t.startDate;
        if (filters.period === '2026' && !start.startsWith('2026')) return false;
        if (filters.period === '2027' && !start.startsWith('2027')) return false;
        if (filters.period === 'q3-2026' && !(start >= '2026-07-01' && start <= '2026-09-30')) return false;
        if (filters.period === 'q4-2026' && !(start >= '2026-10-01' && start <= '2026-12-31')) return false;
        if (filters.period === 'q1-2027' && !(start >= '2027-01-01' && start <= '2027-03-31')) return false;
        if (filters.period === 'q2-2027' && !(start >= '2027-04-01' && start <= '2027-06-30')) return false;
      }

      return true;
    });
  }, [data.tasks, filters, criticalPath, today]);

  // Actions
  const updateTask = useCallback((updatedTask: Task, propagateToDependents: boolean = false) => {
    setData(prev => {
      const oldTask = prev.tasks.find(t => t.id === updatedTask.id);
      let newTasks = prev.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));

      // If propagation is requested and end date changed
      if (propagateToDependents && oldTask && oldTask.endDate !== updatedTask.endDate) {
        const dateShiftDays = (new Date(updatedTask.endDate).getTime() - new Date(oldTask.endDate).getTime()) / (1000 * 3600 * 24);
        if (dateShiftDays !== 0) {
          const dependents = getAffectedDependentTasks(updatedTask.id, prev.tasks);
          const dependentIds = new Set(dependents.map(d => d.id));

          newTasks = newTasks.map(t => {
            if (dependentIds.has(t.id)) {
              const newStart = addDays(t.startDate, dateShiftDays);
              const newEnd = addDays(t.endDate, dateShiftDays);
              return { ...t, startDate: newStart, endDate: newEnd };
            }
            return t;
          });
        }
      }

      return { ...prev, tasks: newTasks };
    });
  }, []);

  const moveTask = useCallback((taskId: string, newStartDate: string, propagate = false) => {
    setData(prev => {
      const current = prev.tasks.find(t => t.id === taskId);
      if (!current) return prev;

      const duration = getTaskDurationDays(current.startDate, current.endDate);
      const newEndDate = addDays(newStartDate, duration - 1);

      const updated: Task = {
        ...current,
        startDate: newStartDate,
        endDate: newEndDate,
      };

      let newTasks = prev.tasks.map(t => (t.id === taskId ? updated : t));

      if (propagate) {
        const dependents = getAffectedDependentTasks(taskId, prev.tasks);
        const dependentIds = new Set(dependents.map(d => d.id));
        const dayDiff = (new Date(newStartDate).getTime() - new Date(current.startDate).getTime()) / (1000 * 3600 * 24);

        newTasks = newTasks.map(t => {
          if (dependentIds.has(t.id)) {
            return {
              ...t,
              startDate: addDays(t.startDate, dayDiff),
              endDate: addDays(t.endDate, dayDiff),
            };
          }
          return t;
        });
      }

      return { ...prev, tasks: newTasks };
    });
  }, []);

  const resizeTask = useCallback((taskId: string, newEndDate: string) => {
    setData(prev => {
      const current = prev.tasks.find(t => t.id === taskId);
      if (!current) return prev;

      // Prevent end date before start date
      if (newEndDate < current.startDate) return prev;

      const updated: Task = { ...current, endDate: newEndDate };
      return {
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? updated : t)),
      };
    });
  }, []);

  const addTask = useCallback((newTask: Task) => {
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId).map(t => ({
        ...t,
        dependencies: t.dependencies.filter(d => d !== taskId),
      })),
    }));
  }, []);

  const resetAll = useCallback(() => {
    const initial = resetStoredData();
    setData(initial);
    setFiltersState(INITIAL_FILTERS);
  }, []);

  const setFilters = useCallback((partial: Partial<ProjectFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
  }, []);

  const importJSONData = useCallback((payload: any) => {
    if (payload && Array.isArray(payload.tasks)) {
      const { tasks, milestones } = migrateProjectData({
        ...payload,
        milestones: Array.isArray(payload.milestones) ? payload.milestones : data.milestones,
      });
      setData({ tasks, milestones });
      return true;
    }
    return false;
  }, [data.milestones]);

  const importCSVData = useCallback((csvText: string) => {
    const parsed = parseCSVToTasks(csvText, data.tasks);
    setData(prev => ({ ...prev, tasks: parsed }));
  }, [data.tasks]);

  return {
    saveStatus,
    tasks: data.tasks,
    milestones: data.milestones,
    filters,
    setFilters,
    resetFilters,
    filteredTasks,
    activeView,
    setActiveView,
    selectedTaskId,
    setSelectedTaskId,
    criticalPath,
    safetyChecks,
    workload,
    delayedTasks,
    isAlertModalOpen,
    setIsAlertModalOpen,
    updateTask,
    moveTask,
    resizeTask,
    addTask,
    deleteTask,
    resetAll,
    importJSONData,
    importCSVData,
  };
}
