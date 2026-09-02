import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  BookOpen, RefreshCw, Plus, Minus, Search,
  CheckCircle2, ArrowRight, Layers,
  Save, ChevronDown, ChevronUp, Share2, ListChecks
} from 'lucide-react';

/**
 * ==========================================
 * 1. STORAGE UTILITY (MULTI-ÁLBUM)
 * ==========================================
 */
const loadInventario = (storageKey) => {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const inv = {};
    if (Array.isArray(data)) {
      data.forEach(row => {
        inv[row.id] = { obtenido: !!row.obtenido, cantidadRepetidas: row.cantidad_repetidas || 0 };
      });
    }
    return inv;
  } catch { return {}; }
};

const saveInventario = (storageKey, inventario) => {
  try {
    const rows = Object.entries(inventario)
      .filter(([, d]) => d.obtenido || d.cantidadRepetidas > 0)
      .map(([id, d]) => ({ id, obtenido: d.obtenido, cantidad_repetidas: d.cantidadRepetidas }));
    localStorage.setItem(storageKey, JSON.stringify(rows));
  } catch (e) { console.error('Save error:', e); }
};

/**
 * ==========================================
 * 2. UTILITIES
 * ==========================================
 */
const normalizeText = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getGrupoTitulo = (grupo, paises) => {
  if (grupo === 'Especial') return '🏆 Cromos Especiales (FWC)';
  if (grupo === 'Coca-Cola') return '🥤 Extra: Coca-Cola';
  const siglas = paises.filter(p => p.grupo === grupo).map(p => p.sigla).join(' · ');
  return `Grupo ${grupo} · ${siglas}`;
};

/**
 * ==========================================
 * 3. DATA – MUNDIAL 2026
 * ==========================================
 */
const PAISES_2026 = [
  { sigla: 'FWC', nombre: 'Especiales FIFA', grupo: 'Especial' },
  { sigla: 'MEX', nombre: 'México', grupo: 'A' }, { sigla: 'RSA', nombre: 'Sudáfrica', grupo: 'A' }, { sigla: 'KOR', nombre: 'Corea del Sur', grupo: 'A' }, { sigla: 'CZE', nombre: 'República Checa', grupo: 'A' },
  { sigla: 'CAN', nombre: 'Canadá', grupo: 'B' }, { sigla: 'BIH', nombre: 'Bosnia y Herz.', grupo: 'B' }, { sigla: 'QAT', nombre: 'Qatar', grupo: 'B' }, { sigla: 'SUI', nombre: 'Suiza', grupo: 'B' },
  { sigla: 'BRA', nombre: 'Brasil', grupo: 'C' }, { sigla: 'MAR', nombre: 'Marruecos', grupo: 'C' }, { sigla: 'HAI', nombre: 'Haití', grupo: 'C' }, { sigla: 'SCO', nombre: 'Escocia', grupo: 'C' },
  { sigla: 'USA', nombre: 'Estados Unidos', grupo: 'D' }, { sigla: 'PAR', nombre: 'Paraguay', grupo: 'D' }, { sigla: 'AUS', nombre: 'Australia', grupo: 'D' }, { sigla: 'TUR', nombre: 'Turquía', grupo: 'D' },
  { sigla: 'GER', nombre: 'Alemania', grupo: 'E' }, { sigla: 'CUW', nombre: 'Curazao', grupo: 'E' }, { sigla: 'CIV', nombre: 'Costa de Marfil', grupo: 'E' }, { sigla: 'ECU', nombre: 'Ecuador', grupo: 'E' },
  { sigla: 'NED', nombre: 'Países Bajos', grupo: 'F' }, { sigla: 'JPN', nombre: 'Japón', grupo: 'F' }, { sigla: 'SWE', nombre: 'Suecia', grupo: 'F' }, { sigla: 'TUN', nombre: 'Túnez', grupo: 'F' },
  { sigla: 'BEL', nombre: 'Bélgica', grupo: 'G' }, { sigla: 'EGY', nombre: 'Egipto', grupo: 'G' }, { sigla: 'IRN', nombre: 'Irán', grupo: 'G' }, { sigla: 'NZL', nombre: 'Nueva Zelanda', grupo: 'G' },
  { sigla: 'ESP', nombre: 'España', grupo: 'H' }, { sigla: 'CPV', nombre: 'Cabo Verde', grupo: 'H' }, { sigla: 'KSA', nombre: 'Arabia Saudita', grupo: 'H' }, { sigla: 'URU', nombre: 'Uruguay', grupo: 'H' },
  { sigla: 'FRA', nombre: 'Francia', grupo: 'I' }, { sigla: 'SEN', nombre: 'Senegal', grupo: 'I' }, { sigla: 'IRQ', nombre: 'Irak', grupo: 'I' }, { sigla: 'NOR', nombre: 'Noruega', grupo: 'I' },
  { sigla: 'ARG', nombre: 'Argentina', grupo: 'J' }, { sigla: 'ALG', nombre: 'Argelia', grupo: 'J' }, { sigla: 'AUT', nombre: 'Austria', grupo: 'J' }, { sigla: 'JOR', nombre: 'Jordania', grupo: 'J' },
  { sigla: 'POR', nombre: 'Portugal', grupo: 'K' }, { sigla: 'COD', nombre: 'RD Congo', grupo: 'K' }, { sigla: 'UZB', nombre: 'Uzbekistán', grupo: 'K' }, { sigla: 'COL', nombre: 'Colombia', grupo: 'K' },
  { sigla: 'ENG', nombre: 'Inglaterra', grupo: 'L' }, { sigla: 'CRO', nombre: 'Croacia', grupo: 'L' }, { sigla: 'GHA', nombre: 'Ghana', grupo: 'L' }, { sigla: 'PAN', nombre: 'Panamá', grupo: 'L' },
  { sigla: 'CC', nombre: 'Coca-Cola (Extras)', grupo: 'Coca-Cola' },
];
const EMOJIS_2026 = {
  FWC:'📜', MEX:'🇲🇽', RSA:'🇿🇦', KOR:'🇰🇷', CZE:'🇨🇿',
  CAN:'🇨🇦', BIH:'🇧🇦', QAT:'🇶🇦', SUI:'🇨🇭',
  BRA:'🇧🇷', MAR:'🇲🇦', HAI:'🇭🇹', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA:'🇺🇸', PAR:'🇵🇾', AUS:'🇦🇺', TUR:'🇹🇷',
  GER:'🇩🇪', CUW:'🇨🇼', CIV:'🇨🇮', ECU:'🇪🇨',
  NED:'🇳🇱', JPN:'🇯🇵', SWE:'🇸🇪', TUN:'🇹🇳',
  BEL:'🇧🇪', EGY:'🇪🇬', IRN:'🇮🇷', NZL:'🇳🇿',
  ESP:'🇪🇸', CPV:'🇨🇻', KSA:'🇸🇦', URU:'🇺🇾',
  FRA:'🇫🇷', SEN:'🇸🇳', IRQ:'🇮🇶', NOR:'🇳🇴',
  ARG:'🇦🇷', ALG:'🇩🇿', AUT:'🇦🇹', JOR:'🇯🇴',
  POR:'🇵🇹', COD:'🇨🇩', UZB:'🇺🇿', COL:'🇨🇴',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO:'🇭🇷', GHA:'🇬🇭', PAN:'🇵🇦', CC:'🥤',
};
const generarCatalogo2026 = () => {
  const c = [];
  PAISES_2026.forEach(p => {
    if (p.sigla === 'FWC') {
      c.push({ id: '00', sigla: 'FWC', numero: '00', tipo: 'especial_fwc', grupo: 'Especial' });
      for (let i = 1; i <= 19; i++) c.push({ id: `FWC-${i}`, sigla: 'FWC', numero: `${i}`, tipo: 'especial_fwc', grupo: 'Especial' });
    } else if (p.sigla === 'CC') {
      for (let i = 1; i <= 14; i++) c.push({ id: `CC-${i}`, sigla: 'CC', numero: `${i}`, tipo: 'coca_cola', grupo: 'Coca-Cola' });
    } else {
      for (let i = 1; i <= 20; i++) c.push({ id: `${p.sigla}-${i}`, sigla: p.sigla, numero: `${i}`, tipo: i===1?'escudo_especial':i===2?'grupal':'retrato', grupo: p.grupo });
    }
  });
  return c;
};

