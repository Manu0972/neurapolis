/**
 * Parametric SVG Anatomy & Facial Architecture Renderer.
 * Generates dynamic vector graphics reacting in real-time to morphometric sliders.
 */

/**
 * Generates an SVG Full Body Mannequin reacting to morphology sliders.
 * @param {Object} char Character parameters
 * @param {'front'|'profile'} view
 * @returns {string} SVG string
 */
export function renderBodyMannequin(char, view = 'front') {
  const {
    gender = 'male',
    heightCm = 180,
    whr = 0.75,
    vTaper = 1.45,
    muscularity = 0.65,
    galbe = 0.50,
    vascularity = 0.30,
    bustVolume = 0.40,
    colors = {
      skin: '#fbebe0',
      accent: '#00e5ff',
      primary: '#0f111a',
      eyes: '#00f0ff'
    }
  } = char;

  const cx = 200;
  // Height scale: 150cm -> 0.90, 210cm -> 1.08
  const hScale = Math.min(1.10, Math.max(0.88, heightCm / 180));

  // Morphometric widths
  const shoulderW = Math.round(52 * (vTaper / 1.45)); // 36 to 65
  const hipW = gender === 'female' ? Math.round(44 * (1 + (galbe - 0.5) * 0.35)) : 38;
  const waistW = Math.round(hipW * whr); // computed directly from WHR!
  const chestW = Math.round(shoulderW * 0.92);
  const thighW = Math.round((hipW * 0.48) + (muscularity * 8));
  const calfW = Math.round(14 + (muscularity * 6));

  // Head and torso coordinates (scaled by height)
  const headY = 48;
  const headR = 24;
  const neckY = headY + headR;
  const clavicleY = Math.round(neckY + 18 * hScale);
  const chestY = Math.round(clavicleY + 45 * hScale);
  const waistY = Math.round(chestY + 58 * hScale);
  const hipY = Math.round(waistY + 48 * hScale);
  const crotchY = Math.round(hipY + 28 * hScale);
  const kneeY = Math.round(crotchY + 160 * hScale);
  const ankleY = Math.round(kneeY + 165 * hScale);
  const footY = Math.round(ankleY + 20 * hScale);

  if (view === 'profile') {
    // SAGITTAL / PROFILE VIEW
    const chestProj = Math.round(cx + 25 + bustVolume * 24);
    const lumbarCurve = Math.round(cx - 18 - (galbe * 8));
    const gluteProj = Math.round(cx - 24 - (galbe * 28)); // Galbe directly determines posterior projection!

    const profilePath = `
      M ${cx} ${headY - headR}
      Q ${cx + 18} ${headY} ${cx + 6} ${headY + headR}
      L ${cx + 8} ${clavicleY}
      Q ${chestProj} ${chestY} ${cx + 12} ${waistY}
      Q ${cx + 18} ${hipY} ${cx + 10} ${crotchY}
      L ${cx + 8} ${kneeY}
      L ${cx + 4} ${ankleY}
      L ${cx + 24} ${footY}
      L ${cx - 14} ${footY}
      L ${cx - 6} ${ankleY}
      L ${cx - 12} ${kneeY}
      Q ${cx - 20} ${crotchY} ${gluteProj} ${hipY}
      Q ${lumbarCurve} ${waistY} ${cx - 16} ${chestY}
      Q ${cx - 14} ${clavicleY} ${cx - 6} ${neckY}
      Z
    `;

    return `
      <svg viewBox="0 0 400 700" class="mannequin-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skinGradProfile" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${colors.skin}" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0.25"/>
          </linearGradient>
          <filter id="glowProf" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <!-- Background grid lines -->
        <g stroke="rgba(255,255,255,0.05)" stroke-width="1">
          <line x1="40" y1="${clavicleY}" x2="360" y2="${clavicleY}"/>
          <line x1="40" y1="${chestY}" x2="360" y2="${chestY}"/>
          <line x1="40" y1="${waistY}" x2="360" y2="${waistY}"/>
          <line x1="40" y1="${hipY}" x2="360" y2="${hipY}"/>
          <line x1="40" y1="${kneeY}" x2="360" y2="${kneeY}"/>
        </g>

        <!-- Profile Silhouette -->
        <path d="${profilePath}" fill="url(#skinGradProfile)" stroke="${colors.accent}" stroke-width="2.5" />

        <!-- Sagittal landmarks -->
        <circle cx="${gluteProj}" cy="${hipY}" r="4" fill="${colors.accent}" filter="url(#glowProf)"/>
        <text x="${gluteProj - 12}" y="${hipY + 4}" fill="${colors.accent}" font-size="10" text-anchor="end" font-family="monospace">GALBE ${(galbe * 100).toFixed(0)}%</text>

        <circle cx="${chestProj}" cy="${chestY}" r="4" fill="${colors.accent}" filter="url(#glowProf)"/>
        <text x="${chestProj + 12}" y="${chestY + 4}" fill="${colors.accent}" font-size="10" text-anchor="start" font-family="monospace">BUST ${(bustVolume * 100).toFixed(0)}%</text>

        <!-- Height marker -->
        <line x1="370" y1="${headY - headR}" x2="370" y2="${footY}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="375" y="${(headY + footY) / 2}" fill="#94a3b8" font-size="11" font-family="monospace" transform="rotate(90 375 ${(headY + footY) / 2})">${heightCm} CM</text>
      </svg>
    `;
  }

  // ANTERIOR / FRONT VIEW
  // Construct body outline points
  const leftShoulderX = cx - shoulderW;
  const rightShoulderX = cx + shoulderW;
  const leftChestX = cx - chestW;
  const rightChestX = cx + chestW;
  const leftWaistX = cx - waistW;
  const rightWaistX = cx + waistW;
  const leftHipX = cx - hipW;
  const rightHipX = cx + hipW;

  // Arms coordinates
  const elbowY = Math.round(waistY);
  const wristY = Math.round(hipY + 15);
  const armWidth = Math.round(12 + muscularity * 10);

  // Muscle rendering flags
  const showAbs = muscularity >= 0.40;
  const showVascular = vascularity >= 0.40;

  return `
    <svg viewBox="0 0 400 700" class="mannequin-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodySkinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${colors.skin}" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="${colors.skin}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#1e293b" stop-opacity="0.90"/>
        </linearGradient>
        <linearGradient id="accentGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.accent}"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Grid lines -->
      <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
        <line x1="20" y1="${clavicleY}" x2="380" y2="${clavicleY}"/>
        <line x1="20" y1="${chestY}" x2="380" y2="${chestY}"/>
        <line x1="20" y1="${waistY}" x2="380" y2="${waistY}"/>
        <line x1="20" y1="${hipY}" x2="380" y2="${hipY}"/>
        <line x1="20" y1="${kneeY}" x2="380" y2="${kneeY}"/>
        <line x1="${cx}" y1="20" x2="${cx}" y2="680" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4"/>
      </g>

      <!-- HEAD -->
      <ellipse cx="${cx}" cy="${headY}" rx="${headR * 0.85}" ry="${headR}" fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="2"/>
      <!-- Neck -->
      <path d="M ${cx - 10} ${headY + headR - 2} L ${cx - 12} ${clavicleY} L ${cx + 12} ${clavicleY} L ${cx + 10} ${headY + headR - 2} Z" fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="1.5"/>

      <!-- TORSO -->
      <path d="
        M ${cx - 12} ${clavicleY}
        Q ${leftShoulderX + 10} ${clavicleY - 2} ${leftShoulderX} ${clavicleY + 12}
        Q ${leftChestX} ${chestY} ${leftWaistX} ${waistY}
        Q ${leftHipX} ${hipY} ${cx - 20} ${crotchY}
        L ${cx} ${crotchY - 8}
        L ${cx + 20} ${crotchY}
        Q ${rightHipX} ${hipY} ${rightWaistX} ${waistY}
        Q ${rightChestX} ${chestY} ${rightShoulderX} ${clavicleY + 12}
        Q ${rightShoulderX - 10} ${clavicleY - 2} ${cx + 12} ${clavicleY}
        Z
      " fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="2"/>

      <!-- PECTORAL / CHEST CONTOURS -->
      <g stroke="${colors.accent}" stroke-width="1.2" opacity="${0.4 + muscularity * 0.5}" fill="none">
        <!-- Left pec -->
        <path d="M ${cx - 4} ${chestY} Q ${cx - chestW * 0.5} ${chestY + 10 + bustVolume * 10} ${leftChestX + 6} ${chestY - 6}"/>
        <!-- Right pec -->
        <path d="M ${cx + 4} ${chestY} Q ${cx + chestW * 0.5} ${chestY + 10 + bustVolume * 10} ${rightChestX - 6} ${chestY - 6}"/>
        <!-- Sternal line -->
        <line x1="${cx}" y1="${clavicleY + 8}" x2="${cx}" y2="${waistY - 10}"/>
      </g>

      <!-- RECTUS ABDOMINIS (ABS & SERRATUS) -->
      ${showAbs ? `
      <g stroke="${colors.accent}" stroke-width="1.2" opacity="${muscularity * 0.85}" fill="none">
        <!-- Top pack -->
        <rect x="${cx - 14}" y="${chestY + 14}" width="12" height="12" rx="2"/>
        <rect x="${cx + 2}" y="${chestY + 14}" width="12" height="12" rx="2"/>
        <!-- Mid pack -->
        <rect x="${cx - 15}" y="${chestY + 30}" width="13" height="13" rx="2"/>
        <rect x="${cx + 2}" y="${chestY + 30}" width="13" height="13" rx="2"/>
        <!-- Lower pack -->
        <rect x="${cx - 14}" y="${chestY + 46}" width="12" height="13" rx="2"/>
        <rect x="${cx + 2}" y="${chestY + 46}" width="12" height="13" rx="2"/>
        <!-- Serratus Anterior Cuts -->
        <path d="M ${leftChestX + 8} ${chestY + 18} L ${leftWaistX + 6} ${chestY + 24}"/>
        <path d="M ${leftChestX + 6} ${chestY + 30} L ${leftWaistX + 5} ${chestY + 36}"/>
        <path d="M ${rightChestX - 8} ${chestY + 18} L ${rightWaistX - 6} ${chestY + 24}"/>
        <path d="M ${rightChestX - 6} ${chestY + 30} L ${rightWaistX - 5} ${chestY + 36}"/>
        <!-- Adonis belt / iliac crest -->
        <path d="M ${leftWaistX + 4} ${waistY + 10} Q ${cx - 10} ${crotchY - 14} ${cx} ${crotchY - 10}"/>
        <path d="M ${rightWaistX - 4} ${waistY + 10} Q ${cx + 10} ${crotchY - 14} ${cx} ${crotchY - 10}"/>
      </g>
      ` : ''}

      <!-- ARMS -->
      <!-- Left Arm -->
      <path d="
        M ${leftShoulderX} ${clavicleY + 12}
        L ${leftShoulderX - armWidth} ${elbowY}
        L ${leftShoulderX - armWidth + 2} ${wristY}
        L ${leftShoulderX - 2} ${wristY}
        L ${leftShoulderX + 2} ${elbowY}
        L ${leftChestX} ${chestY}
        Z
      " fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="1.8"/>

      <!-- Right Arm -->
      <path d="
        M ${rightShoulderX} ${clavicleY + 12}
        L ${rightShoulderX + armWidth} ${elbowY}
        L ${rightShoulderX + armWidth - 2} ${wristY}
        L ${rightShoulderX + 2} ${wristY}
        L ${rightShoulderX - 2} ${elbowY}
        L ${rightChestX} ${chestY}
        Z
      " fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="1.8"/>

      <!-- VASCULARITY NETWORK (Forearm Veins) -->
      ${showVascular ? `
      <g stroke="${colors.accent}" stroke-width="1" opacity="${vascularity * 0.9}" fill="none" filter="url(#neonGlow)">
        <!-- Left forearm vein -->
        <path d="M ${leftShoulderX - 4} ${elbowY + 10} Q ${leftShoulderX - 10} ${elbowY + 25} ${leftShoulderX - 5} ${wristY - 4}"/>
        <path d="M ${leftShoulderX - 8} ${elbowY + 18} L ${leftShoulderX - 2} ${elbowY + 30}"/>
        <!-- Right forearm vein -->
        <path d="M ${rightShoulderX + 4} ${elbowY + 10} Q ${rightShoulderX + 10} ${elbowY + 25} ${rightShoulderX + 5} ${wristY - 4}"/>
        <path d="M ${rightShoulderX + 8} ${elbowY + 18} L ${rightShoulderX + 2} ${elbowY + 30}"/>
      </g>
      ` : ''}

      <!-- LEGS -->
      <!-- Left Leg -->
      <path d="
        M ${cx - 20} ${crotchY}
        Q ${leftHipX - 2} ${crotchY + 30} ${cx - thighW} ${kneeY}
        L ${cx - calfW} ${ankleY}
        L ${cx - 18} ${footY}
        L ${cx - 6} ${footY}
        L ${cx - 4} ${ankleY}
        L ${cx - 6} ${kneeY}
        L ${cx - 3} ${crotchY}
        Z
      " fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="2"/>

      <!-- Right Leg -->
      <path d="
        M ${cx + 20} ${crotchY}
        Q ${rightHipX + 2} ${crotchY + 30} ${cx + thighW} ${kneeY}
        L ${cx + calfW} ${ankleY}
        L ${cx + 18} ${footY}
        L ${cx + 6} ${footY}
        L ${cx + 4} ${ankleY}
        L ${cx + 6} ${kneeY}
        L ${cx + 3} ${crotchY}
        Z
      " fill="url(#bodySkinGrad)" stroke="${colors.accent}" stroke-width="2"/>

      <!-- Vastus Medialis (Teardrop Quad Definition) -->
      ${muscularity >= 0.50 ? `
      <g stroke="${colors.accent}" stroke-width="1" opacity="${muscularity * 0.7}" fill="none">
        <path d="M ${cx - 10} ${kneeY - 24} Q ${cx - 8} ${kneeY - 10} ${cx - 16} ${kneeY - 4}"/>
        <path d="M ${cx + 10} ${kneeY - 24} Q ${cx + 8} ${kneeY - 10} ${cx + 16} ${kneeY - 4}"/>
      </g>
      ` : ''}

      <!-- DIMENSION CALLOUT LABELS -->
      <g fill="#94a3b8" font-family="monospace" font-size="10">
        <!-- V-Taper Clavicle Width -->
        <line x1="${leftShoulderX}" y1="${clavicleY - 12}" x2="${rightShoulderX}" y2="${clavicleY - 12}" stroke="${colors.accent}" stroke-width="1"/>
        <text x="${cx}" y="${clavicleY - 16}" fill="${colors.accent}" text-anchor="middle">V-TAPER ${vTaper.toFixed(2)}</text>

        <!-- Waist Width -->
        <line x1="${leftWaistX}" y1="${waistY}" x2="${rightWaistX}" y2="${waistY}" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="${rightWaistX + 8}" y="${waistY + 3}" fill="#cbd5e1" text-anchor="start">WHR ${whr.toFixed(2)}</text>

        <!-- Muscle Tag -->
        <text x="24" y="660" fill="${colors.accent}" font-size="11" font-weight="bold">DEF: ${(muscularity * 100).toFixed(0)}%</text>
        <text x="376" y="660" fill="#94a3b8" text-anchor="end">${heightCm} CM</text>
      </g>
    </svg>
  `;
}

