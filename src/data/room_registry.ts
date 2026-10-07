/**
 * Registre des objets de la chambre : le premier jeu de Claude Code, plus le grand lot
 * d'Antigravity (src/data/room/items.ts) quand il sera livré.
 */
import { STARTER_ITEMS, type StarterItem } from './room_starter';

export const ROOM_ITEMS: readonly StarterItem[] = [...STARTER_ITEMS];
export const ROOM_ITEM_BY_ID: Readonly<Record<string, StarterItem>> = Object.fromEntries(ROOM_ITEMS.map((i) => [i.id, i]));
