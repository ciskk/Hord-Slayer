/**
 * src/ui/modals/upgradeModal.js
 * Renderizador de Cartas de Tarô Arcano de Poder (Level-up & Bênçãos de Chefes).
 * Design System: Neo-Arcane / Void Astral (Paridade com Pause & Morte)
 */
import { player, isHeroInUninterruptibleState } from '../../entities/player.js';
import { checkIsSynergyIngredient } from '../../config/items.js';
import { getRandomUpgrades } from '../../config/upgrades.js';
import { playSfx } from '../../core/audio.js';
import { resetInput } from '../../core/input.js';
import { gameState, setLastTime } from '../../main.js';
import { renderIcon } from '../icons.js';

// Biblioteca de Glifos Vetoriais Leves para Cartas de Poder
export const UPGRADE_ICONS = {
  // --- Machado (Kragdor) ---
  axe_speed: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#f1c40f" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="14 8" d="M12 2a10 10 0 1 1-10 10"/><polygon points="13,0 16,3 12,4" fill="#f1c40f"/><path fill="#7f8c8d" stroke="#f1c40f" stroke-width="1" d="M9 15l-4 4 1.5 1.5 4-4z"/><path fill="#d35400" d="M12 6l5-4v6l-5 2z"/><path fill="#e67e22" d="M12 6l-3-2v4l3 2z"/><line x1="8" y1="16" x2="14" y2="10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><circle cx="13" cy="11" r="1.5" fill="#f1c40f"/></svg>`,
  axe_extra: `<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="19" y2="5" stroke="#795548" stroke-width="2.2" stroke-linecap="round"/><path fill="#e67e22" stroke="#d35400" stroke-width="0.8" d="M17 3c2 0 4.5 1 5 3.5-1.5 2-4 2.5-6 2.5V3z"/><path fill="#e67e22" stroke="#d35400" stroke-width="0.8" d="M14 6c-2 0-3.5 1-4 2.5 1.5 1.5 3 2 5 2V6z"/><line x1="20" y1="20" x2="5" y2="5" stroke="#795548" stroke-width="2.2" stroke-linecap="round"/><path fill="#f39c12" stroke="#d35400" stroke-width="0.8" d="M7 3c-2 0-4.5 1-5 3.5 1.5 2 4 2.5 6 2.5V3z"/><path fill="#f39c12" stroke="#d35400" stroke-width="0.8" d="M10 6c2 0 3.5 1 4 2.5-1.5 1.5-3 2-5 2V6z"/><circle cx="12" cy="12" r="3.2" fill="#2c3e50" stroke="#ffd166" stroke-width="1.2"/><path fill="#ffd166" d="M11 9.5h2V11h1.5v2H13v1.5h-2V13H9.5v-2H11z"/></svg>`,
  axe_radius: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#f39c12" stroke-width="1.4" stroke-dasharray="4 3"/><polygon points="12,0.5 10,3.5 14,3.5" fill="#f1c40f"/><polygon points="12,23.5 10,20.5 14,20.5" fill="#f1c40f"/><path fill="#bdc3c7" stroke="#e67e22" stroke-width="1" d="M12 4c4 0 7.5 1.5 8 5-2 3-6 4-8 4V4z"/><path fill="#95a5a6" stroke="#e67e22" stroke-width="1" d="M12 4c-4 0-7.5 1.5-8 5 2 3 6 4 8 4V4z"/><line x1="12" y1="3" x2="12" y2="20" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="8.5" r="1.5" fill="#f1c40f"/></svg>`,

  // --- Poções (Valéria) ---
  potion_volley: `<svg viewBox="0 0 24 24"><path fill="#2ecc71" stroke="#27ae60" stroke-width="0.8" d="M11 7h2v2h-2z M12 9l-3 7c-.5 1 .2 2 1.5 2h3c1.3 0 2-1 1.5-2l-3-7z"/><path fill="#00cec9" stroke="#16a085" stroke-width="0.8" transform="rotate(-30 6 12)" d="M5 8h2v2H5z M6 10l-2.5 6c-.4 1 .2 1.8 1.3 1.8h2.4c1.1 0 1.7-.8 1.3-1.8L6 10z"/><path fill="#a8ff78" stroke="#27ae60" stroke-width="0.8" transform="rotate(30 18 12)" d="M17 8h2v2h-2z M18 10l-2.5 6c-.4 1 .2 1.8 1.3 1.8h2.4c1.1 0 1.7-.8 1.3-1.8L18 10z"/><circle cx="12" cy="4" r="1.2" fill="#2ecc71"/><circle cx="5" cy="5" r="1" fill="#00cec9"/><circle cx="19" cy="5" r="1" fill="#a8ff78"/></svg>`,
  potion_potency: `<svg viewBox="0 0 24 24"><rect x="9.5" y="2" width="5" height="2" rx="0.5" fill="#795548"/><path fill="#00cec9" stroke="#00cec9" stroke-width="1.2" d="M10 4h4v3h-4z"/><path fill="#00cec9" stroke="#00b894" stroke-width="1.4" d="M10 7L4.5 17.5A4 4 0 0 0 8 22h8a4 4 0 0 0 3.5-4.5L14 7h-4z"/><circle cx="12" cy="15" r="2.5" fill="#1e272e"/><circle cx="11.2" cy="14.8" r="0.6" fill="#00cec9"/><circle cx="12.8" cy="14.8" r="0.6" fill="#00cec9"/><rect x="11.4" y="16.8" width="1.2" height="1.2" fill="#1e272e"/><circle cx="10" cy="10" r="1" fill="#e0f7fa"/><circle cx="14" cy="12" r="1.3" fill="#e0f7fa"/><circle cx="8" cy="2" r="0.8" fill="#55efc4"/></svg>`,

  // --- Cajado (Ignis) ---
  staff_projectiles: `<svg viewBox="0 0 24 24"><line x1="7" y1="21" x2="14" y2="10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><path fill="#f39c12" stroke="#d35400" stroke-width="1" d="M12 9c-2-2-1-5 2-6 3 0 4 3 2 6l-4 0z"/><circle cx="14" cy="7" r="2.5" fill="#f1c40f"/><circle cx="19" cy="4" r="2" fill="#e74c3c" stroke="#f1c40f" stroke-width="0.8"/><circle cx="21" cy="9" r="1.8" fill="#e74c3c" stroke="#f1c40f" stroke-width="0.8"/><circle cx="18" cy="14" r="1.6" fill="#e74c3c" stroke="#f1c40f" stroke-width="0.8"/><line x1="15" y1="6" x2="18" y2="4.5" stroke="#f1c40f" stroke-width="1" stroke-dasharray="2 1"/><line x1="16" y1="7.5" x2="19.5" y2="9" stroke="#f1c40f" stroke-width="1" stroke-dasharray="2 1"/></svg>`,
  staff_pierce: `<svg viewBox="0 0 24 24"><path fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.5" stroke-dasharray="3 2" d="M12 3a9 9 0 0 1 9 9 M3 12a9 9 0 0 0 9 9"/><line x1="3" y1="21" x2="19" y2="5" stroke="#e17055" stroke-width="2.5" stroke-linecap="round"/><polygon points="19,5 14,7 17,10" fill="#d63031"/><polygon points="22,2 18,7 17,6" fill="#ffd166"/><path fill="#e17055" d="M14 10c1-3 4-4 6-4 0 2-1 5-4 6l-2-2z"/><path fill="#f39c12" d="M10 14c-3-1-4-4-4-6 2 0 5 1 6 4l-2 2z"/><polygon points="11,10 13,8 14,11" fill="#ffeaa7"/><polygon points="10,12 8,13 11,14" fill="#ffeaa7"/></svg>`,

  // --- Espadas (Sir Kael) ---
  sword_extra: `<svg viewBox="0 0 24 24"><path fill="#00cec9" stroke="#81ecec" stroke-width="0.8" d="M12 2l2 4v11l-2 2-2-2V6z"/><path fill="#ffa502" d="M9 16h6v1.5H9z M11 17.5h2v3h-2z"/><path fill="#00cec9" stroke="#81ecec" stroke-width="0.8" opacity="0.85" d="M6 5l1.5 3v9l-1.5 1.5L4.5 17V8z"/><path fill="#ffa502" d="M4 16h4v1H4z M5.5 17h1v2.5h-1z"/><path fill="#00cec9" stroke="#81ecec" stroke-width="0.8" opacity="0.85" d="M18 5l1.5 3v9l-1.5 1.5-1.5-1.5V8z"/><path fill="#ffa502" d="M16 16h4v1h-4z M17.5 17h1v2.5h-1z"/><circle cx="12" cy="2" r="1.2" fill="#fff"/></svg>`,
  sword_speed: `<svg viewBox="0 0 24 24"><line x1="2" y1="18" x2="10" y2="18" stroke="#74b9ff" stroke-width="1.4" stroke-dasharray="3 2"/><line x1="3" y1="14" x2="8" y2="14" stroke="#74b9ff" stroke-width="1.8" stroke-dasharray="4 2"/><line x1="4" y1="10" x2="11" y2="10" stroke="#74b9ff" stroke-width="1.2" stroke-dasharray="2 2"/><path fill="#74b9ff" stroke="#ffffff" stroke-width="0.8" d="M21 3l-3 1-9 9 2 2 9-9 1-3z"/><rect x="8" y="14" width="5" height="1.8" rx="0.5" transform="rotate(45 10.5 14.9)" fill="#f1c40f"/><line x1="9" y1="16" x2="6.5" y2="18.5" stroke="#795548" stroke-width="2"/><circle cx="6" cy="19" r="1" fill="#f1c40f"/><polygon points="21,3 23,1 21.5,4 23,4 20,6 20,4" fill="#ffffff"/></svg>`,

  // --- Martelo (Sir Roland) ---
  hammer_crush: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round" d="M2 20l4-2 3 3 3-2 M22 20l-4-2-3 3-3-2 M12 21v-3"/><line x1="12" y1="4" x2="12" y2="16" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><path fill="#bdc3c7" stroke="#7f8c8d" stroke-width="1.2" d="M6 5h12v6H6z"/><rect x="7.5" y="6" width="9" height="4" fill="#34495e"/><polygon points="12,3 14,5 10,5" fill="#f1c40f"/><rect x="5" y="7" width="2" height="2" fill="#f1c40f"/><rect x="17" y="7" width="2" height="2" fill="#f1c40f"/><polygon points="5,15 4,13 6,14" fill="#bdc3c7"/><polygon points="19,15 20,13 18,14" fill="#bdc3c7"/></svg>`,
  hammer_impact: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#f39c12" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="4 2" d="M14 3a10 10 0 0 1 7 7"/><polygon points="21,5 23,2 22,6" fill="#ffd166"/><polygon points="23,9 20,10 22,12" fill="#ffd166"/><polygon points="18,3 17,6 20,4" fill="#ffd166"/><line x1="4" y1="20" x2="13" y2="11" stroke="#795548" stroke-width="2.8" stroke-linecap="round"/><path fill="#f39c12" stroke="#d35400" stroke-width="1.2" transform="rotate(45 14 10)" d="M9 7h10v6H9z"/><polygon points="14,10 18,6 16,5 12,9" fill="#ffd166"/><circle cx="16" cy="8" r="1.5" fill="#ffffff"/></svg>`,

  // --- Passivas Universais de Atributos ---
  frost_passive: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#74b9ff" stroke-width="1.8" stroke-linecap="round" d="M12 1.5v21 M2.9 6.75l18.2 10.5 M2.9 17.25l18.2-10.5"/><path fill="none" stroke="#74b9ff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M9.5 4.5L12 7l2.5-2.5 M9.5 19.5L12 17l2.5 2.5 M5.5 10l3.5-.5L7 6.5 M18.5 14l-3.5.5 2 3 M5.5 14l1.5-3-3-.5 M18.5 10l-1.5 3 3 .5"/><polygon points="12,10 14,12 12,14 10,12" fill="#e0f7fa" stroke="#00cec9" stroke-width="0.8"/><circle cx="12" cy="1.5" r="1" fill="#e0f7fa"/><circle cx="12" cy="22.5" r="1" fill="#e0f7fa"/><circle cx="2.9" cy="6.75" r="1" fill="#e0f7fa"/><circle cx="21.1" cy="17.25" r="1" fill="#e0f7fa"/><circle cx="2.9" cy="17.25" r="1" fill="#e0f7fa"/><circle cx="21.1" cy="6.75" r="1" fill="#e0f7fa"/></svg>`,
  dmg: `<svg viewBox="0 0 24 24"><path fill="#ff4757" d="M12 1.5c-2 3.5-4.5 5.5-4 9.5 1-2 2.5-3.5 4-4.5 0 3.5 3 6 1.5 10 4-2 6-5.5 5.5-9.5-.5 2-1.5 3.5-3 4.5 1.5-3.5 0-7-4-10z"/><path fill="#f1f2f6" d="M12 4l2 5v7l-2 3-2-3V9z"/><line x1="12" y1="5.5" x2="12" y2="17.5" stroke="#ff4757" stroke-width="1.2"/><path fill="#ffa502" d="M7 16h10v2.5H7z"/><polygon points="7,16 5.5,14.5 7,18.5" fill="#ffa502"/><polygon points="17,16 18.5,14.5 17,18.5" fill="#ffa502"/><rect x="11" y="18.5" width="2" height="3" fill="#747d8c"/><circle cx="12" cy="22.5" r="1.5" fill="#ffa502"/></svg>`,
  haste: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M2 13l4-7h3l-3 5h4l-6 8 2-6z"/><path fill="#f1c40f" d="M22 11l-4 7h-3l3-5h-4l6-8-2 6z"/><path fill="#ffeaa7" stroke="#d49a1d" stroke-width="1.2" stroke-linejoin="round" d="M7 3h10v2.5l-3.5 4 3.5 4V16H7v-2.5l3.5-4L7 5.5V3z"/><polygon points="8.5,5 15.5,5 12,9" fill="#00cec9"/><polygon points="12,12.5 14.5,15 9.5,15" fill="#00cec9"/><circle cx="12" cy="10.8" r="0.8" fill="#fff"/><rect x="6" y="2" width="12" height="2" rx="1" fill="#e67e22"/><rect x="6" y="20" width="12" height="2" rx="1" fill="#e67e22"/></svg>`,
  wings: `<svg viewBox="0 0 24 24"><path fill="#00cec9" d="M11 6C8 3 4 3.5 2 6c0 3 2 6 5 7.5-1.5.5-3 0-4-1 1 3 3.5 5 6 5-1 1-2.5 1-3.5.5 2 2 5.5 2.5 7.5 1z"/><path fill="#00cec9" d="M13 6c3-3 7-2.5 9 0 0 3-2 6-5 7.5 1.5.5 3 0 4-1-1 3-3.5 5-6 5 1 1 2.5 1 3.5.5-2 2-5.5 2.5-7.5 1z"/><path fill="#81ecec" d="M11 8c-2-1.5-4.5-1.5-6 0 0 2 1.5 3.5 3.5 4.5.5-1.5 1.5-3 2.5-4.5z"/><path fill="#81ecec" d="M13 8c2-1.5 4.5-1.5 6 0 0 2-1.5 3.5-3.5 4.5-.5-1.5-1.5-3-2.5-4.5z"/><polygon points="12,7 13.5,11 12,15 10.5,11" fill="#ffffff" stroke="#00cec9" stroke-width="0.8"/><circle cx="12" cy="11" r="1" fill="#00cec9"/></svg>`,
  crit: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(231, 76, 60, 0.4)" stroke-width="1.2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="7 2"/><line x1="12" y1="1" x2="12" y2="4.5" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="19.5" x2="12" y2="23" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="4.5" y2="12" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><line x1="19.5" y1="12" x2="23" y2="12" stroke="#ff4757" stroke-width="2" stroke-linecap="round"/><polygon points="12,6 14,12 12,18 10,12" fill="#ffffff" stroke="#ff4757" stroke-width="0.8"/><circle cx="12" cy="12" r="1.8" fill="#ffd166"/></svg>`,
  magnet: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#3498db" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 2" d="M4 7a10 10 0 0 1 16 0 M5.5 17a10 10 0 0 0 13 0"/><path fill="#2980b9" stroke="#74b9ff" stroke-width="1.2" d="M6 3v8c0 3.3 2.7 6 6 6s6-2.7 6-6V3h-3.5v8c0 1.4-1.1 2.5-2.5 2.5S9.5 12.4 9.5 11V3H6z"/><rect x="5.5" y="3" width="4.5" height="3" fill="#ff4757" rx="0.5"/><rect x="14" y="3" width="4.5" height="3" fill="#38ada9" rx="0.5"/><polygon points="12,6 13.5,8.5 12,11 10.5,8.5" fill="#f1c40f"/></svg>`,
  aura: `<svg viewBox="0 0 24 24"><path fill="#f39c12" d="M12 1l1.5 3h-3z M12 23l-1.5-3h3z M1 12l3-1.5v3z M23 12l-3 1.5v-3z M4.2 4.2l3 .5-.5 3z M19.8 19.8l-3-.5.5-3z M4.2 19.8l.5-3 3 .5z M19.8 4.2l-.5 3-3-.5z"/><circle cx="12" cy="12" r="6" fill="none" stroke="#ffd166" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" stroke-width="1.2"/><polygon points="12,9 13.2,12 12,15 10.8,12" fill="#ffffff"/><circle cx="12" cy="12" r="1.5" fill="#f1c40f"/></svg>`,
  orbitals: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10.5" ry="4" fill="none" stroke="#a55eea" stroke-width="1.2" stroke-dasharray="3 2" transform="rotate(-25 12 12)"/><path fill="#2c3e50" stroke="#8e44ad" stroke-width="1.2" d="M12 7c-2-1.5-6-1.5-8 0v10c2-1.5 6-1.5 8 0 2-1.5 6-1.5 8 0V7c-2-1.5-6-1.5-8 0z"/><path fill="#ecf0f1" d="M11.5 8c-2-1.2-5.5-1.2-7 0v8.5c1.5-1.2 5-1.2 7 0V8zm1 0v8.5c2-1.2 5.5-1.2 7 0V8c-1.5-1.2-5-1.2-7 0z"/><line x1="6.5" y1="10.5" x2="9.5" y2="10.5" stroke="#9b59b6" stroke-width="1"/><line x1="6.5" y1="13" x2="9.5" y2="13" stroke="#9b59b6" stroke-width="1"/><line x1="14.5" y1="10.5" x2="17.5" y2="10.5" stroke="#9b59b6" stroke-width="1"/><line x1="14.5" y1="13" x2="17.5" y2="13" stroke="#9b59b6" stroke-width="1"/><circle cx="19.5" cy="8.5" r="2" fill="#ffd166" stroke="#f39c12" stroke-width="0.8"/></svg>`,
  armor: `<svg viewBox="0 0 24 24"><path fill="#2c3e50" stroke="#bdc3c7" stroke-width="1.5" stroke-linejoin="round" d="M12 2l7 3v6.5c0 5.5-3.5 10.5-7 11.5-3.5-1-7-6-7-11.5V5l7-3z"/><path fill="#7f8c8d" d="M12 3.5L6.5 6v5c0 4.5 2.5 8.5 5.5 9.5V3.5z"/><path fill="#95a5a6" d="M12 3.5v17c3-1 5.5-5 5.5-9.5V6L12 3.5z"/><path fill="#e74c3c" d="M11 7h2v3h3v2h-3v5h-2v-5H8v-2h3V7z"/><circle cx="7" cy="7" r="0.8" fill="#ecf0f1"/><circle cx="17" cy="7" r="0.8" fill="#ecf0f1"/></svg>`,
  heal: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="rgba(46, 204, 113, 0.35)" stroke-width="1.2" stroke-dasharray="4 2"/><path fill="#2ecc71" stroke="#27ae60" stroke-width="1.2" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/><path fill="#ffffff" d="M10.5 8h3v2.5H16v3h-2.5V16h-3v-2.5H8v-3h2.5V8z"/><circle cx="8" cy="6.5" r="1" fill="#a8ff78"/></svg>`,
  blessing: `<svg viewBox="0 0 24 24"><path fill="#d49a1d" d="M3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"/><path fill="#ffeaa7" stroke="#b7791f" stroke-width="1.2" d="M2.5 10c0-4 4-7 9.5-7s9.5 3 9.5 7H2.5z"/><polygon points="12,5 14,8 12,11 10,8" fill="#00cec9"/><circle cx="7.5" cy="8.5" r="1.5" fill="#ff7675"/><circle cx="16.5" cy="8.5" r="1.5" fill="#74b9ff"/><rect x="10.5" y="11" width="3" height="4.5" rx="1" fill="#f1c40f" stroke="#7a4f07" stroke-width="0.8"/><circle cx="12" cy="13.2" r="0.6" fill="#1e272e"/><polygon points="4,4 5,2 5.5,3.8 7,4 5.5,4.8 5,6.5 4.5,4.8" fill="#ffd166"/><polygon points="19,4 20,2 20.5,3.8 22,4 20.5,4.8 20,6.5 19.5,4.8" fill="#ffd166"/></svg>`,

  // --- Cartas do Destino (Pactos Amaldiçoados) ---
  destiny_berserker: `<svg viewBox="0 0 24 24"><path fill="#c084fc" stroke="#ff3838" stroke-width="1" d="M5 10C3 6 4 2 7 1c0 3 1 6 3 8 M19 10c2-4 1-8-2-9 0 3-1 6-3 8"/><path fill="#2c0b1e" stroke="#c084fc" stroke-width="1.4" d="M6 11c0-4 2.5-7 6-7s6 3 6 7c0 2.5-1 4-2 5v3h-2v2h-4v-2H8v-3c-1-1-2-2.5-2-5z"/><ellipse cx="9" cy="11.5" rx="1.5" ry="2" fill="#ff3838"/><ellipse cx="15" cy="11.5" rx="1.5" ry="2" fill="#ff3838"/><polygon points="12,13.5 11,15 13,15" fill="#ff3838"/><line x1="9" y1="18.5" x2="9" y2="20" stroke="#ff3838" stroke-width="1.2"/><line x1="12" y1="18.5" x2="12" y2="20" stroke="#ff3838" stroke-width="1.2"/><line x1="15" y1="18.5" x2="15" y2="20" stroke="#ff3838" stroke-width="1.2"/></svg>`,
  destiny_titan: `<svg viewBox="0 0 24 24"><path fill="#3d3d3d" stroke="#f39c12" stroke-width="1.4" stroke-linejoin="round" d="M12 21.5l-1.4-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.7L12 21.5z"/><path fill="none" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round" d="M12 5v6l-3 2 2 3-1 3 M12 11l3 1-1 3 2 2"/><circle cx="12" cy="11" r="1.5" fill="#ffeaa7"/><line x1="3" y1="9" x2="21" y2="15" stroke="#718093" stroke-width="2.2" stroke-dasharray="3 1.5"/><line x1="3" y1="15" x2="21" y2="9" stroke="#718093" stroke-width="2.2" stroke-dasharray="3 1.5"/></svg>`,
  destiny_arcane_frenzy: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#a855f7" stroke="#67e8f9" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="#ffffff"/><path fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2l-2 5h4l-2 5 M12 22l2-5h-4l2-5 M2 12l5 2v-4l5 2 M22 12l-5-2v4l-5-2"/><polygon points="5,5 7,3 6,6" fill="#67e8f9"/><polygon points="19,5 17,3 18,6" fill="#67e8f9"/><polygon points="5,19 7,21 6,18" fill="#67e8f9"/><polygon points="19,19 17,21 18,18" fill="#67e8f9"/></svg>`,
  destiny_midas: `<svg viewBox="0 0 24 24"><rect x="10" y="16" width="4" height="6" rx="1" fill="#d49a1d" stroke="#8e44ad" stroke-width="1"/><path fill="#ffd166" stroke="#b7791f" stroke-width="1" d="M7 16l1-5 2-4 2-1 2 1 2 4 1 5z"/><path fill="none" stroke="#ffd166" stroke-width="1.8" stroke-linecap="round" d="M8 11L6 7l2-2 M11 7V3l2-1 M13 7V3l2 1 M16 11l2-4-2-2"/><circle cx="12" cy="10" r="2.2" fill="#ffd166" stroke="#7a4f07" stroke-width="0.8"/><circle cx="9" cy="14" r="1.8" fill="#f1c40f" stroke="#7a4f07" stroke-width="0.6"/><circle cx="15" cy="14" r="1.8" fill="#f1c40f" stroke="#7a4f07" stroke-width="0.6"/></svg>`,
  destiny_executioner: `<svg viewBox="0 0 24 24"><path fill="#1a050b" stroke="#ff4757" stroke-width="1.5" stroke-linejoin="round" d="M2 12C5 6 19 6 22 12c-3 6-17 6-20 0z"/><circle cx="12" cy="12" r="5" fill="#ff4757"/><polygon points="11,7 13,7 13.5,14 12,17 10.5,14" fill="#000000"/><polygon points="12,11 14,8 10,8" fill="#ffffff"/><path fill="#ff4757" d="M12 18c0 1.5-1 2.5-1 3.5s1 1.5 1 1.5 1-.5 1-1.5-1-2-1-3.5z"/></svg>`,
  destiny_spectral: `<svg viewBox="0 0 24 24"><path fill="rgba(162, 155, 254, 0.25)" d="M4 14c2-4 5-8 8-8s6 4 8 8c-3 1-5-1-8 2-3-3-5-1-8-2z"/><path fill="#a29bfe" stroke="#dfe6e9" stroke-width="1.2" stroke-linejoin="round" d="M12 3c-4.5 0-7 3.5-7 8 0 4 1.5 6 3 9 1-2 2-1 3-3 1 2 2 1 3 3 1-2 2-1 3-3 1.5 3 2 1 3-3 0-4.5-2.5-8-7-8z"/><ellipse cx="9.5" cy="10" rx="1.4" ry="2.2" fill="#2d3436"/><ellipse cx="14.5" cy="10" rx="1.4" ry="2.2" fill="#2d3436"/><circle cx="9.5" cy="9.5" r="0.6" fill="#67e8f9"/><circle cx="14.5" cy="9.5" r="0.6" fill="#67e8f9"/></svg>`,

  // --- Sinergias & Fusões Supremas ---
  evolved_sword: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#00cec9" stroke-width="1.5" stroke-dasharray="3 2" d="M3 3l18 18 M21 3L3 21"/><path fill="#74b9ff" stroke="#ffffff" stroke-width="1" d="M12 1l3 6v10l-3 4-3-4V7z"/><line x1="12" y1="3" x2="12" y2="19" stroke="#00cec9" stroke-width="1.4"/><path fill="#ffd166" d="M8 15h8v2H8z M10.5 17h3v4h-3z"/><polygon points="12,1 13.5,4 12,6 10.5,4" fill="#ffffff"/></svg>`,
  evolved_axe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#ff3838" stroke-width="1.5" stroke-dasharray="5 2"/><line x1="5" y1="19" x2="19" y2="5" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><path fill="#e74c3c" stroke="#c0392b" stroke-width="1" d="M16 2c3 0 6 1.5 6 5-2 3-5 3.5-8 3.5V2z"/><path fill="#e74c3c" stroke="#c0392b" stroke-width="1" d="M13 7c-3 0-5 1-6 3 2 2 4 2.5 7 2.5V7z"/><line x1="19" y1="19" x2="5" y2="5" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/><path fill="#ff7675" stroke="#c0392b" stroke-width="1" d="M8 2c-3 0-6 1.5-6 5 2 3 5 3.5 8 3.5V2z"/><circle cx="12" cy="12" r="3" fill="#2c3e50" stroke="#ffd166" stroke-width="1.2"/><polygon points="12,10 13.5,12 12,14 10.5,12" fill="#ffd166"/></svg>`,
  evolved_potion: `<svg viewBox="0 0 24 24"><path fill="#27ae60" stroke="#2ecc71" stroke-width="1.2" d="M4 11h16c0 6-3.5 11-8 11s-8-5-8-11z"/><path fill="#2ecc71" d="M3 10h18v2H3z"/><circle cx="7" cy="7" r="1.5" fill="#00cec9"/><circle cx="12" cy="5" r="2" fill="#2ecc71"/><circle cx="17" cy="7" r="1.8" fill="#a8ff78"/><circle cx="9" cy="4" r="1" fill="#a8ff78"/><path fill="#a8ff78" d="M6 13c1 2 2.5 3 4 3s2-2 3-2 2 2 3 2 2.5-1 3-3z"/></svg>`,
  evolved_hammer: `<svg viewBox="0 0 24 24"><path fill="none" stroke="#f1c40f" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="3 2" d="M2 19l4-2 3 3 3-2 M22 19l-4-2-3 3-3-2 M12 22v-4"/><line x1="12" y1="2" x2="12" y2="16" stroke="#d35400" stroke-width="3" stroke-linecap="round"/><path fill="#ffd166" stroke="#b7791f" stroke-width="1.2" d="M5 4h14v7H5z"/><rect x="7" y="5.5" width="10" height="4" fill="#f39c12"/><polygon points="12,1 15,4 9,4" fill="#ffffff"/><circle cx="12" cy="7.5" r="1.8" fill="#ffffff"/><polygon points="20,2 23,0 21,4" fill="#ffd166"/><polygon points="4,2 1,0 3,4" fill="#ffd166"/></svg>`,
  evolved_staff: `<svg viewBox="0 0 24 24"><path fill="#e17055" d="M12 2C8 6 3 8 3 14c0 4 3 7 9 8 6-1 9-4 9-8 0-6-5-8-9-12z"/><path fill="#f39c12" d="M12 6c-2.5 3-5 4.5-5 8 0 2.5 2 4.5 5 5 3-.5 5-2.5 5-5 0-3.5-2.5-5-5-8z"/><polygon points="12,10 14,14 12,17 10,14" fill="#ffeaa7"/><circle cx="12" cy="14" r="1.2" fill="#ffffff"/><circle cx="6" cy="10" r="1" fill="#ffd166"/><circle cx="18" cy="10" r="1" fill="#ffd166"/></svg>`,
  evolved_orbitals: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="10" fill="none" stroke="#ffd166" stroke-width="1.2" stroke-dasharray="6 3"/><circle cx="12" cy="3" r="2.2" fill="#9b59b6" stroke="#ffd166" stroke-width="1"/><circle cx="4.5" cy="16.5" r="2.2" fill="#9b59b6" stroke="#ffd166" stroke-width="1"/><circle cx="19.5" cy="16.5" r="2.2" fill="#9b59b6" stroke="#ffd166" stroke-width="1"/><path fill="#ecf0f1" stroke="#8e44ad" stroke-width="1.2" d="M12 8c-1.5-1-4.5-1-6 0v7c1.5-1 4.5-1 6 0 1.5-1 4.5-1 6 0V8c-1.5-1-4.5-1-6 0z"/><polygon points="12,9 13.5,11.5 12,13.5 10.5,11.5" fill="#f1c40f"/></svg>`,
  evolved_aura: `<svg viewBox="0 0 24 24"><path fill="#f1c40f" d="M12 0l1.8 4h-3.6z M12 24l-1.8-4h3.6z M0 12l4-1.8v3.6z M24 12l-4 1.8v-3.6z M3.5 3.5l4 .5-.5 4z M20.5 20.5l-4-.5.5-4z M3.5 20.5l.5-4 4 .5z M20.5 3.5l-.5 4-4-.5z"/><circle cx="12" cy="12" r="7" fill="#ffd166" stroke="#d49a1d" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#ffffff"/><polygon points="12,7 13.5,12 12,17 10.5,12" fill="#e74c3c"/></svg>`
};

