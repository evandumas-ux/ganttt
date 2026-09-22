import type { DecisionStatus, MemberId, Task } from '../../types/project';

// Lot bus CAN SHM (note d'architecture 16/09, schéma fonctionnel SHM 17/09).
// Dates et charges : propositions provisoires (estimateToValidate).
// Ligne : [id court, intitulé, resp., validation, début, fin, h, prio, sécu, dépend de, rattachée à, fiche, statut, livrable]
// Resp./val. : E = Evan, J = Julien, C = Clémentine. Dates JJ/MM (2026) ou JJ/MM/AAAA.
// Dépendances : ID courts du lot CAN ; préfixe « ! » = tâche existante hors lot (ex. !C02).
type Row = [
  string, string, string, string, string, string, number, 'P0' | 'P1', 0 | 1,
  string, string, string, DecisionStatus?, string?,
];

const NAMES: Record<string, MemberId> = { E: 'Evan', J: 'Julien', C: 'Clémentine' };
const SECTIONS: Record<string, [string, string, DecisionStatus]> = {
  Q: ['Décision', 'Décision écrite (relevé de décision)', 'QUESTION OUVERTE'],
  D: ['Spécification', '', 'À CONFIRMER'],
  P: ['PCB', '', 'À CONFIRMER'],
  F: ['Firmware', '', 'À CONFIRMER'],
  O: ['Outillage', '', 'À CONFIRMER'],
  T: ['Essai', '', 'À CONFIRMER'],
};

