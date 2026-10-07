/**
 * NEURAPOLIS — P-PERSO : Écran de Création & Personnalisation de Personnage
 * Interface interactive, accessible et ergonomique pour configurer :
 * - Identité : Prénom, Nom, Genre
 * - Caractéristiques : Répartition libre d'un pool de 18 points bonus (+/-)
 * - Apparence : Peau, Cheveux (couleur/coupe), Tenue (style/couleur)
 * - Aperçu en direct et validation conditionnelle.
 */
import {
  type Characteristics,
  type PlayerAppearance,
  type PlayerCustomization,
  type PlayerGender,
  BASE_CHARACTERISTICS,
  CHARACTERISTIC_KEYS,
  CHARACTERISTIC_LABELS,
  CHARACTERISTIC_MAX,
  DEFAULT_PLAYER_CUSTOMIZATION,
  GENDER_INFO,
  HAIR_COLOR_INFO,
  HAIR_STYLE_INFO,
  OUTFIT_COLOR_INFO,
  OUTFIT_STYLE_INFO,
  SKIN_TONE_INFO,
  TOTAL_BONUS_POINTS,
  VALID_GENDERS,
  VALID_HAIR_COLORS,
  VALID_HAIR_STYLES,
  VALID_OUTFIT_COLORS,
  VALID_OUTFIT_STYLES,
  VALID_SKIN_TONES,
  validateCharacteristicsAllocation,
  validateIdentity,
} from '../core/player_customization';
import { drawCamille } from './assets/characters/camille';
import { DEFAULT_PLAYER_APPEARANCE } from '../core/types';
import { buildAppearanceEditor } from './appearance-editor';
import { createAvatarPreview } from './avatar-preview3d';

export interface CharacterCreatorOptions {
  initialCustomization?: Partial<PlayerCustomization>;
  onComplete: (customization: PlayerCustomization) => void;
  onCancel?: () => void;
}

/**
 * Monte l'écran de personnalisation du joueur dans l'élément racine spécifié.
 */
