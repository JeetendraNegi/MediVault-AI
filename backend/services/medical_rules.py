import re

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
}

DATE_PATTERNS = [
    re.compile(r'(?:Sample\s+Collected|Collection\s+Date|Collected\s+Date|Reg\s+Date|Registration\s+Date|Report\s+Date|Result\s+Date|Booking\s+Date|Date\s+of\s+Report|Dated|Date)[^\d]*(\d{1,2}[\/\-\.\s]+[A-Za-z0-9]{3,9}[\/\-\.\s]+\d{2,4})', re.I),
    re.compile(r'(?:Sample\s+Collected|Collection\s+Date|Collected\s+Date|Reg\s+Date|Registration\s+Date|Report\s+Date|Result\s+Date|Booking\s+Date|Date\s+of\s+Report|Dated|Date)[^\d]*(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})', re.I)
]

PREFIX_PATTERNS = [
    re.compile(r'^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}\s+', re.I),
    re.compile(r'^\d+\.?\d*\s*[\-\–\—\to]+\s*\d+\.?\d*\s*', re.I),
    re.compile(r'^\d+\.?\d*\s*to\s*', re.I),
    re.compile(r'^\(?\s*[<\>]=?\s*\d+\.?\d*\s*\)?\s*', re.I),
    re.compile(
        r'^(INDIRECT ISE|DIRECT ISE|HPLC|CMIA|CLIA|SPECTROPHOTOMETRY|SPECTROPHOMETRY|'
        r'IMPEDANCE\/MICROSCOPY|IMPEDANCE|CALCULATED|DHSS\/MICROSCOPY|DHSS|MICROSCOPY|'
        r'CYANIDE-FREE|ENZYMATIC|GLYCEROL PHOSPHATE|OXIDASE|DETERGENT|ACCELERATOR|'
        r'BROMOCRESOL GREEN|BIURET|DIAZO|DIAZONIUM SALT|KINETIC ALKALINE PICRATE|'
        r'ALKALINE PICRATE-KINETIC|URICASE\/PEROXIDASE|URICASE|UREASE|CMPG3 SUBSTRATE|'
        r'NADH|P-5’-P|W\/O|PARA-NITROPHENYL PHOSPHATE|L-GAMMA-GLUTAMYL|PULSE HEIGHT AVERAGE|'
        r'NGSP CERTIFIED|BLANK|LESS THAN|HERE!|BOOK MORE TESTS|YOUR HEALTH JOURNEY|'
        r'COMPLETE BLOOD COUNT|DIABETES PROFILE|KIDNEY HEALTH|KIDNEY FUNCTION TEST|'
        r'LIVER HEALTH|LIVER FUNCTION TEST|LIPID PROFILE|PANCREAS PROFILE|'
        r'CALCIUM AND BONE HEALTH|VITAMINS & MINERALS|THYROID HEALTH|THYROID PROFILE|'
        r'HAEMATOLOGY|GLP1 PACKAGE|ESTIMATED AVERAGE GLOSSARY|ESTIMATED AVERAGE)\s+',
        re.I
    ),
]

IGNORE_TOKENS = {
    'page ', 'patient', 'sample', 'doctor', 'hospital', 'lab', 'signature', 'method', 'impression',
    'click', 'download', 'prepared', 'basic info', 'note', 'view summary', 'interval', 'trends',
    'journey', 'package', 'road', 'chakrata', 'processed', 'collected', 'account',
    'bio.', 'ref.', 'biological', 'disclaimer', 'guidelines', 'screening', 'indians', 'preceding',
    'experience', 'variation', 'hydroxylation', 'calculator', 'end of report', 'customer', 'referred by',
    'barcode', 'report date', 'sample type', 'report status', 'this test', 'khatauni', 'pargana',
    'uttarakhand', 'comment:', 'interpretation', 'pregnancy', 'trimester', 'association', 'american',
    'thyroid profile total', 'fasting plasma', '2 hr plasma', 'homa ir, insulin', 'homeostatic model',
    'this assay', 'following a 3-step', 'accurate testing', 'ensuring accuracy', 'have concerns',
    'stringent quality', 'measures meeting', 'procedures following', 'cutting-edge', 'above desirable',
    'borderline high', 'industrial estate', 'delhi', 'pincode', 'less than'
}

DISCARD_PHRASES = {
    'less than', 'greater than', 'more than', 'equal to', 'as per', 'refer to', 'below', 'above', 'to'
}

UNITS_REGEX = r'(mg\/dL|g\/dL|uIU\/mL|µIU\/mL|uU\/mL|µU\/mL|U\/L|%|mmol\/L|pg\/mL|ng\/mL|\/cumm|mill\/uL|10\^3\/[µu]L|10\^6\/cu\.mm|lakhs\/cumm|mg\/L|IU\/L|fL|fl|pg|µg\/dL|ug\/dL|Ratio)'

LINE_MATCH_PATTERN = re.compile(
    rf'^([A-Za-z0-9\s\-\/\(\)\%\,\.\+]{{2,40}}?)\s+([\d\.]+)\s*{UNITS_REGEX}?\s*([\<\>\=\d\.\,\s\-\–\—\to]+)?$',
    re.I
)

VALUE_LINE_PATTERN = re.compile(rf'^(\d+\.?\d*)\s*{UNITS_REGEX}?$', re.I)
UNIT_ONLY_PATTERN = re.compile(rf'^{UNITS_REGEX}$', re.I)
