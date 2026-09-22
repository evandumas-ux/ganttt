import { useCurrentDate } from '../../hooks/useCurrentDate';
import { formatDateFR } from '../../utils/dates';
import React from 'react';
import {
  Calendar,
  AlertCircle,
  Camera,
  Layers,
} from 'lucide-react';
import { ZoomLevel } from '../../types/project';
import { ZOOM_CONFIG } from '../../utils/ganttCoordinates';


interface GanttControlsProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  showMargins: boolean;
  onToggleMargins: () => void;
  onJumpToday: () => void;
  onJumpDeadline: () => void;
  onExportPNG: () => void;
}

export const GanttControls: React.FC<GanttControlsProps> = ({
  zoomLevel,
  onZoomChange,
  showMargins,
  onToggleMargins,
  onJumpToday,
  onJumpDeadline,
  onExportPNG,
}) => {
  const today = useCurrentDate();
  const levels: ZoomLevel[] = ['day', 'week', 'month', 'phase'];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Zoom Level Switcher */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 font-semibold mr-1">Échelle :</span>
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          {levels.map(lvl => (
            <button
              key={lvl}
              onClick={() => onZoomChange(lvl)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                zoomLevel === lvl
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {ZOOM_CONFIG[lvl].label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Quick Jumps */}
      <div className="flex items-center gap-2">
        <button
          onClick={onJumpToday}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
          title={`Centrer sur aujourd'hui (${formatDateFR(today)})`}
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Aujourd’hui</span>
        </button>

        <button
          onClick={onJumpDeadline}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold transition-colors"
          title="Centrer sur la date limite impérative (15 mai 2027)"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Date limite (15 mai)</span>
        </button>
      </div>

      {/* Display Toggles */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Toggle Margins */}
        <button
          onClick={onToggleMargins}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
            showMargins
              ? 'bg-slate-800 text-emerald-300 border-emerald-500'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title="Afficher/masquer les zones de marges et fermeture hivernale"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Marges</span>
        </button>

        {/* Export Image PNG */}
        <button
          onClick={onExportPNG}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
          title="Capturer le diagramme de Gantt en image PNG"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Capture PNG</span>
        </button>
      </div>
    </div>
  );
};
