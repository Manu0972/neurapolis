/**
 * NEURAPOLIS — Moteur d'Actualités Macroéconomiques et Chocs de Marché.
 */
import type { MacroNewsItem, MacroNewsState, MacroTrend, Notification, WorldState } from '../core/types';
import { dateOf, dayIndexOf } from '../core/clock';
import { MACRO_NEWS_TEMPLATES } from '../data/macro_news';
import { notify } from './events';

const DEFAULT_TEMPLATE = {
  headline: 'Stabilité économique et reprise de la consommation',
  summary: 'Le climat des affaires reste serein à Val-Ferrand. Les échanges commerciaux suivent leur cours régulier.',
  trend: 'stabilite' as MacroTrend,
  costModifier: 0,
  demandModifier: 0.05,
  durationDays: 5,
};

export function ensureMacroNewsState(w: WorldState): MacroNewsState {
  if (!w.macroNews) {
    const day = dayIndexOf(w.time.tick);
    const firstTpl = MACRO_NEWS_TEMPLATES[5] ?? MACRO_NEWS_TEMPLATES[0] ?? DEFAULT_TEMPLATE;
    const initialItem: MacroNewsItem = {
      id: `news_init_${day}`,
      day,
      date: dateOf(day).iso,
      headline: firstTpl.headline,
      summary: firstTpl.summary,
      trend: firstTpl.trend,
      costModifier: firstTpl.costModifier,
      demandModifier: firstTpl.demandModifier,
      activeUntilDay: day + firstTpl.durationDays,
    };
    w.macroNews = {
      currentTrend: firstTpl.trend,
      costModifier: firstTpl.costModifier,
      demandModifier: firstTpl.demandModifier,
      feed: [initialItem],
    };
  }
  return w.macroNews;
}

export function getCurrentCostModifier(w: WorldState): number {
  const mn = ensureMacroNewsState(w);
  return mn.costModifier;
}

export function getCurrentDemandModifier(w: WorldState): number {
  const mn = ensureMacroNewsState(w);
  return mn.demandModifier;
}

export function macroNewsDayTick(w: WorldState): Notification[] {
  const mn = ensureMacroNewsState(w);
  const day = dayIndexOf(w.time.tick);
  const notifs: Notification[] = [];

  const latest = mn.feed[0];
  if (!latest || day >= latest.activeUntilDay) {
    // Tirer un nouveau choc macroéconomique
    const templateIndex = Math.floor(Math.random() * MACRO_NEWS_TEMPLATES.length);
    const tpl = MACRO_NEWS_TEMPLATES[templateIndex] ?? MACRO_NEWS_TEMPLATES[0] ?? DEFAULT_TEMPLATE;

    const newItem: MacroNewsItem = {
      id: `news_${day}_${Date.now() % 10000}`,
      day,
      date: dateOf(day).iso,
      headline: tpl.headline,
      summary: tpl.summary,
      trend: tpl.trend,
      costModifier: tpl.costModifier,
      demandModifier: tpl.demandModifier,
      activeUntilDay: day + tpl.durationDays,
    };

    mn.currentTrend = tpl.trend;
    mn.costModifier = tpl.costModifier;
    mn.demandModifier = tpl.demandModifier;
    mn.feed.unshift(newItem);
    if (mn.feed.length > 20) mn.feed.pop();

    const notifText = `📰 Flash Éco : « ${tpl.headline} ». Impact : coûts ${tpl.costModifier >= 0 ? '+' : ''}${Math.round(tpl.costModifier * 100)} %, demande ${tpl.demandModifier >= 0 ? '+' : ''}${Math.round(tpl.demandModifier * 100)} %.`;
    notifs.push(notify('journal', notifText));

    w.events.unshift({
      id: `macro_shock_${day}_${w.time.tick}`,
      day,
      date: dateOf(day).iso,
      type: 'quartier',
      title: tpl.headline,
      text: tpl.summary,
      causes: [{ facteur: `Conjoncture macroéconomique : ${tpl.trend}`, poids: 3 }],
    });
  }

  return notifs;
}

export function triggerCustomMarketShock(w: WorldState, templateIndex = 0): Notification {
  const mn = ensureMacroNewsState(w);
  const day = dayIndexOf(w.time.tick);
  const tpl = MACRO_NEWS_TEMPLATES[templateIndex % MACRO_NEWS_TEMPLATES.length] ?? MACRO_NEWS_TEMPLATES[0] ?? DEFAULT_TEMPLATE;

  const newItem: MacroNewsItem = {
    id: `news_custom_${day}_${Date.now() % 10000}`,
    day,
    date: dateOf(day).iso,
    headline: tpl.headline,
    summary: tpl.summary,
    trend: tpl.trend,
    costModifier: tpl.costModifier,
    demandModifier: tpl.demandModifier,
    activeUntilDay: day + tpl.durationDays,
  };

  mn.currentTrend = tpl.trend;
  mn.costModifier = tpl.costModifier;
  mn.demandModifier = tpl.demandModifier;
  mn.feed.unshift(newItem);

  return notify('journal', `📰 Événement Économique : « ${tpl.headline} » !`);
}
