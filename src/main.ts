/**
 * Point d'entrée présentation — écran d'accueil et reprise de sauvegarde.
 * La carte, le HUD et les panneaux vivent dans src/presentation/.
 */
import './presentation/style.css';
import { mountStartScreen } from './presentation/start-screen';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) mountStartScreen(app);