/**
 * Generates an SVG Facial Architecture Diagram.
 * @param {Object} char
 * @returns {string} SVG string
 */
export function renderFaceArchitecture(char) {
  const {
    gender = 'male',
    canthalTilt = 4.5,
    mandibularAngle = 118,
    facialSymmetry = 0.96,
    cheekbones = 0.70,
    colors = {
      skin: '#fbebe0',
      accent: '#00e5ff',
      eyes: '#00f0ff',
      hair: '#09090b'
    }
  } = char;

  const cx = 200;
  const cy = 200;

  // Facial thirds Y-levels
  const trichionY = 70;   // Hairline
  const glabellaY = 150;  // Brow line
  const subnasaleY = 225; // Nose base
  const mentonY = 320;    // Chin tip

  // Canthal tilt computation (Eye corners)
  const eyeY = 175;
  const eyeSpacing = 36;
  const eyeW = 32;
  // Tilt dy: positive means lateral corner is higher
  const tiltDy = Math.round(Math.tan((canthalTilt * Math.PI) / 180) * eyeW);

  // Mandibular / gonial angle computation
  // Smaller gonial angle (110°) -> wider, more square jaw (jawX further out, jawY lower)
  // Larger gonial angle (130°) -> narrower, steeper V-line
  const gonialFactor = (135 - mandibularAngle) / 25; // 0 to 1
  const jawX = Math.round(cx - 56 - gonialFactor * 16);
  const jawY = Math.round(245 + (1 - gonialFactor) * 15);
  const cheekX = Math.round(cx - 72 - cheekbones * 12);
  const cheekY = 170;

  const symOffset = (1 - facialSymmetry) * 8; // subtle asymmetry simulation

  const faceOutlinePath = `
    M ${cx} ${trichionY}
    Q ${cx + 65} ${trichionY + 30} ${cx + 72 + cheekbones * 12} ${cheekY}
    L ${2 * cx - jawX} ${jawY}
    L ${cx + 16} ${mentonY}
    L ${cx - 16} ${mentonY}
    L ${jawX + symOffset} ${jawY}
    L ${cheekX} ${cheekY}
    Q ${cx - 65} ${trichionY + 30} ${cx} ${trichionY}
    Z
  `;

  return `
    <svg viewBox="0 0 400 400" class="face-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- Background guide grid -->
      <g stroke="rgba(255,255,255,0.08)" stroke-width="1">
        <line x1="40" y1="${trichionY}" x2="360" y2="${trichionY}"/>
        <line x1="40" y1="${glabellaY}" x2="360" y2="${glabellaY}"/>
        <line x1="40" y1="${subnasaleY}" x2="360" y2="${subnasaleY}"/>
        <line x1="40" y1="${mentonY}" x2="360" y2="${mentonY}"/>
        <!-- Midline -->
        <line x1="${cx}" y1="40" x2="${cx}" y2="360" stroke="${colors.accent}" stroke-width="1.2" stroke-dasharray="3 3"/>
      </g>

      <!-- Facial Thirds Labels -->
      <g fill="#94a3b8" font-family="monospace" font-size="9" text-anchor="end">
        <text x="38" y="${(trichionY + glabellaY) / 2}">UPPER 1/3</text>
        <text x="38" y="${(glabellaY + subnasaleY) / 2}">MID 1/3</text>
        <text x="38" y="${(subnasaleY + mentonY) / 2}">LOWER 1/3</text>
      </g>

      <!-- Face Outline Shape -->
      <path d="${faceOutlinePath}" fill="rgba(30, 41, 59, 0.6)" stroke="${colors.accent}" stroke-width="2.5"/>

      <!-- Mandibular Gonial Angle Arcs -->
      <g stroke="${colors.accent}" stroke-width="1.5" fill="none">
        <circle cx="${jawX}" cy="${jawY}" r="6" fill="${colors.accent}"/>
        <circle cx="${2 * cx - jawX}" cy="${jawY}" r="6" fill="${colors.accent}"/>
      </g>
      <text x="${jawX - 10}" y="${jawY + 18}" fill="${colors.accent}" font-family="monospace" font-size="10" font-weight="bold">${mandibularAngle}°</text>
      <text x="${2 * cx - jawX + 10}" y="${jawY + 18}" fill="${colors.accent}" font-family="monospace" font-size="10" font-weight="bold">${mandibularAngle}°</text>

      <!-- Eyebrows -->
      <g stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" fill="none">
        <path d="M ${cx - eyeSpacing - eyeW} ${glabellaY} Q ${cx - eyeSpacing - eyeW / 2} ${glabellaY - 10} ${cx - 16} ${glabellaY - 2}"/>
        <path d="M ${cx + 16} ${glabellaY - 2} Q ${cx + eyeSpacing + eyeW / 2} ${glabellaY - 10} ${cx + eyeSpacing + eyeW} ${glabellaY}"/>
      </g>

      <!-- Eyes & Canthal Tilt Vectors -->
      <!-- Left Eye -->
      <g>
        <!-- Canthal axis line -->
        <line x1="${cx - eyeSpacing}" y1="${eyeY}" x2="${cx - eyeSpacing - eyeW}" y2="${eyeY - tiltDy}" stroke="${colors.accent}" stroke-width="1" stroke-dasharray="2 2"/>
        <!-- Eye contour -->
        <path d="M ${cx - eyeSpacing} ${eyeY} Q ${cx - eyeSpacing - eyeW / 2} ${eyeY - 10} ${cx - eyeSpacing - eyeW} ${eyeY - tiltDy} Q ${cx - eyeSpacing - eyeW / 2} ${eyeY + 8} ${cx - eyeSpacing} ${eyeY}" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Iris & Pupil -->
        <circle cx="${cx - eyeSpacing - eyeW / 2}" cy="${eyeY - tiltDy / 2}" r="6" fill="${colors.eyes}" filter="url(#eyeGlow)"/>
        <circle cx="${cx - eyeSpacing - eyeW / 2 + 1}" cy="${eyeY - tiltDy / 2 - 1}" r="1.5" fill="#ffffff"/>
      </g>

      <!-- Right Eye -->
      <g>
        <!-- Canthal axis line -->
        <line x1="${cx + eyeSpacing}" y1="${eyeY}" x2="${cx + eyeSpacing + eyeW}" y2="${eyeY - tiltDy}" stroke="${colors.accent}" stroke-width="1" stroke-dasharray="2 2"/>
        <!-- Eye contour -->
        <path d="M ${cx + eyeSpacing} ${eyeY} Q ${cx + eyeSpacing + eyeW / 2} ${eyeY - 10} ${cx + eyeSpacing + eyeW} ${eyeY - tiltDy} Q ${cx + eyeSpacing + eyeW / 2} ${eyeY + 8} ${cx + eyeSpacing} ${eyeY}" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Iris & Pupil -->
        <circle cx="${cx + eyeSpacing + eyeW / 2}" cy="${eyeY - tiltDy / 2}" r="6" fill="${colors.eyes}" filter="url(#eyeGlow)"/>
        <circle cx="${cx + eyeSpacing + eyeW / 2 + 1}" cy="${eyeY - tiltDy / 2 - 1}" r="1.5" fill="#ffffff"/>
      </g>

      <!-- Canthal Tilt readout badge -->
      <rect x="${cx - 45}" y="115" width="90" height="20" rx="4" fill="rgba(15,23,42,0.8)" stroke="${colors.accent}" stroke-width="1"/>
      <text x="${cx}" y="129" fill="${colors.accent}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">TILT: ${canthalTilt >= 0 ? '+' : ''}${canthalTilt.toFixed(1)}°</text>

      <!-- Nose Bridge & Tip -->
      <path d="M ${cx} ${glabellaY + 4} L ${cx - 2} ${subnasaleY - 8} Q ${cx} ${subnasaleY} ${cx + 6} ${subnasaleY - 4}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>

      <!-- Lips -->
      <path d="M ${cx - 16} ${subnasaleY + 28} Q ${cx} ${subnasaleY + 22} ${cx + 16} ${subnasaleY + 28} Q ${cx} ${subnasaleY + 36} ${cx - 16} ${subnasaleY + 28}" fill="rgba(244, 63, 94, 0.3)" stroke="#f43f5e" stroke-width="1.2"/>

      <!-- Chin Menton Point -->
      <circle cx="${cx}" cy="${mentonY}" r="3" fill="${colors.accent}"/>
      <text x="${cx}" y="${mentonY + 16}" fill="#94a3b8" font-family="monospace" font-size="9" text-anchor="middle">SYMMETRY ${(facialSymmetry * 100).toFixed(0)}%</text>
    </svg>
  `;
}

