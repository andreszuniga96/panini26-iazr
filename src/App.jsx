import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, RefreshCw, DollarSign, Plus, Minus, Search, 
  CheckCircle2, ArrowRight, Zap, X, History, Layers, 
  Save, ChevronDown, ChevronUp, ChevronRight, Share2, ListChecks
} from 'lucide-react';

/**
 * ==========================================
 * 1. CONFIGURACIÓN DE BASE DE DATOS (MOCK CLOUD-READY)
 * ==========================================
 */

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const supabase = {
  from: (table) => ({
    select: (cols) => {
      const query = {
        eq: (key, val) => { query._eq = { key, val }; return query; },
        single: () => { query._single = true; return query; },
        then: (resolve) => {
          setTimeout(() => {
            try {
              let data = JSON.parse(localStorage.getItem(`sb_${table}`) || '[]');
              if (!Array.isArray(data)) data = [data]; 
              if (query._eq) data = data.filter(d => d[query._eq.key] === query._eq.val);
              if (query._single) resolve({ data: data[0] || null, error: null });
              else resolve({ data, error: null });
            } catch (e) { resolve({ data: null, error: e }); }
          }, 150);
        }
      };
      return query;
    },
    upsert: async (payload) => {
      await delay(100);
      let existing = JSON.parse(localStorage.getItem(`sb_${table}`) || '[]');
      if (!Array.isArray(existing)) existing = [];
      const payloads = Array.isArray(payload) ? payload : [payload];
      payloads.forEach(p => {
         const idx = existing.findIndex(e => e.id === p.id);
         if (idx >= 0) existing[idx] = { ...existing[idx], ...p };
         else existing.push(p);
      });
      localStorage.setItem(`sb_${table}`, JSON.stringify(existing));
      return { data: payload, error: null };
    }
  })
};

/**
 * ==========================================
 * 2. ARQUITECTURA DE DATOS OFICIAL 2026
 * ==========================================
 */