/**
 * ==========================================
 * 4. DATA – MUNDIAL 2022 QATAR
 * ==========================================
 */
const PAISES_2022 = [
  { sigla: 'FWC', nombre: 'Especiales FIFA', grupo: 'Especial' },
  { sigla: 'QAT', nombre: 'Qatar', grupo: 'A' }, { sigla: 'ECU', nombre: 'Ecuador', grupo: 'A' }, { sigla: 'SEN', nombre: 'Senegal', grupo: 'A' }, { sigla: 'NED', nombre: 'Países Bajos', grupo: 'A' },
  { sigla: 'ENG', nombre: 'Inglaterra', grupo: 'B' }, { sigla: 'IRN', nombre: 'Irán', grupo: 'B' }, { sigla: 'USA', nombre: 'Estados Unidos', grupo: 'B' }, { sigla: 'WAL', nombre: 'Gales', grupo: 'B' },
  { sigla: 'ARG', nombre: 'Argentina', grupo: 'C' }, { sigla: 'KSA', nombre: 'Arabia Saudita', grupo: 'C' }, { sigla: 'MEX', nombre: 'México', grupo: 'C' }, { sigla: 'POL', nombre: 'Polonia', grupo: 'C' },
  { sigla: 'FRA', nombre: 'Francia', grupo: 'D' }, { sigla: 'AUS', nombre: 'Australia', grupo: 'D' }, { sigla: 'DEN', nombre: 'Dinamarca', grupo: 'D' }, { sigla: 'TUN', nombre: 'Túnez', grupo: 'D' },
  { sigla: 'ESP', nombre: 'España', grupo: 'E' }, { sigla: 'CRC', nombre: 'Costa Rica', grupo: 'E' }, { sigla: 'GER', nombre: 'Alemania', grupo: 'E' }, { sigla: 'JPN', nombre: 'Japón', grupo: 'E' },
  { sigla: 'BEL', nombre: 'Bélgica', grupo: 'F' }, { sigla: 'CAN', nombre: 'Canadá', grupo: 'F' }, { sigla: 'MAR', nombre: 'Marruecos', grupo: 'F' }, { sigla: 'CRO', nombre: 'Croacia', grupo: 'F' },
  { sigla: 'BRA', nombre: 'Brasil', grupo: 'G' }, { sigla: 'SRB', nombre: 'Serbia', grupo: 'G' }, { sigla: 'SUI', nombre: 'Suiza', grupo: 'G' }, { sigla: 'CMR', nombre: 'Camerún', grupo: 'G' },
  { sigla: 'POR', nombre: 'Portugal', grupo: 'H' }, { sigla: 'GHA', nombre: 'Ghana', grupo: 'H' }, { sigla: 'URU', nombre: 'Uruguay', grupo: 'H' }, { sigla: 'KOR', nombre: 'Corea del Sur', grupo: 'H' },
  { sigla: 'CC', nombre: 'Team Believers (Coca-Cola)', grupo: 'Coca-Cola' },
];
const EMOJIS_2022 = {
  FWC:'📜', QAT:'🇶🇦', ECU:'🇪🇨', SEN:'🇸🇳', NED:'🇳🇱',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', IRN:'🇮🇷', USA:'🇺🇸', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  ARG:'🇦🇷', KSA:'🇸🇦', MEX:'🇲🇽', POL:'🇵🇱',
  FRA:'🇫🇷', AUS:'🇦🇺', DEN:'🇩🇰', TUN:'🇹🇳',
  ESP:'🇪🇸', CRC:'🇨🇷', GER:'🇩🇪', JPN:'🇯🇵',
  BEL:'🇧🇪', CAN:'🇨🇦', MAR:'🇲🇦', CRO:'🇭🇷',
  BRA:'🇧🇷', SRB:'🇷🇸', SUI:'🇨🇭', CMR:'🇨🇲',
  POR:'🇵🇹', GHA:'🇬🇭', URU:'🇺🇾', KOR:'🇰🇷', CC:'🥤',
};
const generarCatalogo2022 = () => {
  const c = [];
  PAISES_2022.forEach(p => {
    if (p.sigla === 'FWC') {
      // 30 FWC stickers → 640 equipos + 30 FWC = 670 total base
      for (let i = 1; i <= 30; i++) c.push({ id: `FWC-${i}`, sigla: 'FWC', numero: `${i}`, tipo: 'especial_fwc', grupo: 'Especial' });
    } else if (p.sigla === 'CC') {
      // C1–C8 (Team Believers, exclusivas Colombia/México/Brasil)
      for (let i = 1; i <= 8; i++) c.push({ id: `CC-C${i}`, sigla: 'CC', numero: `C${i}`, tipo: 'coca_cola', grupo: 'Coca-Cola' });
    } else {
      for (let i = 1; i <= 20; i++) c.push({ id: `${p.sigla}-${i}`, sigla: p.sigla, numero: `${i}`, tipo: i===1?'escudo_especial':i===2?'grupal':'retrato', grupo: p.grupo });
    }
  });
  return c;
};

/**
 * ==========================================
 * 5. DATA – MUNDIAL 2018 RUSIA
 * ==========================================
 */