const ROWS: Row[] = [
  // 3.1 Questions ouvertes → tâches de décision (parent G02)
  ['Q01', 'Nombre et emplacement des nœuds', 'E', 'CJ', '18/09', '25/09', 2, 'P0', 0, '', 'G02', 'Statut ENVISAGÉ : 3 nœuds (avant ogive ~500 mm, principal zone moteur, empennage). Valider en revue G02. Un nœud = un PCB.', 'ENVISAGÉ'],
  ['Q02', 'Débit du bus', 'J', 'C', '21/09', '09/10', 3, 'P0', 0, '', 'G02', 'Longueur > 3 m. Dépend du budget C02. Bloque le schéma.'],
  ['Q03', 'Identifiants 11 ou 29 bits', 'J', 'E', '21/09', '09/10', 1, 'P1', 0, '', 'G02', "Impacte le catalogue et les filtres d'acceptance."],
  ['Q04', 'CAN 2.0 ou CAN FD', 'J', 'C', '21/09', '09/10', 2, 'P0', 0, '', 'G02', "Statut À CONFIRMER : CAN 2.0. Pas de brut sur le bus, donc FD a priori non nécessaire. L'ESP32-S3 ne gère pas FD.", 'À CONFIRMER'],
  ['Q05', 'MCU / contrôleur CAN', 'C', 'J', '21/09', '09/10', 3, 'P0', 0, '', 'G02', 'Statut ENVISAGÉ : ESP32-S3 (TWAI). Alternative : STM32 FDCAN ou contrôleur externe.', 'ENVISAGÉ'],
  ['Q06', 'Transceiver 3,3 V ou 5 V', 'C', 'J', '28/09', '16/10', 2, 'P0', 0, '', 'G02', 'Critères : broche silent/standby, plage de température, disponibilité.'],
  ['Q07', 'Terminaison de repli après séparation', 'C', 'J', '28/09', '23/10', 3, 'P0', 1, '', 'G02', 'Options à comparer : cavalier, terminaison commutée, ou une seule terminaison acceptée sur tronçon court.'],
  ['Q08', 'Détection de la séparation', 'C', 'J', '28/09', '23/10', 2, 'P1', 1, '', 'G02', 'Proposition (non décidée) : broche « sense » dans le connecteur à arrachement.'],
  ['Q09', 'Comportement du nœud avant seul (plus d’ACK)', 'J', 'C', '05/10', '23/10', 2, 'P0', 0, '', 'G02', "Risque : retransmissions en boucle, error passive. Ne doit jamais bloquer l'enregistrement."],
  ['Q10', "Conduite si le top décollage n'est pas reçu", 'J', 'E', '05/10', '23/10', 2, 'P0', 0, '', 'G02', 'FS3.1 « top non reçu » : à définir.'],
  ['Q11', 'Capteur et logique de détection du décollage', 'J', 'C', '28/09', '16/10', 4, 'P0', 0, '', 'G02', 'FP2 / FS2.1 / FS2.2, sur le nœud principal. Impacte le PCB.'],
  ['Q12', 'Dérive des horloges et stratégie de recalage', 'J', 'E', '05/10', '23/10', 2, 'P1', 0, '', 'G02', 'Dérive : À CONFIRMER. Proposition : rediffusion périodique de t − t0.'],
  ['Q13', 'Emplacement du LoRa SHM', 'E', 'CJ', '21/09', '16/10', 3, 'P0', 1, '', 'G02', 'Le nœud principal est en zone carbone. Options : fenêtre verre dans le tube, ou LoRa sur le nœud avant. Décide quel nœud agrège les résumés.'],
  ['Q14', 'Alimentation centralisée ou par nœud', 'C', 'E', '21/09', '16/10', 3, 'P0', 1, '', 'G02', "FSA.4. Décide si des fils d'alimentation traversent le connecteur à arrachement."],
  ['Q15', 'Masse de référence commune', 'C', 'E', '28/09', '16/10', 1, 'P0', 1, '', 'G02', 'Référence nécessaire au CAN (ou transceivers isolés). Rester conforme à SEQ1.'],
  ['Q16', 'Contenu des résumés', 'E', 'J', '05/10', '23/10', 3, 'P1', 0, '', 'G02', 'T° max, niveaux vibratoires (RMS/pic ? fenêtre ?), événements datés. Lien avec C03.'],
  ['Q17', "Contenu de l'état de santé", 'J', 'E', '05/10', '23/10', 2, 'P1', 0, '', 'G02', 'FS3.4. Proposition : tension, T° carte, état SD, TEC/REC, cause de reset, version FW, uptime.'],
  ['Q18', 'Catalogue : IDs, périodes, DLC, endianness, scaling, timeouts', 'E', 'J', '05/10', '23/10', 2, 'P0', 0, '', 'G02', 'À faire après C02. Voir CAN-D02.'],
  ['Q19', 'Politique bus-off / recovery', 'J', 'C', '12/10', '23/10', 1, 'P1', 0, '', 'G02', 'Recovery automatique bornée ou non.'],
  ['Q20', 'Connecteurs CAN et référence du connecteur à arrachement', 'C', 'E', '28/09', '23/10', 3, 'P0', 1, '', 'G02', 'Verrouillage, tenue aux vibrations, brochage commun aux 3 cartes.'],
  ['Q21', 'Adaptateur USB-CAN pour les outils sol et le banc', 'E', 'J', '21/09', '02/10', 1, 'P1', 0, '', 'G02', 'Nécessaire pour le banc sur devkits.'],
  ['Q22', 'Responsable du faisceau CAN', 'E', 'C', '18/09', '25/09', 0.5, 'P1', 0, '', 'G02', 'Proposition : Evan (Clém. à 100 % sur les PCB). A03 est actuellement à Clém.'],
  ['Q23', 'Commandes sol → bord en pré-vol via le CAN ?', 'E', 'J', '05/10', '23/10', 1, 'P1', 0, '', 'G02', 'Aucun flux descendant prévu (À CONFIRMER). Ex. : armement, état, via connecteur de test.'],
  ['Q24', 'Journalisation du trafic CAN sur SD et format', 'J', 'E', '05/10', '23/10', 1, 'P1', 0, '', 'G02', 'FS4.1 : format de fichier à définir.'],

  // 3.2 Spécifications (parent G02)
  ['D01', 'Schéma physique du bus', 'E', 'CJ', '28/09', '23/10', 6, 'P0', 1, 'Q01 Q07 Q13 Q14 Q20', 'G02', '', undefined, 'Ordre des nœuds, stations, longueur de chaque tronçon, stubs, terminaisons, connecteurs'],
  ['D02', 'Catalogue can/messages.csv v1', 'E', 'J', '12/10', '23/10', 8, 'P0', 0, 'Q02 Q03 Q16 Q17 !C02', 'G02', '', undefined, 'Colonnes : ID, émetteur, récepteurs, période/événement, DLC, et par signal : start bit, longueur, endianness, signé, scale, offset, unité, min, max, valeur invalide, timeout, action sur timeout'],
  ['D03', 'ICD CAN v1', 'E', 'J', '28/09', '23/10', 6, 'P0', 0, 'Q01 Q13', 'G02', '', undefined, 'Rôle des nœuds ; états pré-vol / armé / vol / post-séparation / post-vol'],
  ['D04', 'Spec du top décollage', 'J', 'E', '12/10', '23/10', 4, 'P0', 0, 'Q10 Q11', 'G02', '', undefined, 'Contenu (compteur + t0), répétitions, latence max, repli'],
  ['D05', 'Spec gestion du temps', 'J', 'E', '12/10', '23/10', 3, 'P1', 0, 'Q12', 'G02', '', undefined, "Horloge locale, recalage, horodatage dans l'ISR de réception"],
  ['D06', 'Spec séparation et erreurs', 'J', 'C', '12/10', '23/10', 4, 'P0', 1, 'Q07 Q08 Q09 Q19', 'G02', '', undefined, 'Comportement électrique et firmware avant et après séparation'],
  ['D07', 'Budget charge bus', 'J', 'E', '05/10', '23/10', 3, 'P0', 0, 'Q02', 'G02', 'Intégré à C02 (exigence de complétion de C02, pas de doublon).', undefined, 'Charge nominale et pire cas, marge'],

  // 3.3 PCB (Clémentine) — bloc CAN identique sur les 3 cartes
  ['P01', 'Sélection du transceiver', 'C', 'J', '12/10', '23/10', 3, 'P0', 0, 'Q05 Q06 Q02 Q04', '', 'Tension, broche silent/standby, température, stock'],
  ['P02', 'Protections CAN', 'C', 'J', '12/10', '23/10', 2, 'P1', 0, 'P01', '', 'Propositions : TVS CAN, self de mode commun optionnelle, terminaison split', 'À CONFIRMER'],
  ['P03', 'Terminaisons des 3 cartes', 'C', 'J', '19/10', '30/10', 2, 'P0', 1, 'Q07', '', '120 Ω sur les nœuds avant et empennage (cavalier proposé) ; principal sans terminaison ; repli selon Q07'],
  ['P04', 'Connecteurs et brochage commun', 'C', 'E', '19/10', '30/10', 3, 'P0', 1, 'Q14 Q15 Q20', '', '1 port sur les extrémités, 2 ports traversants sur le principal'],
  ['P05', 'Points de test et cavaliers (STOC5 / TEL1)', 'C', 'E', '26/10', '06/11', 2, 'P0', 0, 'P01', '', 'Points de test CAN_H, CAN_L, GND, TX, RX ; cavaliers entre MCU et transceiver. Exigences STOC5 / TEL1 : DÉCIDÉ.', 'DÉCIDÉ'],
  ['P06', 'Entrée de détection de séparation', 'C', 'J', '26/10', '06/11', 2, 'P1', 1, 'Q08', '', 'Uniquement si Q08 la retient'],
  ['P07', "LED d'activité et d'erreur CAN", 'C', 'J', '26/10', '06/11', 1, 'P1', 0, '', '', 'Proposition, utile en rampe'],
  ['P08', 'Bloc schéma CAN réutilisable, intégré aux 3 schémas', 'C', 'J', '02/11', '20/11', 6, 'P0', 0, 'P01 P02 P03 P04 P05 P06 P07', '', ''],
  ['P09', 'Routage CAN', 'C', 'J', '23/11', '11/12', 6, 'P0', 0, 'P08', '', 'Paire différentielle, stubs courts, TVS au connecteur, à distance du LoRa et des alims à découpage'],
  ['P10', 'Tenue thermique des composants CAN', 'C', 'E', '26/10', '20/11', 2, 'P1', 0, 'Q01', '', 'Principal près du moteur ; avant sous coiffe (paroi à 85–95 °C)'],
  ['P11', 'Revue croisée du schéma et du PCB', 'C', 'JE', '07/12', '16/12', 4, 'P0', 1, 'P09', 'E07', ''],
  ['P12', 'BOM et approvisionnement des composants CAN', 'C', 'E', '23/10', '18/12', 3, 'P0', 0, 'P01 P04', 'A01', 'Commander tôt transceivers et connecteurs (délais)'],
  ['P13', 'Fabrication, assemblage, inspection', 'C', 'E', '18/12', '29/01/2027', 4, 'P0', 1, 'P11', 'E08', 'Jalon J3'],
  ['P14', 'Bring-up électrique CAN', 'C', 'J', '25/01/2027', '05/02/2027', 4, 'P0', 1, 'P13', '', 'Mesurer 60 Ω entre CAN_H et CAN_L, tensions, formes d’onde'],

  // 3.4 Firmware (Julien, parent F02 sauf mention)
  ['F01', 'Banc 3 nœuds sur devkits', 'J', 'E', '28/09', '16/10', 4, 'P0', 0, 'Q05 Q21', 'F02', 'Démarrer sans attendre les PCB'],
  ['F02', 'Driver CAN', 'J', 'C', '12/10', '06/11', 8, 'P0', 0, 'Q02 F01', 'F02', "Bit timing et point d'échantillonnage, filtres d'acceptance, file RX en ISR avec horodatage"],
  ['F03', 'Codec généré depuis le catalogue', 'J', 'E', '26/10', '13/11', 4, 'P0', 0, 'D02 O01', 'F02', 'Aucun encodage écrit à la main'],
  ['F04', "Ordonnanceur d'émission", 'J', 'E', '02/11', '20/11', 4, 'P0', 0, 'F02', 'F02', 'Messages périodiques et événementiels'],
  ['F05', 'Timeouts et validité des signaux', 'J', 'E', '09/11', '27/11', 3, 'P0', 0, 'F03', 'F02', ''],
  ['F06', 'Top décollage', 'J', 'E', '16/11', '04/12', 5, 'P0', 0, 'D04', 'F02', 'Émission (principal), réception, répétitions, repli'],
  ['F07', 'Synchronisation du temps', 'J', 'E', '23/11', '11/12', 4, 'P1', 0, 'D05', 'F02', ''],
  ['F08', 'Heartbeat et état de santé', 'J', 'E', '09/11', '27/11', 3, 'P0', 0, 'Q17', 'F02', ''],
  ['F09', "Machine d'états du nœud", 'J', 'E', '16/11', '11/12', 4, 'P0', 0, 'D03', 'F02', ''],
  ['F10', 'Gestion des erreurs', 'J', 'C', '30/11', '18/12', 4, 'P0', 0, 'D06', 'F02', 'TEC/REC, bus-off, recovery bornée'],
  ['F11', 'Mode post-séparation', 'J', 'C', '04/01/2027', '22/01/2027', 4, 'P0', 0, 'D06', 'F02', 'Nœud avant en listen-only ou sans émission ; nœuds arrière continuent'],
  ['F12', 'Agrégation des résumés vers le LoRa', 'J', 'E', '04/01/2027', '29/01/2027', 5, 'P0', 0, 'Q13', 'F03 F05', ''],
  ['F13', 'Journal CAN sur SD', 'J', 'E', '11/01/2027', '29/01/2027', 3, 'P1', 0, 'Q24', 'F04', ''],
  ['F14', 'Priorités et watchdog', 'J', 'C', '11/01/2027', '05/02/2027', 3, 'P0', 0, 'F10', 'F02', "Le CAN ne doit jamais bloquer l'écriture SD"],
  ['F15', 'Version FW et hash du catalogue dans le heartbeat', 'J', 'E', '30/11', '04/12', 1, 'P1', 0, 'F08', 'F02', 'Proposition', 'À CONFIRMER'],
  ['F16', 'Tests unitaires du codec', 'J', 'E', '26/10', '12/02/2027', 4, 'P1', 0, 'F03', 'F02', ''],
  ['F17', 'Portage et validation sur les PCB réels', 'J', 'C', '29/01/2027', '12/02/2027', 6, 'P0', 0, 'P14', 'F02', 'Jalon J4'],

  // 3.5 Outillage, faisceau, documentation (Evan)
  ['O01', 'Chaîne source de vérité', 'E', 'J', '05/10', '30/10', 6, 'P0', 0, 'D02', 'G02', 'CSV → DBC → header C + décodeur Python'],
  ['O02', 'Outil PC', 'E', 'J', '05/10', '06/11', 8, 'P1', 0, 'Q21', 'D01 D02', 'Capture, décodage en direct, log, rejeu'],
  ['O03', 'Simulateur de nœuds', 'E', 'J', '02/11', '27/11', 6, 'P1', 0, 'O02', 'D02', ''],
  ['O04', 'Faisceau de vol CAN', 'E', 'C', '07/12', '12/02/2027', 10, 'P0', 1, 'Q20 Q22 P04', 'A03', 'Responsable À CONFIRMER (Q22)'],
  ['O05', 'Faisceau de banc 3,2 m', 'E', 'C', '28/09', '16/10', 3, 'P1', 0, 'Q21', 'A03', 'Avec break-out de mesure'],
  ['O06', "Procédures d'essai CAN", 'E', 'J', '04/01/2027', '05/02/2027', 6, 'P0', 0, '', 'T02 T03', "Critères d'acceptation"],
  ['O07', 'Décodage post-vol des logs CAN', 'E', 'J', '01/03/2027', '26/03/2027', 4, 'P1', 0, 'F13', 'D05', 'Recalage sur t0'],
  ['O08', 'Définitions de signaux partagées avec le dashboard', 'E', 'J', '16/11', '18/12', 3, 'P1', 0, 'O01', 'D04', ''],
  ['O09', 'Mise à jour des documents', 'E', 'J', '18/09', '25/09', 3, 'P0', 0, '', 'G03', 'Planification, ICD, catalogue'],

  // 3.6 Essais
  ['T01', 'Banc 3 nœuds devkits, câble à longueur réelle', 'J', 'E', '19/10', '18/12', 6, 'P0', 0, '', 'T02', ''],
  ['T02', 'Charge bus mesurée, comparée à C02', 'J', 'E', '30/11', '05/03/2027', 3, 'P0', 0, '', 'T02', 'Mesure sur devkits puis sur PCB'],
  ['T03', 'Latence du top décollage', 'J', 'E', '07/12', '05/03/2027', 3, 'P0', 0, '', 'T02', 'Analyseur logique'],
  ['T04', 'Dérive des horloges sur 3 h', 'J', 'E', '15/02/2027', '26/02/2027', 4, 'P1', 0, '', 'T02', 'Durée alignée sur MES2 (exigence DÉCIDÉ)'],
  ['T05', 'Injection de défauts', 'E', 'JC', '15/02/2027', '05/03/2027', 6, 'P0', 1, 'F17', 'T03', 'Nœud absent, court CAN_H/CAN_L, coupure, terminaison absente, bus-off'],
  ['T06', 'Arrachement du connecteur sous tension', 'E', 'C', '01/03/2027', '20/03/2027', 4, 'P0', 1, '', 'T03', 'Validation croisée obligatoire. Connecteur à arrachement à la séparation : DÉCIDÉ.', 'DÉCIDÉ'],
  ['T07', 'Endurance ≥ 3 h', 'E', 'J', '08/03/2027', '26/03/2027', 4, 'P0', 0, '', 'T05', 'MES2 (exigence DÉCIDÉ)', 'DÉCIDÉ'],
  ['T08', 'Qualité du signal sur PCB', 'C', 'J', '29/01/2027', '12/02/2027', 3, 'P0', 0, '', 'E08', 'Oscilloscope'],
  ['T09', 'Coexistence LoRa / CAN', 'J', 'C', '15/02/2027', '05/03/2027', 3, 'P1', 1, '', 'T04', 'Erreurs CAN pendant les émissions radio'],
  ['T10', 'Vibration et thermique avec faisceau', 'E', 'J', '29/03/2027', '23/04/2027', 4, 'P0', 1, '', 'T06', ''],
  ['T12', 'Essai de bout en bout', 'E', 'JC', '16/03/2027', '26/03/2027', 6, 'P0', 1, 'T05', 'T05', 'Jalon J6'],
  ['T13', 'Revue de conformité CAN', 'E', 'C', '12/04/2027', '23/04/2027', 2, 'P0', 1, '', 'T07', 'Points de test, autonomie, SEQ1 (exigences DÉCIDÉ)', 'DÉCIDÉ'],
];

