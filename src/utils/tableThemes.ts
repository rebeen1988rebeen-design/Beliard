import { TableTheme } from '../types/billiards';

export interface ThemeConfig {
  id: TableTheme;
  nameKu: string;
  nameEn: string;
  feltColor: string;
  feltSpecular: string;
  railColor: string;
  railEmissive: string;
  railEmissiveIntensity: number;
  glassOpacity: number;
  neonBorder: string;
  pocketMetalColor: string;
  bgGradient: string;
  cueColor: string;
}

export const TABLE_THEMES: Record<TableTheme, ThemeConfig> = {
  emerald_glass: {
    id: 'emerald_glass',
    nameKu: 'زمروودی شووشەیی (Emerald Glass)',
    nameEn: 'Emerald Glass',
    feltColor: '#064e3b', // Deep emerald
    feltSpecular: '#10b981',
    railColor: '#0f172a',
    railEmissive: '#10b981',
    railEmissiveIntensity: 0.35,
    glassOpacity: 0.82,
    neonBorder: '#34d399',
    pocketMetalColor: '#e2e8f0',
    bgGradient: 'from-slate-950 via-emerald-950/60 to-slate-950',
    cueColor: '#e2e8f0'
  },
  sapphire_glass: {
    id: 'sapphire_glass',
    nameKu: 'یاقووتی شین (Sapphire Glass)',
    nameEn: 'Sapphire Glass',
    feltColor: '#0c4a6e', // Deep sapphire ocean
    feltSpecular: '#38bdf8',
    railColor: '#090d16',
    railEmissive: '#0284c7',
    railEmissiveIntensity: 0.45,
    glassOpacity: 0.85,
    neonBorder: '#38bdf8',
    pocketMetalColor: '#94a3b8',
    bgGradient: 'from-slate-950 via-sky-950/70 to-slate-950',
    cueColor: '#38bdf8'
  },
  cyber_ruby: {
    id: 'cyber_ruby',
    nameKu: 'سووری سایبەر (Cyber Ruby)',
    nameEn: 'Cyber Ruby',
    feltColor: '#4c0519', // Deep crimson
    feltSpecular: '#f43f5e',
    railColor: '#18020a',
    railEmissive: '#e11d48',
    railEmissiveIntensity: 0.5,
    glassOpacity: 0.88,
    neonBorder: '#fb7185',
    pocketMetalColor: '#cbd5e1',
    bgGradient: 'from-slate-950 via-rose-950/60 to-slate-950',
    cueColor: '#fb7185'
  },
  obsidian_gold: {
    id: 'obsidian_gold',
    nameKu: 'ئەبسییدیەنی زێڕین (Obsidian Gold)',
    nameEn: 'Obsidian Gold',
    feltColor: '#18181b', // Ultra dark obsidian felt
    feltSpecular: '#f59e0b',
    railColor: '#09090b',
    railEmissive: '#d97706',
    railEmissiveIntensity: 0.4,
    glassOpacity: 0.9,
    neonBorder: '#f59e0b',
    pocketMetalColor: '#fcd34d',
    bgGradient: 'from-zinc-950 via-amber-950/50 to-zinc-950',
    cueColor: '#fcd34d'
  }
};

export interface FeltColorOption {
  id: string;
  nameKu: string;
  nameEn: string;
  color: string;
  specular: string;
}

export const FELT_COLOR_OPTIONS: FeltColorOption[] = [
  { id: 'classic_green', nameKu: 'سەوزی کلاسیک (Classic Green)', nameEn: 'Classic Green', color: '#064e3b', specular: '#10b981' },
  { id: 'navy_blue', nameKu: 'شینی دەریایی (Navy)', nameEn: 'Navy Blue', color: '#1e3a8a', specular: '#60a5fa' },
  { id: 'crimson_red', nameKu: 'سووری کریمزن (Crimson)', nameEn: 'Crimson Red', color: '#881337', specular: '#f43f5e' },
  { id: 'obsidian_black', nameKu: 'ڕەشی ئەڵماسی (Obsidian)', nameEn: 'Obsidian Black', color: '#18181b', specular: '#a1a1aa' },
  { id: 'royal_purple', nameKu: 'مۆری شاهانە (Royal Purple)', nameEn: 'Royal Purple', color: '#4a044e', specular: '#e879f9' },
  { id: 'gold_sand', nameKu: 'زەردی زێڕین (Gold Sand)', nameEn: 'Gold Sand', color: '#78350f', specular: '#fbbf24' },
];