const PAISES_2018 = [
  { sigla: 'FWC', nombre: 'Especiales FIFA', grupo: 'Especial' },
  { sigla: 'RUS', nombre: 'Rusia', grupo: 'A' }, { sigla: 'KSA', nombre: 'Arabia Saudita', grupo: 'A' }, { sigla: 'EGY', nombre: 'Egipto', grupo: 'A' }, { sigla: 'URU', nombre: 'Uruguay', grupo: 'A' },
  { sigla: 'POR', nombre: 'Portugal', grupo: 'B' }, { sigla: 'ESP', nombre: 'España', grupo: 'B' }, { sigla: 'MAR', nombre: 'Marruecos', grupo: 'B' }, { sigla: 'IRN', nombre: 'Irán', grupo: 'B' },
  { sigla: 'FRA', nombre: 'Francia', grupo: 'C' }, { sigla: 'AUS', nombre: 'Australia', grupo: 'C' }, { sigla: 'PER', nombre: 'Perú', grupo: 'C' }, { sigla: 'DEN', nombre: 'Dinamarca', grupo: 'C' },
  { sigla: 'ARG', nombre: 'Argentina', grupo: 'D' }, { sigla: 'ISL', nombre: 'Islandia', grupo: 'D' }, { sigla: 'CRO', nombre: 'Croacia', grupo: 'D' }, { sigla: 'NGA', nombre: 'Nigeria', grupo: 'D' },
  { sigla: 'BRA', nombre: 'Brasil', grupo: 'E' }, { sigla: 'SUI', nombre: 'Suiza', grupo: 'E' }, { sigla: 'CRC', nombre: 'Costa Rica', grupo: 'E' }, { sigla: 'SRB', nombre: 'Serbia', grupo: 'E' },
  { sigla: 'GER', nombre: 'Alemania', grupo: 'F' }, { sigla: 'MEX', nombre: 'México', grupo: 'F' }, { sigla: 'SWE', nombre: 'Suecia', grupo: 'F' }, { sigla: 'KOR', nombre: 'Corea del Sur', grupo: 'F' },
  { sigla: 'BEL', nombre: 'Bélgica', grupo: 'G' }, { sigla: 'PAN', nombre: 'Panamá', grupo: 'G' }, { sigla: 'TUN', nombre: 'Túnez', grupo: 'G' }, { sigla: 'ENG', nombre: 'Inglaterra', grupo: 'G' },
  { sigla: 'POL', nombre: 'Polonia', grupo: 'H' }, { sigla: 'SEN', nombre: 'Senegal', grupo: 'H' }, { sigla: 'COL', nombre: 'Colombia', grupo: 'H' }, { sigla: 'JPN', nombre: 'Japón', grupo: 'H' },
];
const EMOJIS_2018 = {
  FWC:'📜', RUS:'🇷🇺', KSA:'🇸🇦', EGY:'🇪🇬', URU:'🇺🇾',
  POR:'🇵🇹', ESP:'🇪🇸', MAR:'🇲🇦', IRN:'🇮🇷',
  FRA:'🇫🇷', AUS:'🇦🇺', PER:'🇵🇪', DEN:'🇩🇰',
  ARG:'🇦🇷', ISL:'🇮🇸', CRO:'🇭🇷', NGA:'🇳🇬',
  BRA:'🇧🇷', SUI:'🇨🇭', CRC:'🇨🇷', SRB:'🇷🇸',
  GER:'🇩🇪', MEX:'🇲🇽', SWE:'🇸🇪', KOR:'🇰🇷',
  BEL:'🇧🇪', PAN:'🇵🇦', TUN:'🇹🇳', ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  POL:'🇵🇱', SEN:'🇸🇳', COL:'🇨🇴', JPN:'🇯🇵',
};
const generarCatalogo2018 = () => {
  const c = [];
  PAISES_2018.forEach(p => {
    if (p.sigla === 'FWC') {
      // 42 FWC stickers → 640 equipos + 42 FWC = 682 total
      for (let i = 1; i <= 42; i++) c.push({ id: `FWC-${i}`, sigla: 'FWC', numero: `${i}`, tipo: 'especial_fwc', grupo: 'Especial' });
    } else {
      for (let i = 1; i <= 20; i++) c.push({ id: `${p.sigla}-${i}`, sigla: p.sigla, numero: `${i}`, tipo: i===1?'escudo_especial':i===2?'grupal':'retrato', grupo: p.grupo });
    }
  });
  return c;
};

/**
 * ==========================================
 * 6. DATA – MUNDIAL 2014 BRASIL
 * ==========================================
 */
const PAISES_2014 = [
  { sigla: 'BRA', nombre: 'Brasil', grupo: 'A' }, { sigla: 'CRO', nombre: 'Croacia', grupo: 'A' }, { sigla: 'MEX', nombre: 'México', grupo: 'A' }, { sigla: 'CMR', nombre: 'Camerún', grupo: 'A' },
  { sigla: 'ESP', nombre: 'España', grupo: 'B' }, { sigla: 'NED', nombre: 'Países Bajos', grupo: 'B' }, { sigla: 'CHI', nombre: 'Chile', grupo: 'B' }, { sigla: 'AUS', nombre: 'Australia', grupo: 'B' },
  { sigla: 'COL', nombre: 'Colombia', grupo: 'C' }, { sigla: 'GRE', nombre: 'Grecia', grupo: 'C' }, { sigla: 'CIV', nombre: 'Costa de Marfil', grupo: 'C' }, { sigla: 'JPN', nombre: 'Japón', grupo: 'C' },
  { sigla: 'URU', nombre: 'Uruguay', grupo: 'D' }, { sigla: 'CRC', nombre: 'Costa Rica', grupo: 'D' }, { sigla: 'ENG', nombre: 'Inglaterra', grupo: 'D' }, { sigla: 'ITA', nombre: 'Italia', grupo: 'D' },
  { sigla: 'SUI', nombre: 'Suiza', grupo: 'E' }, { sigla: 'ECU', nombre: 'Ecuador', grupo: 'E' }, { sigla: 'FRA', nombre: 'Francia', grupo: 'E' }, { sigla: 'HND', nombre: 'Honduras', grupo: 'E' },
  { sigla: 'ARG', nombre: 'Argentina', grupo: 'F' }, { sigla: 'BIH', nombre: 'Bosnia y Herz.', grupo: 'F' }, { sigla: 'IRN', nombre: 'Irán', grupo: 'F' }, { sigla: 'NGA', nombre: 'Nigeria', grupo: 'F' },
  { sigla: 'GER', nombre: 'Alemania', grupo: 'G' }, { sigla: 'POR', nombre: 'Portugal', grupo: 'G' }, { sigla: 'GHA', nombre: 'Ghana', grupo: 'G' }, { sigla: 'USA', nombre: 'Estados Unidos', grupo: 'G' },
  { sigla: 'BEL', nombre: 'Bélgica', grupo: 'H' }, { sigla: 'ALG', nombre: 'Argelia', grupo: 'H' }, { sigla: 'RUS', nombre: 'Rusia', grupo: 'H' }, { sigla: 'KOR', nombre: 'Corea del Sur', grupo: 'H' },
];
const EMOJIS_2014 = {
  BRA:'🇧🇷', CRO:'🇭🇷', MEX:'🇲🇽', CMR:'🇨🇲',
  ESP:'🇪🇸', NED:'🇳🇱', CHI:'🇨🇱', AUS:'🇦🇺',
  COL:'🇨🇴', GRE:'🇬🇷', CIV:'🇨🇮', JPN:'🇯🇵',
  URU:'🇺🇾', CRC:'🇨🇷', ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', ITA:'🇮🇹',
  SUI:'🇨🇭', ECU:'🇪🇨', FRA:'🇫🇷', HND:'🇭🇳',
  ARG:'🇦🇷', BIH:'🇧🇦', IRN:'🇮🇷', NGA:'🇳🇬',
  GER:'🇩🇪', POR:'🇵🇹', GHA:'🇬🇭', USA:'🇺🇸',
  BEL:'🇧🇪', ALG:'🇩🇿', RUS:'🇷🇺', KOR:'🇰🇷',
};
const generarCatalogo2014 = () => {
  const c = [];
  // 32 equipos × 20 = 640 láminas total
  PAISES_2014.forEach(p => {
    for (let i = 1; i <= 20; i++) c.push({ id: `${p.sigla}-${i}`, sigla: p.sigla, numero: `${i}`, tipo: i===1?'escudo_especial':i===2?'grupal':'retrato', grupo: p.grupo });
  });
  return c;
};

