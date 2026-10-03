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
  seat('gb', 'BBC World Service N1', 'United Kingdom'),
  seat('gb', 'BBC World Service N2', 'United Kingdom'),
  seat('us', 'Voice of America (VOA)', 'United States'),
  seat('fr', 'France 24 N1', 'France'),
  seat('fr', 'France 24 N2', 'France'),
  seat('cn', 'China Daily N1', 'China'),
  seat('cn', 'China Daily N2', 'China'),
  seat('ru', 'Sputnik N1', 'Russia'),
  seat('ru', 'Sputnik N2', 'Russia'),
  seat('qa', 'Al Jazeera Arabic N1', 'Qatar'),
  seat('qa', 'Al Jazeera Arabic N2', 'Qatar'),
  seat('ps', 'Wafa — Palestine News Agency N1', 'Palestine'),
  seat('ps', 'Wafa — Palestine News Agency N2', 'Palestine'),
  seat('il', 'The Jerusalem Post N1', 'Israel'),
  seat('il', 'The Jerusalem Post N2', 'Israel'),
];
