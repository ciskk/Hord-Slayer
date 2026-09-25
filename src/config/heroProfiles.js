/**
 * src/config/heroProfiles.js
 * Configurações visuais, cromáticas e brasões vetoriais heráldicos dos Campeões.
 * Centralizado para evitar dependências circulares entre main.js, hudController.js e modais.
 */

// Brasões Heráldicos Vetoriais dos Campeões (Geometria 24x24)
export const HERO_EMBLEMS_SVG = {
  KNIGHT: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  PALADIN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  MAGE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20"/>
      <circle cx="12" cy="5" r="3"/>
      <path d="M8 8c0 4 8 4 8 8"/>
      <polygon points="12,1 15,4 9,4" fill="currentColor"/>
      <path d="M7 3l2 2M17 3l-2 2"/>
    </svg>
  `,
  ARCHER: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 22a10 10 0 0 0 10-10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <polygon points="18,8 22,12 18,16" fill="currentColor"/>
    </svg>
  `,
  ROGUE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  WARRIOR: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  BARBARIAN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z"/>
      <rect x="9.8" y="5.2" width="4.4" height="6.3" rx="0.6" fill="currentColor"/>
      <line x1="12" y1="11.5" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="14" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="14" y1="14" x2="10" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="17.5" x2="14" y2="20" stroke-width="1.3"/>
      <line x1="14" y1="17.5" x2="10" y2="20" stroke-width="1.3"/>
      <polygon points="12,23.5 10.2,21.5 13.8,21.5" fill="currentColor"/>
    </svg>
  `,
  ALCHEMIST: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6"/>
      <line x1="10" y1="3" x2="10" y2="7"/>
      <line x1="14" y1="3" x2="14" y2="7"/>
      <path d="M10 7L5 18a2.5 2.5 0 0 0 2.2 3.5h9.6a2.5 2.5 0 0 0 2.2-3.5L14 7"/>
      <path d="M7 15c2.5-1.2 7.5-1.2 10 0" stroke-opacity="0.8"/>
      <circle cx="10" cy="18" r="1.2" fill="currentColor"/>
      <circle cx="14.5" cy="16.5" r="0.8" fill="currentColor"/>
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  WARLOCK: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  `
};

