import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Save,
  Trash2,
  Check,
} from 'lucide-react';
import { Task, MemberId, OwnerId, Pole, Priority, TaskStatus, ALL_POLES } from '../../types/project';
import { getTaskDurationDays, isPastDeadline, getDaysLate, formatDateFR } from '../../utils/dates';
import { MEMBER_IDS, SENSITIVE_TASK_IDS, TEAM_MEMBERS } from '../../data/team';
import { hasSecondMember } from '../../utils/safetyRules';
const VALIDATOR_TBC = 'À CONFIRMER';
import { OwnerOptions } from '../common/Badge';

interface TaskEditModalProps {
  task: Task | null;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, propagate: boolean) => void;
  onDelete?: (taskId: string) => void;
}

const STATUS_LIST: TaskStatus[] = [
  'À faire',
  'Prête',
  'En cours',
  'En validation',
  'Bloquée',
  'Terminée',
];

const FORBIDDEN_WORDS = ['propulseur', 'moteur solide', 'propergol', 'pyrotechnie propulsive'];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  allTasks,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isNew = !task;

  // Form state
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pole, setPole] = useState<Pole>('Gestion');
  const [owner, setOwner] = useState<OwnerId>('Evan');
  const [support, setSupport] = useState('');
  const [priority, setPriority] = useState<Priority>('P1');
  const [startDate, setStartDate] = useState('2026-09-07');
  const [endDate, setEndDate] = useState('2026-09-25');
  const [hours, setHours] = useState<Record<MemberId, number>>({
    Evan: 0,
    Julien: 0,
    Clémentine: 0,
  });
  const [status, setStatus] = useState<TaskStatus>('À faire');
  const [progress, setProgress] = useState(0);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [deliverable, setDeliverable] = useState('');
  const [validationCriteria, setValidationCriteria] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [secondValidator, setSecondValidator] = useState('');
  const [propagate, setPropagate] = useState(false);
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setId(task.id);
      setTitle(task.title);
      setDescription(task.description || '');
      setPole(task.pole);
      setOwner(task.owner);
      setSupport(task.support || '');
      setPriority(task.priority);
      setStartDate(task.startDate);
      setEndDate(task.endDate);
      setHours({
        Evan: task.hours.Evan || 0,
        Julien: task.hours.Julien || 0,
        Clémentine: task.hours.Clémentine || 0,
      });
      setStatus(task.status);
      setProgress(task.progress || 0);
      setDependencies(task.dependencies || []);
      setDeliverable(task.deliverable || '');
      setValidationCriteria(task.validationCriteria || '');
      setIsSensitive(task.isSensitive || SENSITIVE_TASK_IDS.has(task.id));
      setSecondValidator(task.secondValidator || '');
      setNotes(task.notes || '');
      setErrorMessage(null);
    } else {
      const nextId = `TASK${String(allTasks.length + 1).padStart(2, '0')}`;
      setId(nextId);
      setTitle('');
      setDescription('');
      setPole('Gestion');
      setOwner('Evan');
      setSupport('');
      setPriority('P1');
      setStartDate('2026-09-07');
      setEndDate('2026-09-25');
      setHours({ Evan: 10, Julien: 0, Clémentine: 0 });
      setStatus('À faire');
      setProgress(0);
      setDependencies([]);
      setDeliverable('');
      setValidationCriteria('');
      setIsSensitive(false);
      setSecondValidator('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [task, allTasks.length, isOpen]);

  if (!isOpen) return null;

  // Les heures « à attribuer » (membre retiré) restent incluses dans la charge totale
  const hoursToConfirm = task?.hoursToConfirm || 0;
  const totalCalculatedHours =
    MEMBER_IDS.reduce((sum, m) => sum + (hours[m] || 0), 0) + hoursToConfirm;

  const durationDays = getTaskDurationDays(startDate, endDate);
  const isOverdue = isPastDeadline(endDate);
  const daysLate = getDaysLate(endDate);

  const containsForbidden = FORBIDDEN_WORDS.some(w =>
    `${title} ${description} ${notes} ${support}`.toLowerCase().includes(w)
  );

  const missingSecondMember = isSensitive && !hasSecondMember({ owner, secondValidator } as Task);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id.trim() || !title.trim()) {
      setErrorMessage('L’identifiant et l’intitulé de la tâche sont obligatoires.');
      return;
    }

    if (endDate < startDate) {
      setErrorMessage('La date de fin ne peut pas être antérieure à la date de début.');
      return;
    }

    if (totalCalculatedHours <= 0) {
      setErrorMessage('La charge horaire totale doit être supérieure à 0 h.');
      return;
    }

    if (containsForbidden) {
      setErrorMessage(
        'Règle de sécurité violée : Aucune tâche concernant la manipulation ou la conception du propulseur n’est autorisée dans le projet STORK IV IRIS.'
      );
      return;
    }

    const updatedTask: Task = {
      ...task, // conserve les champs non édités ici (statut de décision, rattachement, notes de révision…)
      id: id.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || undefined,
      pole,
      owner,
      support: support.trim(),
      totalHours: totalCalculatedHours,
      hours: {
        Evan: hours.Evan || 0,
        Julien: hours.Julien || 0,
        Clémentine: hours.Clémentine || 0,
      },
      priority,
      startDate,
      endDate,
      dependencies,
      completionRequirements: task?.completionRequirements,
      relatedMilestoneIds: task?.relatedMilestoneIds,
      specialRequirements: task?.specialRequirements,
      deliverable: deliverable.trim() || undefined,
      validationCriteria: validationCriteria.trim() || undefined,
      status,
      progress: Math.min(100, Math.max(0, progress)),
      isSensitive,
      secondValidator: secondValidator.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(updatedTask, propagate);
    onClose();
  };

  const toggleDependency = (depId: string) => {
    if (dependencies.includes(depId)) {
      setDependencies(dependencies.filter(d => d !== depId));
    } else {
      setDependencies([...dependencies, depId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-cyan-300">
              {id || 'NOUVELLE TÂCHE'}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isNew ? 'Créer une tâche' : 'Modifier la tâche'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Overdue Warning */}
          {isOverdue && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Dépassement de la date limite impérative (15 mai 2027) !
                </p>
                <p className="mt-0.5">
                  Fin le {formatDateFR(endDate)} (+{daysLate} jours de retard sur la livraison finale).
                </p>
              </div>
            </div>
          )}

          {/* Safety Warning */}
          {containsForbidden && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Violation formelle des règles de sécurité !</p>
                <p className="mt-0.5">Les activités relatives au propulseur sont strictement exclues.</p>
              </div>
            </div>
          )}

          {missingSecondMember && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Règle de sécurité : validation par un second membre</p>
                <p className="mt-0.5">
                  Une tâche sensible doit être validée par un second membre de l’équipe, différent du responsable.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Row 1: ID, Pole, Priority, Sensitive */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identifiant (ID)
              </label>
              <input
                type="text"
                value={id}
                onChange={e => setId(e.target.value.toUpperCase())}
                disabled={!isNew}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 font-mono uppercase focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pôle
              </label>
              <select
                value={pole}
                onChange={e => setPole(e.target.value as Pole)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {ALL_POLES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priorité
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="P0">P0 (Critique mission)</option>
                <option value="P1">P1 (Standard)</option>
              </select>
            </div>

            <div className="flex items-center h-full pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={isSensitive}
                  onChange={e => setIsSensitive(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Tâche sensible sécurité</span>
              </label>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Intitulé de la tâche
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description technique
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 focus:outline-none focus:border-cyan-500"
              placeholder="Détails des objectifs et contraintes techniques..."
            />
          </div>

          {/* Row 3: Owner, Support, Second Validator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Responsable principal
              </label>
              <select
                value={owner}
                onChange={e => setOwner(e.target.value as OwnerId)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <OwnerOptions format="name" />
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Appui ou validation
              </label>
              <input
                type="text"
                value={support}
                onChange={e => setSupport(e.target.value)}
                placeholder="Ex: Julien et référent structure"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Second validateur désigné
              </label>
              <input
                list="second-validator-options"
                value={secondValidator}
                onChange={e => setSecondValidator(e.target.value)}
                placeholder="Ex: Julien, Evan"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
              <datalist id="second-validator-options">
                {[...MEMBER_IDS, VALIDATOR_TBC, 'Toute l’équipe', 'Autorité de lancement'].map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 4: Dates & Propagation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`w-full bg-white dark:bg-slate-900 border rounded px-2.5 py-1.5 font-mono focus:outline-none ${
                  isOverdue ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-[11px] text-slate-500">
                Durée : <strong className="font-mono text-slate-800 dark:text-slate-200">{durationDays} jours</strong>
              </span>
              <label className="flex items-center gap-1.5 mt-2 cursor-pointer text-cyan-700 dark:text-cyan-400 font-medium">
                <input
                  type="checkbox"
                  checked={propagate}
                  onChange={e => setPropagate(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0"
                />
                <span>Propager décalage aux dépendances</span>
              </label>
            </div>
          </div>

          {/* Row 5: Hours Breakdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Répartition des heures :</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                Total : {totalCalculatedHours} h
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              {MEMBER_IDS.map(m => (
                <div key={m}>
                  <label className="block text-[11px] font-sans mb-0.5" style={{ color: TEAM_MEMBERS[m].color }}>
                    {m === 'Clémentine' ? 'Clém.' : m} (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours[m]}
                    onChange={e => setHours({ ...hours, [m]: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1"
                  />
                </div>
              ))}
              {hoursToConfirm > 0 && (
                <div>
                  <label className="block text-[11px] text-slate-500 font-sans mb-0.5">À attribuer (h)</label>
                  <div className="px-2 py-1 border border-dashed border-slate-300 dark:border-slate-700 rounded">{hoursToConfirm}</div>
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Deliverable & Validation Criteria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Livrable attendu
              </label>
              <input
                type="text"
                value={deliverable}
                onChange={e => setDeliverable(e.target.value)}
                placeholder="Ex: Fichier Gerbers, rapport de test..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Critère de validation
              </label>
              <input
                type="text"
                value={validationCriteria}
                onChange={e => setValidationCriteria(e.target.value)}
                placeholder="Ex: Signature du BAT, validation ERC/DRC..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 7: Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {STATUS_LIST.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Progression : <span className="font-mono text-cyan-600 dark:text-cyan-400">{progress}%</span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={e => setProgress(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
            </div>
          </div>

          {/* Dependencies Picker */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Dépendances calendaires dures ({dependencies.length})
            </label>
            <div className="max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-1">
              {allTasks
                .filter(t => t.id !== id)
                .map(t => {
                  const isChecked = dependencies.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleDependency(t.id)}
                      className={`px-2 py-1 rounded border text-left text-xs flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-400 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-mono">{t.id}</span>
                      {isChecked && <Check className="w-3 h-3 text-cyan-600" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes techniques & consignes de sécurité
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 focus:outline-none focus:border-cyan-500"
              placeholder="Consignes particulières, contraintes spécifiques..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div>
            {!isNew && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Confirmer la suppression de la tâche ${id} ?`)) {
                    onDelete(id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-300 dark:border-rose-800 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
