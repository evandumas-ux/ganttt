import React, { useState, useRef } from 'react';
import { Task, Milestone } from '../../types/project';
import { exportToJSON, exportToCSV } from '../../utils/storage';
import {
  FileDown,
  FileUp,
  X,
  FileSpreadsheet,
  FileCode,
  Printer,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ImportExportModalProps {
  tasks: Task[];
  milestones: Milestone[];
  isOpen: boolean;
  onClose: () => void;
  onImportJSON: (payload: any) => boolean;
  onImportCSV: (text: string) => void;
  onPrintPDF: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  tasks,
  milestones,
  isOpen,
  onClose,
  onImportJSON,
  onImportCSV,
  onPrintPDF,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportToJSON(tasks, milestones);
    setMessage({ type: 'success', text: 'Exportation JSON téléchargée avec succès.' });
  };

  const handleExportCSV = () => {
    exportToCSV(tasks);
    setMessage({ type: 'success', text: 'Exportation CSV (UTF-8 avec séparateur point-virgule) téléchargée avec succès.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          const ok = onImportJSON(parsed);
          if (ok) {
            setMessage({ type: 'success', text: 'Fichier JSON importé avec succès !' });
          } else {
            setMessage({ type: 'error', text: 'Structure JSON non valide.' });
          }
        } catch (err) {
          setMessage({ type: 'error', text: 'Erreur de lecture du fichier JSON.' });
        }
      } else if (file.name.endsWith('.csv')) {
        try {
          onImportCSV(content);
          setMessage({ type: 'success', text: 'Fichier CSV importé avec succès !' });
        } catch (err) {
          setMessage({ type: 'error', text: 'Erreur de lecture du fichier CSV.' });
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleManualImport = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const ok = onImportJSON(parsed);
        if (ok) {
          setMessage({ type: 'success', text: 'Données JSON chargées avec succès !' });
          setPasteText('');
        } else {
          setMessage({ type: 'error', text: 'Structure JSON non reconnue.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Format JSON invalide.' });
      }
    } else {
      try {
        onImportCSV(trimmed);
        setMessage({ type: 'success', text: 'Données CSV chargées avec succès !' });
        setPasteText('');
      } catch (err) {
        setMessage({ type: 'error', text: 'Format CSV non reconnu.' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Gestion des Données (Import / Export)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={() => {
              setActiveTab('export');
              setMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Exporter les données
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Importer des données
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* JSON */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <FileCode className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Export JSON
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-snug">
                    Sauvegarde intégrale avec tâches, jalons, heures et exigences.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
                >
                  Télécharger JSON
                </button>
              </div>

              {/* CSV */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Export CSV
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-snug">
                    Tableur standard UTF-8 (compatible Excel avec accents).
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                >
                  Télécharger CSV
                </button>
              </div>

              {/* PDF */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <Printer className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Export PDF
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-snug">
                    Vue imprimable prête pour sauvegarde PDF.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(onPrintPDF, 300);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
                >
                  Imprimer / PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Importer un fichier (.json ou .csv)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Sélectionner un fichier sur votre ordinateur</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-slate-400 text-xs">ou</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Coller du contenu JSON ou CSV
                </label>
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Collez ici votre texte JSON ou CSV..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleManualImport}
                  disabled={!pasteText.trim()}
                  className="mt-2 w-full py-1.5 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  Valider l'importation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
