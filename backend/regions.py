"""
Region/Country data for language and accent optimization in Gemini transcription.
Maps country codes to language hints for the STT prompt.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class RegionInfo:
    """Region information for language/accent hints."""
    code: str
    name: str
    languages: List[str]
    accent_hint: str


# Comprehensive region data - matches frontend/src/data/regions.ts
REGIONS: Dict[str, RegionInfo] = {
    # A
    'AF': RegionInfo('AF', 'Afghanistan', ['Dari', 'Pashto'], 'Afghan Dari or Pashto accent'),
    'AL': RegionInfo('AL', 'Albania', ['Albanian'], 'Albanian accent'),
    'DZ': RegionInfo('DZ', 'Algeria', ['Arabic', 'French', 'Berber'], 'Algerian Arabic or French accent'),
    'AR': RegionInfo('AR', 'Argentina', ['Spanish'], 'Rioplatense Spanish accent'),
    'AM': RegionInfo('AM', 'Armenia', ['Armenian'], 'Armenian accent'),
    'AU': RegionInfo('AU', 'Australia', ['English'], 'Australian English accent'),
    'AT': RegionInfo('AT', 'Austria', ['German'], 'Austrian German accent'),
    'AZ': RegionInfo('AZ', 'Azerbaijan', ['Azerbaijani'], 'Azerbaijani accent'),
    
    # B
    'BH': RegionInfo('BH', 'Bahrain', ['Arabic'], 'Gulf Arabic accent'),
    'BD': RegionInfo('BD', 'Bangladesh', ['Bengali', 'English'], 'Bengali accent, may mix Bengali and English'),
    'BY': RegionInfo('BY', 'Belarus', ['Belarusian', 'Russian'], 'Belarusian or Russian accent'),
    'BE': RegionInfo('BE', 'Belgium', ['Dutch', 'French', 'German'], 'Belgian Dutch, French, or German accent'),
    'BR': RegionInfo('BR', 'Brazil', ['Portuguese'], 'Brazilian Portuguese accent'),
    'BG': RegionInfo('BG', 'Bulgaria', ['Bulgarian'], 'Bulgarian accent'),
    
    # C
    'KH': RegionInfo('KH', 'Cambodia', ['Khmer'], 'Khmer accent'),
    'CA': RegionInfo('CA', 'Canada', ['English', 'French'], 'Canadian English or Quebec French accent'),
    'CL': RegionInfo('CL', 'Chile', ['Spanish'], 'Chilean Spanish accent'),
    'CN': RegionInfo('CN', 'China', ['Mandarin', 'Cantonese'], 'Mandarin Chinese or Cantonese accent'),
    'CO': RegionInfo('CO', 'Colombia', ['Spanish'], 'Colombian Spanish accent'),
    'HR': RegionInfo('HR', 'Croatia', ['Croatian'], 'Croatian accent'),
    'CU': RegionInfo('CU', 'Cuba', ['Spanish'], 'Cuban Spanish accent'),
    'CZ': RegionInfo('CZ', 'Czechia', ['Czech'], 'Czech accent'),
    
    # D
    'DK': RegionInfo('DK', 'Denmark', ['Danish'], 'Danish accent'),
    'DO': RegionInfo('DO', 'Dominican Republic', ['Spanish'], 'Dominican Spanish accent'),
    
    # E
    'EC': RegionInfo('EC', 'Ecuador', ['Spanish'], 'Ecuadorian Spanish accent'),
    'EG': RegionInfo('EG', 'Egypt', ['Arabic'], 'Egyptian Arabic accent'),
    'SV': RegionInfo('SV', 'El Salvador', ['Spanish'], 'Salvadoran Spanish accent'),
    'EE': RegionInfo('EE', 'Estonia', ['Estonian'], 'Estonian accent'),
    'ET': RegionInfo('ET', 'Ethiopia', ['Amharic', 'Oromo', 'English'], 'Ethiopian Amharic accent'),
    
    # F
    'FI': RegionInfo('FI', 'Finland', ['Finnish', 'Swedish'], 'Finnish accent'),
    'FR': RegionInfo('FR', 'France', ['French'], 'Metropolitan French accent'),
    
    # G
    'GE': RegionInfo('GE', 'Georgia', ['Georgian'], 'Georgian accent'),
    'DE': RegionInfo('DE', 'Germany', ['German'], 'German accent'),
    'GH': RegionInfo('GH', 'Ghana', ['English', 'Akan', 'Twi'], 'Ghanaian English accent'),
    'GR': RegionInfo('GR', 'Greece', ['Greek'], 'Greek accent'),
    'GT': RegionInfo('GT', 'Guatemala', ['Spanish'], 'Guatemalan Spanish accent'),
    
    # H
    'HN': RegionInfo('HN', 'Honduras', ['Spanish'], 'Honduran Spanish accent'),
    'HK': RegionInfo('HK', 'Hong Kong', ['Cantonese', 'English', 'Mandarin'], 'Hong Kong Cantonese or English accent'),
    'HU': RegionInfo('HU', 'Hungary', ['Hungarian'], 'Hungarian accent'),
    
    # I
    'IS': RegionInfo('IS', 'Iceland', ['Icelandic'], 'Icelandic accent'),
    'IN': RegionInfo('IN', 'India', ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'], 
                     'Indian accent, may speak Hindi, Hinglish (Hindi-English mix), or regional Indian languages. Transcribe Hindi/Hinglish in Roman letters, not Devanagari.'),
    'ID': RegionInfo('ID', 'Indonesia', ['Indonesian', 'Javanese'], 'Indonesian accent'),
    'IR': RegionInfo('IR', 'Iran', ['Persian/Farsi'], 'Persian/Farsi accent'),
    'IQ': RegionInfo('IQ', 'Iraq', ['Arabic', 'Kurdish'], 'Iraqi Arabic or Kurdish accent'),
    'IE': RegionInfo('IE', 'Ireland', ['English', 'Irish'], 'Irish English accent'),
    'IL': RegionInfo('IL', 'Israel', ['Hebrew', 'Arabic'], 'Israeli Hebrew accent'),
    'IT': RegionInfo('IT', 'Italy', ['Italian'], 'Italian accent'),
    
    # J
    'JM': RegionInfo('JM', 'Jamaica', ['English', 'Jamaican Patois'], 'Jamaican English or Patois accent'),
    'JP': RegionInfo('JP', 'Japan', ['Japanese'], 'Japanese accent'),
    'JO': RegionInfo('JO', 'Jordan', ['Arabic'], 'Jordanian Arabic accent'),
    
    # K
    'KZ': RegionInfo('KZ', 'Kazakhstan', ['Kazakh', 'Russian'], 'Kazakh or Russian accent'),
    'KE': RegionInfo('KE', 'Kenya', ['Swahili', 'English'], 'Kenyan English or Swahili accent'),
    'KR': RegionInfo('KR', 'South Korea', ['Korean'], 'Korean accent'),
    'KW': RegionInfo('KW', 'Kuwait', ['Arabic'], 'Kuwaiti Arabic accent'),
    'KG': RegionInfo('KG', 'Kyrgyzstan', ['Kyrgyz', 'Russian'], 'Kyrgyz accent'),
    
    # L
    'LA': RegionInfo('LA', 'Laos', ['Lao'], 'Lao accent'),
    'LV': RegionInfo('LV', 'Latvia', ['Latvian'], 'Latvian accent'),
    'LB': RegionInfo('LB', 'Lebanon', ['Arabic', 'French'], 'Lebanese Arabic accent'),
    'LT': RegionInfo('LT', 'Lithuania', ['Lithuanian'], 'Lithuanian accent'),
    'LU': RegionInfo('LU', 'Luxembourg', ['Luxembourgish', 'French', 'German'], 'Luxembourgish accent'),
    
    # M
    'MY': RegionInfo('MY', 'Malaysia', ['Malay', 'English', 'Mandarin', 'Tamil'], 'Malaysian accent, may mix Malay and English (Manglish)'),
    'MV': RegionInfo('MV', 'Maldives', ['Dhivehi', 'English'], 'Maldivian accent'),
    'MT': RegionInfo('MT', 'Malta', ['Maltese', 'English'], 'Maltese English accent'),
    'MX': RegionInfo('MX', 'Mexico', ['Spanish'], 'Mexican Spanish accent'),
    'MD': RegionInfo('MD', 'Moldova', ['Romanian', 'Russian'], 'Moldovan accent'),
    'MN': RegionInfo('MN', 'Mongolia', ['Mongolian'], 'Mongolian accent'),
    'MA': RegionInfo('MA', 'Morocco', ['Arabic', 'French', 'Berber'], 'Moroccan Arabic or French accent'),
    'MM': RegionInfo('MM', 'Myanmar', ['Burmese'], 'Burmese accent'),
    
    # N
    'NP': RegionInfo('NP', 'Nepal', ['Nepali', 'Hindi', 'English'], 'Nepali accent, may mix Nepali and English'),
    'NL': RegionInfo('NL', 'Netherlands', ['Dutch'], 'Dutch accent'),
    'NZ': RegionInfo('NZ', 'New Zealand', ['English', 'Maori'], 'New Zealand English accent'),
    'NG': RegionInfo('NG', 'Nigeria', ['English', 'Yoruba', 'Hausa', 'Igbo'], 'Nigerian English accent'),
    'NO': RegionInfo('NO', 'Norway', ['Norwegian'], 'Norwegian accent'),
    
    # O
    'OM': RegionInfo('OM', 'Oman', ['Arabic'], 'Omani Arabic accent'),
    
    # P
    'PK': RegionInfo('PK', 'Pakistan', ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto'], 
                     'Pakistani accent, may speak Urdu, English, or mix (Urdish). Transcribe Urdu in Roman letters.'),
    'PA': RegionInfo('PA', 'Panama', ['Spanish'], 'Panamanian Spanish accent'),
    'PY': RegionInfo('PY', 'Paraguay', ['Spanish', 'Guarani'], 'Paraguayan Spanish accent'),
    'PE': RegionInfo('PE', 'Peru', ['Spanish', 'Quechua'], 'Peruvian Spanish accent'),
    'PH': RegionInfo('PH', 'Philippines', ['Filipino/Tagalog', 'English'], 'Filipino accent, may mix Tagalog and English (Taglish)'),
    'PL': RegionInfo('PL', 'Poland', ['Polish'], 'Polish accent'),
    'PT': RegionInfo('PT', 'Portugal', ['Portuguese'], 'European Portuguese accent'),
    'PR': RegionInfo('PR', 'Puerto Rico', ['Spanish', 'English'], 'Puerto Rican Spanish accent'),
    
    # Q
    'QA': RegionInfo('QA', 'Qatar', ['Arabic'], 'Qatari Arabic accent'),
    
    # R
    'RO': RegionInfo('RO', 'Romania', ['Romanian'], 'Romanian accent'),
    'RU': RegionInfo('RU', 'Russia', ['Russian'], 'Russian accent'),
    
    # S
    'SA': RegionInfo('SA', 'Saudi Arabia', ['Arabic'], 'Saudi Arabic accent'),
    'SN': RegionInfo('SN', 'Senegal', ['French', 'Wolof'], 'Senegalese French accent'),
    'RS': RegionInfo('RS', 'Serbia', ['Serbian'], 'Serbian accent'),
    'SG': RegionInfo('SG', 'Singapore', ['English', 'Mandarin', 'Malay', 'Tamil'], 'Singaporean English (Singlish) accent'),
    'SK': RegionInfo('SK', 'Slovakia', ['Slovak'], 'Slovak accent'),
    'SI': RegionInfo('SI', 'Slovenia', ['Slovenian'], 'Slovenian accent'),
    'ZA': RegionInfo('ZA', 'South Africa', ['English', 'Afrikaans', 'Zulu', 'Xhosa'], 'South African English accent'),
    'ES': RegionInfo('ES', 'Spain', ['Spanish', 'Catalan', 'Basque', 'Galician'], 'Castilian Spanish accent'),
    'LK': RegionInfo('LK', 'Sri Lanka', ['Sinhala', 'Tamil', 'English'], 'Sri Lankan accent'),
    'SE': RegionInfo('SE', 'Sweden', ['Swedish'], 'Swedish accent'),
    'CH': RegionInfo('CH', 'Switzerland', ['German', 'French', 'Italian', 'Romansh'], 'Swiss German, French, or Italian accent'),
    'SY': RegionInfo('SY', 'Syria', ['Arabic'], 'Syrian Arabic accent'),
    
    # T
    'TW': RegionInfo('TW', 'Taiwan', ['Mandarin', 'Taiwanese Hokkien'], 'Taiwanese Mandarin accent'),
    'TJ': RegionInfo('TJ', 'Tajikistan', ['Tajik', 'Russian'], 'Tajik accent'),
    'TZ': RegionInfo('TZ', 'Tanzania', ['Swahili', 'English'], 'Tanzanian accent'),
    'TH': RegionInfo('TH', 'Thailand', ['Thai'], 'Thai accent'),
    'TR': RegionInfo('TR', 'Turkey', ['Turkish'], 'Turkish accent'),
    'TM': RegionInfo('TM', 'Turkmenistan', ['Turkmen', 'Russian'], 'Turkmen accent'),
    
    # U
    'UA': RegionInfo('UA', 'Ukraine', ['Ukrainian', 'Russian'], 'Ukrainian accent'),
    'AE': RegionInfo('AE', 'United Arab Emirates', ['Arabic', 'English'], 'Emirati Arabic or Gulf English accent'),
    'GB': RegionInfo('GB', 'United Kingdom', ['English'], 'British English accent (RP, regional variants)'),
    'US': RegionInfo('US', 'United States', ['English', 'Spanish'], 'American English accent'),
    'UY': RegionInfo('UY', 'Uruguay', ['Spanish'], 'Uruguayan Spanish accent'),
    'UZ': RegionInfo('UZ', 'Uzbekistan', ['Uzbek', 'Russian'], 'Uzbek accent'),
    
    # V
    'VE': RegionInfo('VE', 'Venezuela', ['Spanish'], 'Venezuelan Spanish accent'),
    'VN': RegionInfo('VN', 'Vietnam', ['Vietnamese'], 'Vietnamese accent'),
    
    # Y
    'YE': RegionInfo('YE', 'Yemen', ['Arabic'], 'Yemeni Arabic accent'),
    
    # Z
    'ZM': RegionInfo('ZM', 'Zambia', ['English', 'Bemba', 'Nyanja'], 'Zambian English accent'),
    'ZW': RegionInfo('ZW', 'Zimbabwe', ['English', 'Shona', 'Ndebele'], 'Zimbabwean English accent'),
}

DEFAULT_REGION_CODE = 'IN'


def get_region(code: str) -> Optional[RegionInfo]:
    """Get region info by country code."""
    return REGIONS.get(code.upper())


def build_language_hint(region_code: str) -> str:
    """
    Build a language/accent hint for Gemini based on the user's region.
    Returns a string to append to the transcription prompt.
    """
    region = get_region(region_code)
    if not region:
        region = REGIONS[DEFAULT_REGION_CODE]
    
    languages = ', '.join(region.languages)
    return f"User's region: {region.name}. Expected languages: {languages}. {region.accent_hint}."
