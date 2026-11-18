import type { BuildingFootprint, GraphEdge, GraphNode, Place } from '../types/wayfinding';

const VERIFIED_DATE = '2026-11-12';

/**
 * Coordinates aligned to Google Maps & official LPU Site Plan:
 * Main Gate (North-East, 31.26064, 75.70676) -> Academic Quad / Block 34-37 (South, 31.2513, 75.7041)
 * -> North/South Hostels & Sports (31.2485, 75.7045).
 */
export const EXTRA_NODES: GraphNode[] = [
  { id: 'b1.door', x: 192, y: 472, lat: 31.2594, lng: 75.7066, floor: 0, kind: 'door', block: 1, label: { en: 'Block 1 (Computer Application)', hi: 'ब्लॉक 1 (कंप्यूटर एप्लीकेशन)' } },
  { id: 'b2.door', x: 226, y: 432, lat: 31.2589, lng: 75.7064, floor: 0, kind: 'door', block: 2, label: { en: 'Block 2 (Mini Auditorium & Cafe)', hi: 'ब्लॉक 2 (मिनी ऑडिटोरियम)' } },
  { id: 'b3.door', x: 252, y: 400, lat: 31.2583, lng: 75.7062, floor: 0, kind: 'door', block: 3, label: { en: 'Block 3 (International Studies)', hi: 'ब्लॉक 3 (अंतर्राष्ट्रीय अध्ययन)' } },
  { id: 'b13.door', x: 215, y: 292, lat: 31.2565, lng: 75.7061, floor: 0, kind: 'door', block: 13, label: { en: 'Block 13 (Student Affairs)', hi: 'ब्लॉक 13 (छात्र कल्याण)' } },
  { id: 'b18.door', x: 345, y: 215, lat: 31.2549, lng: 75.7050, floor: 0, kind: 'door', block: 18, label: { en: 'Block 18 (Education)', hi: 'ब्लॉक 18 (शिक्षा विभाग)' } },
  { id: 'b19.door', x: 300, y: 210, lat: 31.2550, lng: 75.7055, floor: 0, kind: 'door', block: 19, label: { en: 'Block 19 (Open Auditorium)', hi: 'ब्लॉक 19 (ओपन ऑडिटोरियम)' } },
  { id: 'b20.door', x: 425, y: 185, lat: 31.2543, lng: 75.7037, floor: 0, kind: 'door', block: 20, label: { en: 'Block 20 (School of Law)', hi: 'ब्लॉक 20 (स्कूल ऑफ़ लॉ)' } },
  { id: 'b25.door', x: 332, y: 102, lat: 31.2531, lng: 75.7039, floor: 0, kind: 'door', block: 25, label: { en: 'Block 25 (Biotechnology)', hi: 'ब्लॉक 25 (बायोटेक)' } },
  { id: 'b26.door', x: 315, y: 112, lat: 31.2532, lng: 75.7042, floor: 0, kind: 'door', block: 26, label: { en: 'Block 26 (ECE / EEE)', hi: 'ब्लॉक 26 (ईसीई)' } },
  { id: 'b28.door', x: 278, y: 138, lat: 31.2534, lng: 75.7048, floor: 0, kind: 'door', block: 28, label: { en: 'Block 28 (Agriculture)', hi: 'ब्लॉक 28 (कृषि)' } },
  { id: 'b29.door', x: 235, y: 150, lat: 31.2534, lng: 75.7052, floor: 0, kind: 'door', block: 29, label: { en: 'Block 29 (Pro-Chancellor)', hi: 'ब्लॉक 29 (प्रो-चांसलर)' } },
  { id: 'b31.door', x: 212, y: 122, lat: 31.2527, lng: 75.7053, floor: 0, kind: 'door', block: 31, label: { en: 'Block 31 (Admissions)', hi: 'ब्लॉक 31 (प्रवेश)' } },
  { id: 'b32.door', x: 202, y: 104, lat: 31.2523, lng: 75.7052, floor: 0, kind: 'door', block: 32, label: { en: 'Block 32 (Exams & VC)', hi: 'ब्लॉक 32 (परीक्षा विभाग)' } },
  { id: 'b33.door', x: 186, y: 74, lat: 31.2518, lng: 75.7050, floor: 0, kind: 'door', block: 33, label: { en: 'Block 33 (ECE / EEE)', hi: 'ब्लॉक 33 (ईसीई)' } },
  { id: 'b36.door', x: 222, y: 28, lat: 31.2515771, lng: 75.7041227, floor: 0, kind: 'door', block: 36, label: { en: 'Block 36 (EEE)', hi: 'ब्लॉक 36 (ईईई)' } },
  { id: 'b38.door', x: 326, y: 42, lat: 31.2522, lng: 75.7028, floor: 0, kind: 'door', block: 38, label: { en: 'Block 38 (Research Center)', hi: 'ब्लॉक 38 (रिसर्च सेंटर)' } },
  { id: 'b42.door', x: 368, y: -62, lat: 31.2502, lng: 75.7027, floor: 0, kind: 'door', block: 42, label: { en: 'Block 42 (Swimming Pool)', hi: 'ब्लॉक 42 (स्विमिंग पूल)' } },
  { id: 'b45.door', x: 405, y: -95, lat: 31.2496, lng: 75.7022, floor: 0, kind: 'door', block: 45, label: { en: 'Block 45 (Boys Hostel 1)', hi: 'ब्लॉक 45 (बॉयज़ हॉस्टल 1)' } },
  { id: 'b55.door', x: 145, y: -168, lat: 31.2481, lng: 75.7051, floor: 0, kind: 'door', block: 55, label: { en: 'Block 55 (Mechanical Engg.)', hi: 'ब्लॉक 55 (मैकेनिकल)' } },
  { id: 'b56.door', x: 128, y: -188, lat: 31.2478, lng: 75.7053, floor: 0, kind: 'door', block: 56, label: { en: 'Block 56 (Civil Engg.)', hi: 'ब्लॉक 56 (सिविल)' } },
  { id: 'b57.door', x: 112, y: -206, lat: 31.2475, lng: 75.7055, floor: 0, kind: 'door', block: 57, label: { en: 'Block 57 (Polytechnic)', hi: 'ब्लॉक 57 (पॉलिटेक्निक)' } },
  { id: 'b58.door', x: 100, y: -226, lat: 31.2472, lng: 75.7057, floor: 0, kind: 'door', block: 58, label: { en: 'Block 58 (Workshops)', hi: 'ब्लॉक 58 (वर्कशॉप)' } },
];