// Chassis Vetoriais Heráldicos Exclusivos da Habilidade Suprema (ULT)
export const HERO_ULT_CHASSIS_SVG = {
  KNIGHT: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-gold-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff0b3" />
          <stop offset="25%" stop-color="#d4af37" />
          <stop offset="55%" stop-color="#7a5416" />
          <stop offset="80%" stop-color="#b89330" />
          <stop offset="100%" stop-color="#2a1a05" />
        </linearGradient>
        <linearGradient id="ult-steel-chassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2c3345" />
          <stop offset="50%" stop-color="#141824" />
          <stop offset="100%" stop-color="#080a10" />
        </linearGradient>
        <radialGradient id="ult-core-depth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a2030" />
          <stop offset="70%" stop-color="#0c0f18" />
          <stop offset="100%" stop-color="#040609" />
        </radialGradient>
      </defs>
      <!-- Base Octogonal de Aço Consecrado -->
      <polygon points="22,2 50,2 70,22 70,50 50,70 22,70 2,50 2,22" fill="url(#ult-steel-chassis)" stroke="#06070a" stroke-width="1.4" />
      <polygon points="23,4 49,4 68,23 68,49 49,68 23,68 4,49 4,23" fill="none" stroke="url(#ult-gold-bevel)" stroke-width="1.2" opacity="0.9" />

      <!-- Cruzes Góticas Sacras Cardinais -->
      <path class="skill-bracket skill-bracket-n" d="M36,0.5 L38.5,5 L43.5,5 L43.5,7 L38.5,7 L38.5,12 L33.5,12 L33.5,7 L28.5,7 L28.5,5 L33.5,5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-s" d="M36,71.5 L38.5,67 L43.5,67 L43.5,65 L38.5,65 L38.5,60 L33.5,60 L33.5,65 L28.5,65 L28.5,67 L33.5,67 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-w" d="M0.5,36 L5,38.5 L5,43.5 L7,43.5 L7,38.5 L12,38.5 L12,33.5 L7,33.5 L7,28.5 L5,28.5 L5,33.5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-e" d="M71.5,36 L67,38.5 L67,43.5 L65,43.5 L65,38.5 L60,38.5 L60,33.5 L65,33.5 L65,28.5 L67,28.5 L67,33.5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>

      <!-- Rebites de Ouro Nobre nos Eixos Diagonais -->
      <circle cx="56.5" cy="15.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="56.5" cy="56.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="15.5" cy="56.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="15.5" cy="15.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />

      <!-- Trilho de Cooldown Circular -->
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#0a0d14" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#f1c40f" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />

      <!-- Friso Dourado e Câmara Central -->
      <circle cx="36" cy="36" r="23.8" fill="none" stroke="url(#ult-gold-bevel)" stroke-width="1.2" opacity="0.9" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-core-depth)" />
    </svg>
  `,
  PALADIN: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-gold-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff0b3" />
          <stop offset="25%" stop-color="#d4af37" />
          <stop offset="55%" stop-color="#7a5416" />
          <stop offset="80%" stop-color="#b89330" />
          <stop offset="100%" stop-color="#2a1a05" />
        </linearGradient>
        <linearGradient id="ult-steel-chassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2c3345" />
          <stop offset="50%" stop-color="#141824" />
          <stop offset="100%" stop-color="#080a10" />
        </linearGradient>
        <radialGradient id="ult-core-depth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1a2030" />
          <stop offset="70%" stop-color="#0c0f18" />
          <stop offset="100%" stop-color="#040609" />
        </radialGradient>
      </defs>
      <polygon points="22,2 50,2 70,22 70,50 50,70 22,70 2,50 2,22" fill="url(#ult-steel-chassis)" stroke="#06070a" stroke-width="1.4" />
      <polygon points="23,4 49,4 68,23 68,49 49,68 23,68 4,49 4,23" fill="none" stroke="url(#ult-gold-bevel)" stroke-width="1.2" opacity="0.9" />
      <path class="skill-bracket skill-bracket-n" d="M36,0.5 L38.5,5 L43.5,5 L43.5,7 L38.5,7 L38.5,12 L33.5,12 L33.5,7 L28.5,7 L28.5,5 L33.5,5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-s" d="M36,71.5 L38.5,67 L43.5,67 L43.5,65 L38.5,65 L38.5,60 L33.5,60 L33.5,65 L28.5,65 L28.5,67 L33.5,67 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-w" d="M0.5,36 L5,38.5 L5,43.5 L7,43.5 L7,38.5 L12,38.5 L12,33.5 L7,33.5 L7,28.5 L5,28.5 L5,33.5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <path class="skill-bracket skill-bracket-e" d="M71.5,36 L67,38.5 L67,43.5 L65,43.5 L65,38.5 L60,38.5 L60,33.5 L65,33.5 L65,28.5 L67,28.5 L67,33.5 Z" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.8"/>
      <circle cx="56.5" cy="15.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="56.5" cy="56.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="15.5" cy="56.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="15.5" cy="15.5" r="1.6" fill="url(#ult-gold-bevel)" stroke="#1a0f02" stroke-width="0.5" />
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#0a0d14" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#f1c40f" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />
      <circle cx="36" cy="36" r="23.8" fill="none" stroke="url(#ult-gold-bevel)" stroke-width="1.2" opacity="0.9" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-core-depth)" />
    </svg>
  `,
  MAGE: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-mage-magma" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff275" />
          <stop offset="30%" stop-color="#ff7675" />
          <stop offset="70%" stop-color="#d63031" />
          <stop offset="100%" stop-color="#4a0e10" />
        </linearGradient>
        <linearGradient id="ult-mage-obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2c1417" />
          <stop offset="50%" stop-color="#14080a" />
          <stop offset="100%" stop-color="#080203" />
        </linearGradient>
        <radialGradient id="ult-mage-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3a0d11" />
          <stop offset="70%" stop-color="#190406" />
          <stop offset="100%" stop-color="#080102" />
        </radialGradient>
      </defs>
      <!-- Base de Basalto Vulcânico Chanfrado -->
      <circle cx="36" cy="36" r="34" fill="url(#ult-mage-obsidian)" stroke="#080203" stroke-width="1.5" />
      <circle cx="36" cy="36" r="31.5" fill="none" stroke="url(#ult-mage-magma)" stroke-width="1.2" opacity="0.8" />

      <!-- Garras de Labareda e Espinhos de Dragão nos 6 Vértices -->
      <path class="skill-bracket" d="M36,0.5 C38,4.5 42,7.5 41,11 C38.5,9.5 37,8 36,9.5 C35,8 33.5,9.5 31,11 C30,7.5 34,4.5 36,0.5 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>
      <path class="skill-bracket" d="M36,71.5 C38,67.5 42,64.5 41,61 C38.5,62.5 37,64 36,62.5 C35,64 33.5,62.5 31,61 C30,64.5 34,67.5 36,71.5 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>
      <path class="skill-bracket" d="M5.5,18 C9.5,20 12.5,24 11.5,27.5 C10.5,25 9,24 8,24.5 C7.5,23 8,21.5 5.5,18 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>
      <path class="skill-bracket" d="M66.5,18 C62.5,20 59.5,24 60.5,27.5 C61.5,25 63,24 64,24.5 C64.5,23 64,21.5 66.5,18 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>
      <path class="skill-bracket" d="M5.5,54 C9.5,52 12.5,48 11.5,44.5 C10.5,47 9,48 8,47.5 C7.5,49 8,50.5 5.5,54 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>
      <path class="skill-bracket" d="M66.5,54 C62.5,52 59.5,48 60.5,44.5 C61.5,47 63,48 64,47.5 C64.5,49 64,50.5 66.5,54 Z" fill="url(#ult-mage-magma)" stroke="#1c0506" stroke-width="0.8"/>

      <!-- Fissuras de Magma Incandescentes Gravadas na Pedra -->
      <path d="M14,26 L19,30 L25,27" stroke="#e67e22" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M58,26 L53,30 L47,27" stroke="#e67e22" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.85"/>
      <path d="M20,53 L26,50" stroke="#ff7675" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.8"/>
      <path d="M52,53 L46,50" stroke="#ff7675" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.8"/>

      <!-- Trilho de Cooldown Circular com Brilho Ígneo -->
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#120406" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#e67e22" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />

      <circle cx="36" cy="36" r="23.8" fill="none" stroke="url(#ult-mage-magma)" stroke-width="1.2" opacity="0.85" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-mage-core)" />
    </svg>
  `,
  ROGUE: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-rogue-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="40%" stop-color="#94a3b8" />
          <stop offset="80%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e2230" />
        </linearGradient>
        <linearGradient id="ult-rogue-void" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2a163d" />
          <stop offset="50%" stop-color="#120c1d" />
          <stop offset="100%" stop-color="#050308" />
        </linearGradient>
        <radialGradient id="ult-rogue-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#241038" />
          <stop offset="70%" stop-color="#0e0618" />
          <stop offset="100%" stop-color="#040207" />
        </radialGradient>
      </defs>
      <!-- Base de Ônix Abissal -->
      <circle cx="36" cy="36" r="34" fill="url(#ult-rogue-void)" stroke="#050308" stroke-width="1.5" />

      <!-- Lâminas Astrais Curvas Entrelaçadas no Aro (Shuriken Eclipse) -->
      <path class="skill-bracket" d="M36,1 C46,1 62,12 66,26 C61,23 54,21 48,23 C53,15 45,5 36,1 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M71,36 C71,46 60,62 46,66 C49,61 51,54 49,48 C57,53 67,45 71,36 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M36,71 C26,71 10,60 6,46 C11,49 18,51 24,49 C19,57 27,67 36,71 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M1,36 C1,26 12,10 26,6 C23,11 21,18 23,24 C15,19 5,27 1,36 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>

      <!-- Gemas de Ametista Lapidada nos Eixos Diagonais -->
      <polygon points="17,14 20,17 17,20 14,17" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="55,14 58,17 55,20 52,17" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="17,52 20,55 17,58 14,55" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="55,52 58,55 55,58 52,55" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>

      <!-- Trilho de Cooldown Circular com Brilho Espectral -->
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#090610" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#c084fc" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />

      <circle cx="36" cy="36" r="23.8" fill="none" stroke="#38bdf8" stroke-width="1.0" opacity="0.8" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-rogue-core)" />
    </svg>
  `,
  WARRIOR: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-rogue-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="40%" stop-color="#94a3b8" />
          <stop offset="80%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e2230" />
        </linearGradient>
        <linearGradient id="ult-rogue-void" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2a163d" />
          <stop offset="50%" stop-color="#120c1d" />
          <stop offset="100%" stop-color="#050308" />
        </linearGradient>
        <radialGradient id="ult-rogue-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#241038" />
          <stop offset="70%" stop-color="#0e0618" />
          <stop offset="100%" stop-color="#040207" />
        </radialGradient>
      </defs>
      <circle cx="36" cy="36" r="34" fill="url(#ult-rogue-void)" stroke="#050308" stroke-width="1.5" />
      <path class="skill-bracket" d="M36,1 C46,1 62,12 66,26 C61,23 54,21 48,23 C53,15 45,5 36,1 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M71,36 C71,46 60,62 46,66 C49,61 51,54 49,48 C57,53 67,45 71,36 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M36,71 C26,71 10,60 6,46 C11,49 18,51 24,49 C19,57 27,67 36,71 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <path class="skill-bracket" d="M1,36 C1,26 12,10 26,6 C23,11 21,18 23,24 C15,19 5,27 1,36 Z" fill="url(#ult-rogue-silver)" stroke="#090a12" stroke-width="0.8"/>
      <polygon points="17,14 20,17 17,20 14,17" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="55,14 58,17 55,20 52,17" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="17,52 20,55 17,58 14,55" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <polygon points="55,52 58,55 55,58 52,55" fill="#a855f7" stroke="#cbd5e1" stroke-width="0.6"/>
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#090610" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#c084fc" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />
      <circle cx="36" cy="36" r="23.8" fill="none" stroke="#38bdf8" stroke-width="1.0" opacity="0.8" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-rogue-core)" />
    </svg>
  `,
  BARBARIAN: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-barb-iron" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#47535e" />
          <stop offset="50%" stop-color="#241a16" />
          <stop offset="100%" stop-color="#0f0907" />
        </linearGradient>
        <linearGradient id="ult-barb-bone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5eee1" />
          <stop offset="45%" stop-color="#dfd3b7" />
          <stop offset="85%" stop-color="#8a735c" />
          <stop offset="100%" stop-color="#3d2a1d" />
        </linearGradient>
        <radialGradient id="ult-barb-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3d0a0d" />
          <stop offset="70%" stop-color="#1c0406" />
          <stop offset="100%" stop-color="#080102" />
        </radialGradient>
      </defs>
      <!-- Base de Ferro Martelado Rústico -->
      <circle cx="36" cy="36" r="34" fill="url(#ult-barb-iron)" stroke="#0a0504" stroke-width="1.8" />

      <!-- Chifres Primordiais de Fera nos 4 Cantos -->
      <path class="skill-bracket" d="M14,14 C8,6 2,4 0,2 C3,8 5,14 11,18 Z" fill="url(#ult-barb-bone)" stroke="#2b1a11" stroke-width="0.8"/>
      <path class="skill-bracket" d="M58,14 C64,6 70,4 72,2 C69,8 67,14 61,18 Z" fill="url(#ult-barb-bone)" stroke="#2b1a11" stroke-width="0.8"/>
      <path class="skill-bracket" d="M14,58 C8,66 2,68 0,70 C3,64 5,58 11,54 Z" fill="url(#ult-barb-bone)" stroke="#2b1a11" stroke-width="0.8"/>
      <path class="skill-bracket" d="M58,58 C64,66 70,68 72,70 C69,64 67,58 61,54 Z" fill="url(#ult-barb-bone)" stroke="#2b1a11" stroke-width="0.8"/>

      <!-- Rebites Rústicos de Cobre Batido -->
      <circle cx="36" cy="4.5" r="2.0" fill="#bc925a" stroke="#1a0f0a" stroke-width="0.6"/>
      <circle cx="36" cy="67.5" r="2.0" fill="#bc925a" stroke="#1a0f0a" stroke-width="0.6"/>
      <circle cx="4.5" cy="36" r="2.0" fill="#bc925a" stroke="#1a0f0a" stroke-width="0.6"/>
      <circle cx="67.5" cy="36" r="2.0" fill="#bc925a" stroke="#1a0f0a" stroke-width="0.6"/>

      <!-- Cortes de Batalha (Scratches) -->
      <line x1="27" y1="5" x2="33" y2="10" stroke="#0a0504" stroke-width="1.2"/>
      <line x1="43" y1="62" x2="38" y2="67" stroke="#0a0504" stroke-width="1.2"/>

      <!-- Trilho de Cooldown Circular com Tom de Sangue -->
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#140608" stroke-width="3.6" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#e74c3c" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />

      <circle cx="36" cy="36" r="23.8" fill="none" stroke="#d35400" stroke-width="1.2" opacity="0.85" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-barb-core)" />
    </svg>
  `,
  ALCHEMIST: `
    <svg class="skill-medallion-svg" viewBox="0 0 72 72" overflow="visible">
      <defs>
        <linearGradient id="ult-alch-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ead0a1" />
          <stop offset="40%" stop-color="#bc966a" />
          <stop offset="80%" stop-color="#8a5d3b" />
          <stop offset="100%" stop-color="#3d2616" />
        </linearGradient>
        <linearGradient id="ult-alch-iron" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2a1835" />
          <stop offset="50%" stop-color="#140b1a" />
          <stop offset="100%" stop-color="#08030b" />
        </linearGradient>
        <radialGradient id="ult-alch-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2c0c38" />
          <stop offset="70%" stop-color="#15041c" />
          <stop offset="100%" stop-color="#07010a" />
        </radialGradient>
      </defs>
      <!-- Base de Flange Industrial em Latão Steampunk -->
      <circle cx="36" cy="36" r="34" fill="url(#ult-alch-iron)" stroke="#08030b" stroke-width="1.5" />
      <circle cx="36" cy="36" r="32" fill="none" stroke="url(#ult-alch-brass)" stroke-width="1.4" opacity="0.85" />

      <!-- 8 Parafusos Sextavados Industriais -->
      <circle cx="36" cy="5" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="36" cy="67" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="5" cy="36" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="67" cy="36" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="14" cy="14" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="58" cy="14" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="14" cy="58" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>
      <circle cx="58" cy="58" r="1.6" fill="url(#ult-alch-brass)" stroke="#1a120b" stroke-width="0.5"/>

      <!-- Serpentina de Vidro Alquímico Curva Superior com Veneno Roxo -->
      <path d="M14,24 C16,14 25,7 36,7 C47,7 56,14 58,24" fill="none" stroke="rgba(214, 162, 232, 0.45)" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M14,24 C16,14 25,7 36,7 C47,7 56,14 58,24" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="0.8" stroke-linecap="round"/>

      <!-- Válvulas de Escape Laterais -->
      <rect x="0" y="33.5" width="4" height="5" rx="1" fill="#b87333" stroke="#1a120b" stroke-width="0.5"/>
      <rect x="68" y="33.5" width="4" height="5" rx="1" fill="#b87333" stroke="#1a120b" stroke-width="0.5"/>

      <!-- Trilho de Cooldown Circular com Tom de Veneno Roxo -->
      <circle cx="36" cy="36" r="26.5" fill="none" stroke="#120517" stroke-width="3.4" />
      <path id="skill-progress-ring" class="skill-progress-ring" d="M 36,9.5 A 26.5 26.5 0 0 1 36,62.5 A 26.5 26.5 0 0 1 36,9.5" fill="none" stroke="#9b59b6" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="166.5" stroke-dashoffset="0" />

      <circle cx="36" cy="36" r="23.8" fill="none" stroke="url(#ult-alch-brass)" stroke-width="1.2" opacity="0.85" />
      <circle cx="36" cy="36" r="22.6" fill="url(#ult-alch-core)" />
    </svg>
  `
};