export function mountCharacterCreation(
  root: HTMLElement,
  onComplete: (customization: PlayerCustomization) => void,
  onCancel?: () => void
): HTMLElement {
  root.replaceChildren();

  // État local mutable réactif
  let firstName = DEFAULT_PLAYER_CUSTOMIZATION.firstName;
  let lastName = DEFAULT_PLAYER_CUSTOMIZATION.lastName;
  let gender: PlayerGender = DEFAULT_PLAYER_CUSTOMIZATION.gender;

  let appearance: PlayerAppearance = { ...DEFAULT_PLAYER_APPEARANCE, ...DEFAULT_PLAYER_CUSTOMIZATION.appearance };

  const bonusPoints: Record<keyof Characteristics, number> = {
    comprehension: 0,
    creativite: 0,
    influence: 0,
    discipline: 0,
    adaptabilite: 0,
    confiance: 0,
  };

  // Conteneur principal
  const container = document.createElement('main');
  container.className = 'character-creator';
  container.setAttribute('aria-labelledby', 'creator-title');

  // Injecter les styles dédiés s'ils ne sont pas déjà présents
  ensureCreatorStyles();

  // En-tête
  const header = document.createElement('header');
  header.className = 'creator-header';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'creator-eyebrow';
  eyebrow.textContent = 'VAL-FERRAND • RENTRÉE 2020';
  const title = document.createElement('h1');
  title.id = 'creator-title';
  title.textContent = 'Création de ton Personnage';
  const subtitle = document.createElement('p');
  subtitle.className = 'creator-subtitle';
  subtitle.textContent =
    'Choisis ton identité, affine tes points forts et personnalise ton allure avant de faire tes premiers pas.';
  header.append(eyebrow, title, subtitle);
  container.appendChild(header);

  // Disposition en deux colonnes (Formulaire d'édition + Carte d'aperçu)
  const bodyGrid = document.createElement('div');
  bodyGrid.className = 'creator-grid';

  const formColumn = document.createElement('div');
  formColumn.className = 'creator-form-col';

  // --------------------------------------------------------------------------
  // SECTION 1 : IDENTITÉ
  // --------------------------------------------------------------------------
  const identitySection = document.createElement('section');
  identitySection.className = 'creator-section identity-section';
  const idTitle = document.createElement('h2');
  idTitle.textContent = '1. Identité';
  identitySection.appendChild(idTitle);

  const nameFieldsRow = document.createElement('div');
  nameFieldsRow.className = 'creator-fields-row';

  // Prénom
  const fnGroup = document.createElement('div');
  fnGroup.className = 'creator-input-group';
  const fnLabel = document.createElement('label');
  fnLabel.htmlFor = 'char-firstname';
  fnLabel.textContent = 'Prénom *';
  const fnInput = document.createElement('input');
  fnInput.id = 'char-firstname';
  fnInput.type = 'text';
  fnInput.maxLength = 30;
  fnInput.value = firstName;
  fnInput.placeholder = 'Ex: Camille';
  fnGroup.append(fnLabel, fnInput);

  // Nom
  const lnGroup = document.createElement('div');
  lnGroup.className = 'creator-input-group';
  const lnLabel = document.createElement('label');
  lnLabel.htmlFor = 'char-lastname';
  lnLabel.textContent = 'Nom de famille';
  const lnInput = document.createElement('input');
  lnInput.id = 'char-lastname';
  lnInput.type = 'text';
  lnInput.maxLength = 30;
  lnInput.value = lastName;
  lnInput.placeholder = 'Ex: Dupont';
  lnGroup.append(lnLabel, lnInput);

  nameFieldsRow.append(fnGroup, lnGroup);
  identitySection.appendChild(nameFieldsRow);

  // Genre
  const genderGroup = document.createElement('div');
  genderGroup.className = 'creator-input-group';
  const genderLabel = document.createElement('label');
  genderLabel.textContent = 'Genre';
  const genderButtonsRow = document.createElement('div');
  genderButtonsRow.className = 'creator-pills-row';

  const genderButtons: Record<PlayerGender, HTMLButtonElement> = {} as any;
  for (const g of VALID_GENDERS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `creator-pill-btn ${g === gender ? 'active' : ''}`;
    btn.setAttribute('aria-pressed', g === gender ? 'true' : 'false');
    btn.innerHTML = `<span class="pill-icon">${GENDER_INFO[g].icon}</span> <span>${GENDER_INFO[g].label}</span>`;
    btn.addEventListener('click', () => {
      gender = g;
      for (const otherG of VALID_GENDERS) {
        genderButtons[otherG].classList.toggle('active', otherG === g);
        genderButtons[otherG].setAttribute('aria-pressed', otherG === g ? 'true' : 'false');
      }
      updatePreview();
      updateValidation();
    });
    genderButtons[g] = btn;
    genderButtonsRow.appendChild(btn);
  }
  genderGroup.append(genderLabel, genderButtonsRow);
  identitySection.appendChild(genderGroup);

  formColumn.appendChild(identitySection);

  // --------------------------------------------------------------------------
  // SECTION 2 : CARACTÉRISTIQUES (18 POINTS BONUS)
  // --------------------------------------------------------------------------
  const statsSection = document.createElement('section');
  statsSection.className = 'creator-section characteristics-section';
  const statsTitleRow = document.createElement('div');
  statsTitleRow.className = 'creator-section-header-row';
  const statsTitle = document.createElement('h2');
  statsTitle.textContent = '2. Talents & Caractéristiques';

  const poolBadge = document.createElement('div');
  poolBadge.className = 'creator-pool-badge';
  poolBadge.id = 'bonus-counter-badge';
  poolBadge.innerHTML = `Points bonus : <strong id="bonus-counter">${TOTAL_BONUS_POINTS}</strong> / ${TOTAL_BONUS_POINTS}`;
  statsTitleRow.append(statsTitle, poolBadge);
  statsSection.appendChild(statsTitleRow);

  const statsNotice = document.createElement('p');
  statsNotice.className = 'creator-section-desc';
  statsNotice.textContent =
    'Distribue l’intégralité de tes 18 points bonus entre tes 6 caractéristiques pour équilibrer ou spécialiser Camille.';
  statsSection.appendChild(statsNotice);

  // Raccourcis : Répartition équitable / Réinitialiser
  const shortcutsRow = document.createElement('div');
  shortcutsRow.className = 'creator-shortcuts-row';
  const autoEquitableBtn = document.createElement('button');
  autoEquitableBtn.type = 'button';
  autoEquitableBtn.className = 'creator-small-btn';
  autoEquitableBtn.textContent = '⚖️ Répartir équitablement (+3 partout)';
  autoEquitableBtn.addEventListener('click', () => {
    for (const key of CHARACTERISTIC_KEYS) {
      bonusPoints[key] = 3;
    }
    refreshStatRows();
    updatePreview();
    updateValidation();
  });

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'creator-small-btn';
  resetBtn.textContent = '↺ Réinitialiser';
  resetBtn.addEventListener('click', () => {
    for (const key of CHARACTERISTIC_KEYS) {
      bonusPoints[key] = 0;
    }
    refreshStatRows();
    updatePreview();
    updateValidation();
  });
  shortcutsRow.append(autoEquitableBtn, resetBtn);
  statsSection.appendChild(shortcutsRow);

  // Lignes de caractéristiques
  const statsList = document.createElement('div');
  statsList.className = 'creator-stats-list';

  interface StatRowElements {
    decBtn: HTMLButtonElement;
    incBtn: HTMLButtonElement;
    bonusDisplay: HTMLElement;
    totalDisplay: HTMLElement;
    barFill: HTMLElement;
  }
  const statElements: Partial<Record<keyof Characteristics, StatRowElements>> = {};

  for (const key of CHARACTERISTIC_KEYS) {
    const info = CHARACTERISTIC_LABELS[key];
    const baseVal = BASE_CHARACTERISTICS[key];

    const row = document.createElement('div');
    row.className = 'creator-stat-row';

    const infoCol = document.createElement('div');
    infoCol.className = 'stat-info-col';
    const labelRow = document.createElement('div');
    labelRow.className = 'stat-label-row';
    labelRow.innerHTML = `<span class="stat-icon">${info.icon}</span> <strong>${info.label}</strong>`;
    const desc = document.createElement('small');
    desc.className = 'stat-desc';
    desc.textContent = info.description;
    infoCol.append(labelRow, desc);

    const controlsCol = document.createElement('div');
    controlsCol.className = 'stat-controls-col';

    const decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.className = 'stat-step-btn dec-btn';
    decBtn.textContent = '−';
    decBtn.setAttribute('aria-label', `Diminuer ${info.label}`);

    const bonusDisplay = document.createElement('span');
    bonusDisplay.className = 'stat-bonus-badge';
    bonusDisplay.textContent = '+0';

    const incBtn = document.createElement('button');
    incBtn.type = 'button';
    incBtn.className = 'stat-step-btn inc-btn';
    incBtn.textContent = '+';
    incBtn.setAttribute('aria-label', `Augmenter ${info.label}`);

    const totalDisplay = document.createElement('span');
    totalDisplay.className = 'stat-total-display';
    totalDisplay.textContent = `${baseVal}`;

    const barContainer = document.createElement('div');
    barContainer.className = 'stat-bar-container';
    const barFill = document.createElement('div');
    barFill.className = 'stat-bar-fill';
    barFill.style.width = `${baseVal}%`;
    barContainer.appendChild(barFill);

    decBtn.addEventListener('click', () => {
      if (bonusPoints[key] > 0) {
        bonusPoints[key]--;
        refreshStatRows();
        updatePreview();
        updateValidation();
      }
    });

    incBtn.addEventListener('click', () => {
      const alloc = validateCharacteristicsAllocation(bonusPoints);
      if (alloc.remainingPoints > 0 && baseVal + bonusPoints[key] < CHARACTERISTIC_MAX) {
        bonusPoints[key]++;
        refreshStatRows();
        updatePreview();
        updateValidation();
      }
    });

    controlsCol.append(decBtn, bonusDisplay, incBtn, totalDisplay);
    row.append(infoCol, controlsCol, barContainer);
    statsList.appendChild(row);

    statElements[key] = {
      decBtn,
      incBtn,
      bonusDisplay,
      totalDisplay,
      barFill,
    };
  }
  statsSection.appendChild(statsList);
  formColumn.appendChild(statsSection);

  // --------------------------------------------------------------------------
  // SECTION 3 : APPARENCE & STYLE
  // --------------------------------------------------------------------------
  const appearanceSection = document.createElement('section');
  appearanceSection.className = 'creator-section appearance-section';
  const appTitle = document.createElement('h2');
  appTitle.textContent = '3. Apparence & Style';
  appearanceSection.appendChild(appTitle);

  // Éditeur approfondi (corps, visage, cheveux, tenue, accessoires) : partagé avec l'armoire.
  const editor = buildAppearanceEditor(appearance, {
    age: 12,
    tier: 1,
    onChange: (next) => {
      appearance = next;
      updatePreview();
    },
  });
  appearanceSection.appendChild(editor.root);

  formColumn.appendChild(appearanceSection);
  bodyGrid.appendChild(formColumn);

  // --------------------------------------------------------------------------
  // COLONNE 2 : CARTE D'APERÇU EN DIRECT (PREVIEW CARD)
  // --------------------------------------------------------------------------
  const previewColumn = document.createElement('aside');
  previewColumn.className = 'creator-preview-col';

  const previewCard = document.createElement('div');
  previewCard.className = 'creator-preview-card';
  previewCard.setAttribute('aria-label', 'Aperçu du personnage');

  // Avatar stylisé avec Sprite Canvas pixel-art en direct
  const avatarBox = document.createElement('div');
  avatarBox.className = 'preview-avatar-box';
  avatarBox.id = 'preview-avatar';
  avatarBox.style.cssText = 'width:84px;height:96px;margin:0 auto 0.75rem auto;border-radius:8px;border:3px solid #3c2a20;display:flex;align-items:center;justify-content:center;background:#fff;overflow:hidden;box-shadow:0 3px 6px rgba(0,0,0,0.1);';

  const avatarCanvas = document.createElement('canvas');
  avatarCanvas.width = 64;
  avatarCanvas.height = 88;
  avatarCanvas.style.cssText = 'image-rendering:pixelated;width:64px;height:88px;';
  avatarBox.appendChild(avatarCanvas);
  const preview3d = createAvatarPreview(240, 300);
  if (preview3d) {
    // Le vrai personnage du jeu, qui tourne ; on le fait pivoter en glissant.
    avatarBox.replaceChildren(preview3d.canvas);
    avatarBox.style.cssText = 'margin:0 auto 0.75rem auto;max-width:240px;';
  }
  previewCard.appendChild(avatarBox);

  // Nom complet & Genre
  const previewName = document.createElement('h3');
  previewName.className = 'preview-player-name';
  previewName.id = 'preview-fullname';
  previewName.textContent = 'Camille Dupont';

  const previewMeta = document.createElement('p');
  previewMeta.className = 'preview-player-meta';
  previewMeta.id = 'preview-meta';
  previewMeta.textContent = 'Non-binaire • 12 ans • Val-Ferrand';

  const previewLookSummary = document.createElement('p');
  previewLookSummary.className = 'preview-look-summary';
  previewLookSummary.id = 'preview-look';

  previewCard.append(previewName, previewMeta, previewLookSummary);

  // Mini récapitulatif des caractéristiques
  const previewStatsBox = document.createElement('div');
  previewStatsBox.className = 'preview-stats-box';
  const previewStatsTitle = document.createElement('h4');
  previewStatsTitle.textContent = 'Profil initial';
  previewStatsBox.appendChild(previewStatsTitle);

  const previewStatsGrid = document.createElement('div');
  previewStatsGrid.className = 'preview-stats-grid';
  previewStatsGrid.id = 'preview-stats-grid';
  previewStatsBox.appendChild(previewStatsGrid);
  previewCard.appendChild(previewStatsBox);

  // État de validation / Message d'alerte
  const validationAlert = document.createElement('div');
  validationAlert.className = 'creator-validation-alert';
  validationAlert.id = 'creator-validation-alert';
  previewCard.appendChild(validationAlert);

  // Boutons d'action
  const actionButtonsGroup = document.createElement('div');
  actionButtonsGroup.className = 'creator-actions-group';

  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.className = 'start-button primary creator-submit-btn';
  submitButton.id = 'creator-submit-btn';
  submitButton.textContent = 'Valider et Commencer l’Aventure';
  submitButton.disabled = true;

  submitButton.addEventListener('click', () => {
    const idValidation = validateIdentity(fnInput.value, lnInput.value, gender);
    const allocValidation = validateCharacteristicsAllocation(bonusPoints);

    if (!idValidation.valid || !allocValidation.valid) {
      updateValidation();
      return;
    }

    const customization: PlayerCustomization = {
      firstName: idValidation.sanitized.firstName,
      lastName: idValidation.sanitized.lastName,
      gender: idValidation.sanitized.gender,
      characteristics: allocValidation.finalCharacteristics,
      appearance: { ...appearance },
    };

    onComplete(customization);
  });
  actionButtonsGroup.appendChild(submitButton);

  if (onCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'start-button creator-cancel-btn';
    cancelBtn.textContent = '← Retour au menu';
    cancelBtn.addEventListener('click', onCancel);
    actionButtonsGroup.appendChild(cancelBtn);
  }

  previewCard.appendChild(actionButtonsGroup);
  previewColumn.appendChild(previewCard);
  bodyGrid.appendChild(previewColumn);

  container.appendChild(bodyGrid);
  // La page ne défile pas (body en overflow: hidden pour le jeu) : la fiche a son propre défilement.
  const scroller = document.createElement('div');
  scroller.className = 'creator-scroll';
  scroller.appendChild(container);
  root.appendChild(scroller);

  // --------------------------------------------------------------------------
  // LOGIQUE DE MISE À JOUR RÉACTIVE
  // --------------------------------------------------------------------------

  function refreshStatRows(): void {
    const alloc = validateCharacteristicsAllocation(bonusPoints);
    const counterElem = document.getElementById('bonus-counter');
    if (counterElem) {
      counterElem.textContent = `${alloc.remainingPoints}`;
      const badge = document.getElementById('bonus-counter-badge');
      if (badge) {
        badge.classList.toggle('complete', alloc.remainingPoints === 0);
        badge.classList.toggle('invalid', alloc.remainingPoints < 0);
      }
    }

    for (const key of CHARACTERISTIC_KEYS) {
      const el = statElements[key];
      if (!el) continue;
      const baseVal = BASE_CHARACTERISTICS[key];
      const bonus = bonusPoints[key];
      const total = baseVal + bonus;

      el.bonusDisplay.textContent = `+${bonus}`;
      el.bonusDisplay.classList.toggle('has-bonus', bonus > 0);
      el.totalDisplay.textContent = `${total}`;
      el.barFill.style.width = `${Math.min(100, total)}%`;

      el.decBtn.disabled = bonus <= 0;
      el.incBtn.disabled = alloc.remainingPoints <= 0 || total >= CHARACTERISTIC_MAX;
    }
  }

  function updatePreview(): void {
    const curFn = fnInput.value.trim() || 'Camille';
    const curLn = lnInput.value.trim();
    const fullName = [curFn, curLn].filter(Boolean).join(' ');

    const nameEl = document.getElementById('preview-fullname');
    if (nameEl) nameEl.textContent = fullName;

    const initialsEl = document.getElementById('preview-initials');
    if (initialsEl) {
      const inits = (curFn[0] ?? 'C') + (curLn ? curLn[0] : '');
      initialsEl.textContent = inits.toUpperCase();
    }

    const lookEl = document.getElementById('preview-look');
    if (lookEl) {
      lookEl.textContent = `Tenue ${OUTFIT_STYLE_INFO[appearance.outfitStyle].label.toLowerCase()} ${OUTFIT_COLOR_INFO[appearance.outfitColor].label.toLowerCase()}, cheveux ${HAIR_COLOR_INFO[appearance.hairColor].label.toLowerCase()}s ${HAIR_STYLE_INFO[appearance.hairStyle].label.toLowerCase()}s.`;
    }

    // Rendu dynamique du sprite pixel-art sur le mini Canvas
    preview3d?.setAppearance(appearance, gender, 1.52);
    const avatarBoxEl = document.getElementById('preview-avatar');
    if (avatarBoxEl) {
      avatarBoxEl.style.borderColor = OUTFIT_COLOR_INFO[appearance.outfitColor].hex;
      const cvs = avatarBoxEl.querySelector('canvas');
      if (cvs) {
        const cCtx = cvs.getContext('2d');
        if (cCtx) {
          cCtx.clearRect(0, 0, cvs.width, cvs.height);
          drawCamille(
            cCtx,
            cvs.width / 2,
            cvs.height - 12,
            3,
            '12',
            0,
            false,
            appearance
          );
        }
      }
    }

    const gridEl = document.getElementById('preview-stats-grid');
    if (gridEl) {
      gridEl.innerHTML = '';
      for (const key of CHARACTERISTIC_KEYS) {
        const item = document.createElement('div');
        item.className = 'preview-stat-item';
        const total = BASE_CHARACTERISTICS[key] + bonusPoints[key];
        item.innerHTML = `<span class="stat-badge-icon">${CHARACTERISTIC_LABELS[key].icon}</span> <span class="stat-badge-name">${CHARACTERISTIC_LABELS[key].label}</span> <strong class="stat-badge-val">${total}</strong>`;
        gridEl.appendChild(item);
      }
    }
  }

  function updateValidation(): void {
    const idRes = validateIdentity(fnInput.value, lnInput.value, gender);
    const allocRes = validateCharacteristicsAllocation(bonusPoints);

    const alertEl = document.getElementById('creator-validation-alert');
    if (!alertEl) return;

    if (!idRes.valid) {
      alertEl.textContent = idRes.errors[0] ?? 'Identité incomplète.';
      alertEl.className = 'creator-validation-alert error';
      submitButton.disabled = true;
    } else if (allocRes.remainingPoints > 0) {
      alertEl.textContent = `Il te reste encore ${allocRes.remainingPoints} point(s) bonus à attribuer.`;
      alertEl.className = 'creator-validation-alert warning';
      submitButton.disabled = true;
    } else if (allocRes.remainingPoints < 0) {
      alertEl.textContent = `Tu as alloué trop de points (${allocRes.totalAllocated} / ${TOTAL_BONUS_POINTS}).`;
      alertEl.className = 'creator-validation-alert error';
      submitButton.disabled = true;
    } else {
      alertEl.textContent = '✓ Personnage prêt pour la rentrée !';
      alertEl.className = 'creator-validation-alert success';
      submitButton.disabled = false;
    }
  }

  // Écouteurs d'événements sur les inputs texte
  fnInput.addEventListener('input', () => {
    updatePreview();
    updateValidation();
  });
  lnInput.addEventListener('input', () => {
    updatePreview();
    updateValidation();
  });

  // Premier rendu initial
  refreshStatRows();
  updatePreview();
  updateValidation();

  return container;
}

