// Compatibilité des archives/imports : les chaînes historiques ne sont jamais des données actives.
export function normalizeLegacyText(text: string, replacementMember: string): string {
  return text
    .replaceAll('Corentin', replacementMember)
    .replace(/CAN 2\.0(?: classique)?|CAN classique/g, 'CAN FD')
    .replace(/500\s*kbit\/s/g, '1 Mbit/s nominal / 5 Mbit/s phase données')
    .replace(/ESP32-S3\s*\/\s*TWAI|ESP32-S3|TWAI/g, 'STM32H723 / FDCAN (baseline à valider en G02)')
    .replaceAll('TCAN334', 'TCAN3413')
    .replace(/(?:carte\s+)?microSD|(?:carte\s+)?SD-Card|(?:carte\s+)?\bSD\b/gi, 'NAND W25N01GV')
    .replace(/[^.!?\n]*\bSENSE\b[^.!?\n]*[.!?]?/gi, 'Séparation détectée inertiellement avec les ADXL375. ')
    .replace(/retrait (?:de (?:la )?|d’une )carte mémoire/gi, 'relecture post-vol par USB')
    .replace('4 membres', '3 membres');
}

export const LEGACY_HOURS_HEADER = 'Heures Corentin';
export const legacyHours = (hours: object, extraHours: number) => ({ ...hours, Corentin: extraHours });