function isSynergyIngredient(optId) {
  return checkIsSynergyIngredient(optId, player);
}

export let pendingLevelUps = 0;
export let bossRewardContext = null;
let levelupKeydownHandler = null;
let currentOptions = [];

export function setBossRewardContext(bossName, bossId) {
  bossRewardContext = {
    bossName: bossName || 'Chefe Supremo',
    bossId: bossId || 1,
    totalCount: 0,
    chosenCount: 0
  };
}

export function ensureBossUpgradeCount(minCount) {
  if (bossRewardContext && bossRewardContext.totalCount < minCount) {
    const diff = minCount - bossRewardContext.totalCount;
    for (let k = 0; k < diff; k++) {
      levelUp();
    }
  }
}

export function resetUpgradeQueue() {
  pendingLevelUps = 0;
  bossRewardContext = null;
  const bossBanner = document.getElementById('boss-reward-banner');
  if (bossBanner) bossBanner.style.display = 'none';
}

export function updateUpgradeModalHeader() {
  const bossBanner = document.getElementById('boss-reward-banner');
  const bossTitle = document.getElementById('boss-reward-title');
  const bossCounter = document.getElementById('boss-reward-counter');
  const eyebrowText = document.getElementById('levelup-eyebrow-text');
  const headerSub = document.getElementById('levelup-monumental-sub');
  const heroLvlBadge = document.getElementById('levelup-hero-level');
  const queueChip = document.getElementById('levelup-queue-chip');
  const queueCount = document.getElementById('levelup-queue-count');

  if (heroLvlBadge) {
    heroLvlBadge.innerText = `NV ${player.level || 1}`;
  }

  if (queueChip && queueCount) {
    if (pendingLevelUps > 1) {
      queueChip.style.display = 'inline-flex';
      queueCount.innerText = `${pendingLevelUps} Bênçãos`;
    } else {
      queueChip.style.display = 'none';
    }
  }

  if (bossRewardContext && bossRewardContext.totalCount > 0) {
    if (bossBanner) {
      bossBanner.style.display = 'flex';
      if (bossTitle) bossTitle.innerText = `VITÓRIA CONTRA ${bossRewardContext.bossName.toUpperCase()}!`;
      if (bossCounter) {
        const currentChoice = bossRewardContext.chosenCount + 1;
        const total = Math.max(bossRewardContext.totalCount, bossRewardContext.chosenCount + pendingLevelUps);
        const remaining = Math.max(0, pendingLevelUps - 1);
        bossCounter.innerHTML = `<span style="color:#ffd166; font-weight:800;">+${total} UPGRADES CONQUISTADOS</span> &bull; Escolhendo Bênção <b>${currentChoice} de ${total}</b>${remaining > 0 ? ` (${remaining} restante${remaining > 1 ? 's' : ''})` : ' (Última Bênção)'}`;
      }
    }
    if (eyebrowText) eyebrowText.innerText = "COLOSSO SUPREMO DERROTADO • DÁDIVA ARCANO";
    if (headerSub) headerSub.innerText = "Recompensa mística concedida pela aniquilação do soberano";
  } else {
    if (bossBanner) bossBanner.style.display = 'none';
    if (eyebrowText) eyebrowText.innerText = "TRANSCENDÊNCIA DE NÍVEL • TARÔ ARCANO";
    if (headerSub) {
      if (pendingLevelUps > 1) {
        headerSub.innerHTML = `Invoque uma bênção arcana para remodelar o combate &bull; <b style="color:#ffd166;">${pendingLevelUps} bênçãos na fila</b>`;
      } else {
        headerSub.innerText = "Invoque uma bênção arcana para remodelar o combate";
      }
    }
  }
}