/**
 * ==========================================
 * 7. DATA – MUNDIAL 2010 SUDÁFRICA
 * ==========================================
 */
const PAISES_2010 = [
  { sigla: 'RSA', nombre: 'Sudáfrica', grupo: 'A' }, { sigla: 'MEX', nombre: 'México', grupo: 'A' }, { sigla: 'URU', nombre: 'Uruguay', grupo: 'A' }, { sigla: 'FRA', nombre: 'Francia', grupo: 'A' },
  { sigla: 'ARG', nombre: 'Argentina', grupo: 'B' }, { sigla: 'NGA', nombre: 'Nigeria', grupo: 'B' }, { sigla: 'KOR', nombre: 'Corea del Sur', grupo: 'B' }, { sigla: 'GRE', nombre: 'Grecia', grupo: 'B' },
  { sigla: 'ENG', nombre: 'Inglaterra', grupo: 'C' }, { sigla: 'USA', nombre: 'Estados Unidos', grupo: 'C' }, { sigla: 'ALG', nombre: 'Argelia', grupo: 'C' }, { sigla: 'SVN', nombre: 'Eslovenia', grupo: 'C' },
  { sigla: 'GER', nombre: 'Alemania', grupo: 'D' }, { sigla: 'AUS', nombre: 'Australia', grupo: 'D' }, { sigla: 'SRB', nombre: 'Serbia', grupo: 'D' }, { sigla: 'GHA', nombre: 'Ghana', grupo: 'D' },
  { sigla: 'NED', nombre: 'Países Bajos', grupo: 'E' }, { sigla: 'DEN', nombre: 'Dinamarca', grupo: 'E' }, { sigla: 'JPN', nombre: 'Japón', grupo: 'E' }, { sigla: 'CMR', nombre: 'Camerún', grupo: 'E' },
  { sigla: 'ITA', nombre: 'Italia', grupo: 'F' }, { sigla: 'PAR', nombre: 'Paraguay', grupo: 'F' }, { sigla: 'NZL', nombre: 'Nueva Zelanda', grupo: 'F' }, { sigla: 'SVK', nombre: 'Eslovaquia', grupo: 'F' },
  { sigla: 'BRA', nombre: 'Brasil', grupo: 'G' }, { sigla: 'PRK', nombre: 'Corea del Norte', grupo: 'G' }, { sigla: 'CIV', nombre: 'Costa de Marfil', grupo: 'G' }, { sigla: 'POR', nombre: 'Portugal', grupo: 'G' },
  { sigla: 'ESP', nombre: 'España', grupo: 'H' }, { sigla: 'SUI', nombre: 'Suiza', grupo: 'H' }, { sigla: 'HND', nombre: 'Honduras', grupo: 'H' }, { sigla: 'CHI', nombre: 'Chile', grupo: 'H' },
  { sigla: 'CC', nombre: 'Coca-Cola (Especiales)', grupo: 'Coca-Cola' },
];
const EMOJIS_2010 = {
  RSA:'🇿🇦', MEX:'🇲🇽', URU:'🇺🇾', FRA:'🇫🇷',
  ARG:'🇦🇷', NGA:'🇳🇬', KOR:'🇰🇷', GRE:'🇬🇷',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', USA:'🇺🇸', ALG:'🇩🇿', SVN:'🇸🇮',
  GER:'🇩🇪', AUS:'🇦🇺', SRB:'🇷🇸', GHA:'🇬🇭',
  NED:'🇳🇱', DEN:'🇩🇰', JPN:'🇯🇵', CMR:'🇨🇲',
  ITA:'🇮🇹', PAR:'🇵🇾', NZL:'🇳🇿', SVK:'🇸🇰',
  BRA:'🇧🇷', PRK:'🇰🇵', CIV:'🇨🇮', POR:'🇵🇹',
  ESP:'🇪🇸', SUI:'🇨🇭', HND:'🇭🇳', CHI:'🇨🇱', CC:'🥤',
};
const generarCatalogo2010 = () => {
  const c = [];
  PAISES_2010.forEach(p => {
    if (p.sigla === 'CC') {
      // 8 especiales Coca-Cola: letras A–H (Zakumi, póster, aeroplano, arquero…)
      for (const l of ['A','B','C','D','E','F','G','H']) {
        c.push({ id: `CC-${l}`, sigla: 'CC', numero: l, tipo: 'coca_cola', grupo: 'Coca-Cola' });
      }
    } else {
      for (let i = 1; i <= 20; i++) c.push({ id: `${p.sigla}-${i}`, sigla: p.sigla, numero: `${i}`, tipo: i===1?'escudo_especial':i===2?'grupal':'retrato', grupo: p.grupo });
    }
  });
  return c;
};

/**
 * ==========================================
 * 8. MUNDIALES CONFIG (centralizado)
 * ==========================================
 */
const buildConfig = ({ key, nombre, abrev, flag, c1, c2, grupos, paises, emojis, gen, totalBase, ccGroup }) => {
  const catalogoArray = gen();
  const catalogoMap = catalogoArray.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  return {
    key, nombre, abrev, flag, color1: c1, color2: c2,
    gradient: `linear-gradient(to bottom, ${c1}, ${c2})`,
    storageKey: key === '2026' ? 'sb_inventario' : `sb_inventario_${key}`,
    grupos, paises, emojis, catalogoArray, catalogoMap,
    totalBase, ccGroup: ccGroup || null,
  };
};

const MUNDIALES_CONFIG = {
  '2026': buildConfig({ key:'2026', nombre:'México/USA/Canadá 2026', abrev:'USA 2026', flag:'🌎', c1:'#8a1538', c2:'#600e26', grupos:['Especial','A','B','C','D','E','F','G','H','I','J','K','L','Coca-Cola'], paises:PAISES_2026, emojis:EMOJIS_2026, gen:generarCatalogo2026, totalBase:980, ccGroup:'Coca-Cola' }),
  '2022': buildConfig({ key:'2022', nombre:'Qatar 2022', abrev:'Qatar 2022', flag:'🇶🇦', c1:'#7c3aed', c2:'#5b21b6', grupos:['Especial','A','B','C','D','E','F','G','H','Coca-Cola'], paises:PAISES_2022, emojis:EMOJIS_2022, gen:generarCatalogo2022, totalBase:670, ccGroup:'Coca-Cola' }),
  '2018': buildConfig({ key:'2018', nombre:'Rusia 2018', abrev:'Rusia 2018', flag:'🇷🇺', c1:'#1d4ed8', c2:'#1e3a8a', grupos:['Especial','A','B','C','D','E','F','G','H'], paises:PAISES_2018, emojis:EMOJIS_2018, gen:generarCatalogo2018, totalBase:682, ccGroup:null }),
  '2014': buildConfig({ key:'2014', nombre:'Brasil 2014', abrev:'Brasil 2014', flag:'🇧🇷', c1:'#15803d', c2:'#14532d', grupos:['A','B','C','D','E','F','G','H'], paises:PAISES_2014, emojis:EMOJIS_2014, gen:generarCatalogo2014, totalBase:640, ccGroup:null }),
  '2010': buildConfig({ key:'2010', nombre:'Sudáfrica 2010', abrev:'S. África 2010', flag:'🇿🇦', c1:'#d97706', c2:'#92400e', grupos:['A','B','C','D','E','F','G','H','Coca-Cola'], paises:PAISES_2010, emojis:EMOJIS_2010, gen:generarCatalogo2010, totalBase:640, ccGroup:'Coca-Cola' }),
};

