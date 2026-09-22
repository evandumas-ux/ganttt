import { ProjectMargin } from '../types/project';

export const PROJECT_MARGINS: ProjectMargin[] = [
  {
    id: 'margin-winter',
    name: 'Disponibilité réduite',
    type: 'reduced_availability',
    startDate: '2026-12-19',
    endDate: '2027-01-03',
    description: 'Période de fermeture universitaire / congés d’hiver. Pas de livrable critique planifié.',
    color: 'rgba(239, 68, 68, 0.12)', // Subtle red/striped overlay
  },
  {
    id: 'margin-technical',
    name: 'Marge technique',
    type: 'technical',
    startDate: '2027-03-29',
    endDate: '2027-04-02',
    description: 'Tampon d’aléa post-essai bout en bout avant le démarrage des essais environnementaux.',
    color: 'rgba(59, 130, 246, 0.12)', // Subtle blue overlay
  },
  {
    id: 'margin-qualification',
    name: 'Marge post-qualification',
    type: 'qualification',
    startDate: '2027-04-24',
    endDate: '2027-04-25',
    description: 'Marge d’analyse des rapports de qualification avant la commission d’aptitude au vol.',
    color: 'rgba(168, 85, 247, 0.12)', // Subtle purple overlay
  },
  {
    id: 'margin-final',
    name: 'Marge finale',
    type: 'final',
    startDate: '2027-05-10',
    endDate: '2027-05-15',
    description: 'Marge de sécurité finale pour la consolidation du dossier et la clôture du projet.',
    color: 'rgba(34, 197, 94, 0.12)', // Subtle green overlay
  },
];
