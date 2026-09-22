// Registre des risques SHM (IRIS). Gravité et probabilité non cotées : à évaluer en revue.
export interface ProjectRisk {
  id: string;
  title: string;
  consequence: string;
  linkedTaskIds: string[];
  isSafety: boolean;
}

export const PROJECT_RISKS: ProjectRisk[] = [
  { id: 'R-CAN-01', title: 'Nœud avant sans ACK après séparation', consequence: "Saturation d'erreurs, perte d'enregistrement", linkedTaskIds: ['CAN-Q09', 'CAN-D06', 'CAN-F11', 'CAN-F14'], isSafety: false },
  { id: 'R-CAN-02', title: 'Terminaison unique ou absente après séparation', consequence: 'Réflexions sur le bus', linkedTaskIds: ['CAN-Q07', 'CAN-P03', 'CAN-T05'], isSafety: false },
  { id: 'R-CAN-03', title: 'Antenne LoRa SHM en zone carbone', consequence: 'À préciser', linkedTaskIds: ['CAN-Q13', 'C04', 'T04'], isSafety: false },
  { id: 'R-CAN-04', title: "Délais d'approvisionnement des transceivers et connecteurs CAN", consequence: 'À préciser', linkedTaskIds: ['CAN-P12', 'A01', 'CAN-P13'], isSafety: false },
  { id: 'R-CAN-05', title: 'Dérive des horloges non recalée', consequence: 'Datation fausse des mesures', linkedTaskIds: ['CAN-Q12', 'CAN-D05', 'CAN-F07', 'CAN-T04'], isSafety: false },
  { id: 'R-CAN-06', title: 'Arrachement du connecteur sous tension', consequence: 'Courts-circuits', linkedTaskIds: ['CAN-Q14', 'CAN-Q20', 'CAN-P04', 'CAN-T06'], isSafety: true },
  { id: 'R-CAN-07', title: "Perturbation CAN par l'émission LoRa", consequence: 'Erreurs CAN pendant les émissions radio', linkedTaskIds: ['CAN-P09', 'CAN-T09'], isSafety: false },
  { id: 'R-CAN-08', title: 'Question ouverte non tranchée à J1', consequence: 'Blocage du schéma à J2', linkedTaskIds: ['CAN-Q02', 'CAN-Q05', 'CAN-Q06', 'CAN-P08'], isSafety: false },
];