const GRUPOS = ['Especial', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Coca-Cola'];

const PAISES = [
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
  { sigla: 'CC', nombre: 'Coca-Cola (Extras)', grupo: 'Coca-Cola' }
];

const EMOJIS = {
  'FWC': '📜', 'MEX': '🇲🇽', 'RSA': '🇿🇦', 'KOR': '🇰🇷', 'CZE': '🇨🇿',
  'CAN': '🇨🇦', 'BIH': '🇧🇦', 'QAT': '🇶🇦', 'SUI': '🇨🇭',
  'BRA': '🇧🇷', 'MAR': '🇲🇦', 'HAI': '🇭🇹', 'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'PAR': '🇵🇾', 'AUS': '🇦🇺', 'TUR': '🇹🇷',
  'GER': '🇩🇪', 'CUW': '🇨🇼', 'CIV': '🇨🇮', 'ECU': '🇪🇨',
  'NED': '🇳🇱', 'JPN': '🇯🇵', 'SWE': '🇸🇪', 'TUN': '🇹🇳',
  'BEL': '🇧🇪', 'EGY': '🇪🇬', 'IRN': '🇮🇷', 'NZL': '🇳🇿',
  'ESP': '🇪🇸', 'CPV': '🇨🇻', 'KSA': '🇸🇦', 'URU': '🇺🇾',
  'FRA': '🇫🇷', 'SEN': '🇸🇳', 'IRQ': '🇮🇶', 'NOR': '🇳🇴',
  'ARG': '🇦🇷', 'ALG': '🇩🇿', 'AUT': '🇦🇹', 'JOR': '🇯🇴',
  'POR': '🇵🇹', 'COD': '🇨🇩', 'UZB': '🇺🇿', 'COL': '🇨🇴',
  'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'CRO': '🇭🇷', 'GHA': '🇬🇭', 'PAN': '🇵🇦',
  'CC': '🥤'
};

const generarCatalogoOficial = () => {
  const catalogo = [];
  PAISES.forEach(pais => {
    if (pais.sigla === 'FWC') {
      catalogo.push({ id: '00', sigla: 'FWC', numero: '00', tipo: 'especial_fwc', grupo: pais.grupo });
      for (let i = 1; i <= 19; i++) {
        catalogo.push({ id: `FWC-${i}`, sigla: 'FWC', numero: i.toString(), tipo: 'especial_fwc', grupo: pais.grupo });
      }
    } else if (pais.sigla === 'CC') {
      for (let i = 1; i <= 14; i++) {
        catalogo.push({ id: `CC-${i}`, sigla: 'CC', numero: i.toString(), tipo: 'coca_cola', grupo: pais.grupo });
      }
    } else {
      for (let i = 1; i <= 20; i++) {
        let tipo = 'retrato';
        if (i === 1) tipo = 'escudo_especial';
        else if (i === 2) tipo = 'grupal';
        catalogo.push({ id: `${pais.sigla}-${i}`, sigla: pais.sigla, numero: i.toString(), tipo, grupo: pais.grupo });
      }
    }
  });
  return catalogo;
};

const CATALOGO_ARRAY = generarCatalogoOficial();
const CATALOGO_MAP = CATALOGO_ARRAY.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

const getGrupoTitulo = (grupo) => {
  if (grupo === 'Especial') return 'Cromos Especiales (FWC)';
  if (grupo === 'Coca-Cola') return 'Extra: Coca-Cola (CC)';
  const siglas = PAISES.filter(p => p.grupo === grupo).map(p => p.sigla).join('-');
  return `Grupo ${grupo} (${siglas})`;
};

const normalizeText = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

<<<<<<< HEAD
=======
// --- ALGORITMO DE COMPRESIÓN DE LISTAS ---
// Agrupa números consecutivos en rangos (Ej: 1, 2, 3, 5 -> "1-3, 5")
const condensarNumerosArray = (numsArr) => {
  if (!numsArr || numsArr.length === 0) return '';
  const nums = numsArr.sort((a, b) => a - b);
  let rangos = [];
  let inicio = nums[0];
  let anterior = nums[0];

  for (let i = 1; i <= nums.length; i++) {
    if (nums[i] === anterior + 1) {
      anterior = nums[i];
    } else {
      const strInicio = inicio === 0 ? '00' : inicio;
      const strAnterior = anterior === 0 ? '00' : anterior;
      rangos.push(inicio === anterior ? `${strInicio}` : `${strInicio}-${strAnterior}`);
      if (i < nums.length) {
        inicio = nums[i];
        anterior = nums[i];
      }
    }
  }
  return rangos.join(', ');
};

>>>>>>> 0c66a0d (feat: Modulo de faltantes corregidos)
/**
 * ==========================================
 * 3. CUSTOM HOOK (Estado y Nube)
 * ==========================================
 */
function usePaniniState() {
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState({});
  const [finanzas, setFinanzas] = useState({ ventas: [], gastosAcumulados: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resInv, resFin] = await Promise.all([
          supabase.from('inventario').select('id, obtenido, cantidad_repetidas'),
          supabase.from('finanzas').select('*').eq('id', 1).single()
        ]);
        
        const newInv = {};
        if (resInv.data) {
          resInv.data.forEach(row => { newInv[row.id] = { obtenido: row.obtenido, cantidadRepetidas: row.cantidad_repetidas }; });
        }
        setInventario(newInv);

        if (resFin.data) {
          setFinanzas({ ventas: resFin.data.ventas || [], gastosAcumulados: resFin.data.gastos_acumulados || 0 });
        }
      } catch (error) {
        console.error("Error al conectar con Supabase:", error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hacerCommitNuevas = async (idsArray) => {
    const nuevoInv = { ...inventario };
    const rowsToUpsert = [];
    idsArray.forEach(id => {
      if (CATALOGO_MAP[id]) {
        const item = nuevoInv[id] || { obtenido: false, cantidadRepetidas: 0 };
        nuevoInv[id] = { ...item, obtenido: true };
        rowsToUpsert.push({ id, obtenido: true, cantidad_repetidas: item.cantidadRepetidas });
      }
    });
    setInventario(nuevoInv);
    if (rowsToUpsert.length > 0) await supabase.from('inventario').upsert(rowsToUpsert);
  };

  const modificarRepetida = async (id, delta) => {
    const nuevoInv = { ...inventario };
    const item = nuevoInv[id] || { obtenido: false, cantidadRepetidas: 0 };
    const nuevaCantidad = Math.max(0, item.cantidadRepetidas + delta);
    nuevoInv[id] = { ...item, cantidadRepetidas: nuevaCantidad };
    setInventario(nuevoInv);
    await supabase.from('inventario').upsert([{ id, obtenido: nuevoInv[id].obtenido, cantidad_repetidas: nuevaCantidad }]);
  };

  const removerCromoObtenido = async (id) => {
    const nuevoInv = { ...inventario };
    if (nuevoInv[id]) {
      nuevoInv[id] = { ...nuevoInv[id], obtenido: false };
      setInventario(nuevoInv);
      await supabase.from('inventario').upsert([{ id, obtenido: false, cantidad_repetidas: nuevoInv[id].cantidadRepetidas }]);
    }
  };

  const ejecutarIntercambioMasivo = async (dadasObj, recibidasArr) => {
    const nuevoInv = { ...inventario };
    const rowsToUpsert = [];
    
    Object.entries(dadasObj).forEach(([id, cant]) => {
      if (cant > 0) {
        nuevoInv[id].cantidadRepetidas -= cant;
        rowsToUpsert.push({ id, obtenido: nuevoInv[id].obtenido, cantidad_repetidas: nuevoInv[id].cantidadRepetidas });
      }
    });

    recibidasArr.forEach(id => {
      const item = nuevoInv[id] || { obtenido: false, cantidadRepetidas: 0 };
      if (!item.obtenido) nuevoInv[id] = { ...item, obtenido: true };
      else nuevoInv[id] = { ...item, cantidadRepetidas: item.cantidadRepetidas + 1 };
      rowsToUpsert.push({ id, obtenido: nuevoInv[id].obtenido, cantidad_repetidas: nuevoInv[id].cantidadRepetidas });
    });

    setInventario(nuevoInv);
    if (rowsToUpsert.length > 0) await supabase.from('inventario').upsert(rowsToUpsert);
  };

  return { 
    loading, inventario, finanzas, 
    hacerCommitNuevas, modificarRepetida, removerCromoObtenido, ejecutarIntercambioMasivo
  };
}

function useAlbumStats(inventario) {
  return useMemo(() => {
    let totales = { obtenidos: 0, faltantes: 980, porcentaje: 0 };
    let grupos = {};
    let paises = {};

    CATALOGO_ARRAY.forEach(s => {
      const obtenido = inventario[s.id]?.obtenido ? 1 : 0;
      
      if (s.grupo !== 'Coca-Cola') totales.obtenidos += obtenido;

      if (!grupos[s.grupo]) {
        let total = 80;
        if (s.grupo === 'Especial') total = 20;
        if (s.grupo === 'Coca-Cola') total = 14;
        grupos[s.grupo] = { obtenidos: 0, total };
      }
      grupos[s.grupo].obtenidos += obtenido;

      if (!paises[s.sigla]) {
        let total = 20;
        if (s.sigla === 'CC') total = 14;
        paises[s.sigla] = { obtenidos: 0, total };
      }
      paises[s.sigla].obtenidos += obtenido;
    });

    totales.faltantes = 980 - totales.obtenidos;
    totales.porcentaje = ((totales.obtenidos / 980) * 100).toFixed(1);

    Object.keys(grupos).forEach(g => {
      grupos[g].porcentaje = ((grupos[g].obtenidos / grupos[g].total) * 100).toFixed(0);
    });

    Object.keys(paises).forEach(p => {
      paises[p].porcentaje = ((paises[p].obtenidos / paises[p].total) * 100).toFixed(0);
    });

    return { totales, grupos, paises };
  }, [inventario]);
}

/**
 * ==========================================
 * 5. COMPONENTES VISUALES UI
 * ==========================================
 */

// ================== TAB 1: MI ÁLBUM ==================
const TabAlbum = ({ inventario, hacerCommitNuevas, removerCromoObtenido }) => {
  const stats = useAlbumStats(inventario);
  const [pendingAdds, setPendingAdds] = useState(new Set());
  const [openGroups, setOpenGroups] = useState({ 'Especial': true }); 
  const [busqueda, setBusqueda] = useState('');
  const pressTimer = useRef(null);

  const togglePending = (id) => {
    const item = inventario[id];
    if (item?.obtenido) return; 
    setPendingAdds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePressStart = (id, obtenido) => {
    if (!obtenido) return;
    pressTimer.current = setTimeout(() => {
      if (window.confirm(`¿Estás seguro de remover el cromo ${id.replace('-',' ')} de tu álbum?`)) {
        removerCromoObtenido(id);
      }
    }, 800);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const handleConfirm = () => { hacerCommitNuevas(Array.from(pendingAdds)); setPendingAdds(new Set()); };
  const toggleAccordion = (grupo) => setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));

  const handleShareFaltantes = async () => {
<<<<<<< HEAD
    let contenido = "⚽ *MIS FALTANTES - PANINI 2026* ⚽\n";
    contenido += `📅 Fecha: ${new Date().toLocaleDateString()}\n`;
    contenido += `🔍 Me faltan: ${stats.totales.faltantes} cromos\n`;

    GRUPOS.forEach(grupo => {
      const paisesGrupo = PAISES.filter(p => p.grupo === grupo);
      let grupoTieneFaltantes = false;
      let textoGrupo = `\n📍 *${getGrupoTitulo(grupo).toUpperCase()}*\n`;

      paisesGrupo.forEach(pais => {
        const faltantesPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla && !inventario[s.id]?.obtenido);
        if (faltantesPais.length > 0) {
          grupoTieneFaltantes = true;
          textoGrupo += `🔸 *${pais.nombre}* (${pais.sigla}):\n`;
          const listaCromos = faltantesPais.map(s => s.id.replace('-', ' '));
          textoGrupo += listaCromos.join(', ') + '\n';
        }
      });

      if (grupoTieneFaltantes) contenido += textoGrupo;
    });

=======
    let contenido = "Figuritas App - Lista\nUsa Méx Can 26\n\nFaltantes\n";

    PAISES.forEach(pais => {
      const faltantesPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla && !inventario[s.id]?.obtenido);
      if (faltantesPais.length > 0 && pais.sigla !== 'CC') {
        const nums = faltantesPais.map(s => s.numero === '00' ? '00' : parseInt(s.numero));
        contenido += `${pais.sigla} ${EMOJIS[pais.sigla]}: ${nums.join(', ')}\n`;
      }
    });

    contenido += "\nGestiona tu álbum desde el siguiente link:\nhttps://panini26.vercel.app/";

>>>>>>> 0c66a0d (feat: Modulo de faltantes corregidos)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mis Faltantes Panini 2026',
          text: contenido,
        });
      } catch (e) { console.log("Compartir cancelado o falló", e); }
    } else {
      navigator.clipboard.writeText(contenido);
<<<<<<< HEAD
      if (window.confirm("¡Lista copiada al portapapeles!\n¿Deseas abrir WhatsApp Web/App para enviarla?")) {
        window.open(`https://wa.me/?text=${encodeURIComponent(contenido)}`, '_blank');
=======
      if (window.confirm("¡Lista copiada al portapapeles!\n(Pégala directamente en el chat para evitar recortes)\n\n¿Deseas abrir WhatsApp Web para enviarla?")) {
        const urlWA = contenido.length > 2000 ? 'https://web.whatsapp.com/' : `https://api.whatsapp.com/send?text=${encodeURIComponent(contenido)}`;
        window.open(urlWA, '_blank');
>>>>>>> 0c66a0d (feat: Modulo de faltantes corregidos)
      }
    }
  };

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#8a1538] to-[#600e26] text-white shadow-lg">
        <div className="p-4 pb-2 flex justify-between items-center">
          <h1 className="text-xl font-black flex items-center gap-2"><BookOpen size={24}/> Mi Álbum</h1>
          <button onClick={handleShareFaltantes} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="Compartir a WhatsApp">
             <Share2 size={20} />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="flex justify-between items-center bg-black/20 rounded-xl p-3 backdrop-blur-sm">
            <div>
              <p className="text-xs text-amber-200/80 font-semibold mb-1">PROGRESO GLOBAL (Base 980)</p>
              <p className="text-2xl font-black">{stats.totales.porcentaje}%</p>
            </div>
            <div className="text-right flex gap-4">
              <div><p className="text-[10px] opacity-70">Obtenidos</p><p className="font-bold">{stats.totales.obtenidos}</p></div>
              <div><p className="text-[10px] opacity-70">Faltantes</p><p className="font-bold text-red-300">{stats.totales.faltantes}</p></div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 mt-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar país o sigla (ej. MEX)..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/95 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {GRUPOS.map(grupo => {
          const gStats = stats.grupos[grupo];
          
          const paisesGrupoOrig = PAISES.filter(p => p.grupo === grupo);
          const paisesGrupo = busqueda 
            ? paisesGrupoOrig.filter(p => normalizeText(p.nombre).includes(normalizeText(busqueda)) || normalizeText(p.sigla).includes(normalizeText(busqueda)))
            : paisesGrupoOrig;

          if (busqueda && paisesGrupo.length === 0) return null;
          const isOpen = busqueda ? true : openGroups[grupo];

          return (
            <div key={grupo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => toggleAccordion(grupo)}
                className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-gray-50 border-b border-gray-200' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-1 rounded-full ${isOpen ? 'bg-[#8a1538]/10 text-[#8a1538]' : 'bg-gray-100 text-gray-500'}`}>
                    {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </span>
                  <h2 className="font-bold text-gray-800 text-sm md:text-base text-left leading-tight">
                    {getGrupoTitulo(grupo)}
                  </h2>
                </div>
                <div className="text-right min-w-[70px]">
                  <span className="text-xs font-black text-gray-700">
                    {gStats.obtenidos} <span className="text-gray-400 font-medium">/ {gStats.total}</span>
                  </span>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1"><div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{width: `${gStats.porcentaje}%`}}></div></div>
                </div>
              </button>

              {isOpen && (
                <div className="p-2 space-y-4 bg-gray-50/50">
                  {paisesGrupo.map(pais => {
                    const pStats = stats.paises[pais.sigla];
                    const stickersPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla);

                    return (
                      <div key={pais.sigla} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="p-3 flex justify-between items-center bg-white border-b border-gray-100">
                          <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#8a1538] rounded-full inline-block"></span>
                            {pais.nombre} <span className="text-xs font-normal text-gray-400">({pais.sigla})</span>
                          </h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${pStats.porcentaje == 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {pStats.obtenidos} / {pStats.total} ({pStats.porcentaje}%)
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-[1px] bg-gray-200 border-t border-gray-100 p-[1px]">
                          {stickersPais.map(sticker => {
                            const obtenido = inventario[sticker.id]?.obtenido;
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
                                onContextMenu={(e) => { if (obtenido) e.preventDefault(); }}
                                className={`relative flex items-center justify-center h-[60px] transition-all cursor-pointer select-none
                                  ${obtenido ? 'bg-emerald-100/90 border border-emerald-200 z-0 shadow-inner' : isPending ? 'bg-blue-50 border-2 border-blue-500 z-10' : 'bg-white opacity-45 grayscale hover:opacity-70'}
                                `}
                              >
                                <span className={`text-[12px] font-black tracking-tight ${obtenido ? 'text-emerald-900' : isPending ? 'text-blue-700' : 'text-gray-500'}`}>
                                  {sticker.id.replace('-', ' ')}
                                </span>
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
        <div className="fixed bottom-24 left-0 w-full px-4 z-50 animate-in slide-in-from-bottom-10">
          <button onClick={handleConfirm} className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Save size={24}/> Guardar {pendingAdds.size} Nuevos Cromos
          </button>
        </div>
      )}
    </div>
  );
};

// ================== TAB NUEVA: FALTANTES EXPRESS ==================
const TabFaltantes = ({ inventario, hacerCommitNuevas }) => {
  const [pendingAdds, setPendingAdds] = useState(new Set());
  const [busqueda, setBusqueda] = useState('');

  const faltantes = useMemo(() => CATALOGO_ARRAY.filter(s => !inventario[s.id]?.obtenido && s.grupo !== 'Coca-Cola'), [inventario]);

  const togglePending = (id) => {
    setPendingAdds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => { hacerCommitNuevas(Array.from(pendingAdds)); setPendingAdds(new Set()); };

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="p-4 pb-2 flex justify-between items-center">
          <h1 className="text-xl font-black flex items-center gap-2"><ListChecks size={24}/> Faltantes Express</h1>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            Faltan: <span className="text-lg">{faltantes.length}</span>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-blue-200" />
            <input 
              type="text" 
              placeholder="Buscar país..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-blue-800/50 text-white placeholder-blue-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
            />
          </div>
        </div>
      </div>
      
      <p className="px-4 py-2 text-[11px] text-gray-500 bg-white border-b shadow-sm uppercase font-bold text-center tracking-wider mb-2">
        Toca las láminas que conseguiste para guardarlas
      </p>

      <div className="p-3">
        {PAISES.map(pais => {
          if (pais.grupo === 'Coca-Cola') return null; // Excluimos Coca-Cola de la lista estricta
          if (busqueda && !normalizeText(pais.nombre).includes(normalizeText(busqueda)) && !normalizeText(pais.sigla).includes(normalizeText(busqueda))) return null;
          
          const faltantesPais = faltantes.filter(s => s.sigla === pais.sigla);
          if (faltantesPais.length === 0) return null;

          return (
            <div key={pais.sigla} className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h4 className="font-bold text-gray-700 bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                  {pais.nombre} <span className="text-xs font-normal text-gray-400">({pais.sigla})</span>
                </span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{faltantesPais.length}</span>
              </h4>
              <div className="flex flex-wrap gap-2 p-3">
                {faltantesPais.map(s => {
                  const isPending = pendingAdds.has(s.id);
                  return (
                    <button 
                      key={s.id} 
                      onClick={() => togglePending(s.id)}
                      className={`px-3 py-2 rounded-lg font-bold text-sm border transition-all ${isPending ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {s.id.replace('-', ' ')}
                    </button>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>

      {pendingAdds.size > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-4 z-50 animate-in slide-in-from-bottom-10">
          <button onClick={handleConfirm} className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Save size={24}/> Marcar {pendingAdds.size} como Obtenidos
          </button>
        </div>
      )}
    </div>
  );
};


// ================== TAB 3: MIS REPETIDAS ==================
const TabRepetidas = ({ inventario, modificarRepetida }) => {
  const [openGroups, setOpenGroups] = useState({ 'Especial': true }); 
  const [busqueda, setBusqueda] = useState('');
  
  const toggleAccordion = (grupo) => setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));

  const totalRepetidas = useMemo(() => {
    return CATALOGO_ARRAY.reduce((acc, s) => acc + (inventario[s.id]?.cantidadRepetidas || 0), 0);
  }, [inventario]);

  const handleShareRepetidas = async () => {
<<<<<<< HEAD
    let contenido = "⚽ *MIS REPETIDAS - PANINI 2026* ⚽\n";
    contenido += `📅 Fecha: ${new Date().toLocaleDateString()}\n`;
    contenido += `🔄 Disponibles para cambio: ${totalRepetidas}\n`;

    GRUPOS.forEach(grupo => {
      const paisesGrupo = PAISES.filter(p => p.grupo === grupo);
      let grupoTieneRepetidas = false;
      let textoGrupo = `\n📍 *${getGrupoTitulo(grupo).toUpperCase()}*\n`;

      paisesGrupo.forEach(pais => {
        const repetidasPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla && (inventario[s.id]?.cantidadRepetidas || 0) > 0);
        if (repetidasPais.length > 0) {
          grupoTieneRepetidas = true;
          textoGrupo += `🔸 *${pais.nombre}* (${pais.sigla}):\n`;
          const listaCromos = repetidasPais.map(s => `${s.id.replace('-', ' ')} (x${inventario[s.id].cantidadRepetidas})`);
          textoGrupo += listaCromos.join(', ') + '\n';
        }
      });

      if (grupoTieneRepetidas) contenido += textoGrupo;
    });

=======
    let contenido = "Figuritas App - Lista\nUsa Méx Can 26\n\nRepetidas\n";

    PAISES.forEach(pais => {
      const repetidasPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla && (inventario[s.id]?.cantidadRepetidas || 0) > 0);
      if (repetidasPais.length > 0) {
        const parts = [];
        repetidasPais.forEach(s => {
          const num = s.numero === '00' ? '00' : parseInt(s.numero);
          const cant = inventario[s.id].cantidadRepetidas;
          if (cant > 1) {
            parts.push(`${num} (x${cant})`);
          } else {
            parts.push(`${num}`);
          }
        });
        
        contenido += `${pais.sigla} ${EMOJIS[pais.sigla]}: ${parts.join(', ')}\n`;
      }
    });

    contenido += "\nGestiona tu álbum desde el siguiente link:\nhttps://panini26.vercel.app/";

>>>>>>> 0c66a0d (feat: Modulo de faltantes corregidos)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mis Repetidas Panini 2026',
          text: contenido,
        });
      } catch (e) { console.log("Compartir cancelado o falló", e); }
    } else {
      navigator.clipboard.writeText(contenido);
<<<<<<< HEAD
      if (window.confirm("¡Lista copiada al portapapeles!\n¿Deseas abrir WhatsApp Web/App para enviarla?")) {
        window.open(`https://wa.me/?text=${encodeURIComponent(contenido)}`, '_blank');
=======
      if (window.confirm("¡Lista copiada al portapapeles!\n(Pégala directamente en el chat para evitar recortes)\n\n¿Deseas abrir WhatsApp Web para enviarla?")) {
        const urlWA = contenido.length > 2000 ? 'https://web.whatsapp.com/' : `https://api.whatsapp.com/send?text=${encodeURIComponent(contenido)}`;
        window.open(urlWA, '_blank');
>>>>>>> 0c66a0d (feat: Modulo de faltantes corregidos)
      }
    }
  };

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-lg">
        <div className="p-4 pb-2 flex justify-between items-center">
          <h1 className="text-xl font-black flex items-center gap-2"><Layers size={24}/> Mis Repetidas</h1>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              Total: <span className="text-lg">{totalRepetidas}</span>
            </div>
            <button 
              onClick={handleShareRepetidas} disabled={totalRepetidas === 0}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 disabled:opacity-50 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-amber-200" />
            <input 
              type="text" 
              placeholder="Buscar país (ej. Brasil, GER)..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-amber-700/30 text-white placeholder-amber-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white shadow-inner"
            />
          </div>
        </div>
      </div>
      
      <p className="px-4 py-2 text-[11px] text-gray-500 bg-white border-b shadow-sm uppercase font-bold text-center tracking-wider">
        Toca el cromo para sumarlo a repetidas
      </p>

      <div className="p-3 space-y-3">
        {GRUPOS.map(grupo => {
          const paisesGrupoOrig = PAISES.filter(p => p.grupo === grupo);
          const paisesGrupo = busqueda 
            ? paisesGrupoOrig.filter(p => normalizeText(p.nombre).includes(normalizeText(busqueda)) || normalizeText(p.sigla).includes(normalizeText(busqueda)))
            : paisesGrupoOrig;

          if (busqueda && paisesGrupo.length === 0) return null;

          const isOpen = busqueda ? true : openGroups[grupo];
          const repetidasGrupo = CATALOGO_ARRAY.filter(s => s.grupo === grupo).reduce((acc, s) => acc + (inventario[s.id]?.cantidadRepetidas || 0), 0);

          return (
            <div key={grupo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => toggleAccordion(grupo)}
                className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-amber-50/50 border-b border-gray-200' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-1 rounded-full ${isOpen ? 'bg-amber-500/10 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </span>
                  <h2 className="font-bold text-gray-800 text-sm md:text-base text-left leading-tight">
                    {getGrupoTitulo(grupo)}
                  </h2>
                </div>
                {repetidasGrupo > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {repetidasGrupo} disp.
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="p-2 space-y-4 bg-gray-50/50">
                  {paisesGrupo.map(pais => {
                    const stickersPais = CATALOGO_ARRAY.filter(s => s.sigla === pais.sigla);
                    
                    return (
                      <div key={pais.sigla} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="p-3 bg-white border-b border-gray-100">
                          <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                            {pais.nombre} <span className="text-xs font-normal text-gray-400">({pais.sigla})</span>
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-[1px] bg-gray-200 border-t border-gray-100 p-[1px]">
                          {stickersPais.map(sticker => {
                            const cant = inventario[sticker.id]?.cantidadRepetidas || 0;
                            
                            return (
                              <div 
                                key={sticker.id} 
                                onClick={() => modificarRepetida(sticker.id, 1)}
                                className={`relative flex flex-col items-center justify-center h-[60px] transition-all cursor-pointer select-none
                                  ${cant > 0 ? 'bg-amber-100 border-amber-200 z-10' : 'bg-white hover:bg-gray-50'}
                                `}
                              >
                                <span className={`text-[12px] font-black tracking-tight ${cant > 0 ? 'text-amber-900 mb-1' : 'text-gray-500'}`}>
                                  {sticker.id.replace('-', ' ')}
                                </span>
                                
                                {cant > 0 && (
                                  <div className="flex items-center justify-between w-[90%] px-1.5 py-0.5 bg-white/80 rounded-full shadow-sm backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => modificarRepetida(sticker.id, -1)} className="text-gray-500 hover:text-red-500 font-black"><Minus size={12}/></button>
                                    <span className="text-[11px] font-black text-amber-700 leading-none">{cant}</span>
                                    <button onClick={() => modificarRepetida(sticker.id, 1)} className="text-gray-500 hover:text-emerald-500 font-black"><Plus size={12}/></button>
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
};

// ================== TAB 4: MOTOR INTERCAMBIOS ==================
const TabIntercambios = ({ inventario, ejecutarIntercambioMasivo }) => {
  const [step, setStep] = useState(1);
  const [doyCantidades, setDoyCantidades] = useState({});
  const [reciboIds, setReciboIds] = useState(new Set());
  const [busquedaRecibo, setBusquedaRecibo] = useState('');

  const repetidas = useMemo(() => CATALOGO_ARRAY.filter(s => (inventario[s.id]?.cantidadRepetidas || 0) > 0), [inventario]);
  const faltantes = useMemo(() => CATALOGO_ARRAY.filter(s => !inventario[s.id]?.obtenido), [inventario]);

  const toggleDoy = (id, max) => setDoyCantidades(p => ({ ...p, [id]: p[id] >= max ? 0 : (p[id] || 0) + 1 }));
  const toggleRecibo = (id) => setReciboIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const procesar = () => {
    ejecutarIntercambioMasivo(doyCantidades, Array.from(reciboIds));
    setDoyCantidades({}); setReciboIds(new Set()); setStep(1); setBusquedaRecibo('');
    alert("¡Intercambio registrado con éxito!");
  };

  const totalDoy = Object.values(doyCantidades).reduce((a,b)=>a+b, 0);

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      <div className="bg-white p-4 shadow-sm mb-2 sticky top-0 z-10">
        <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-700"><RefreshCw/> Nuevo Intercambio</h2>
        <div className="flex gap-2 mt-4">{[1,2,3].map(s => <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-emerald-600' : 'bg-gray-200'}`} />)}</div>
      </div>

      <div className="p-4">
        {step === 1 && (
          <div className="animate-in fade-in space-y-4">
            <h3 className="font-bold text-lg">Tus Repetidas (Vas a dar)</h3>
            <div className="grid grid-cols-3 gap-2">
              {repetidas.length === 0 && <p className="col-span-3 text-center text-gray-500 py-8">No tienes repetidas disponibles.</p>}
              {repetidas.map(s => {
                const max = inventario[s.id].cantidadRepetidas;
                const selec = doyCantidades[s.id] || 0;
                return (
                  <button key={s.id} onClick={() => toggleDoy(s.id, max)} className={`p-3 rounded-xl border flex flex-col items-center transition-all ${selec > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                    <span className="font-bold text-[13px]">{s.id.replace('-',' ')}</span>
                    {selec > 0 ? <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">Dar {selec}</span> : <span className="text-[10px] text-gray-400 mt-1">Disp: {max}</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setStep(2)} disabled={totalDoy === 0} className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold mt-6 flex justify-center items-center gap-2 disabled:opacity-50">Siguiente <ArrowRight/></button>
          </div>
        )}
        
        {step === 2 && (
          <div className="animate-in fade-in space-y-4">
            <h3 className="font-bold text-lg">Tus Faltantes (Vas a recibir)</h3>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Buscar país..." value={busquedaRecibo} onChange={(e) => setBusquedaRecibo(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>

            <div className="bg-white p-2 rounded-xl shadow-sm border h-[45vh] overflow-y-auto">
              {PAISES.map(pais => {
                if (busquedaRecibo && !normalizeText(pais.nombre).includes(normalizeText(busquedaRecibo)) && !normalizeText(pais.sigla).includes(normalizeText(busquedaRecibo))) return null;

                const faltantesPais = faltantes.filter(s => s.sigla === pais.sigla);
                if(faltantesPais.length === 0) return null;
                
                return (
                  <div key={pais.sigla} className="mb-4">
                    <h4 className="font-bold text-gray-600 bg-gray-50 p-2 text-sm">{pais.nombre}</h4>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {faltantesPais.map(s => (
                        <div key={s.id} onClick={() => toggleRecibo(s.id)} className={`py-3 rounded-lg flex items-center justify-center font-bold text-[12px] cursor-pointer border ${reciboIds.has(s.id) ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {s.id.replace('-',' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setStep(1)} className="p-4 bg-gray-200 rounded-xl font-bold">Atrás</button>
              <button onClick={()=>setStep(3)} disabled={reciboIds.size === 0} className="flex-1 bg-emerald-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50">Siguiente <ArrowRight/></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in space-y-4">
            <h3 className="font-bold text-lg">Resumen</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border divide-y">
              <div className="p-4 bg-red-50"><p className="text-sm font-bold text-red-600 mb-2">Das ({totalDoy}):</p><div className="flex flex-wrap gap-1">{Object.entries(doyCantidades).filter(([_,c])=>c>0).map(([id,c])=><span key={id} className="bg-white px-2 py-1 rounded border border-red-200 text-xs font-bold">{id.replace('-',' ')} (x{c})</span>)}</div></div>
              <div className="p-4 bg-emerald-50"><p className="text-sm font-bold text-emerald-600 mb-2">Recibes ({reciboIds.size}):</p><div className="flex flex-wrap gap-1">{Array.from(reciboIds).map(id=><span key={id} className="bg-white px-2 py-1 rounded border border-emerald-200 text-xs font-bold">{id.replace('-',' ')}</span>)}</div></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>setStep(2)} className="p-4 bg-gray-200 rounded-xl font-bold">Atrás</button>
              <button onClick={procesar} className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-bold flex justify-center items-center gap-2"><CheckCircle2/> Confirmar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ================== LAYOUT ==================
export default function App() {
  const [tabActivo, setTabActivo] = useState('album');
  const state = usePaniniState();

  if (state.loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-[#8a1538] animate-pulse">Conectando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 mx-auto max-w-[480px] shadow-2xl relative overflow-hidden flex flex-col">
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {tabActivo === 'album' && <TabAlbum inventario={state.inventario} hacerCommitNuevas={state.hacerCommitNuevas} removerCromoObtenido={state.removerCromoObtenido} />}
        {tabActivo === 'faltantes' && <TabFaltantes inventario={state.inventario} hacerCommitNuevas={state.hacerCommitNuevas} />}
        {tabActivo === 'repetidas' && <TabRepetidas inventario={state.inventario} modificarRepetida={state.modificarRepetida} />}
        {tabActivo === 'intercambios' && <TabIntercambios inventario={state.inventario} ejecutarIntercambioMasivo={state.ejecutarIntercambioMasivo} />}
      </main>

      {/* REAJUSTE PARA 4 PESTAÑAS (Faltantes incluida) */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-1 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 h-[75px]">
        <button onClick={() => setTabActivo('album')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${tabActivo === 'album' ? 'text-[#8a1538]' : 'text-gray-400 hover:text-gray-600'}`}>
          <BookOpen size={22} className={tabActivo === 'album' ? 'fill-[#8a1538]/20' : ''}/>
          <span className="text-[10px] font-bold mt-1">Álbum</span>
        </button>
        <button onClick={() => setTabActivo('faltantes')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${tabActivo === 'faltantes' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}>
          <ListChecks size={22} className={tabActivo === 'faltantes' ? 'text-blue-700' : ''}/>
          <span className="text-[10px] font-bold mt-1">Faltantes</span>
        </button>
        <button onClick={() => setTabActivo('repetidas')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${tabActivo === 'repetidas' ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}>
          <Layers size={22} className={tabActivo === 'repetidas' ? 'fill-amber-500/20' : ''}/>
          <span className="text-[10px] font-bold mt-1">Repetidas</span>
        </button>
        <button onClick={() => setTabActivo('intercambios')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${tabActivo === 'intercambios' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <RefreshCw size={22} />
          <span className="text-[10px] font-bold mt-1">Cambios</span>
        </button>
      </nav>
    </div>
  );
}