import type { Characteristics, CharacteristicsId, PlayerAppearance, PlayerGender } from '../core/types';

export const TOTAL_CHARACTERISTIC_POINTS = 292;
export const CHARACTERISTIC_POINT_BUDGET = TOTAL_CHARACTERISTIC_POINTS;
export const MIN_CHARACTERISTIC = 20;
export const MAX_CHARACTERISTIC = 80;

export const CHARACTERISTIC_FIELDS: ReadonlyArray<{ id: CharacteristicsId; label: string; description: string }> = [
  { id: 'comprehension', label: 'Compréhension', description: 'Comprendre les situations et apprendre.' },
  { id: 'creativite', label: 'Créativité', description: 'Imaginer des idées et des solutions.' },
  { id: 'influence', label: 'Influence', description: 'Convaincre et rassembler.' },
  { id: 'discipline', label: 'Discipline', description: 'Tenir ses engagements.' },
  { id: 'adaptabilite', label: 'Adaptabilité', description: 'Réagir aux imprévus.' },
  { id: 'confiance', label: 'Confiance en soi', description: 'Oser agir et défendre ses choix.' },
];

export const DEFAULT_CHARACTERISTICS: Characteristics = {
  comprehension: 42,
  creativite: 65,
  influence: 35,
  discipline: 48,
  adaptabilite: 58,
  confiance: 44,
};

export const ARCHETYPES: ReadonlyArray<{ id: string; name: string; description: string; stats: Characteristics }> = [
  {
    id: 'equilibre', name: 'Polyvalent', description: 'Un départ équilibré pour découvrir le quartier.',
    stats: { comprehension: 48, creativite: 49, influence: 49, discipline: 48, adaptabilite: 50, confiance: 48 },
  },
  {
    id: 'negociateur', name: 'Leader & Négociateur', description: 'À l’aise pour convaincre et fédérer.',
    stats: { comprehension: 44, creativite: 50, influence: 68, discipline: 42, adaptabilite: 42, confiance: 46 },
  },
  {
    id: 'inventif', name: 'Inventif', description: 'Curieux, créatif et prêt à essayer.',
    stats: { comprehension: 50, creativite: 72, influence: 38, discipline: 40, adaptabilite: 46, confiance: 46 },
  },
  {
    id: 'organise', name: 'Organisé', description: 'Méthodique et fiable dans ses projets.',
    stats: { comprehension: 46, creativite: 42, influence: 42, discipline: 70, adaptabilite: 46, confiance: 46 },
  },
];

export const GENDER_OPTIONS: ReadonlyArray<{ id: PlayerGender; label: string }> = [
  { id: 'fille', label: 'Fille' },
  { id: 'garcon', label: 'Garçon' },
  { id: 'non-binaire', label: 'Non-binaire' },
];

export const SKIN_TONE_OPTIONS = [
  { id: 'peche', label: 'Pêche', hex: '#f2c9a5' },
  { id: 'miel', label: 'Miel', hex: '#d99b72' },
  { id: 'cuivre', label: 'Cuivré', hex: '#a96848' },
  { id: 'ebene', label: 'Brun profond', hex: '#684333' },
] as const;

export const HAIR_COLOR_OPTIONS = [
  { id: 'brun', label: 'Brun', hex: '#3b2926' },
  { id: 'noir', label: 'Noir', hex: '#17191d' },
  { id: 'auburn', label: 'Auburn', hex: '#b56837' },
  { id: 'blond', label: 'Blond', hex: '#d3a64b' },
  { id: 'rose', label: 'Rose', hex: '#9b536e' },
] as const;

export const OUTFIT_COLOR_OPTIONS = [
  { id: 'bleu', label: 'Bleu', hex: '#3a6ca8' },
  { id: 'corail', label: 'Corail', hex: '#c4564b' },
  { id: 'vert', label: 'Vert', hex: '#54815a' },
  { id: 'violet', label: 'Violet', hex: '#7961a5' },
  { id: 'ocre', label: 'Ocre', hex: '#d2a744' },
] as const;

export const HAIR_STYLE_OPTIONS = [
  { id: 'court', label: 'Court' },
  { id: 'long', label: 'Long' },
  { id: 'boucle', label: 'Bouclé' },
  { id: 'tresse', label: 'Tressé' },
] as const;

