import re

with open('src/pages/EmxPage.jsx', 'r') as f:
    content = f.read()

# Replacements
content = content.replace("ChswsPage", "EmxPage")
content = content.replace("CHSWS_CODES", "EMX_CODES")
content = content.replace("CHSWS_ITEMS", "EMX_ITEMS")
content = content.replace("chsws", "emx")
content = content.replace("CHSWS1", "EMX1").replace("CHSWS2", "EMX2").replace("CHSWS3", "EMX3").replace("CHSWS4", "EMX4")
content = content.replace("CLEAN_HOUSEKEEPING_SAFE_WALKING", "EMERGENCY_EXITS")
content = content.replace("Clean Housekeeping", "Emergency Exits")
content = content.replace("Health & Welfare", "Fire & Life Safety")

# Redo the arrays
codes = """const EMX_CODES = [
  { value: '', label: 'Select code (no deviation if blank)' },
  { value: 'EMX1', label: 'EMX1 - Obstructed exit doors' },
  { value: 'EMX2', label: 'EMX2 - Doors do not open outwards' },
  { value: 'EMX3', label: 'EMX3 - Missing/faulty panic hardware' },
  { value: 'EMX4', label: 'EMX4 - Combustible materials in escape routes' },
  { value: 'EMX5', label: 'EMX5 - Non-compliant signage' },
  { value: 'EMX6', label: 'EMX6 - Signage not illuminated/visible' },
  { value: 'EMX7', label: 'EMX7 - Backup lighting failed' },
  { value: 'EMX8', label: 'EMX8 - Assembly point issues' },
  { value: 'EMX9', label: 'EMX9 - Other' },
]"""

items = """const EMX_ITEMS = [
  { key: 'emx01', label: 'Are all designated emergency exit doors completely unobstructed on both sides?' },
  { key: 'emx02', label: 'Do all emergency exit doors open outwards in the direction of the escape route?' },
  { key: 'emx03', label: 'Are exit doors fitted with panic hardware that does not require a key to open from the inside?' },
  { key: 'emx04', label: 'Are all escape routes entirely free of combustible materials or temporary storage?' },
  { key: 'emx05', label: 'Are emergency exit signs strictly compliant with SANS 1186 (correct green/white symbolic safety signs)?' },
  { key: 'emx06', label: 'Is the emergency exit signage continuously illuminated and clearly visible from anywhere within the escape path?' },
  { key: 'emx07', label: 'Are backup emergency lighting systems functional and tested to operate during load shedding or power failures?' },
  { key: 'emx08', label: 'Are designated outdoor emergency assembly points clearly marked and safely accessible?' },
]"""

metadata = """const ITEM_METADATA = {
  emx01: { label: 'Unobstructed Doors', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />' },
  emx02: { label: 'Open Outwards', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />' },
  emx03: { label: 'Panic Hardware', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />' },
  emx04: { label: 'Clear Routes', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />' },
  emx05: { label: 'SANS 1186 Signs', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' },
  emx06: { label: 'Illuminated Signs', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />' },
  emx07: { label: 'Backup Lighting', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />' },
  emx08: { label: 'Assembly Points', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />' },
};"""

content = re.sub(r'const EMX_CODES = \[.*?\]', codes, content, flags=re.DOTALL)
content = re.sub(r'const EMX_ITEMS = \[.*?\]', items, content, flags=re.DOTALL)
content = re.sub(r'const ITEM_METADATA = \{.*?\};', metadata, content, flags=re.DOTALL)

with open('src/pages/EmxPage.jsx', 'w') as f:
    f.write(content)