/**
 * Generates an SVG Radar Chart for Biometric Attributes.
 * @param {Array<{axis: string, value: number}>} metrics
 * @param {string} accentColor
 * @returns {string} SVG string
 */
export function renderRadarChart(metrics, accentColor = '#00e5ff') {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 95;
  const n = metrics.length;

  // Grid levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.50, 0.75, 1.0];
  const gridRings = levels.map(lvl => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(angle) * (maxR * lvl);
      const y = cy + Math.sin(angle) * (maxR * lvl);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }).join('');

  // Spoke lines
  const spokes = metrics.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR;
    const y = cy + Math.sin(angle) * maxR;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
  }).join('');

  // Value Polygon
  const polyPoints = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const valRatio = Math.max(0.1, Math.min(1.0, m.value / 100));
    const x = cx + Math.cos(angle) * (maxR * valRatio);
    const y = cy + Math.sin(angle) * (maxR * valRatio);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Nodes and labels
  const labelsAndNodes = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const valRatio = Math.max(0.1, Math.min(1.0, m.value / 100));
    const nx = cx + Math.cos(angle) * (maxR * valRatio);
    const ny = cy + Math.sin(angle) * (maxR * valRatio);

    // Label position slightly outside maxR
    const lx = cx + Math.cos(angle) * (maxR + 24);
    const ly = cy + Math.sin(angle) * (maxR + 24);

    return `
      <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="4" fill="${accentColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#cbd5e1" font-size="8.5" font-family="monospace" text-anchor="middle" dominant-baseline="middle">${m.axis.toUpperCase()}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${size} ${size}" class="radar-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.1"/>
        </radialGradient>
      </defs>
      ${gridRings}
      ${spokes}
      <polygon points="${polyPoints.join(' ')}" fill="url(#radarFillGrad)" stroke="${accentColor}" stroke-width="2"/>
      ${labelsAndNodes}
    </svg>
  `;
}