function resolveCardCategory(opt) {
  const badgeLower = (opt.badge || '').toLowerCase();
  if (badgeLower.includes('machado') || badgeLower.includes('poção') || badgeLower.includes('cajado') || badgeLower.includes('espada') || badgeLower.includes('martelo') || badgeLower.includes('arma')) {
    return 'ARMA';
  }
  if (badgeLower.includes('recompensa') || badgeLower.includes('fortuna') || badgeLower.includes('cura') || badgeLower.includes('utilidade')) {
    return 'UTILIDADE';
  }
  return 'PASSIVA';
}

function selectCardIndex(idx) {
  if (idx < 0 || idx >= currentOptions.length) return;
  const opt = currentOptions[idx];
  playSfx('card_select');
  opt.apply();
  pendingLevelUps--;

  if (bossRewardContext) {
    bossRewardContext.chosenCount++;
  }

  if (pendingLevelUps > 0) {
    updateUpgradeModalHeader();
    renderUpgradeCards();
  } else {
    closeLevelUpModal();
  }
}

function closeLevelUpModal() {
  const modal = document.getElementById('upgrade-modal');
  const gameCanvas = document.getElementById('game-canvas');

  if (levelupKeydownHandler) {
    window.removeEventListener('keydown', levelupKeydownHandler);
    levelupKeydownHandler = null;
  }

  pendingLevelUps = 0;
  bossRewardContext = null;
  updateUpgradeModalHeader();

  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('closing');
  }

  setTimeout(() => {
    if (modal) {
      modal.classList.remove('closing');
      modal.style.display = 'none';
    }
    if (gameCanvas) {
      gameCanvas.classList.remove('canvas-levelup-frozen');
    }
    gameState.isPaused = false;
    setLastTime(performance.now());
  }, 200);
}