const MUNDIALES_ORDER = ['2026', '2022', '2018', '2014', '2010'];

/**
 * ==========================================
 * 9. HOOKS
 * ==========================================
 */
function usePaniniState(mundialKey) {
  const config = MUNDIALES_CONFIG[mundialKey];
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState({});

  useEffect(() => {
    // Reset state and load from localStorage deferred to next frame
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setInventario({});
    let raf;
    const load = () => {
      setInventario(loadInventario(config.storageKey));
      setLoading(false);
    };
    raf = requestAnimationFrame(() => { raf = requestAnimationFrame(load); });
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [mundialKey, config.storageKey]);

  const hacerCommitNuevas = useCallback((ids) => {
    setInventario(prev => {
      const next = { ...prev };
      ids.forEach(id => {
        if (config.catalogoMap[id]) next[id] = { ...(next[id] || { obtenido: false, cantidadRepetidas: 0 }), obtenido: true };
      });
      saveInventario(config.storageKey, next);
      return next;
    });
  }, [config]);

  const modificarRepetida = useCallback((id, delta) => {
    setInventario(prev => {
      const item = prev[id] || { obtenido: false, cantidadRepetidas: 0 };
      const next = { ...prev, [id]: { ...item, cantidadRepetidas: Math.max(0, item.cantidadRepetidas + delta) } };
      saveInventario(config.storageKey, next);
      return next;
    });
  }, [config]);

  const removerCromoObtenido = useCallback((id) => {
    setInventario(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev, [id]: { ...prev[id], obtenido: false } };
      saveInventario(config.storageKey, next);
      return next;
    });
  }, [config]);

  const ejecutarIntercambioMasivo = useCallback((dadasObj, recibidasArr) => {
    setInventario(prev => {
      const next = { ...prev };
      Object.entries(dadasObj).forEach(([id, cant]) => {
        if (cant > 0 && next[id]) next[id] = { ...next[id], cantidadRepetidas: Math.max(0, next[id].cantidadRepetidas - cant) };
      });
      recibidasArr.forEach(id => {
        const item = next[id] || { obtenido: false, cantidadRepetidas: 0 };
        if (!item.obtenido) next[id] = { ...item, obtenido: true };
        else next[id] = { ...item, cantidadRepetidas: item.cantidadRepetidas + 1 };
      });
      saveInventario(config.storageKey, next);
      return next;
    });
  }, [config]);

  return { loading, inventario, hacerCommitNuevas, modificarRepetida, removerCromoObtenido, ejecutarIntercambioMasivo };
}

function useAlbumStats(inventario, config) {
  return useMemo(() => {
    const ccGroup = config.ccGroup;
    let obtenidos = 0;
    const grupos = {};
    const paises = {};

    config.catalogoArray.forEach(s => {
      const got = inventario[s.id]?.obtenido ? 1 : 0;
      if (s.grupo !== ccGroup) obtenidos += got;
      if (!grupos[s.grupo]) grupos[s.grupo] = { obtenidos: 0, total: 0 };
      grupos[s.grupo].total++;
      grupos[s.grupo].obtenidos += got;
      if (!paises[s.sigla]) paises[s.sigla] = { obtenidos: 0, total: 0 };
      paises[s.sigla].total++;
      paises[s.sigla].obtenidos += got;
    });

    const total = config.totalBase;
    Object.keys(grupos).forEach(g => { grupos[g].porcentaje = ((grupos[g].obtenidos / grupos[g].total) * 100).toFixed(0); });
    Object.keys(paises).forEach(p => { paises[p].porcentaje = ((paises[p].obtenidos / paises[p].total) * 100).toFixed(0); });

    return { totales: { obtenidos, faltantes: total - obtenidos, total, porcentaje: ((obtenidos / total) * 100).toFixed(1) }, grupos, paises };
  }, [inventario, config]);
}

/**
 * ==========================================
 * 10. WORLD SELECTOR
 * ==========================================
 */
const WorldSelector = ({ mundialActivo, setMundialActivo }) => (
  <div className="flex overflow-x-auto hide-scrollbar bg-gray-950 py-2 gap-1.5 border-b border-gray-800 flex-shrink-0"
    style={{ paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))', paddingRight: 'max(8px, env(safe-area-inset-right, 8px))' }}>
    {MUNDIALES_ORDER.map(key => {
      const cfg = MUNDIALES_CONFIG[key];
      const isActive = mundialActivo === key;
      return (
        <button
          key={key}
          onClick={() => setMundialActivo(key)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
          style={isActive
            ? { background: cfg.color1, color: '#fff', boxShadow: `0 0 14px ${cfg.color1}90` }
            : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }
          }
        >
          <span className="text-sm leading-none">{cfg.flag}</span>
          <span>{cfg.abrev}</span>
        </button>
      );
    })}
  </div>
);

/**
 * ==========================================
 * 11. TAB: MI ÁLBUM
 * ==========================================
 */