// Configuração Cromática, Especialidades e Sinergias Recomendadas
export const CHARACTER_PROFILES = {
  KNIGHT: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    chassisSvg: HERO_ULT_CHASSIS_SVG.KNIGHT,
    ultProfile: {
      type: 'CATHEDRAL',
      name: 'Investida Sagrada',
      readySfx: 'holy_ready',
      haptic: 'medium',
      cssClass: 'hero-knight',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Martelo Sagrado',
    specialty: 'Controle de Horda & Barreira Retaliadora',
    primaryAttack: 'Esmaga o solo com ondas de choque sagradas em 360°, desintegrando projéteis e abrindo fendas.',
    recommendedSynergies: [
      { name: 'Armadura Sagrada', type: 'DEFESA', desc: 'Maximiza reflexão de dano e resiliência' },
      { name: 'Machado Orbital', type: 'COBERTURA', desc: 'Cria uma zona de morte contínua ao redor' },
      { name: 'Tomo da Fúria', type: 'DANO', desc: 'Eleva a cadência e o impacto dos esmagamentos' }
    ],
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  PALADIN: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    chassisSvg: HERO_ULT_CHASSIS_SVG.PALADIN,
    ultProfile: {
      type: 'CATHEDRAL',
      name: 'Investida Sagrada',
      readySfx: 'holy_ready',
      haptic: 'medium',
      cssClass: 'hero-knight',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Martelo dos Titãs',
    specialty: 'Controle de Horda & Barreira Retaliadora',
    primaryAttack: 'Esmaga o solo com ondas de choque sagradas em 360°, desintegrando projéteis e abrindo fendas.',
    recommendedSynergies: [
      { name: 'Armadura Sagrada', type: 'DEFESA', desc: 'Maximiza reflexão de dano e resiliência' },
      { name: 'Machado Orbital', type: 'COBERTURA', desc: 'Cria uma zona de morte contínua ao redor' },
      { name: 'Tomo da Fúria', type: 'DANO', desc: 'Eleva a cadência e o impacto dos esmagamentos' }
    ],
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  MAGE: {
    themeColor: '#ff7675',
    emblemSvg: HERO_EMBLEMS_SVG.MAGE,
    chassisSvg: HERO_ULT_CHASSIS_SVG.MAGE,
    ultProfile: {
      type: 'VOLCANO',
      name: 'Passo Ígneo',
      readySfx: 'fire_ready',
      haptic: 'heavy',
      cssClass: 'hero-mage',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Cajado da Tormenta',
    specialty: 'Artilharia Mágica & Combustão em Massa',
    primaryAttack: 'Rajadas ultrarrápidas de esferas ígneas concentradas que perfuram alvos em linha reta.',
    recommendedSynergies: [
      { name: 'Tomo Arcano', type: 'DANO', desc: 'Eleva a cadência e poder térmico das esferas' },
      { name: 'Anel do Vácuo', type: 'ÁREA', desc: 'Amplia a área de explosão das labaredas' },
      { name: 'Botas Aladas', type: 'MOBILIDADE', desc: 'Garante reposicionamento tático constante' }
    ],
    levels: { dano: 5, area: 3, vel: 3, res: 2 }
  },
  ARCHER: {
    themeColor: '#2ecc71',
    emblemSvg: HERO_EMBLEMS_SVG.ARCHER,
    chassisSvg: HERO_ULT_CHASSIS_SVG.KNIGHT,
    ultProfile: {
      type: 'CATHEDRAL',
      name: 'Disparo Mestre',
      readySfx: 'holy_ready',
      haptic: 'medium',
      cssClass: 'hero-knight',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Arco Élfico',
    specialty: 'Disparo de Precisão à Longa Distância',
    primaryAttack: 'Flechas perfurantes velozes com alta penetração em linha reta.',
    recommendedSynergies: [
      { name: 'Trevo Espectral', type: 'CRÍTICO', desc: 'Maximiza a chance de acertos letais imediatos' },
      { name: 'Botas Aladas', type: 'VELOCIDADE', desc: 'Facilita manter distância da horda' }
    ],
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  ROGUE: {
    themeColor: '#c084fc',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    chassisSvg: HERO_ULT_CHASSIS_SVG.ROGUE,
    ultProfile: {
      type: 'VOID',
      name: 'Manto de Fumaça',
      readySfx: 'void_ready',
      haptic: 'medium',
      cssClass: 'hero-rogue',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Lâminas Espirituais',
    specialty: 'Alta Mobilidade, Críticos e Teleguiados',
    primaryAttack: 'Lâminas astrais arremessadas em cone com alta velocidade que perseguem inimigos próximos.',
    recommendedSynergies: [
      { name: 'Trevo Espectral', type: 'CRÍTICO', desc: 'Maximiza a chance de acertos letais imediatos' },
      { name: 'Cajado da Tormenta', type: 'ALCANCE', desc: 'Combina dano à distância com ataques próximos' },
      { name: 'Amuleto Sombrio', type: 'VELOCIDADE', desc: 'Acelera a recarga de lâminas para disparos contínuos' }
    ],
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  WARRIOR: {
    themeColor: '#c084fc',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    chassisSvg: HERO_ULT_CHASSIS_SVG.ROGUE,
    ultProfile: {
      type: 'VOID',
      name: 'Lâminas Espectrais',
      readySfx: 'void_ready',
      haptic: 'medium',
      cssClass: 'hero-rogue',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Lâminas Espectrais',
    specialty: 'Alta Mobilidade, Críticos e Teleguiados',
    primaryAttack: 'Lâminas astrais arremessadas em cone com alta velocidade que perseguem inimigos próximos.',
    recommendedSynergies: [
      { name: 'Trevo Espectral', type: 'CRÍTICO', desc: 'Maximiza a chance de acertos letais imediatos' },
      { name: 'Amuleto Sombrio', type: 'VELOCIDADE', desc: 'Acelera a recarga de lâminas' }
    ],
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  BARBARIAN: {
    themeColor: '#e74c3c',
    emblemSvg: HERO_EMBLEMS_SVG.BARBARIAN,
    chassisSvg: HERO_ULT_CHASSIS_SVG.BARBARIAN,
    ultProfile: {
      type: 'PRIMAL',
      name: 'Rugido Ancestral',
      readySfx: 'blood_ready',
      haptic: 'heavy',
      cssClass: 'hero-barbarian',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Machado Orbital',
    specialty: 'Dano em Área Maciço & Rompimento Bruto',
    primaryAttack: 'Arremesso giratório de machados colossais que circundam o corpo decapitando monstros.',
    recommendedSynergies: [
      { name: 'Martelo Sagrado', type: 'IMPACTO', desc: 'Derruba e atordoa enquanto os machados giram' },
      { name: 'Coração de Titã', type: 'VITALIDADE', desc: 'Garante regeneração contínua no meio da horda' },
      { name: 'Manopla de Força', type: 'DANO', desc: 'Amplifica o knockback e o raio das lâminas' }
    ],
    levels: { dano: 5, area: 4, vel: 2, res: 4 }
  },
  ALCHEMIST: {
    themeColor: '#9b59b6',
    emblemSvg: HERO_EMBLEMS_SVG.ALCHEMIST,
    chassisSvg: HERO_ULT_CHASSIS_SVG.ALCHEMIST,
    ultProfile: {
      type: 'ALEMBIC',
      name: 'Reagente Volátil',
      readySfx: 'alchemic_ready',
      haptic: 'medium',
      cssClass: 'hero-alchemist',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Frascos Cáusticos',
    specialty: 'Negação de Terreno & Ácido Corrosivo',
    primaryAttack: 'Bombardeio em parábola de frascos que se estilhaçam em poças químicas borbulhantes.',
    recommendedSynergies: [
      { name: 'Frasco Prolongador', type: 'DURAÇÃO', desc: 'Mantém as poças ativas por tempo estendido' },
      { name: 'Grimório Tóxico', type: 'ÁREA', desc: 'Expande o diâmetro da poça para cobrir a tela' },
      { name: 'Ímã de Almas', type: 'COLETA', desc: 'Atrai gemas de longe enquanto o ácido dissolve inimigos' }
    ],
    levels: { dano: 3, area: 5, vel: 3, res: 2 }
  },
  WARLOCK: {
    themeColor: '#9b59b6',
    emblemSvg: HERO_EMBLEMS_SVG.WARLOCK,
    chassisSvg: HERO_ULT_CHASSIS_SVG.ROGUE,
    ultProfile: {
      type: 'VOID',
      name: 'Maldição Entrópica',
      readySfx: 'void_ready',
      haptic: 'medium',
      cssClass: 'hero-rogue',
      keyBadge: 'ESPAÇO'
    },
    weaponName: 'Grimório Sombrio',
    specialty: 'Maldições Entrópicas & Dreno de Almas',
    primaryAttack: 'Vórtices de energia abissal que drenam vitalidade e reduzem velocidade inimiga.',
    recommendedSynergies: [
      { name: 'Anel do Vácuo', type: 'ÁREA', desc: 'Amplifica o raio dos vórtices' },
      { name: 'Cajado da Tormenta', type: 'DISPARO', desc: 'Adiciona dano de longa distância' }
    ],
    levels: { dano: 5, area: 4, vel: 2, res: 2 }
  }
};