export const OUTFIT_STYLE_OPTIONS = [
  { id: 'casual', label: 'Décontractée' },
  { id: 'sport', label: 'Sport' },
  { id: 'chic', label: 'Chic' },
  { id: 'artisan', label: 'Artisan' },
] as const;

export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 24;
}

export function characteristicTotal(values: Characteristics): number {
  return CHARACTERISTIC_FIELDS.reduce((total, field) => total + values[field.id], 0);
}

export function isValidCharacteristicAllocation(values: Characteristics): boolean {
  return CHARACTERISTIC_FIELDS.every(({ id }) => Number.isInteger(values[id])
    && values[id] >= MIN_CHARACTERISTIC && values[id] <= MAX_CHARACTERISTIC)
    && characteristicTotal(values) === TOTAL_CHARACTERISTIC_POINTS;
}

export interface CharacterCreation {
  name: string;
  gender: PlayerGender;
  appearance: PlayerAppearance;
  characteristics: Characteristics;
}

export interface CharacterCreatorActions {
  onComplete: (character: CharacterCreation) => void;
  onCancel: () => void;
}


function safeHex(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

/** Portrait SVG déterministe de l'avatar choisi; aucune donnée n'est interpolée sans validation. */
export function renderCreatorAvatarSvg(appearance: PlayerAppearance, size = 100): string {
  const dimension = Number.isFinite(size) ? Math.max(32, Math.min(512, Math.round(size))) : 100;
  const skin = safeHex(appearance.skinTone, '#d99b72');
  const hair = safeHex(appearance.hairColor, '#3b2926');
  const outfit = safeHex(appearance.outfitColor, '#3a6ca8');
  const longHair = appearance.hairStyle === 'long' || appearance.hairStyle === 'tresse';
  const curly = appearance.hairStyle === 'boucle';
  const hairShape = curly
    ? `<circle cx="50" cy="31" r="21" fill="${hair}"/><circle cx="31" cy="37" r="9" fill="${hair}"/><circle cx="69" cy="37" r="9" fill="${hair}"/>`
    : `<path d="M27 48 Q23 12 50 12 Q77 12 73 48 L67 36 Q60 27 50 32 Q40 27 33 36 Z" fill="${hair}"/>${longHair ? `<path d="M29 38 Q25 57 31 66 L38 65 L38 39 M71 38 Q75 57 69 66 L62 65 L62 39" fill="${hair}"/>` : ''}`;
  const outfitDetail = appearance.outfit === 'artisan'
    ? `<path d="M38 69 L62 69 L67 100 L33 100 Z" fill="#8a5a3a"/>`
    : appearance.outfit === 'chic'
      ? `<path d="M43 66 L50 74 L57 66" fill="none" stroke="#f2c9a5" stroke-width="3"/>`
      : appearance.outfit === 'sport'
        ? `<path d="M31 80 L69 80" stroke="#f9ecd0" stroke-width="4"/>`
        : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${dimension}" height="${dimension}" role="img" aria-label="Portrait du personnage">`
    + `<rect width="100" height="100" rx="18" fill="#4a3220"/>`
    + `<path d="M17 100 Q19 69 50 68 Q81 69 83 100" fill="${outfit}"/>${outfitDetail}`
    + `<ellipse cx="50" cy="44" rx="22" ry="27" fill="${skin}"/>${hairShape}`
    + `<circle cx="42" cy="46" r="2" fill="#2a1a14"/><circle cx="58" cy="46" r="2" fill="#2a1a14"/>`
    + `<path d="M44 57 Q50 61 56 57" fill="none" stroke="#7b3f37" stroke-width="2" stroke-linecap="round"/>`
    + `</svg>`;
}

function makeLabel(text: string, className = 'creator-label'): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = className;
  label.textContent = text;
  return label;
}

function makeChoiceButtons<T extends { id: string; label: string }>(
  options: ReadonlyArray<T>,
  selected: string,
  onSelect: (id: string) => void,
  className = 'creator-btn-toggle',
): HTMLDivElement {
  const group = document.createElement('div');
  group.className = 'creator-button-group wrap';
  for (const option of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `${className}${option.id === selected ? ' active' : ''}`;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.id === selected));
    button.addEventListener('click', () => onSelect(option.id));
    group.appendChild(button);
  }
  return group;
}

