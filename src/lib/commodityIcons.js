// Commodity icon mapping utility ported from Flutter.
// Maps commodity names to PNG asset icons with emoji fallback.

const DEFAULT_ICON = {
    emoji: '🌱',
    shortLabel: '...',
    color: '#4CAF50', // Colors.green
    category: 'Lainnya',
    assetName: null // will use ic_no_image.png
};

// Colors mapping
export function getCategoryColor(category) {
    switch (category) {
        case 'Rempah': return '#E65100';
        case 'Kayu': return '#5D4037';
        case 'HHBK': return '#2E7D32';
        case 'Buah': return '#F57F17';
        case 'Pangan': return '#827717';
        case 'Perkebunan': return '#4E342E';
        case 'Budidaya Laut': return '#0277BD';
        case 'Konservasi': return '#1B5E20';
        case 'Jasa Lingkungan': return '#00695C';
        case 'Pemanfaatan': return '#00695C';
        case 'HHBK Premium': return '#6A1B9A';
        default: return '#9E9E9E'; // Colors.grey
    }
}

const ICON_MAP = {
    // === Rempah ===
    'pala': { emoji: '🌰', shortLabel: 'Pala', color: '#E65100', category: 'Rempah', assetName: 'ic_pala.png' },
    'cengkeh': { emoji: '🌺', shortLabel: 'Cngkh', color: '#E65100', category: 'Rempah', assetName: 'ic_cengkeh.png' },
    'kayu manis': { emoji: '🫙', shortLabel: 'KMns', color: '#E65100', category: 'Rempah', assetName: 'ic_kayu_manis.png' },
    'vanili': { emoji: '🧂', shortLabel: 'Vnil', color: '#E65100', category: 'Rempah', assetName: 'ic_vanili.png' },
    'jahe': { emoji: '🫚', shortLabel: 'Jahe', color: '#E65100', category: 'Rempah', assetName: 'ic_jahe.png' },
    'jahe merah': { emoji: '🫚', shortLabel: 'JhMr', color: '#E65100', category: 'Rempah', assetName: 'ic_jahe_merah.png' },
    'sereh merah': { emoji: '🌿', shortLabel: 'Sreh', color: '#E65100', category: 'Rempah', assetName: 'ic_sereh_merah.png' },
    'nilam': { emoji: '🍃', shortLabel: 'Nilm', color: '#E65100', category: 'Rempah', assetName: 'ic_nilam.png' },
    'rica merah': { emoji: '🌶️', shortLabel: 'Rica', color: '#E65100', category: 'Rempah', assetName: 'ic_rica_merah.png' },
    'kenanga': { emoji: '🌸', shortLabel: 'Knng', color: '#E65100', category: 'Rempah', assetName: 'ic_kenanga.png' },
    'lengkuas': { emoji: '🫚', shortLabel: 'Lgks', color: '#E65100', category: 'Rempah', assetName: 'ic_lengkuas.png' },

    // === Kayu ===
    'sengon': { emoji: '🌲', shortLabel: 'Sngn', color: '#5D4037', category: 'Kayu', assetName: 'ic_sengon.png' },
    'sengon laut': { emoji: '🌲', shortLabel: 'SngL', color: '#5D4037', category: 'Kayu', assetName: 'ic_sengon_laut.png' },
    'merbau': { emoji: '🪵', shortLabel: 'Mrbu', color: '#5D4037', category: 'Kayu', assetName: 'ic_merbau.png' },
    'damar': { emoji: '🪵', shortLabel: 'Damr', color: '#5D4037', category: 'Kayu', assetName: 'ic_damar.png' },
    'getah damar': { emoji: '🪵', shortLabel: 'GDmr', color: '#5D4037', category: 'Kayu', assetName: 'ic_getah_damar.png' },
    'matoa': { emoji: '🌳', shortLabel: 'Mtoa', color: '#5D4037', category: 'Kayu', assetName: 'ic_matoa.png' },
    'nyatoh': { emoji: '🌳', shortLabel: 'Nyth', color: '#5D4037', category: 'Kayu', assetName: 'ic_nyatoh.png' },
    'kayu besi': { emoji: '⚒️', shortLabel: 'KBsi', color: '#5D4037', category: 'Kayu', assetName: 'ic_kayu_besi.png' },
    'hate besi': { emoji: '⚒️', shortLabel: 'HBsi', color: '#5D4037', category: 'Kayu', assetName: 'ic_kayu_besi.png' },
    'besi': { emoji: '⚒️', shortLabel: 'Besi', color: '#5D4037', category: 'Kayu', assetName: 'ic_kayu_besi.png' },
    'kayu bugis': { emoji: '🌲', shortLabel: 'KBgs', color: '#5D4037', category: 'Kayu' },
    'kayu merah': { emoji: '🌲', shortLabel: 'KMrh', color: '#5D4037', category: 'Kayu' },
    'kayu putih': { emoji: '🌲', shortLabel: 'KPth', color: '#5D4037', category: 'Kayu' },
    'kayu tafiri': { emoji: '🌲', shortLabel: 'KTfr', color: '#5D4037', category: 'Kayu' },
    'kayu lasi': { emoji: '🌲', shortLabel: 'KLsi', color: '#5D4037', category: 'Kayu' },
    'meranti': { emoji: '🌲', shortLabel: 'Mrnt', color: '#5D4037', category: 'Kayu' },
    'meranti merah': { emoji: '🌲', shortLabel: 'MrMr', color: '#5D4037', category: 'Kayu' },
    'meranti putih': { emoji: '🌲', shortLabel: 'MrPt', color: '#5D4037', category: 'Kayu' },
    'mersawa': { emoji: '🌲', shortLabel: 'Mrsw', color: '#5D4037', category: 'Kayu' },
    'samama': { emoji: '🌲', shortLabel: 'Smma', color: '#5D4037', category: 'Kayu' },
    'cempaka': { emoji: '🌳', shortLabel: 'Cmpk', color: '#5D4037', category: 'Kayu', assetName: 'ic_cempaka.png' },
    'gosale': { emoji: '🌿', shortLabel: 'Gsl', color: '#5D4037', category: 'Kayu' },
    'gusale': { emoji: '🌿', shortLabel: 'Gsl', color: '#5D4037', category: 'Kayu' },
    'gofasa': { emoji: '🌿', shortLabel: 'Gfs', color: '#5D4037', category: 'Kayu' },
    'binuang': { emoji: '🌳', shortLabel: 'Bnng', color: '#5D4037', category: 'Kayu' },
    'bintanggur': { emoji: '🌳', shortLabel: 'Btgr', color: '#5D4037', category: 'Kayu' },
    'bintangur': { emoji: '🌳', shortLabel: 'Btgr', color: '#5D4037', category: 'Kayu' },
    'jabon': { emoji: '🌳', shortLabel: 'Jabn', color: '#5D4037', category: 'Kayu', assetName: 'ic_jabon.png' },
    'jabon merah': { emoji: '🌳', shortLabel: 'JbMr', color: '#5D4037', category: 'Kayu' },
    'kerikis': { emoji: '🌳', shortLabel: 'Krks', color: '#5D4037', category: 'Kayu' },
    'ketapang': { emoji: '🌳', shortLabel: 'Ktpg', color: '#5D4037', category: 'Kayu' },
    'balsa': { emoji: '🌳', shortLabel: 'Blsa', color: '#5D4037', category: 'Kayu' },
    'jati': { emoji: '🌲', shortLabel: 'Jati', color: '#5D4037', category: 'Kayu', assetName: 'ic_jati.png' },
    'trembesi': { emoji: '🌳', shortLabel: 'Trmb', color: '#5D4037', category: 'Kayu' },
    'linggua': { emoji: '🌳', shortLabel: 'Lngg', color: '#5D4037', category: 'Kayu' },
    'palaka': { emoji: '🌳', shortLabel: 'Plka', color: '#5D4037', category: 'Kayu' },

    // === HHBK ===
    'rotan': { emoji: '🎋', shortLabel: 'Rotn', color: '#2E7D32', category: 'HHBK', assetName: 'ic_rotan.png' },
    'bambu': { emoji: '🎍', shortLabel: 'Bmbu', color: '#2E7D32', category: 'HHBK', assetName: 'ic_bambu.png' },
    'kelapa': { emoji: '🌴', shortLabel: 'Klpa', color: '#2E7D32', category: 'HHBK', assetName: 'ic_kelapa.png' },
    'kopra': { emoji: '🌴', shortLabel: 'Kpra', color: '#2E7D32', category: 'HHBK', assetName: 'ic_kelapa.png' },
    'sagu': { emoji: '🌾', shortLabel: 'Sagu', color: '#2E7D32', category: 'HHBK', assetName: 'ic_sagu.png' },
    'aren': { emoji: '🧃', shortLabel: 'Aren', color: '#2E7D32', category: 'HHBK', assetName: 'ic_aren.png' },
    'enau': { emoji: '🧃', shortLabel: 'Enau', color: '#2E7D32', category: 'HHBK', assetName: 'ic_aren.png' },
    'kenari': { emoji: '🥜', shortLabel: 'Knri', color: '#2E7D32', category: 'HHBK', assetName: 'ic_kenari.png' },
    'kenari hutan': { emoji: '🥜', shortLabel: 'KnrH', color: '#2E7D32', category: 'HHBK', assetName: 'ic_kenari.png' },
    'kemiri': { emoji: '🫒', shortLabel: 'Kmri', color: '#2E7D32', category: 'HHBK', assetName: 'ic_kemiri.png' },
    'lebah': { emoji: '🍯', shortLabel: 'Lbah', color: '#2E7D32', category: 'HHBK', assetName: 'ic_lebah.png' },
    'lebah madu': { emoji: '🍯', shortLabel: 'Madu', color: '#2E7D32', category: 'HHBK', assetName: 'ic_lebah.png' },
    'madu': { emoji: '🍯', shortLabel: 'Madu', color: '#2E7D32', category: 'HHBK', assetName: 'ic_lebah.png' },
    'madu hutan': { emoji: '🍯', shortLabel: 'MdHt', color: '#2E7D32', category: 'HHBK', assetName: 'ic_lebah.png' },
    'madu trigona': { emoji: '🍯', shortLabel: 'MdTr', color: '#2E7D32', category: 'HHBK', assetName: 'ic_lebah.png' },
    'jamur': { emoji: '🍄', shortLabel: 'Jmur', color: '#2E7D32', category: 'HHBK', assetName: 'ic_jamur.png' },
    'jamur tiram': { emoji: '🍄', shortLabel: 'JmTr', color: '#2E7D32', category: 'HHBK', assetName: 'ic_jamur.png' },
    'anggrek': { emoji: '🌸', shortLabel: 'Angk', color: '#2E7D32', category: 'HHBK', assetName: 'ic_anggrek.png' },
    'daun bobo': { emoji: '🍃', shortLabel: 'DBbo', color: '#2E7D32', category: 'HHBK' },
    'jambu mete': { emoji: '🥜', shortLabel: 'JbMt', color: '#2E7D32', category: 'HHBK', assetName: 'ic_jambu_mete.png' },

    // === HHBK Premium ===
    'gaharu': { emoji: '💎', shortLabel: 'Gahr', color: '#6A1B9A', category: 'HHBK Premium', assetName: 'ic_gaharu.png' },

    // === Buah ===
    'durian': { emoji: '🍈', shortLabel: 'Duri', color: '#F57F17', category: 'Buah', assetName: 'ic_durian.png' },
    'langsat': { emoji: '🍊', shortLabel: 'Lngs', color: '#F57F17', category: 'Buah', assetName: 'ic_langsat.png' },
    'mangga': { emoji: '🥭', shortLabel: 'Mgga', color: '#F57F17', category: 'Buah', assetName: 'ic_mangga.png' },
    'pisang': { emoji: '🍌', shortLabel: 'Psng', color: '#F57F17', category: 'Buah', assetName: 'ic_pisang.png' },
    'rambutan': { emoji: '🍇', shortLabel: 'Rmbt', color: '#F57F17', category: 'Buah', assetName: 'ic_rambutan.png' },
    'salak': { emoji: '🥝', shortLabel: 'Slak', color: '#F57F17', category: 'Buah', assetName: 'ic_salak.png' },
    'nanas': { emoji: '🍍', shortLabel: 'Nnas', color: '#F57F17', category: 'Buah', assetName: 'ic_nanas.png' },
    'nangka': { emoji: '🍈', shortLabel: 'Nngk', color: '#F57F17', category: 'Buah', assetName: 'ic_nangka.png' },
    'manggis': { emoji: '🍇', shortLabel: 'Mgis', color: '#F57F17', category: 'Buah', assetName: 'ic_manggis.png' },
    'alpukat': { emoji: '🥑', shortLabel: 'Alpk', color: '#F57F17', category: 'Buah', assetName: 'ic_alpukat.png' },
    'duku': { emoji: '🍊', shortLabel: 'Duku', color: '#F57F17', category: 'Buah', assetName: 'ic_duku.png' },
    'sukun': { emoji: '🍞', shortLabel: 'Skun', color: '#F57F17', category: 'Buah', assetName: 'ic_sukun.png' },
    'sukun hutan': { emoji: '🍞', shortLabel: 'SkHt', color: '#F57F17', category: 'Buah', assetName: 'ic_sukun.png' },
    'sirsak': { emoji: '🍈', shortLabel: 'Srsk', color: '#F57F17', category: 'Buah' },
    'cempedak': { emoji: '🍈', shortLabel: 'Cmpd', color: '#F57F17', category: 'Buah' },
    'buah rao': { emoji: '🍈', shortLabel: 'Rao', color: '#F57F17', category: 'Buah' },

    // === Perkebunan ===
    'kopi': { emoji: '☕', shortLabel: 'Kopi', color: '#4E342E', category: 'Perkebunan', assetName: 'ic_kopi.png' },
    'kakao': { emoji: '🍫', shortLabel: 'Kkao', color: '#4E342E', category: 'Perkebunan', assetName: 'ic_cokelat.png' },
    'cokelat': { emoji: '🍫', shortLabel: 'Cklt', color: '#4E342E', category: 'Perkebunan', assetName: 'ic_cokelat.png' },
    'kokoa': { emoji: '🍫', shortLabel: 'Kkoa', color: '#4E342E', category: 'Perkebunan', assetName: 'ic_cokelat.png' },

    // === Pangan ===
    'singkong': { emoji: '🥔', shortLabel: 'Skng', color: '#827717', category: 'Pangan', assetName: 'ic_singkong.png' },
    'ketela': { emoji: '🥔', shortLabel: 'Ktla', color: '#827717', category: 'Pangan', assetName: 'ic_singkong.png' },
    'ubi jalar': { emoji: '🍠', shortLabel: 'UbJl', color: '#827717', category: 'Pangan', assetName: 'ic_ubi_jalar.png' },
    'ubi kayu': { emoji: '🥔', shortLabel: 'UbKy', color: '#827717', category: 'Pangan', assetName: 'ic_singkong.png' },
    'jagung': { emoji: '🌽', shortLabel: 'Jgng', color: '#827717', category: 'Pangan', assetName: 'ic_jagung.png' },
    'kacang tanah': { emoji: '🥜', shortLabel: 'KcTn', color: '#827717', category: 'Pangan', assetName: 'ic_kacang_tanah.png' },
    'padi ladang': { emoji: '🌾', shortLabel: 'Padi', color: '#827717', category: 'Pangan', assetName: 'ic_padi.png' },
    'padi sawah': { emoji: '🌾', shortLabel: 'Padi', color: '#827717', category: 'Pangan', assetName: 'ic_padi.png' },
    'tomat': { emoji: '🍅', shortLabel: 'Tmt', color: '#827717', category: 'Pangan', assetName: 'ic_tomat.png' },

    // === Budidaya Laut ===
    'rumput laut': { emoji: '🌊', shortLabel: 'RLut', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_rumput_laut.png' },
    'udang': { emoji: '🦐', shortLabel: 'Udng', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_udang.png' },
    'kepiting': { emoji: '🦀', shortLabel: 'Kptg', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_kepiting.png' },
    'kepiting bakau': { emoji: '🦀', shortLabel: 'KpBk', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_kepiting.png' },
    'budidaya ikan hias': { emoji: '🐠', shortLabel: 'Ikan', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_ikan_hias.png' },
    'budidaya kepiting': { emoji: '🦀', shortLabel: 'BdKp', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_kepiting.png' },
    'budidaya kerang-kerangan': { emoji: '🐚', shortLabel: 'Krng', color: '#0277BD', category: 'Budidaya Laut', assetName: 'ic_kerang.png' },
    'mangrove': { emoji: '🌳', shortLabel: 'Mngr', color: '#1B5E20', category: 'Konservasi', assetName: 'ic_mangrove.png' },

    // === Pemanfaatan (Ex Jasa Lingkungan) ===
    'ekowisata': { emoji: '🏞️', shortLabel: 'Ekow', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata.png' },
    'ekowisata air terjun': { emoji: '💦', shortLabel: 'ArTj', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_air_terjun.png' },
    'ekowisata mangrove': { emoji: '🌿', shortLabel: 'EkMg', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_mangrove.png' },
    'ekowisata terumbu karang': { emoji: '🪸', shortLabel: 'TrKr', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_terumbu_karang.png' },
    'ekowisata gunung': { emoji: '⛰️', shortLabel: 'Gung', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_gunung.png' },
    'ekowisata lembah': { emoji: '🏞️', shortLabel: 'Lmbh', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_lembah.png' },
    'ekowisata panorama alam': { emoji: '🏔️', shortLabel: 'Pnrm', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_panorama_alam.png' },
    'ekowisata danau gosora': { emoji: '🏞️', shortLabel: 'DnGo', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_danau.png' },
    'ekowisata danau morodai': { emoji: '🏞️', shortLabel: 'DnMo', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_ekowisata_danau.png' },
    'jasa lingkungan': { emoji: '🌍', shortLabel: 'JsLg', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_jasa_lingkungan.png' },
    'pemanfaatan mata air': { emoji: '💧', shortLabel: 'Air', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_pemanfaatan_air.png' },
    'pemanfaatan air': { emoji: '💧', shortLabel: 'Air', color: '#00695C', category: 'Pemanfaatan', assetName: 'ic_pemanfaatan_air.png' }
};

export function getCommodityIconOptions(name) {
    if (!name) return DEFAULT_ICON;

    const lowerName = name.toLowerCase().trim();

    if (ICON_MAP[lowerName]) {
        return ICON_MAP[lowerName];
    }

    // Partial match fallback
    for (const [key, value] of Object.entries(ICON_MAP)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return value;
        }
    }

    return DEFAULT_ICON;
}

export function getCommodityAssetPath(assetName) {
    if (!assetName) return '/images/commodities/ic_no_image.png';
    return `/images/commodities/${assetName}`;
}
