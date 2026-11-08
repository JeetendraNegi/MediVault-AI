import os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
from services.ocr_service import extract_text_from_file

text = extract_text_from_file('uploads/doc-f3bc3934_lab report.pdf')
lines = [l.strip() for l in text.split('\n') if l.strip()]

skip_keywords = [
    'page ', 'patient', 'sample', 'doctor', 'hospital', 'lab', 'signature', 'method', 'impression',
    'click', 'download', 'prepared', 'basic info', 'note', 'view summary', 'interval', 'trends',
    'journey', 'package', 'road', 'chakrata', 'processed', 'collected', 'account',
    'bio.', 'ref.', 'biological', 'disclaimer', 'guidelines', 'screening', 'indians', 'preceding',
    'experience', 'variation', 'hydroxylation', 'calculator', 'end of report', 'customer', 'referred by',
    'barcode', 'report date', 'sample type', 'report status', 'this test', 'khatauni', 'pargana',
    'uttarakhand', 'comment:', 'interpretation', 'pregnancy', 'trimester', 'association', 'american',
    'thyroid profile total', 'fasting plasma', '2 hr plasma', 'homa ir, insulin', 'homeostatic model',
    'this assay', 'following a 3-step', 'accurate testing', 'ensuring accuracy', 'have concerns',
    'stringent quality', 'measures meeting', 'procedures following', 'cutting-edge'
]

clean_prefix_patterns = [
    r'^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}\s+', # '11 Jul 26 '
    r'^\d+\.?\d*\s*[\-\–\—\to]+\s*\d+\.?\d*\s*', # '13.0 - 17.0 ' or '40 - 50 '
    r'^\(?\s*[<\>]\s*=?\s*\d+\.?\d*\s*\)?\s*', # '<= 199.9 '
    r'^(INDIRECT ISE|DIRECT ISE|HPLC|CMIA|CLIA|SPECTROPHOTOMETRY|IMPEDANCE|CALCULATED|DHSS|MICROCOPY|CYANIDE-FREE|ENZYMATIC|GLYCEROL PHOSPHATE|OXIDASE|DETERGENT|ACCELERATOR|BROMOCRESOL GREEN|BIURET|DIAZO|DIAZONIUM SALT|KINETIC ALKALINE PICRATE|URICASE|UREASE|CMPG3 SUBSTRATE|NADH|P-5’-P|PARA-NITROPHENYL PHOSPHATE|L-GAMMA-GLUTAMYL|HERE!|BOOK MORE TESTS|YOUR HEALTH JOURNEY|COMPLETE BLOOD COUNT|DIABETES PROFILE|KIDNEY HEALTH|KIDNEY FUNCTION TEST|LIVER HEALTH|LIVER FUNCTION TEST|LIPID PROFILE|PANCREAS PROFILE|CALCIUM AND BONE HEALTH|VITAMINS & MINERALS|THYROID HEALTH|THYROID PROFILE|HAEMATOLOGY|GLP1 PACKAGE)\s+',
]

def clean_name(raw):
    n = raw.strip(' ()[]:,-*')
    # Loop to strip stacked prefixes
    for _ in range(4):
        prev = n
        for pat in clean_prefix_patterns:
            n = re.sub(pat, '', n, flags=re.IGNORECASE).strip(' ()[]:,-*')
        if n == prev:
            break
    n = re.sub(r'^(SERUM|TOTAL|BLOOD|TEST|NAME|RESULT|ESTIMATION|DETERMINATION)\s+', '', n, flags=re.IGNORECASE).strip(' ()[]:,-*')
    if n.startswith('(') and n.endswith(')'):
        n = n[1:-1].strip()
    return n

extracted = []
seen = set()

i = 0
while i < len(lines):
    line = lines[i]

    # Combine multi-line test names (e.g. line i = "Thyroid Stimulating", line i+1 = "Hormone - Ultra Sensitive")
    test_name_cand = line
    offset = 1

    if i + 1 < len(lines) and re.search(r'^[A-Za-z\s\-\,\(\)]+$', lines[i+1]) and not re.search(r'^\d+\.?\d*$', lines[i+1]) and len(lines[i+1]) < 35:
        if not any(k in lines[i+1].lower() for k in ['mg/dl', 'g/dl', '%', 'u/l', 'mmol/l', 'fl', 'pg', 'ng/ml', 'page', 'result', 'unit', 'ref']):
            test_name_cand = f"{lines[i]} {lines[i+1]}"
            offset = 2

    name_clean = clean_name(test_name_cand)
    if len(re.findall(r'[A-Za-z]', name_clean)) < 2 or any(k in name_clean.lower() for k in skip_keywords):
        i += 1
        continue

    # Check if next line(s) has numeric value
    if i + offset >= len(lines):
        i += 1
        continue

    val_str = lines[i + offset]
    val_match = re.search(r'^(\d+\.?\d*)\s*(mg\/dL|g\/dL|uIU\/mL|µIU\/mL|uU\/mL|µU\/mL|U\/L|%|mmol\/L|pg\/mL|ng\/mL|\/cumm|mill\/uL|10\^3\/[µu]L|10\^6\/cu\.mm|lakhs\/cumm|mg\/L|IU\/L|fL|fl|pg|µg\/dL|ug\/dL|Ratio)?$', val_str, re.IGNORECASE)

    if val_match:
        val = float(val_match.group(1))
        unit = val_match.group(2) or ""

        # Check subsequent line for unit if missing
        ref_idx = i + offset + 1
        if not unit and ref_idx < len(lines):
            unit_match = re.search(r'^(mg\/dL|g\/dL|uIU\/mL|µIU\/mL|uU\/mL|µU\/mL|U\/L|%|mmol\/L|pg\/mL|ng\/mL|\/cumm|mill\/uL|10\^3\/[µu]L|10\^6\/cu\.mm|lakhs\/cumm|mg\/L|IU\/L|fL|fl|pg|µg\/dL|ug\/dL|Ratio)$', lines[ref_idx], re.IGNORECASE)
            if unit_match:
                unit = lines[ref_idx]
                ref_idx += 1

        ref_str = ""
        if ref_idx < len(lines):
            cand_ref = lines[ref_idx]
            if re.search(r'[\d\<\>\-\=]', cand_ref) and not any(k in cand_ref.lower() for k in ['page', 'patient', 'doctor', 'tata', 'note', 'comment']):
                ref_str = cand_ref

        # Canonicalize similar names for deduplication
        canon_key = name_clean.lower().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        if canon_key not in seen and len(name_clean) >= 2:
            extracted.append((name_clean, val, unit, ref_str))
            seen.add(canon_key)
            i += offset
            continue

    i += 1

print(f'Total UNIQUE CLEAN Extracted Real Parameters Count: {len(extracted)}')
for idx, item in enumerate(extracted, 1):
    print(f'{idx:2d}. {item[0]:45s} | {item[1]:<8} | {item[2]:10s} | {item[3]}')
