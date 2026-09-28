import { refreshResultsLanguage } from '../ui/modals/gameOverModal.js';
import { getLanguage, setLanguage, onLanguageChange } from './index.js';
import { translateDOM } from './dom.js';
import { renderPauseInventory, isPauseModalOpen } from '../ui/modals/pauseModal.js';
import { renderUpgradeCards, updateUpgradeModalHeader } from '../ui/modals/upgradeModal.js';
import { refreshChestLanguage } from '../ui/modals/chestModal.js';
import { refreshHUDLanguage } from '../ui/hudController.js';
import { updateAllAutoFit } from '../core/responsive.js';

let initialized = false;
export function initMatchI18n() {
  if (typeof document === 'undefined') return;
  if (initialized) return;
  initialized = true;
  const select = document.getElementById('pause-language-select');
  select?.addEventListener('change', () => setLanguage(select.value));
  for (const event of ['keydown', 'keyup']) select?.addEventListener(event, e => e.stopPropagation());
  const refresh = () => {
    if (select) select.value = getLanguage();
    for (const id of ['hud', 'pause-modal', 'upgrade-modal', 'chest-modal', 'death-modal', 'victory-modal', 'blood-altar-touch-btn']) translateDOM(document.getElementById(id));
    refreshHUDLanguage();
    if (isPauseModalOpen()) renderPauseInventory();
    if (document.getElementById('upgrade-modal')?.classList.contains('active')) {
      updateUpgradeModalHeader();
      renderUpgradeCards({ preserveOptions: true });
    }
    refreshChestLanguage();
    refreshResultsLanguage();
    updateAllAutoFit();
  };
  onLanguageChange(refresh);
  refresh();
}