/**
 * Injecte dynamiquement les feuilles de style de l'écran de création si absentes.
 */
function ensureCreatorStyles(): void {
  if (document.getElementById('character-creator-styles')) return;

  const style = document.createElement('style');
  style.id = 'character-creator-styles';
  style.textContent = `
    .creator-scroll {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .character-creator {
      max-width: 1040px;
      margin: 1.5rem auto;
      padding: 1.5rem;
      background: #fbf8f2;
      border: 2px solid #3c2a20;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(42, 26, 20, 0.15);
      font-family: inherit;
      color: #2a1a14;
    }
    .creator-header {
      border-bottom: 2px solid #e2d9cb;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .creator-eyebrow {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #a85a3a;
      margin: 0 0 0.25rem 0;
    }
    .creator-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      color: #2a1a14;
    }
    .creator-subtitle {
      margin: 0;
      color: #5d4a40;
      font-size: 0.95rem;
    }
    .creator-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 860px) {
      .creator-grid {
        grid-template-columns: 1fr;
      }
    }
    .creator-preview-col {
      position: sticky;
      top: 1rem;
    }
    @media (max-width: 860px) {
      .creator-preview-col { position: static; }
    }
    .creator-form-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .creator-section {
      background: #fff;
      border: 1px solid #dcd3c4;
      border-radius: 6px;
      padding: 1.25rem;
    }
    .creator-section h2 {
      margin: 0 0 0.75rem 0;
      font-size: 1.2rem;
      color: #3c2a20;
    }
    .creator-section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .creator-section-desc {
      margin: 0 0 1rem 0;
      font-size: 0.85rem;
      color: #6a594d;
    }
    .creator-pool-badge {
      background: #eee5d7;
      border: 1px solid #c9bda9;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .creator-pool-badge.complete {
      background: #e1f5e8;
      border-color: #78c692;
      color: #1e6b36;
    }
    .creator-pool-badge.invalid {
      background: #fde8e8;
      border-color: #e88c8c;
      color: #9c2424;
    }
    .creator-fields-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .creator-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }
    .creator-input-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #403026;
    }
    .creator-input-group input[type="text"] {
      padding: 0.5rem 0.65rem;
      border: 1px solid #b7a996;
      border-radius: 4px;
      font-size: 0.95rem;
      background: #faf8f5;
      color: #2a1a14;
    }
    .creator-input-group input[type="text"]:focus {
      outline: 2px solid #f48c5d;
      border-color: #f48c5d;
    }
    .creator-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .creator-pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid #c0b29e;
      border-radius: 4px;
      background: #fdfcf9;
      cursor: pointer;
      font-size: 0.85rem;
      color: #3a2a20;
      transition: all 0.15s ease;
    }
    .creator-pill-btn:hover {
      background: #f4ebe0;
      border-color: #8f7966;
    }
    .creator-pill-btn.active {
      background: #3c2a20;
      color: #fff;
      border-color: #3c2a20;
      font-weight: 600;
    }
    .creator-swatches-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .creator-swatch-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.6rem;
      border: 1px solid #c0b29e;
      border-radius: 4px;
      background: #fdfcf9;
      cursor: pointer;
      font-size: 0.8rem;
      color: #3a2a20;
      transition: all 0.15s ease;
    }
    .creator-swatch-btn:hover {
      background: #f4ebe0;
    }
    .creator-swatch-btn.active {
      border: 2px solid #2a1a14;
      background: #f3ece4;
      font-weight: 700;
    }
    .swatch-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.25);
      display: inline-block;
    }
    .creator-shortcuts-row {
      display: flex;
      gap: 0.6rem;
      margin-bottom: 1rem;
    }
    .creator-small-btn {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      border: 1px dashed #a49480;
      border-radius: 4px;
      background: #faf6f0;
      cursor: pointer;
      color: #4c3b31;
    }
    .creator-small-btn:hover {
      background: #efe6da;
      border-style: solid;
    }
    .creator-stats-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .creator-stat-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0eae1;
    }
    .stat-bar-container {
      grid-column: 1 / -1;
      height: 6px;
      background: #e9e1d5;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.15rem;
    }
    .stat-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #f48c5d, #3a6ca8);
      transition: width 0.2s ease;
    }
    .stat-label-row {
      font-size: 0.95rem;
    }
    .stat-desc {
      display: block;
      color: #7b6b60;
      font-size: 0.75rem;
    }
    .stat-controls-col {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .stat-step-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #b8a896;
      border-radius: 4px;
      background: #fbf9f6;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      color: #3c2a20;
    }
    .stat-step-btn:hover:not(:disabled) {
      background: #f4ebe0;
      border-color: #5c4333;
    }
    .stat-step-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .stat-bonus-badge {
      min-width: 32px;
      text-align: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: #7b6b60;
    }
    .stat-bonus-badge.has-bonus {
      color: #2b7a42;
    }
    .stat-total-display {
      min-width: 32px;
      text-align: right;
      font-weight: 800;
      font-size: 1rem;
      color: #2a1a14;
    }
    .creator-preview-card {
      background: #fff;
      border: 2px solid #3c2a20;
      border-radius: 6px;
      padding: 1.25rem;
      position: sticky;
      top: 1rem;
      box-shadow: 0 4px 12px rgba(42, 26, 20, 0.08);
    }
    .preview-avatar-box {
      width: 72px;
      height: 72px;
      margin: 0 auto 0.75rem auto;
      border-radius: 50%;
      border: 3px solid #3c2a20;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 800;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    .preview-player-name {
      text-align: center;
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      color: #2a1a14;
    }
    .preview-player-meta {
      text-align: center;
      margin: 0 0 0.75rem 0;
      font-size: 0.8rem;
      color: #7b6b60;
    }
    .preview-look-summary {
      font-size: 0.8rem;
      color: #5c4333;
      background: #faf6f0;
      border-left: 3px solid #f48c5d;
      padding: 0.5rem 0.65rem;
      margin: 0 0 1rem 0;
      border-radius: 0 4px 4px 0;
    }
    .preview-stats-box h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #7b6b60;
    }
    .preview-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .preview-stat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fbf9f6;
      border: 1px solid #eee5d7;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .stat-badge-name {
      color: #5c4333;
    }
    .stat-badge-val {
      font-weight: 700;
      color: #2a1a14;
    }
    .creator-validation-alert {
      padding: 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      text-align: center;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .creator-validation-alert.warning {
      background: #fff8e6;
      border: 1px solid #ebd492;
      color: #8c6914;
    }
    .creator-validation-alert.error {
      background: #fde8e8;
      border: 1px solid #e88c8c;
      color: #9c2424;
    }
    .creator-validation-alert.success {
      background: #e7f7ed;
      border: 1px solid #85d7a0;
      color: #176630;
    }
    .creator-actions-group {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .creator-submit-btn {
      width: 100%;
      padding: 0.85rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
    }
    .creator-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .creator-cancel-btn {
      width: 100%;
      padding: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}
