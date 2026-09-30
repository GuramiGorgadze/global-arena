const seat = (code, name, role = '', photo = '') => ({ code, name, role, photo });

const flag = (slug) => `/mun/flags/${slug}.webp`;

// --- UNSC ------------------------------------------------------------------
export const UNSC_ROSTER = [
  seat('ps', 'Palestine'),
  seat('il', 'Israel'),
  seat('us', 'United States'),
  seat('ir', 'Iran'),
  seat('in', 'India'),
  seat('ru', 'Russia'),
  seat('fr', 'France'),
  seat('de', 'Germany'),
  seat('ng', 'Nigeria'),
  seat('gb', 'United Kingdom'),
  seat('cu', 'Cuba'),
  seat('eg', 'Egypt'),
  seat('sy', 'Syria'),
  seat('cz', 'Czechia'),
  seat('br', 'Brazil'),
  seat('cn', 'China'),
];

// --- SPECPOL ---------------------------------------------------------------
export const SPECPOL_ROSTER = [
  seat('cy', 'Cyprus'),
  seat('tr', 'Türkiye'),
  seat('gr', 'Greece'),
  seat('gb', 'United Kingdom'),
  seat('us', 'United States'),
  seat('fr', 'France'),
  seat('ru', 'Russia'),
  seat('cn', 'China'),
  seat('az', 'Azerbaijan'),
  seat('pk', 'Pakistan'),
  seat('es', 'Spain'),
  seat('rs', 'Serbia'),
  seat('ar', 'Argentina'),
  seat('sk', 'Slovakia'),
  seat('de', 'Germany'),
  seat('it', 'Italy'),
  seat('eg', 'Egypt'),
  seat('in', 'India'),
];

// --- UNHRC (Human Rights) --------------------------------------------------
export const UNHRC_ROSTER = [
  seat('ye', 'Yemen'),
  seat('ir', 'Iran'),
  seat('sa', 'Saudi Arabia'),
  seat('gb', 'United Kingdom'),
  seat('us', 'United States'),
  seat('ae', 'United Arab Emirates'),
  seat('om', 'Oman'),
  seat('ru', 'Russia'),
  seat('cn', 'China'),
  seat('jo', 'Jordan'),
  seat('iq', 'Iraq'),
  seat('de', 'Germany'),
  seat('fr', 'France'),
  seat('eg', 'Egypt'),
  seat('qa', 'Qatar'),
  seat('tr', 'Türkiye'),
  seat('il', 'Israel'),
  seat('lb', 'Lebanon'),
];

// --- DISEC -----------------------------------------------------------------
export const DISEC_ROSTER = [
  seat('ir', 'Iran'),
  seat('us', 'United States'),
  seat('il', 'Israel'),
  seat('iq', 'Iraq'),
  seat('lb', 'Lebanon'),
  seat('ye', 'Yemen'),
  seat('', 'Hezbollah', '', flag('hezbollah')),
  seat('sy', 'Syria'),
  seat('tr', 'Türkiye'),
  seat('sa', 'Saudi Arabia'),
  seat('ae', 'United Arab Emirates'),
  seat('ru', 'Russia'),
  seat('cn', 'China'),
  seat('qa', 'Qatar'),
  seat('gb', 'United Kingdom'),
  seat('fr', 'France'),
  seat('', 'Houthis (Ansar Allah)', '', flag('houthis')),
  seat('', 'PKK', '', flag('pkk')),
  seat('jo', 'Jordan'),
  seat('eg', 'Egypt'),
];

// --- Press Corps -----------------------------------------------------------
export const PRESS_ROSTER = [
  seat('gb', 'BBC World Service', 'United Kingdom'),
  seat('us', 'Voice of America (VOA)', 'United States'),
  seat('fr', 'France 24', 'France'),
  seat('cn', 'China Daily', 'China'),
  seat('ru', 'Sputnik', 'Russia'),
  seat('qa', 'Al Jazeera Arabic', 'Qatar'),
  seat('ps', 'Wafa — Palestine News Agency', 'Palestine'),
  seat('un', 'Independent Digital / Citizen Journalist', 'Independent'),
  seat('il', 'The Jerusalem Post', 'Israel'),
];
