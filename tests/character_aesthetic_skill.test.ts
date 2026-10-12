import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getRepoRoot(): string {
  let cur = process.cwd();
  while (cur.length > 3) {
    if (fs.existsSync(path.join(cur, '.agents', 'skills', 'character-aesthetic-engineering', 'SKILL.md'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return 'C:\\Users\\laqui\\Documents\\glm';
}

describe('Character Aesthetic Engineering Skill Verification', () => {
  const rootDir = getRepoRoot();
  const skillDir = path.join(rootDir, '.agents', 'skills', 'character-aesthetic-engineering');
  const skillFile = path.join(skillDir, 'SKILL.md');
  const refDir = path.join(skillDir, 'references');

  it('SKILL.md exists and contains valid YAML frontmatter', () => {
    expect(fs.existsSync(skillFile)).toBe(true);
    const content = fs.readFileSync(skillFile, 'utf-8');
    
    // Frontmatter check
    expect(content.startsWith('---')).toBe(true);
    const frontmatterEnd = content.indexOf('---', 3);
    expect(frontmatterEnd).toBeGreaterThan(3);
    
    const frontmatter = content.slice(3, frontmatterEnd);
    expect(frontmatter).toContain('name: character-aesthetic-engineering');
    expect(frontmatter).toContain('description:');
    expect(frontmatter.toLowerCase()).toContain('midjourney');
    expect(frontmatter.toLowerCase()).toContain('webtoon');
    expect(frontmatter.toLowerCase()).toContain('morphology');
  });

  it('SKILL.md covers all surgical control pillars', () => {
    const content = fs.readFileSync(skillFile, 'utf-8');

    // Muscle controls
    expect(content).toContain('Soft / Natural');
    expect(content).toContain('Lean / Toned');
    expect(content).toContain('Athletic / Defined');
    expect(content).toContain('Ripped / Chiseled');
    expect(content).toContain('Hyper / Shredded');
    expect(content).toContain('V-Taper');
    expect(content).toContain('Vascularity');

    // Facial harmony
    expect(content).toContain('Canthal Tilt');
    expect(content).toContain('+2° to +6°');
    expect(content).toContain('Gonial Angle');
    expect(content).toContain('Vertical Thirds');
    expect(content).toContain('Philtrum-to-Chin');

    // Female & Male morphology
    expect(content).toContain('Waist-to-Hip Ratio (WHR)');
    expect(content).toContain('0.65 - 0.72');
    expect(content).toContain('bustNaturalGravity');
    expect(content).toContain('Galbe');
    expect(content).toContain('Adonis Belt');
  });

  it('SKILL.md covers the 4 major aesthetic styles', () => {
    const content = fs.readFileSync(skillFile, 'utf-8');
    expect(content).toContain('Webtoon Action');
    expect(content).toContain('Solo Leveling');
    expect(content).toContain('Modern Anime');
    expect(content).toContain('Detailed Seinen Manga');
    expect(content).toContain('Semi-Realistic Digital Art');
  });

  it('SKILL.md covers wardrobe paradigms and duty vs off-duty principle', () => {
    const content = fs.readFileSync(skillFile, 'utf-8');
    expect(content).toContain('K-Streetwear');
    expect(content).toContain('Techwear');
    expect(content).toContain('Dark Fantasy / Hunter');
    expect(content).toContain('Martial Neo-Traditional');
    expect(content).toContain('Classic Haute Tailoring');
    expect(content).toContain('Duty vs. Off-Duty');
  });

  it('All reference files exist and are populated with comprehensive documentation', () => {
    const expectedRefs = [
      'anatomical_vocabulary.md',
      'facial_harmony_matrix.md',
      'wardrobe_styles.md',
      'prompt_templates.md',
    ];

    for (const ref of expectedRefs) {
      const fullPath = path.join(refDir, ref);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(3000); // Verify substantial, genuine content
    }
  });

  it('SKILL.md markdown links resolve to actual files on disk', () => {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const linkRegex = /\[([^\]]+)\]\((references\/[a-z_]+\.md)\)/g;
    let match;
    let count = 0;
    while ((match = linkRegex.exec(content)) !== null) {
      count++;
      const relativePath = match[2];
      if (relativePath) {
        const targetPath = path.join(skillDir, relativePath);
        expect(fs.existsSync(targetPath)).toBe(true);
      }
    }
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it('prompt_templates.md covers all 5 AI image engines', () => {
    const promptPath = path.join(refDir, 'prompt_templates.md');
    const content = fs.readFileSync(promptPath, 'utf-8');

    expect(content).toContain('Midjourney v6');
    expect(content).toContain('Stable Diffusion XL (SDXL)');
    expect(content).toContain('Flux.1');
    expect(content).toContain('Google Imagen 3');
    expect(content).toContain('OpenAI DALL-E 3');

    // Key templates
    expect(content).toContain('Master Model Sheet');
    expect(content).toContain('12-Emotion Expression Grid Matrix');
    expect(content).toContain('Kinetic Dynamic Action Pose Sheet');
    expect(content).toContain('Macro Details & Equipment Callout Sheet');
    expect(content).toContain('Cinematic Single Hero Portrait');
  });

  it('facial_harmony_matrix.md covers ethnic phenotypic diversity and canons', () => {
    const facialPath = path.join(refDir, 'facial_harmony_matrix.md');
    const content = fs.readFileSync(facialPath, 'utf-8');

    expect(content).toContain('East Asian');
    expect(content).toContain('South Asian');
    expect(content).toContain('African & African Diaspora');
    expect(content).toContain('Caucasian / European');
    expect(content).toContain('Latin American');
    expect(content).toContain('Middle Eastern & North African');
    expect(content).toContain('Southeast Asian');
    expect(content).toContain('Nordic / Scandinavian');
    expect(content).toContain('Indigenous American');
    expect(content).toContain('Polynesian');
    expect(content).toContain('Fantasy / Ethereal Hybrid');

    expect(content).toContain('Canthal Tilt Analysis');
    expect(content).toContain('Rule of Vertical Thirds');
    expect(content).toContain('Rule of Transverse Fifths');
  });

  it('anatomical_vocabulary.md covers muscle tiers, V-taper and female bust gravity drape', () => {
    const anatPath = path.join(refDir, 'anatomical_vocabulary.md');
    const content = fs.readFileSync(anatPath, 'utf-8');

    expect(content).toContain('Head-to-Height Ratio');
    expect(content).toContain('Waist-to-Hip Ratio (WHR)');
    expect(content).toContain('Shoulder-to-Hip Ratio (SHR)');
    expect(content).toContain('Demon Back');
    expect(content).toContain('Serratus anterior');
    expect(content).toContain('Adonis belt');
    expect(content).toContain('Natural Teardrop Drape');
    expect(content).toContain('Galbe / Gluteal Shelf');
  });

  it('wardrobe_styles.md covers fold dynamics and all 6 style categories', () => {
    const wardPath = path.join(refDir, 'wardrobe_styles.md');
    const content = fs.readFileSync(wardPath, 'utf-8');

    // Fold mechanics
    expect(content).toContain('Pipe Folds');
    expect(content).toContain('Zig-Zag Folds');
    expect(content).toContain('Spiral Folds');
    expect(content).toContain('Diaper Folds');
    expect(content).toContain('Half-Lock / Drop Folds');

    // Categories
    expect(content).toContain('K-Streetwear');
    expect(content).toContain('Techwear & Cyber-Tactical');
    expect(content).toContain('Dark Fantasy & Hunter Battle Armor');
    expect(content).toContain('Martial Arts & Modern Neo-Traditional');
    expect(content).toContain('Classic Haute Tailoring');
    expect(content).toContain('Duty vs. Off-Duty');
  });
});
