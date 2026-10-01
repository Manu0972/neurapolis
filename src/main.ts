/**
 * Point d'entrée présentation — quartier jouable (jalon M2).
 * La carte, le HUD et les panneaux vivent dans src/presentation/.
 */
import './presentation/style.css';
import { startGame } from './presentation/game';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) startGame(app);