const TabAlbum = React.memo(({ inventario, hacerCommitNuevas, removerCromoObtenido, config }) => {
  const stats = useAlbumStats(inventario, config);
  const [pendingAdds, setPendingAdds] = useState(new Set());
  const [openGroups, setOpenGroups] = useState(() => ({ [config.grupos[0]]: true }));
  const [busqueda, setBusqueda] = useState('');
  const pressTimer = useRef(null);

  const togglePending = (id) => {
    if (inventario[id]?.obtenido) return;
    setPendingAdds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handlePressStart = (id, obtenido) => {
    if (!obtenido) return;
    pressTimer.current = setTimeout(() => {
      if (window.confirm(`¿Quitar la lámina ${id.replace('-', ' ')} del álbum?`)) removerCromoObtenido(id);
    }, 800);
  };
  const handlePressEnd = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };

  const handleConfirm = () => { hacerCommitNuevas(Array.from(pendingAdds)); setPendingAdds(new Set()); };
  const toggleAccordion = (grupo) => setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));

  const handleShare = async () => {
    let text = `${config.nombre} – Faltantes\n\n`;
    config.paises.forEach(p => {
      const f = config.catalogoArray.filter(s => s.sigla === p.sigla && !inventario[s.id]?.obtenido);
      if (f.length > 0 && p.sigla !== 'CC') text += `${p.sigla} ${config.emojis[p.sigla]||''}: ${f.map(s => s.numero).join(', ')}\n`;
    });
    text += '\nhttps://panini26.vercel.app/';
    if (navigator.share) { try { await navigator.share({ title: `Faltantes ${config.nombre}`, text }); } catch { /* user cancelled */ } }
    else { navigator.clipboard.writeText(text); alert('¡Lista copiada al portapapeles!'); }
  };

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-30 text-white shadow-lg" style={{ background: config.gradient }}>
        <div className="p-4 pb-2 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black flex items-center gap-2"><BookOpen size={22} /> Mi Álbum</h1>
            <p className="text-[10px] opacity-60 mt-0.5">{config.nombre}</p>
          </div>
          <button onClick={handleShare} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="Compartir faltantes">
            <Share2 size={20} />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="flex justify-between items-center bg-black/20 rounded-xl p-3">
            <div>
              <p className="text-[10px] text-amber-200/80 font-semibold mb-1">PROGRESO ({config.totalBase} láminas base)</p>
              <p className="text-3xl font-black leading-none">{stats.totales.porcentaje}%</p>
            </div>
            <div className="text-right flex gap-4">
              <div><p className="text-[10px] opacity-60">Obtenidas</p><p className="text-xl font-black">{stats.totales.obtenidos}</p></div>
              <div><p className="text-[10px] opacity-60">Faltantes</p><p className="text-xl font-black text-red-300">{stats.totales.faltantes}</p></div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Buscar país o sigla..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ fontSize: '16px' }}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white/95 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-white/60 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {config.grupos.map(grupo => {
          const gStats = stats.grupos[grupo];
          if (!gStats) return null;
          const paisesOrig = config.paises.filter(p => p.grupo === grupo);
          const paisesGrupo = busqueda
            ? paisesOrig.filter(p => normalizeText(p.nombre).includes(normalizeText(busqueda)) || normalizeText(p.sigla).includes(normalizeText(busqueda)))
            : paisesOrig;
          if (busqueda && paisesGrupo.length === 0) return null;
          const isOpen = busqueda ? true : !!openGroups[grupo];

          return (
            <div key={grupo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleAccordion(grupo)}
                className={`w-full flex justify-between items-center p-4 transition-colors min-h-[56px] ${isOpen ? 'bg-gray-50 border-b border-gray-100' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex-shrink-0 p-1 rounded-full text-white" style={{ background: isOpen ? config.color1 : '#9ca3af' }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                  <h2 className="font-bold text-gray-800 text-sm text-left leading-tight truncate pr-2">
                    {getGrupoTitulo(grupo, config.paises)}
                  </h2>
                </div>
                <div className="text-right min-w-[64px] flex-shrink-0">
                  <span className="text-xs font-black text-gray-700">{gStats.obtenidos} <span className="text-gray-400 font-normal">/ {gStats.total}</span></span>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${gStats.porcentaje}%` }} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="p-2 space-y-3 bg-gray-50/50">
                  {paisesGrupo.map(pais => {
                    const pStats = stats.paises[pais.sigla];
                    if (!pStats) return null;
                    const stickers = config.catalogoArray.filter(s => s.sigla === pais.sigla);
                    const completo = Number(pStats.porcentaje) === 100;
                    return (
                      <div key={pais.sigla} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="px-3 py-2 flex justify-between items-center border-b border-gray-100">
                          <h3 className="font-bold text-gray-700 flex items-center gap-1.5 text-sm min-w-0">
                            <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: config.color1 }} />
                            <span className="text-base leading-none">{config.emojis[pais.sigla]}</span>
                            <span className="truncate">{pais.nombre}</span>
                            <span className="text-xs font-normal text-gray-400 flex-shrink-0">({pais.sigla})</span>
                          </h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${completo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {pStats.obtenidos}/{pStats.total}
                          </span>
                        </div>
                        <div className="sticker-grid grid grid-cols-5 gap-px bg-gray-200 p-px">
                          {stickers.map(sticker => {
                            const obtenido = !!inventario[sticker.id]?.obtenido;
                            const isPending = pendingAdds.has(sticker.id);
                            return (
                              <div
                                key={sticker.id}
                                onClick={() => togglePending(sticker.id)}
                                onTouchStart={() => handlePressStart(sticker.id, obtenido)}
                                onTouchEnd={handlePressEnd}
                                onMouseDown={() => handlePressStart(sticker.id, obtenido)}
                                onMouseUp={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onContextMenu={e => { if (obtenido) e.preventDefault(); }}
                                className={`relative flex items-center justify-center select-none cursor-pointer transition-all ${
                                  obtenido ? 'bg-emerald-100/90 shadow-inner'
                                  : isPending ? 'bg-blue-50 outline outline-2 outline-blue-500'
                                  : 'bg-white opacity-40 hover:opacity-60'
                                }`}
                                style={{ height: '60px', touchAction: 'manipulation', minHeight: '44px' }}
                              >
                                <span className={`text-[11px] font-black tracking-tight ${obtenido ? 'text-emerald-900' : isPending ? 'text-blue-700' : 'text-gray-500'}`}>
                                  {sticker.id.replace('-', ' ')}
                                </span>
                                {obtenido && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pendingAdds.size > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-50"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)' }}>
          <button
            onClick={handleConfirm}
            className="w-full text-white font-bold text-lg py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', touchAction: 'manipulation' }}
          >
            <Save size={22} /> Guardar {pendingAdds.size} {pendingAdds.size === 1 ? 'Lámina' : 'Láminas'}
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * ==========================================
 * 12. TAB: FALTANTES EXPRESS
 * ==========================================
 */
const TabFaltantes = React.memo(({ inventario, hacerCommitNuevas, config }) => {
  const [pendingAdds, setPendingAdds] = useState(new Set());
  const [busqueda, setBusqueda] = useState('');

  const faltantes = useMemo(() =>
    config.catalogoArray.filter(s => !inventario[s.id]?.obtenido && s.grupo !== config.ccGroup),
    [inventario, config]
  );

  const togglePending = (id) => setPendingAdds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleConfirm = () => { hacerCommitNuevas(Array.from(pendingAdds)); setPendingAdds(new Set()); };

  return (
    <div className="pb-28 bg-gray-50">
      <div className="sticky top-0 z-30 text-white shadow-lg" style={{ background: config.gradient }}>
        <div className="p-4 pb-2 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black flex items-center gap-2"><ListChecks size={22} /> Faltantes Express</h1>
            <p className="text-[10px] opacity-60 mt-0.5">{config.nombre}</p>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-bold">
            Faltan: <span className="text-xl font-black">{faltantes.length}</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" />
            <input
              type="text" placeholder="Buscar país..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ fontSize: '16px' }}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-blue-800/50 text-white placeholder-blue-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <p className="px-4 py-2 text-[10px] text-gray-500 bg-white border-b uppercase font-bold text-center tracking-wider">
        Toca las láminas que conseguiste para marcarlas
      </p>

      <div className="p-3">
        {config.paises.map(pais => {
          if (config.ccGroup && (pais.sigla === 'CC' || pais.grupo === config.ccGroup)) return null;
          if (busqueda && !normalizeText(pais.nombre).includes(normalizeText(busqueda)) && !normalizeText(pais.sigla).includes(normalizeText(busqueda))) return null;
          const fp = faltantes.filter(s => s.sigla === pais.sigla);
          if (fp.length === 0) return null;
          return (
            <div key={pais.sigla} className="mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="font-bold text-gray-700 bg-gray-50 px-3 py-2.5 border-b border-gray-100 flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full" />
                  <span className="text-base leading-none">{config.emojis[pais.sigla]}</span>
                  {pais.nombre} <span className="text-xs font-normal text-gray-400">({pais.sigla})</span>
                </span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{fp.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {fp.map(s => {
                  const isPending = pendingAdds.has(s.id);
                  return (
                    <button
                      key={s.id} onClick={() => togglePending(s.id)}
                      className={`px-3 py-2 rounded-lg font-bold text-sm border transition-all ${isPending ? 'bg-blue-600 text-white border-blue-700 shadow scale-105' : 'bg-white text-gray-600 border-gray-200'}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {s.id.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pendingAdds.size > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-50"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)' }}>
          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ touchAction: 'manipulation' }}
          >
            <Save size={22} /> Marcar {pendingAdds.size} como Obtenidas
          </button>
        </div>
      )}
    </div>
  );
});

/**
 * ==========================================
 * 13. TAB: MIS REPETIDAS
 * ==========================================
 */
const TabRepetidas = React.memo(({ inventario, modificarRepetida, config }) => {
  const [openGroups, setOpenGroups] = useState(() => ({ [config.grupos[0]]: true }));
  const [busqueda, setBusqueda] = useState('');

  const totalRepetidas = useMemo(() =>
    config.catalogoArray.reduce((acc, s) => acc + (inventario[s.id]?.cantidadRepetidas || 0), 0),
    [inventario, config]
  );

  const toggleAccordion = (g) => setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const handleShare = async () => {
    let text = `${config.nombre} – Repetidas\n\n`;
    config.paises.forEach(p => {
      const rep = config.catalogoArray.filter(s => s.sigla === p.sigla && (inventario[s.id]?.cantidadRepetidas || 0) > 0);
      if (rep.length > 0) {
        const parts = rep.map(s => { const c = inventario[s.id].cantidadRepetidas; return c > 1 ? `${s.numero}(x${c})` : s.numero; });
        text += `${p.sigla} ${config.emojis[p.sigla]||''}: ${parts.join(', ')}\n`;
      }
    });
    text += '\nhttps://panini26.vercel.app/';
    if (navigator.share) { try { await navigator.share({ title: `Repetidas ${config.nombre}`, text }); } catch { /* user cancelled */ } }
    else { navigator.clipboard.writeText(text); alert('¡Lista copiada!'); }
  };

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-30 text-white shadow-lg" style={{ background: 'linear-gradient(to bottom, #d97706, #92400e)' }}>
        <div className="p-4 pb-2 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black flex items-center gap-2"><Layers size={22} /> Mis Repetidas</h1>
            <p className="text-[10px] opacity-60 mt-0.5">{config.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-bold">
              Total: <span className="text-xl font-black">{totalRepetidas}</span>
            </div>
            <button onClick={handleShare} disabled={totalRepetidas === 0}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 disabled:opacity-40 transition-colors" style={{ touchAction: 'manipulation' }}>
              <Share2 size={20} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200 pointer-events-none" />
            <input
              type="text" placeholder="Buscar país..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ fontSize: '16px' }}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-amber-800/30 text-white placeholder-amber-200 font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </div>

      <p className="px-4 py-2 text-[10px] text-gray-500 bg-white border-b uppercase font-bold text-center tracking-wider">
        Toca el cromo para sumarlo a repetidas
      </p>

      <div className="p-3 space-y-3">
        {config.grupos.map(grupo => {
          const paisesOrig = config.paises.filter(p => p.grupo === grupo);
          const paisesGrupo = busqueda ? paisesOrig.filter(p => normalizeText(p.nombre).includes(normalizeText(busqueda)) || normalizeText(p.sigla).includes(normalizeText(busqueda))) : paisesOrig;
          if (busqueda && paisesGrupo.length === 0) return null;
          const isOpen = busqueda ? true : !!openGroups[grupo];
          const repGrupo = config.catalogoArray.filter(s => s.grupo === grupo).reduce((a, s) => a + (inventario[s.id]?.cantidadRepetidas || 0), 0);

          return (
            <div key={grupo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleAccordion(grupo)}
                className={`w-full flex justify-between items-center p-4 transition-colors min-h-[56px] ${isOpen ? 'bg-amber-50/50 border-b border-gray-100' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="flex-shrink-0 p-1 rounded-full text-white" style={{ background: isOpen ? '#d97706' : '#9ca3af' }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                  <h2 className="font-bold text-gray-800 text-sm text-left truncate">{getGrupoTitulo(grupo, config.paises)}</h2>
                </div>
                {repGrupo > 0 && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{repGrupo} disp.</span>}
              </button>

              {isOpen && (
                <div className="p-2 space-y-3 bg-gray-50/50">
                  {paisesGrupo.map(pais => {
                    const stickers = config.catalogoArray.filter(s => s.sigla === pais.sigla);
                    return (
                      <div key={pais.sigla} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <h3 className="font-bold text-gray-700 flex items-center gap-1.5 text-sm">
                            <span className="w-1 h-4 bg-amber-500 rounded-full flex-shrink-0" />
                            <span className="text-base leading-none">{config.emojis[pais.sigla]}</span>
                            {pais.nombre} <span className="text-xs font-normal text-gray-400">({pais.sigla})</span>
                          </h3>
                        </div>
                        <div className="sticker-grid grid grid-cols-5 gap-px bg-gray-200 p-px">
                          {stickers.map(sticker => {
                            const cant = inventario[sticker.id]?.cantidadRepetidas || 0;
                            return (
                              <div
                                key={sticker.id}
                                onClick={() => modificarRepetida(sticker.id, 1)}
                                className={`relative flex flex-col items-center justify-center transition-all cursor-pointer select-none ${cant > 0 ? 'bg-amber-100' : 'bg-white hover:bg-gray-50'}`}
                                style={{ height: '60px', touchAction: 'manipulation', minHeight: '44px' }}
                              >
                                <span className={`text-[11px] font-black tracking-tight ${cant > 0 ? 'text-amber-900 mb-1' : 'text-gray-500'}`}>
                                  {sticker.id.replace('-', ' ')}
                                </span>
                                {cant > 0 && (
                                  <div className="flex items-center justify-between w-[92%] px-0.5 py-0.5 bg-white/80 rounded-full shadow-sm" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => modificarRepetida(sticker.id, -1)} className="touch-sm text-gray-500 hover:text-red-500 p-2" style={{ touchAction: 'manipulation', minHeight: 'unset' }}><Minus size={10} /></button>
                                    <span className="text-[10px] font-black text-amber-700">{cant}</span>
                                    <button onClick={() => modificarRepetida(sticker.id, 1)} className="touch-sm text-gray-500 hover:text-emerald-500 p-2" style={{ touchAction: 'manipulation', minHeight: 'unset' }}><Plus size={10} /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * ==========================================
 * 14. TAB: INTERCAMBIOS
 * ==========================================
 */
const TabIntercambios = React.memo(({ inventario, ejecutarIntercambioMasivo, config }) => {
  const [step, setStep] = useState(1);
  const [doyCantidades, setDoyCantidades] = useState({});
  const [reciboIds, setReciboIds] = useState(new Set());
  const [busquedaRecibo, setBusquedaRecibo] = useState('');

  const repetidas = useMemo(() => config.catalogoArray.filter(s => (inventario[s.id]?.cantidadRepetidas || 0) > 0), [inventario, config]);
  const faltantes = useMemo(() => config.catalogoArray.filter(s => !inventario[s.id]?.obtenido), [inventario, config]);

  const toggleDoy = (id, max) => setDoyCantidades(p => ({ ...p, [id]: p[id] >= max ? 0 : (p[id] || 0) + 1 }));
  const toggleRecibo = (id) => setReciboIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const procesar = () => {
    ejecutarIntercambioMasivo(doyCantidades, Array.from(reciboIds));
    setDoyCantidades({}); setReciboIds(new Set()); setStep(1); setBusquedaRecibo('');
    alert('¡Intercambio registrado con éxito!');
  };

  const totalDoy = Object.values(doyCantidades).reduce((a, b) => a + b, 0);

  return (
    <div className="pb-28 bg-gray-50">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-700"><RefreshCw size={22} /> Nuevo Intercambio</h2>
        <p className="text-[10px] text-gray-400 mt-0.5">{config.nombre}</p>
        <div className="flex gap-2 mt-3">
          {[1,2,3].map(s => <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-emerald-600' : 'bg-gray-200'}`} />)}
        </div>
      </div>

      <div className="p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Tus Repetidas <span className="text-sm text-gray-400 font-normal">(Vas a dar)</span></h3>
            <div className="grid grid-cols-3 gap-2">
              {repetidas.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10 text-sm">No tienes repetidas disponibles.</p>}
              {repetidas.map(s => {
                const max = inventario[s.id].cantidadRepetidas;
                const selec = doyCantidades[s.id] || 0;
                return (
                  <button key={s.id} onClick={() => toggleDoy(s.id, max)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${selec > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
                    style={{ touchAction: 'manipulation' }}>
                    <span className="font-bold text-[13px]">{s.id.replace('-', ' ')}</span>
                    {selec > 0
                      ? <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Dar {selec}</span>
                      : <span className="text-[10px] text-gray-400">Disp: {max}</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(2)} disabled={totalDoy === 0}
              className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-opacity"
              style={{ touchAction: 'manipulation' }}>
              Siguiente <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Faltantes <span className="text-sm text-gray-400 font-normal">(Vas a recibir)</span></h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Buscar país..." value={busquedaRecibo} onChange={e => setBusquedaRecibo(e.target.value)}
                style={{ fontSize: '16px' }}
                className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm border overflow-y-auto hide-scrollbar" style={{ maxHeight: '42dvh', WebkitOverflowScrolling: 'touch' }}>
              {config.paises.map(pais => {
                if (busquedaRecibo && !normalizeText(pais.nombre).includes(normalizeText(busquedaRecibo)) && !normalizeText(pais.sigla).includes(normalizeText(busquedaRecibo))) return null;
                const fp = faltantes.filter(s => s.sigla === pais.sigla);
                if (fp.length === 0) return null;
                return (
                  <div key={pais.sigla} className="mb-3">
                    <h4 className="font-bold text-gray-600 bg-gray-50 px-2 py-1.5 text-sm rounded">{config.emojis[pais.sigla]} {pais.nombre}</h4>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {fp.map(s => (
                        <div key={s.id} onClick={() => toggleRecibo(s.id)}
                          className={`py-3 rounded-lg flex items-center justify-center font-bold text-[12px] cursor-pointer border transition-all ${reciboIds.has(s.id) ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}
                          style={{ touchAction: 'manipulation' }}>
                          {s.id.replace('-', ' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="p-4 bg-gray-200 rounded-xl font-bold" style={{ touchAction: 'manipulation' }}>Atrás</button>
              <button onClick={() => setStep(3)} disabled={reciboIds.size === 0}
                className="flex-1 bg-emerald-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50"
                style={{ touchAction: 'manipulation' }}>
                Siguiente <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Resumen del Intercambio</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border divide-y">
              <div className="p-4 bg-red-50">
                <p className="text-sm font-bold text-red-600 mb-2">Das ({totalDoy}):</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(doyCantidades).filter(([,c]) => c > 0).map(([id,c]) => (
                    <span key={id} className="bg-white px-2 py-1 rounded border border-red-200 text-xs font-bold">{id.replace('-',' ')} (x{c})</span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-emerald-50">
                <p className="text-sm font-bold text-emerald-600 mb-2">Recibes ({reciboIds.size}):</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(reciboIds).map(id => (
                    <span key={id} className="bg-white px-2 py-1 rounded border border-emerald-200 text-xs font-bold">{id.replace('-',' ')}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="p-4 bg-gray-200 rounded-xl font-bold" style={{ touchAction: 'manipulation' }}>Atrás</button>
              <button onClick={procesar} className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2" style={{ touchAction: 'manipulation' }}>
                <CheckCircle2 size={20} /> Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * ==========================================
 * 15. MAIN APP
 * ==========================================
 */
export default function App() {
  const [mundialActivo, setMundialActivo] = useState('2026');
  const [tabActivo, setTabActivo] = useState('album');
  const state = usePaniniState(mundialActivo);
  const config = MUNDIALES_CONFIG[mundialActivo];

  if (state.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">⚽</div>
        <p className="font-black text-lg animate-pulse" style={{ color: config.color1 }}>Cargando álbum…</p>
        <p className="text-gray-400 text-sm mt-1">{config.nombre}</p>
      </div>
    </div>
  );

  const TABS = [
    { id: 'album',       label: 'Álbum',    Icon: BookOpen },
    { id: 'faltantes',   label: 'Faltantes', Icon: ListChecks },
    { id: 'repetidas',   label: 'Repetidas', Icon: Layers },
    { id: 'intercambios',label: 'Cambios',  Icon: RefreshCw },
  ];

  return (
    <div className="h-dvh bg-gray-100 font-sans text-gray-900 mx-auto max-w-[480px] shadow-2xl relative flex flex-col overflow-hidden">
      {/* World selector – siempre visible en la cima */}
      <WorldSelector mundialActivo={mundialActivo} setMundialActivo={(key) => { setMundialActivo(key); setTabActivo('album'); }} />

      {/* Contenido principal scrollable */}
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {tabActivo === 'album' && (
          <TabAlbum key={mundialActivo} inventario={state.inventario} hacerCommitNuevas={state.hacerCommitNuevas} removerCromoObtenido={state.removerCromoObtenido} config={config} />
        )}
        {tabActivo === 'faltantes' && (
          <TabFaltantes key={mundialActivo} inventario={state.inventario} hacerCommitNuevas={state.hacerCommitNuevas} config={config} />
        )}
        {tabActivo === 'repetidas' && (
          <TabRepetidas key={mundialActivo} inventario={state.inventario} modificarRepetida={state.modificarRepetida} config={config} />
        )}
        {tabActivo === 'intercambios' && (
          <TabIntercambios key={mundialActivo} inventario={state.inventario} ejecutarIntercambioMasivo={state.ejecutarIntercambioMasivo} config={config} />
        )}
      </main>

      {/* Barra de navegación inferior */}
      <nav
        className="flex-shrink-0 bg-white border-t border-gray-200 flex justify-around items-stretch z-40 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          minHeight: '64px'
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = tabActivo === id;
          return (
            <button
              key={id}
              onClick={() => setTabActivo(id)}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-colors"
              style={{ minHeight: '44px', color: isActive ? config.color1 : '#9ca3af', touchAction: 'manipulation' }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold">{label}</span>
              {isActive && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: config.color1 }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}