export const EXTRA_EDGES: GraphEdge[] = [
  { a: 'walk.plaza', b: 'b1.door', meters: 105, accessible: true, landmark: { en: 'Block 1 entrance on your right', hi: 'दाईं ओर ब्लॉक 1 प्रवेश' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.plaza', b: 'b2.door', meters: 72, accessible: true, landmark: { en: 'Mini Auditorium & Campus Cafe', hi: 'मिनी ऑडिटोरियम व कैंपस कैफ़े' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.cross1', b: 'b3.door', meters: 22, accessible: true, landmark: { en: 'Block 3 International Studies', hi: 'ब्लॉक 3 प्रवेश' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.cross1', b: 'b13.door', meters: 96, accessible: true, landmark: { en: 'Block 13 (Student Affairs)', hi: 'ब्लॉक 13 (DSA)' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b13.door', b: 'b14.door', meters: 48, accessible: true, landmark: { en: 'Block 14 School of Business', hi: 'ब्लॉक 14 स्कूल ऑफ़ बिज़नेस' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'food.unimall', b: 'b18.door', meters: 64, accessible: true, landmark: { en: 'Block 18 Education', hi: 'ब्लॉक 18 शिक्षा' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.mall_jct', b: 'b19.door', meters: 75, accessible: true, landmark: { en: 'Open Auditorium steps', hi: 'ओपन ऑडिटोरियम' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b18.door', b: 'b20.door', meters: 86, accessible: true, landmark: { en: 'Block 20 School of Law', hi: 'ब्लॉक 20 स्कूल ऑफ़ लॉ' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b27.door', b: 'b26.door', meters: 30, accessible: true, landmark: { en: 'Block 26 ECE', hi: 'ब्लॉक 26' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b26.door', b: 'b25.door', meters: 22, accessible: true, landmark: { en: 'Block 25 Biotech', hi: 'ब्लॉक 25' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.fountain', b: 'b28.door', meters: 46, accessible: true, landmark: { en: 'Block 28 Agriculture', hi: 'ब्लॉक 28 कृषि' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'walk.fountain', b: 'b29.door', meters: 30, accessible: true, landmark: { en: 'Block 29 Pro-Chancellor', hi: 'ब्लॉक 29' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b30.door', b: 'b31.door', meters: 24, accessible: true, landmark: { en: 'Block 31 Admissions', hi: 'ब्लॉक 31' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b31.door', b: 'b32.door', meters: 22, accessible: true, landmark: { en: 'Block 32 Exams', hi: 'ब्लॉक 32' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b32.door', b: 'b33.door', meters: 34, accessible: true, landmark: { en: 'Block 33 ECE', hi: 'ब्लॉक 33' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b33.door', b: 'b34.door', meters: 20, accessible: true, landmark: { en: 'Block 34 CSE entrance', hi: 'ब्लॉक 34 प्रवेश' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b34.door', b: 'b36.door', meters: 68, accessible: true, landmark: { en: 'Block 36 walkway beside Block 34', hi: 'ब्लॉक 34 के बगल में ब्लॉक 36 मार्ग' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b36.door', b: 'auditorium.mittal', meters: 53, accessible: true, landmark: { en: 'Shanti Devi Mittal Auditorium (Block 35)', hi: 'शांति देवी मित्तल ऑडिटोरियम (ब्लॉक 35)' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'b36.door', b: 'library.central', meters: 84, accessible: true, landmark: { en: 'Central Library (Block 37)', hi: 'केंद्रीय पुस्तकालय (ब्लॉक 37)' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'library.central', b: 'b38.door', meters: 48, accessible: true, landmark: { en: 'Block 38 Research Center', hi: 'ब्लॉक 38 रिसर्च सेंटर' }, verified: true, verifiedOn: VERIFIED_DATE },
  { a: 'sports.jct', b: 'b42.door', meters: 78, accessible: true, landmark: { en: 'Block 42 Swimming Pool', hi: 'ब्लॉक 42 स्विमिंग पूल' }, verified: false },
  { a: 'b42.door', b: 'b45.door', meters: 50, accessible: true, landmark: { en: 'Block 45 Boys Hostel 1', hi: 'ब्लॉक 45 बॉयज़ हॉस्टल 1' }, verified: false },
  { a: 'sports.ground', b: 'b55.door', meters: 92, accessible: true, landmark: { en: 'Block 55 Mechanical', hi: 'ब्लॉक 55 मैकेनिकल' }, verified: false },
  { a: 'b55.door', b: 'b56.door', meters: 26, accessible: true, landmark: { en: 'Block 56 Civil', hi: 'ब्लॉक 56 सिविल' }, verified: false },
  { a: 'b56.door', b: 'b57.door', meters: 24, accessible: true, landmark: { en: 'Block 57 Polytechnic', hi: 'ब्लॉक 57' }, verified: false },
  { a: 'b57.door', b: 'b58.door', meters: 24, accessible: true, landmark: { en: 'Block 58 Workshops', hi: 'ब्लॉक 58 वर्कशॉप' }, verified: false },
];

export const EXTRA_BUILDINGS: BuildingFootprint[] = [];

export const EXTRA_PLACES: Place[] = [
  { id: 'block-1', names: ['Block 1 — Computer Application'], hiName: 'ब्लॉक 1 — कंप्यूटर एप्लीकेशन', aliases: ['1', 'b1', 'block 1', 'sca', 'ब्लॉक 1'], block: 1, node: 'b1.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2594, lng: 75.7066 },
  { id: 'block-2', names: ['Block 2 — Mini Auditorium & Cafe'], hiName: 'ब्लॉक 2 — मिनी ऑडिटोरियम', aliases: ['2', '2a', '2b', 'b2', 'block 2', 'mini auditorium', 'campus cafe'], block: 2, node: 'b2.door', category: 'auditorium', hours: '08:00 – 20:00', lat: 31.2589, lng: 75.7064 },
  { id: 'block-3', names: ['Block 3 — International Studies'], hiName: 'ब्लॉक 3 — अंतर्राष्ट्रीय अध्ययन', aliases: ['3', '3a', '3b', 'b3', 'block 3', 'pharmacy'], block: 3, node: 'b3.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2583, lng: 75.7062 },
  { id: 'block-13', names: ['Block 13 — Student Affairs (DSA)'], hiName: 'ब्लॉक 13 — छात्र कल्याण (DSA)', aliases: ['13', 'b13', 'block 13', 'dsa', 'student affairs'], block: 13, node: 'b13.door', category: 'admin', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2565, lng: 75.7061 },
  { id: 'block-18', names: ['Block 18 — Education'], hiName: 'ब्लॉक 18 — शिक्षा विभाग', aliases: ['18', 'b18', 'block 18', 'education'], block: 18, node: 'b18.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2549, lng: 75.7050 },
  { id: 'block-19', names: ['Block 19 — Open Auditorium'], hiName: 'ब्लॉक 19 — ओपन ऑडिटोरियम', aliases: ['19', 'b19', 'block 19', 'open auditorium'], block: 19, node: 'b19.door', category: 'auditorium', hours: '08:00 – 21:00', lat: 31.2550, lng: 75.7055 },
  { id: 'block-20', names: ['Block 20 — School of Law'], hiName: 'ब्लॉक 20 — स्कूल ऑफ़ लॉ', aliases: ['20', 'b20', 'block 20', 'law'], block: 20, node: 'b20.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2543, lng: 75.7037 },
  { id: 'block-25', names: ['Block 25 — Biotechnology'], hiName: 'ब्लॉक 25 — बायोटेक', aliases: ['25', 'b25', 'block 25', 'biotech'], block: 25, node: 'b25.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2531, lng: 75.7039 },
  { id: 'block-26', names: ['Block 26 — Electronics & Electrical'], hiName: 'ब्लॉक 26 — इलेक्ट्रॉनिक्स', aliases: ['26', 'b26', 'block 26', 'ece', 'eee'], block: 26, node: 'b26.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2532, lng: 75.7042 },
  { id: 'block-28', names: ['Block 28 — Agriculture'], hiName: 'ब्लॉक 28 — कृषि विभाग', aliases: ['28', 'b28', 'block 28', 'agriculture'], block: 28, node: 'b28.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2534, lng: 75.7048 },
  { id: 'block-29', names: ['Block 29 — Pro-Chancellor Office'], hiName: 'ब्लॉक 29 — प्रो-चांसलर', aliases: ['29', 'b29', 'block 29', 'pro chancellor'], block: 29, node: 'b29.door', category: 'admin', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2534, lng: 75.7052 },
  { id: 'block-31', names: ['Block 31 — Admissions'], hiName: 'ब्लॉक 31 — एडमिशन', aliases: ['31', 'b31', 'block 31'], block: 31, node: 'b31.door', category: 'admin', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2527, lng: 75.7053 },
  { id: 'block-32', names: ['Block 32 — Vice Chancellor & Exams'], hiName: 'ब्लॉक 32 — परीक्षा व कुलपति', aliases: ['32', 'b32', 'block 32', 'exam', 'vc'], block: 32, node: 'b32.door', category: 'admin', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2523, lng: 75.7052 },
  { id: 'block-33', names: ['Block 33 — Electronics & Electrical'], hiName: 'ब्लॉक 33 — इलेक्ट्रॉनिक्स', aliases: ['33', 'b33', 'block 33', 'ece'], block: 33, node: 'b33.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2518, lng: 75.7050 },
  { id: 'block-36', names: ['Block 36 — Electronics & Electrical'], hiName: 'ब्लॉक 36 — इलेक्ट्रॉनिक्स', aliases: ['36', 'b36', 'block 36', 'eee'], block: 36, node: 'b36.door', category: 'block', hours: 'Mon–Sat 7 AM–6 PM', rating: 3.8, userRatingCount: 37, googlePlaceId: 'ChIJnQxL0qJfGjkRUBy-ZEyN1Qc', lat: 31.2515771, lng: 75.7041227 },
  { id: 'block-38', names: ['Block 38 — Research Center'], hiName: 'ब्लॉक 38 — रिसर्च सेंटर', aliases: ['38', 'b38', 'block 38', 'research'], block: 38, node: 'b38.door', category: 'lab', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2522, lng: 75.7028 },
  { id: 'block-42', names: ['Block 42 — Swimming Pool'], hiName: 'ब्लॉक 42 — स्विमिंग पूल', aliases: ['42', 'b42', 'block 42', 'pool', 'swimming'], block: 42, node: 'b42.door', category: 'sports', hours: '06:00 – 20:00', lat: 31.2502, lng: 75.7027 },
  { id: 'block-45', names: ['Block 45 — Boys Hostel 1'], hiName: 'ब्लॉक 45 — बॉयज़ हॉस्टल 1', aliases: ['45', 'b45', 'bh1', 'boys hostel 1'], block: 45, node: 'b45.door', category: 'block', hours: '24 hours', lat: 31.2496, lng: 75.7022 },
  { id: 'block-55', names: ['Block 55 — Mechanical Engineering'], hiName: 'ब्लॉक 55 — मैकेनिकल', aliases: ['55', 'b55', 'block 55', 'mechanical'], block: 55, node: 'b55.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2481, lng: 75.7051 },
  { id: 'block-56', names: ['Block 56 — Civil Engineering'], hiName: 'ब्लॉक 56 — सिविल', aliases: ['56', 'b56', 'block 56', 'civil'], block: 56, node: 'b56.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2478, lng: 75.7053 },
  { id: 'block-57', names: ['Block 57 — Polytechnic'], hiName: 'ब्लॉक 57 — पॉलिटेक्निक', aliases: ['57', 'b57', 'block 57', 'polytechnic'], block: 57, node: 'b57.door', category: 'block', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2475, lng: 75.7055 },
  { id: 'block-58', names: ['Block 58 — Workshops'], hiName: 'ब्लॉक 58 — वर्कशॉप', aliases: ['58', 'b58', 'block 58', 'workshop'], block: 58, node: 'b58.door', category: 'lab', hours: 'Mon–Sat 9 AM–5 PM', lat: 31.2472, lng: 75.7057 },
];