// Chemin critique CAN (§3.7)
export const CAN_CRITICAL_IDS = [
  'Q05', 'Q06', 'Q02', 'Q04', 'P01', 'P08', 'P09', 'P11', 'P13', 'P14', 'F17', 'T05', 'T12',
  'Q07', 'Q14', 'Q15', 'Q20', 'P03', 'P04', 'D02', 'O01', 'F03', 'Q13', 'F12',
].map(id => `CAN-${id}`);

const toISO = (d: string) => {
  const [dd, mm, yyyy = '2026'] = d.split('/');
  return `${yyyy}-${mm}-${dd}`;
};
const list = (s: string) => (s ? s.split(' ') : []);
const people = (codes: string) => codes.split('').map(c => NAMES[c]).join(', ');

export const CAN_TASKS: Task[] = ROWS.map(
  ([id, title, own, val, start, end, h, priority, secu, deps, parents, fiche, status, deliverable]) => {
    const [tag, defaultDeliverable, defaultStatus] = SECTIONS[id[0]];
    const owner = NAMES[own];
    const validators = people(val);
    return {
      id: `CAN-${id}`,
      pole: 'CAN SHM',
      title,
      owner,
      support: validators,
      secondValidator: validators,
      totalHours: h,
      hours: { [owner]: h },
      priority,
      startDate: toISO(start),
      endDate: toISO(end),
      dependencies: list(deps).map(d => (d.startsWith('!') ? d.slice(1) : `CAN-${d}`)),
      validationCriteria: `Validation croisée par ${validators}`,
      status: 'À faire',
      progress: 0,
      isSensitive: secu === 1,
      decisionStatus: status ?? defaultStatus,
      attachedTo: parents ? list(parents) : ['E02', 'E03', 'E06', 'E07', 'E08', 'A01'],
      estimateToValidate: true,
      tags: ['CAN', tag],
      ...(fiche && { description: fiche }),
      ...((deliverable || defaultDeliverable) && { deliverable: deliverable || defaultDeliverable }),
    };
  },
);
