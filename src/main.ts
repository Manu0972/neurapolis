/**
 * Point d'entrée présentation — écran d'accueil et reprise de sauvegarde.
 * La carte, le HUD et les panneaux vivent dans src/presentation/.
 * Avec « ?e2e » dans l'URL, un scénario de bout en bout joue une partie et affiche son rapport.
 */
import './presentation/style.css';
import { mountStartScreen } from './presentation/start-screen';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  if (new URLSearchParams(location.search).has('e2e')) {
    void import('./presentation/e2e').then((m) => m.mountE2E(app));
  } else {
    mountStartScreen(app);
  }
}