function makeSwatches<T extends { id: string; label: string; hex: string }>(
  options: ReadonlyArray<T>,
  selected: string,
  onSelect: (hex: string) => void,
): HTMLDivElement {
  const group = document.createElement('div');
  group.className = 'creator-swatches';
  for (const option of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `creator-swatch${option.hex === selected ? ' active' : ''}`;
    button.style.backgroundColor = option.hex;
    button.title = option.label;
    button.setAttribute('aria-label', option.label);
    button.setAttribute('aria-pressed', String(option.hex === selected));
    button.addEventListener('click', () => onSelect(option.hex));
    group.appendChild(button);
  }
  return group;
}

export function mountCharacterCreator(root: HTMLElement, actions: CharacterCreatorActions): void {
  root.replaceChildren();
  let gender: PlayerGender = 'non-binaire';
  let appearance: PlayerAppearance = {
    skinTone: SKIN_TONE_OPTIONS[0].hex,
    hairStyle: HAIR_STYLE_OPTIONS[0].id,
    hairColor: HAIR_COLOR_OPTIONS[0].hex,
    outfit: OUTFIT_STYLE_OPTIONS[0].id,
    outfitColor: OUTFIT_COLOR_OPTIONS[0].hex,
  };
  let characteristics = { ...DEFAULT_CHARACTERISTICS };

  const panel = document.createElement('main');
  panel.className = 'character-creator-screen';
  const card = document.createElement('section');
  card.className = 'character-creator-card';
  const header = document.createElement('header');
  header.className = 'creator-header';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'start-eyebrow';
  eyebrow.textContent = 'TON HISTOIRE COMMENCE ICI';
  const title = document.createElement('h1');
  title.className = 'creator-title';
  title.textContent = 'Crée ton personnage';
  const subtitle = document.createElement('p');
  subtitle.className = 'creator-subtitle';
  subtitle.textContent = 'Choisis ton identité, tes points forts et ton style.';
  header.append(eyebrow, title, subtitle);

  const form = document.createElement('form');
  const grid = document.createElement('div');
  grid.className = 'creator-grid';
  const identityColumn = document.createElement('div');
  identityColumn.className = 'creator-col';
  const statsColumn = document.createElement('div');
  statsColumn.className = 'creator-col';

  const nameSection = document.createElement('section');
  nameSection.className = 'creator-section';
  const nameLabel = makeLabel('Nom du personnage');
  nameLabel.htmlFor = 'creator-name-input';
  const nameInput = document.createElement('input');
  nameInput.id = 'creator-name-input';
  nameInput.name = 'playerName';
  nameInput.className = 'creator-input';
  nameInput.type = 'text';
  nameInput.minLength = 2;
  nameInput.maxLength = 24;
  nameInput.required = true;
  nameInput.autocomplete = 'given-name';
  nameInput.placeholder = 'Écris le prénom de ton choix';
  nameSection.append(nameLabel, nameInput);

  const genderSection = document.createElement('section');
  genderSection.className = 'creator-section';
  const genderLabel = document.createElement('span');
  genderLabel.className = 'creator-label';
  genderLabel.textContent = 'Genre';
  const genderGroup = document.createElement('div');
  genderGroup.className = 'creator-button-group wrap';

  const preview = document.createElement('section');
  preview.className = 'creator-preview-card';
  const previewPortrait = document.createElement('div');
  previewPortrait.className = 'creator-avatar-preview-wrap';
  const previewInfo = document.createElement('div');
  previewInfo.className = 'creator-preview-info';
  const previewName = document.createElement('h2');
  previewName.className = 'creator-preview-name';
  previewName.textContent = 'Aperçu';
  const previewBadges = document.createElement('p');
  previewBadges.className = 'creator-preview-badges';
  previewInfo.append(previewName, previewBadges);
  preview.append(previewPortrait, previewInfo);

  const updatePreview = (): void => {
    previewPortrait.innerHTML = renderCreatorAvatarSvg(appearance, 100);
    previewName.textContent = nameInput.value.trim() || 'Ton personnage';
    previewBadges.textContent = `${GENDER_OPTIONS.find((option) => option.id === gender)?.label ?? ''} · ${OUTFIT_STYLE_OPTIONS.find((option) => option.id === appearance.outfit)?.label ?? ''}`;
  };

  for (const option of GENDER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `creator-btn-toggle${gender === option.id ? ' active' : ''}`;
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(gender === option.id));
    button.addEventListener('click', () => {
      gender = option.id;
      for (const peer of genderGroup.querySelectorAll('button')) {
        const active = peer === button;
        peer.classList.toggle('active', active);
        peer.setAttribute('aria-pressed', String(active));
      }
      updatePreview();
    });
    genderGroup.appendChild(button);
  }
  genderSection.append(genderLabel, genderGroup);

  const appearanceSection = document.createElement('section');
  appearanceSection.className = 'creator-section';
  const addSwatchChoice = <T extends { id: string; label: string; hex: string }>(
    headingText: string,
    options: ReadonlyArray<T>,
    key: 'skinTone' | 'hairColor' | 'outfitColor',
  ): void => {
    const heading = document.createElement('span');
    heading.className = 'creator-label';
    heading.textContent = headingText;
    const target = appearance[key];
    const swatches = makeSwatches(options, target, (hex) => {
      appearance = { ...appearance, [key]: hex };
      for (const swatch of swatches.querySelectorAll<HTMLButtonElement>('.creator-swatch')) {
        const active = swatch.title === options.find((option) => option.hex === hex)?.label;
        swatch.classList.toggle('active', active);
        swatch.setAttribute('aria-pressed', String(active));
      }
      updatePreview();
    });
    appearanceSection.append(heading, swatches);
  };
  addSwatchChoice('Teint', SKIN_TONE_OPTIONS, 'skinTone');
  addSwatchChoice('Couleur des cheveux', HAIR_COLOR_OPTIONS, 'hairColor');
  addSwatchChoice('Couleur de la tenue', OUTFIT_COLOR_OPTIONS, 'outfitColor');

  const hairStyleSection = document.createElement('section');
  hairStyleSection.className = 'creator-section';
  const hairHeading = document.createElement('span');
  hairHeading.className = 'creator-label';
  hairHeading.textContent = 'Coiffure';
  const hairButtons = makeChoiceButtons(HAIR_STYLE_OPTIONS, appearance.hairStyle, (id) => {
    appearance = { ...appearance, hairStyle: id };
    for (const button of hairButtons.querySelectorAll<HTMLButtonElement>('button')) {
      const active = button.textContent === HAIR_STYLE_OPTIONS.find((item) => item.id === id)?.label;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    updatePreview();
  }, 'creator-archetype-btn');
  hairStyleSection.append(hairHeading, hairButtons);

  const outfitSection = document.createElement('section');
  outfitSection.className = 'creator-section';
  const outfitHeading = document.createElement('span');
  outfitHeading.className = 'creator-label';
  outfitHeading.textContent = 'Tenue';
  const outfitButtons = makeChoiceButtons(OUTFIT_STYLE_OPTIONS, appearance.outfit, (id) => {
    appearance = { ...appearance, outfit: id };
    for (const button of outfitButtons.querySelectorAll<HTMLButtonElement>('button')) {
      const active = button.textContent === OUTFIT_STYLE_OPTIONS.find((item) => item.id === id)?.label;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    updatePreview();
  }, 'creator-archetype-btn');
  outfitSection.append(outfitHeading, outfitButtons);

  const statsHeading = document.createElement('span');
  statsHeading.className = 'creator-label';
  statsHeading.textContent = 'Tes points forts';
  const statsHint = document.createElement('span');
  statsHint.className = 'creator-hint';
  statsHint.textContent = `Répartis ${TOTAL_CHARACTERISTIC_POINTS} points. Chaque valeur va de ${MIN_CHARACTERISTIC} à ${MAX_CHARACTERISTIC}.`;
  const archetypeGrid = document.createElement('div');
  archetypeGrid.className = 'creator-archetype-grid';
  const statRows = document.createElement('div');
  statRows.className = 'creator-stats-list';
  const pointsBadge = document.createElement('span');
  pointsBadge.className = 'creator-points-badge';
  pointsBadge.setAttribute('aria-live', 'polite');

  const updateStats = (): void => {
    const total = characteristicTotal(characteristics);
    const valid = isValidCharacteristicAllocation(characteristics);
    pointsBadge.textContent = `${total} / ${TOTAL_CHARACTERISTIC_POINTS} points`;
    pointsBadge.classList.toggle('valid', valid);
    pointsBadge.classList.toggle('error', !valid);
    for (const field of CHARACTERISTIC_FIELDS) {
      const row = statRows.querySelector<HTMLElement>(`[data-stat="${field.id}"]`);
      if (!row) continue;
      const value = characteristics[field.id];
      const valueNode = row.querySelector<HTMLElement>('.creator-stat-val');
      const fill = row.querySelector<HTMLElement>('.creator-stat-bar-fill');
      const decrease = row.querySelector<HTMLButtonElement>('[data-delta="-1"]');
      const increase = row.querySelector<HTMLButtonElement>('[data-delta="1"]');
      if (valueNode) valueNode.textContent = String(value);
      if (fill) fill.style.width = `${value}%`;
      if (decrease) decrease.disabled = value <= MIN_CHARACTERISTIC;
      if (increase) increase.disabled = value >= MAX_CHARACTERISTIC;
    }
    for (const button of archetypeGrid.querySelectorAll<HTMLButtonElement>('.creator-archetype-btn')) button.classList.remove('active');
  };

  for (const archetype of ARCHETYPES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'creator-archetype-btn';
    const name = document.createElement('strong');
    name.textContent = archetype.name;
    const description = document.createElement('small');
    description.textContent = archetype.description;
    button.append(name, description);
    button.addEventListener('click', () => {
      characteristics = { ...archetype.stats };
      for (const peer of archetypeGrid.querySelectorAll<HTMLButtonElement>('.creator-archetype-btn')) peer.classList.toggle('active', peer === button);
      updateStats();
      button.classList.add('active');
    });
    archetypeGrid.appendChild(button);
  }

  for (const field of CHARACTERISTIC_FIELDS) {
    const row = document.createElement('div');
    row.className = 'creator-stat-row';
    row.dataset.stat = field.id;
    const meta = document.createElement('div');
    meta.className = 'creator-stat-meta';
    const name = document.createElement('span');
    name.className = 'creator-stat-name';
    name.textContent = field.label;
    const description = document.createElement('span');
    description.className = 'creator-stat-desc';
    description.textContent = field.description;
    meta.append(name, description);
    const track = document.createElement('div');
    track.className = 'creator-stat-bar-track';
    const fill = document.createElement('div');
    fill.className = 'creator-stat-bar-fill';
    track.appendChild(fill);
    const controls = document.createElement('div');
    controls.className = 'creator-stat-controls';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.className = 'creator-btn-stepper';
    decrease.textContent = '−';
    decrease.setAttribute('aria-label', `Diminuer ${field.label}`);
    decrease.dataset.delta = '-1';
    decrease.addEventListener('click', () => { characteristics[field.id]--; updateStats(); });
    const value = document.createElement('span');
    value.className = 'creator-stat-val';
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.className = 'creator-btn-stepper';
    increase.textContent = '+';
    increase.setAttribute('aria-label', `Augmenter ${field.label}`);
    increase.dataset.delta = '1';
    increase.addEventListener('click', () => { characteristics[field.id]++; updateStats(); });
    controls.append(decrease, value, increase);
    row.append(meta, track, controls);
    statRows.appendChild(row);
  }
  updateStats();

  const status = document.createElement('p');
  status.className = 'creator-hint';
  status.setAttribute('role', 'status');
  const footer = document.createElement('footer');
  footer.className = 'creator-footer';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'start-button';
  cancel.textContent = 'Retour';
  cancel.addEventListener('click', actions.onCancel);
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'start-button primary';
  submit.textContent = 'Lancer l’aventure';
  footer.append(cancel, submit);

  nameInput.addEventListener('input', updatePreview);
  updatePreview();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isValidPlayerName(nameInput.value)) {
      status.textContent = 'Entre un nom de 2 à 24 caractères.';
      nameInput.focus();
      return;
    }
    if (!isValidCharacteristicAllocation(characteristics)) {
      status.textContent = `L’allocation doit totaliser ${TOTAL_CHARACTERISTIC_POINTS} points.`;
      return;
    }
    actions.onComplete({ name: nameInput.value.trim(), gender, appearance: { ...appearance }, characteristics: { ...characteristics } });
  });

  genderSection.append(genderLabel, genderGroup);
  identityColumn.append(nameSection, genderSection, preview, appearanceSection, hairStyleSection, outfitSection);
  statsColumn.append(statsHeading, statsHint, pointsBadge, archetypeGrid, statRows, status, footer);
  grid.append(identityColumn, statsColumn);
  form.appendChild(grid);
  card.append(header, form);
  panel.appendChild(card);
  root.appendChild(panel);
}
