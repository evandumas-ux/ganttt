import React, { useState, useMemo, useEffect } from 'react';
import { useProjectData } from './hooks/useProjectData';
import { Header } from './components/common/Header';
import { SummaryBanner } from './components/common/SummaryBanner';
import { Navigation } from './components/common/Navigation';
import { TaskFilterBar } from './components/tasks/TaskFilterBar';
import { GanttView } from './components/gantt/GanttView';
import { TaskListView } from './components/tasks/TaskListView';
import { WorkloadView } from './components/workload/WorkloadView';
import { MilestonesView } from './components/milestones/MilestonesView';
import { SafetyView } from './components/safety/SafetyView';
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer';
import { TaskEditModal } from './components/tasks/TaskEditModal';
import { DeadlineBanner } from './components/alerts/DeadlineBanner';
import { ImportExportModal } from './components/alerts/ImportExportModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { INITIAL_TASKS } from './data/initialTasks';
import { Task, ThemeMode } from './types/project';

export function App() {
  // Theme state: Light theme by default, optional dark theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('stork_iris_theme_mode');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('stork_iris_theme_mode', theme); } catch { /* Keep the app usable when storage is unavailable. */ }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const {
    saveStatus,
    tasks,
    milestones,
    filters,
    setFilters,
    resetFilters,
    filteredTasks,
    activeView,
    setActiveView,
    criticalPath,
    safetyChecks,
    workload,
    delayedTasks,
    updateTask,
    moveTask,
    resizeTask,
    addTask,
    deleteTask,
    resetAll,
    importJSONData,
    importCSVData,
  } = useProjectData();

  // Modals and Drawers state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);

  // Open task detail drawer
  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailDrawerOpen(true);
  };

  // Open edit modal
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleDuplicateTask = (sourceTask: Task) => {
    const nextId = `TASK${String(tasks.length + 1).padStart(2, '0')}`;
    const duplicated: Task = {
      ...sourceTask,
      id: nextId,
      title: `${sourceTask.title} (Copie)`,
      status: 'À faire',
      progress: 0,
    };
    addTask(duplicated);
  };

  const handlePrint = () => {
    window.print();
  };

  const completedCount = useMemo(
    () => tasks.filter(t => t.status === 'Terminée').length,
    [tasks]
  );

  const safetyAlertsCount = useMemo(
    () => safetyChecks.filter(s => !s.passed).length,
    [safetyChecks]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Deadline Breach Banner if overdue tasks exist */}
      <DeadlineBanner
        delayedTasks={delayedTasks}
        isOpen={isDeadlineModalOpen}
        onOpen={() => setIsDeadlineModalOpen(true)}
        onClose={() => setIsDeadlineModalOpen(false)}
        onSelectTask={handleOpenDetail}
      />

      {/* Main Header */}
      <Header
        totalTasks={tasks.length}
        totalHours={workload.totalHours}
        completedTasks={completedCount}
        delayedCount={delayedTasks.length}
        criticalCount={criticalPath.criticalTaskIds.size}
        safetyChecks={safetyChecks}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNewTask={handleNewTask}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onReset={() => setIsConfirmResetOpen(true)}
        onPrint={handlePrint}
        onOpenAlerts={() => {
          if (delayedTasks.length > 0) {
            setIsDeadlineModalOpen(true);
          } else {
            setActiveView('safety');
          }
        }}
      />

      {/* Compact Top Summary Banner */}
      <div role="status" className={`px-4 py-1 text-xs ${saveStatus === 'error' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 dark:text-slate-400'}`}>
        {saveStatus === 'error'
          ? 'Sauvegarde impossible dans ce navigateur. Exportez vos données depuis Import / Export pour les conserver.'
          : saveStatus === 'saving' ? 'Sauvegarde en cours…' : 'Modifications enregistrées automatiquement dans ce navigateur.'}
      </div>
      <SummaryBanner
        tasks={tasks}
        milestones={milestones}
        criticalTaskIds={criticalPath.criticalTaskIds}
      />

      {/* 5 View Navigation Tabs */}
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        tasksCount={tasks.length}
        criticalCount={criticalPath.criticalTaskIds.size}
        safetyAlertsCount={safetyAlertsCount}
        milestonesCount={milestones.length}
      />

      {/* Filters Bar (visible on Gantt and Tasks view) */}
      {(activeView === 'gantt' || activeView === 'tasks') && (
        <TaskFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={resetFilters}
          totalFiltered={filteredTasks.length}
          totalTasks={tasks.length}
          sensitiveCount={tasks.filter(t => t.isSensitive).length}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeView === 'gantt' && (
          <GanttView
            tasks={filteredTasks}
            allTasks={tasks}
            milestones={milestones}
            criticalTaskIds={criticalPath.criticalTaskIds}
            selectedTaskId={selectedTask?.id || null}
            onSelectTask={handleOpenDetail}
            onUpdateTask={task => updateTask(task, false)}
            onMoveTask={moveTask}
            onResizeTask={resizeTask}
          />
        )}

        {activeView === 'tasks' && (
          <TaskListView
            tasks={filteredTasks}
            criticalTaskIds={criticalPath.criticalTaskIds}
            onSelectTask={handleOpenDetail}
            onEditTask={handleEditTask}
            onUpdateTask={task => updateTask(task, false)}
            onDeleteTask={deleteTask}
            onDuplicateTask={handleDuplicateTask}
          />
        )}

        {activeView === 'workload' && (
          <WorkloadView tasks={tasks} workload={workload} />
        )}

        {activeView === 'milestones' && (
          <MilestonesView
            milestones={milestones}
            tasks={tasks}
            onSelectTask={handleOpenDetail}
          />
        )}

        {activeView === 'safety' && (
          <SafetyView
            tasks={tasks}
            safetyChecks={safetyChecks}
            onSelectTask={handleOpenDetail}
          />
        )}
      </main>

      {/* Detail Slide-Over Drawer */}
      <TaskDetailDrawer
        task={tasks.find(t => t.id === selectedTask?.id) || selectedTask}
        allTasks={tasks}
        criticalTaskIds={criticalPath.criticalTaskIds}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedTask(null);
        }}
        onEdit={handleEditTask}
        onUpdateTask={updateTask}
        onSelectRelatedTask={handleOpenDetail}
      />

      {/* Task Edit / Create Modal */}
      <TaskEditModal
        task={editingTask}
        allTasks={tasks}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={(savedTask, propagate) => {
          if (editingTask) {
            updateTask(savedTask, propagate);
          } else {
            addTask(savedTask);
          }
          if (selectedTask?.id === savedTask.id) {
            setSelectedTask(savedTask);
          }
        }}
        onDelete={deleteTask}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        tasks={tasks}
        milestones={milestones}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportJSON={importJSONData}
        onImportCSV={importCSVData}
        onPrintPDF={handlePrint}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmResetOpen}
        title="Restaurer les données officielles du projet ?"
        message={`Cette action réinitialise l'application avec les ${INITIAL_TASKS.length} tâches officielles de STORK IV - IRIS. Les modifications locales non exportées seront remplacées.`}
        confirmText="Restaurer"
        cancelText="Annuler"
        onConfirm={() => {
          resetAll();
          setIsConfirmResetOpen(false);
          setSelectedTask(null);
          setIsDetailDrawerOpen(false);
        }}
        onCancel={() => setIsConfirmResetOpen(false)}
      />
    </div>
  );
}

export default App;