function setupLevelupKeyboard() {
  if (levelupKeydownHandler) return;

  levelupKeydownHandler = (e) => {
    if (e.repeat) return;
    const modal = document.getElementById('upgrade-modal');
    if (!modal || modal.style.display === 'none') return;

    if (e.key === '1' || e.code === 'Digit1') {
      e.preventDefault();
      selectCardIndex(0);
    } else if (e.key === '2' || e.code === 'Digit2') {
      e.preventDefault();
      selectCardIndex(1);
    } else if (e.key === '3' || e.code === 'Digit3') {
      e.preventDefault();
      selectCardIndex(2);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const rerollBtn = document.getElementById('reroll-btn');
      if (rerollBtn && rerollBtn.style.display !== 'none' && player.rerolls > 0) {
        rerollBtn.click();
      }
    }
  };

  window.addEventListener('keydown', levelupKeydownHandler);
}

export function renderUpgradeCards() {
  const modal = document.getElementById('upgrade-modal');
  const container = document.getElementById('upgrade-list');
  if (!container || !modal) return;
  container.innerHTML = '';

  currentOptions = getRandomUpgrades(3);

  currentOptions.forEach((opt, index) => {
    const card = document.createElement('div');
    card.className = `upgrade-card-pro ${opt.rarity}`;

    const iconSvg = UPGRADE_ICONS[opt.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffd166"/></svg>`;
    const isSynergy = isSynergyIngredient(opt.id);
    const isDestiny = !!opt.isDestinyCard;
    const category = isDestiny ? 'PACTO' : resolveCardCategory(opt);
    const hotkeyNum = index + 1;

    const categoryIcon = isDestiny ? 'sparkle' : (category === 'ARMA' ? 'sword' : (category === 'UTILIDADE' ? 'heal' : 'aura'));
    const categoryColor = isDestiny ? '#c084fc' : '#94a3b8';

    card.innerHTML = `
      <div class="card-header-bar">
        <span class="card-category-tag" style="${isDestiny ? 'border-color: rgba(192, 132, 252, 0.5); color: #d8b4fe;' : ''}">
          ${renderIcon(categoryIcon, { size: 10, color: categoryColor })}
          ${category}
        </span>
        <span class="card-hotkey-badge">[ ${hotkeyNum} ]</span>
      </div>

      ${isSynergy ? `<div class="synergy-indicator-tag">${renderIcon('sparkle', { size: 10, color: '#ffd166' })} PEÇA DE FUSÃO</div>` : ''}
      ${isDestiny ? `<div class="synergy-indicator-tag" style="border-color: rgba(192, 132, 252, 0.6); color: #e9d5ff; background: rgba(147, 51, 234, 0.25);">${renderIcon('sparkle', { size: 10, color: '#c084fc' })} PACTO AMALDIÇOADO</div>` : ''}

      <div class="card-icon-pedestal">
        <div class="pedestal-ring-outer"></div>
        <div class="pedestal-core">
          ${iconSvg}
        </div>
      </div>

      <div class="card-title-group">
        <div class="card-title-main">${opt.title}</div>
        <div class="card-rarity-badge-mini">${opt.badge}</div>
      </div>

      <div class="card-desc-text">${opt.desc}</div>

      ${isDestiny 
        ? `<div class="card-tradeoff-group">
             <div class="card-stat-pill stat-bonus">▲ ${opt.bonusText}</div>
             <div class="card-stat-pill stat-penalty">▼ ${opt.penaltyText}</div>
           </div>`
        : `<div class="card-stat-pill">${typeof opt.getStat === 'function' ? opt.getStat() : opt.stat}</div>`
      }
    `;

    card.onmouseenter = () => {
      playSfx('card_hover');
    };

    card.onclick = () => {
      selectCardIndex(index);
    };

    container.appendChild(card);
  });

  const rerollBtn = document.getElementById('reroll-btn');
  const rerollCount = document.getElementById('reroll-count');
  if (rerollBtn && rerollCount) {
    if (player.rerolls > 0) {
      rerollCount.innerText = player.rerolls;
      rerollBtn.style.display = 'inline-flex';
      rerollBtn.onclick = () => {
        player.rerolls--;
        playSfx('level');
        updateUpgradeModalHeader();
        renderUpgradeCards();
      };
    } else {
      rerollBtn.style.display = 'none';
    }
  }

  setupLevelupKeyboard();
}

export function levelUp() {
  pendingLevelUps++;
  if (bossRewardContext) {
    bossRewardContext.totalCount++;
  }

  const upgradeModal = document.getElementById('upgrade-modal');
  if (upgradeModal && upgradeModal.style.display === 'flex') {
    updateUpgradeModalHeader();
    return;
  }

  // Bloqueio de Pop-Up: Se o herói estiver em ULT (Sir Roland, Ignis) ou canalizando, adia a apresentação
  if (isHeroInUninterruptibleState()) {
    playSfx('gem');
    const xpFill = document.getElementById('xp-fill');
    if (xpFill) {
      xpFill.classList.add('xp-queued-pulse');
      setTimeout(() => xpFill.classList.remove('xp-queued-pulse'), 600);
    }
    return;
  }

  presentDeferredLevelUpModal();
}

export function presentDeferredLevelUpModal() {
  if (pendingLevelUps <= 0) return;

  const upgradeModal = document.getElementById('upgrade-modal');
  const gameCanvas = document.getElementById('game-canvas');

  if (upgradeModal && upgradeModal.style.display === 'flex') {
    updateUpgradeModalHeader();
    return;
  }

  playSfx('level');
  gameState.isPaused = true;
  resetInput();

  if (gameCanvas) {
    gameCanvas.classList.add('canvas-levelup-frozen');
  }

  updateUpgradeModalHeader();
  renderUpgradeCards();

  if (upgradeModal) {
    upgradeModal.classList.remove('closing');
    upgradeModal.classList.add('active');
    upgradeModal.style.display = 'flex';
  }
}
