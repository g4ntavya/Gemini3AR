/**
 * Region/Country data for language and accent optimization
 * Each region has primary languages and accent hints for Gemini
 */

export interface Region {
    code: string;           // ISO 3166-1 alpha-2 country code
    name: string;           // Country name
    flag: string;           // Emoji flag
    languages: string[];    // Primary languages spoken
    accentHint: string;     // Accent/dialect hint for Gemini
}

export const REGIONS: Region[] = [
    // A
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', languages: ['Dari', 'Pashto'], accentHint: 'Afghan Dari or Pashto accent' },
    { code: 'AL', name: 'Albania', flag: '🇦🇱', languages: ['Albanian'], accentHint: 'Albanian accent' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', languages: ['Arabic', 'French', 'Berber'], accentHint: 'Algerian Arabic or French accent' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', languages: ['Spanish'], accentHint: 'Rioplatense Spanish accent' },
    { code: 'AM', name: 'Armenia', flag: '🇦🇲', languages: ['Armenian'], accentHint: 'Armenian accent' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', languages: ['English'], accentHint: 'Australian English accent' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', languages: ['German'], accentHint: 'Austrian German accent' },
    { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', languages: ['Azerbaijani'], accentHint: 'Azerbaijani accent' },
    
    // B
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', languages: ['Arabic'], accentHint: 'Gulf Arabic accent' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', languages: ['Bengali', 'English'], accentHint: 'Bengali accent, may mix Bengali and English' },
    { code: 'BY', name: 'Belarus', flag: '🇧🇾', languages: ['Belarusian', 'Russian'], accentHint: 'Belarusian or Russian accent' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', languages: ['Dutch', 'French', 'German'], accentHint: 'Belgian Dutch, French, or German accent' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', languages: ['Portuguese'], accentHint: 'Brazilian Portuguese accent' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', languages: ['Bulgarian'], accentHint: 'Bulgarian accent' },
    
    // C
    { code: 'KH', name: 'Cambodia', flag: '🇰🇭', languages: ['Khmer'], accentHint: 'Khmer accent' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', languages: ['English', 'French'], accentHint: 'Canadian English or Quebec French accent' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', languages: ['Spanish'], accentHint: 'Chilean Spanish accent' },
    { code: 'CN', name: 'China', flag: '🇨🇳', languages: ['Mandarin', 'Cantonese'], accentHint: 'Mandarin Chinese or Cantonese accent' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', languages: ['Spanish'], accentHint: 'Colombian Spanish accent' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷', languages: ['Croatian'], accentHint: 'Croatian accent' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺', languages: ['Spanish'], accentHint: 'Cuban Spanish accent' },
    { code: 'CZ', name: 'Czechia', flag: '🇨🇿', languages: ['Czech'], accentHint: 'Czech accent' },
    
    // D
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', languages: ['Danish'], accentHint: 'Danish accent' },
    { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', languages: ['Spanish'], accentHint: 'Dominican Spanish accent' },
    
    // E
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', languages: ['Spanish'], accentHint: 'Ecuadorian Spanish accent' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', languages: ['Arabic'], accentHint: 'Egyptian Arabic accent' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻', languages: ['Spanish'], accentHint: 'Salvadoran Spanish accent' },
    { code: 'EE', name: 'Estonia', flag: '🇪🇪', languages: ['Estonian'], accentHint: 'Estonian accent' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', languages: ['Amharic', 'Oromo', 'English'], accentHint: 'Ethiopian Amharic accent' },
    
    // F
    { code: 'FI', name: 'Finland', flag: '🇫🇮', languages: ['Finnish', 'Swedish'], accentHint: 'Finnish accent' },
    { code: 'FR', name: 'France', flag: '🇫🇷', languages: ['French'], accentHint: 'Metropolitan French accent' },
    
    // G
    { code: 'GE', name: 'Georgia', flag: '🇬🇪', languages: ['Georgian'], accentHint: 'Georgian accent' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', languages: ['German'], accentHint: 'German accent' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', languages: ['English', 'Akan', 'Twi'], accentHint: 'Ghanaian English accent' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', languages: ['Greek'], accentHint: 'Greek accent' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', languages: ['Spanish'], accentHint: 'Guatemalan Spanish accent' },
    
    // H
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', languages: ['Spanish'], accentHint: 'Honduran Spanish accent' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', languages: ['Cantonese', 'English', 'Mandarin'], accentHint: 'Hong Kong Cantonese or English accent' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺', languages: ['Hungarian'], accentHint: 'Hungarian accent' },
    
    // I
    { code: 'IS', name: 'Iceland', flag: '🇮🇸', languages: ['Icelandic'], accentHint: 'Icelandic accent' },
    { code: 'IN', name: 'India', flag: '🇮🇳', languages: ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'], accentHint: 'Indian accent, may speak Hindi, Hinglish (Hindi-English mix), or regional Indian languages. Transcribe Hindi/Hinglish in Roman letters, not Devanagari.' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', languages: ['Indonesian', 'Javanese'], accentHint: 'Indonesian accent' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷', languages: ['Persian/Farsi'], accentHint: 'Persian/Farsi accent' },
    { code: 'IQ', name: 'Iraq', flag: '🇮🇶', languages: ['Arabic', 'Kurdish'], accentHint: 'Iraqi Arabic or Kurdish accent' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', languages: ['English', 'Irish'], accentHint: 'Irish English accent' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', languages: ['Hebrew', 'Arabic'], accentHint: 'Israeli Hebrew accent' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', languages: ['Italian'], accentHint: 'Italian accent' },
    
    // J
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲', languages: ['English', 'Jamaican Patois'], accentHint: 'Jamaican English or Patois accent' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', languages: ['Japanese'], accentHint: 'Japanese accent' },
    { code: 'JO', name: 'Jordan', flag: '🇯🇴', languages: ['Arabic'], accentHint: 'Jordanian Arabic accent' },
    
    // K
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', languages: ['Kazakh', 'Russian'], accentHint: 'Kazakh or Russian accent' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', languages: ['Swahili', 'English'], accentHint: 'Kenyan English or Swahili accent' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', languages: ['Korean'], accentHint: 'Korean accent' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', languages: ['Arabic'], accentHint: 'Kuwaiti Arabic accent' },
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', languages: ['Kyrgyz', 'Russian'], accentHint: 'Kyrgyz accent' },
    
    // L
    { code: 'LA', name: 'Laos', flag: '🇱🇦', languages: ['Lao'], accentHint: 'Lao accent' },
    { code: 'LV', name: 'Latvia', flag: '🇱🇻', languages: ['Latvian'], accentHint: 'Latvian accent' },
    { code: 'LB', name: 'Lebanon', flag: '🇱🇧', languages: ['Arabic', 'French'], accentHint: 'Lebanese Arabic accent' },
    { code: 'LT', name: 'Lithuania', flag: '🇱🇹', languages: ['Lithuanian'], accentHint: 'Lithuanian accent' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', languages: ['Luxembourgish', 'French', 'German'], accentHint: 'Luxembourgish accent' },
    
    // M
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', languages: ['Malay', 'English', 'Mandarin', 'Tamil'], accentHint: 'Malaysian accent, may mix Malay and English (Manglish)' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', languages: ['Dhivehi', 'English'], accentHint: 'Maldivian accent' },
    { code: 'MT', name: 'Malta', flag: '🇲🇹', languages: ['Maltese', 'English'], accentHint: 'Maltese English accent' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', languages: ['Spanish'], accentHint: 'Mexican Spanish accent' },
    { code: 'MD', name: 'Moldova', flag: '🇲🇩', languages: ['Romanian', 'Russian'], accentHint: 'Moldovan accent' },
    { code: 'MN', name: 'Mongolia', flag: '🇲🇳', languages: ['Mongolian'], accentHint: 'Mongolian accent' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', languages: ['Arabic', 'French', 'Berber'], accentHint: 'Moroccan Arabic or French accent' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲', languages: ['Burmese'], accentHint: 'Burmese accent' },
    
    // N
    { code: 'NP', name: 'Nepal', flag: '🇳🇵', languages: ['Nepali', 'Hindi', 'English'], accentHint: 'Nepali accent, may mix Nepali and English' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', languages: ['Dutch'], accentHint: 'Dutch accent' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', languages: ['English', 'Maori'], accentHint: 'New Zealand English accent' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', languages: ['English', 'Yoruba', 'Hausa', 'Igbo'], accentHint: 'Nigerian English accent' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', languages: ['Norwegian'], accentHint: 'Norwegian accent' },
    
    // O
    { code: 'OM', name: 'Oman', flag: '🇴🇲', languages: ['Arabic'], accentHint: 'Omani Arabic accent' },
    
    // P
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', languages: ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto'], accentHint: 'Pakistani accent, may speak Urdu, English, or mix (Urdish). Transcribe Urdu in Roman letters.' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦', languages: ['Spanish'], accentHint: 'Panamanian Spanish accent' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', languages: ['Spanish', 'Guarani'], accentHint: 'Paraguayan Spanish accent' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', languages: ['Spanish', 'Quechua'], accentHint: 'Peruvian Spanish accent' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', languages: ['Filipino/Tagalog', 'English'], accentHint: 'Filipino accent, may mix Tagalog and English (Taglish)' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', languages: ['Polish'], accentHint: 'Polish accent' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', languages: ['Portuguese'], accentHint: 'European Portuguese accent' },
    { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', languages: ['Spanish', 'English'], accentHint: 'Puerto Rican Spanish accent' },
    
    // Q
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', languages: ['Arabic'], accentHint: 'Qatari Arabic accent' },
    
    // R
    { code: 'RO', name: 'Romania', flag: '🇷🇴', languages: ['Romanian'], accentHint: 'Romanian accent' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', languages: ['Russian'], accentHint: 'Russian accent' },
    
    // S
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', languages: ['Arabic'], accentHint: 'Saudi Arabic accent' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', languages: ['French', 'Wolof'], accentHint: 'Senegalese French accent' },
    { code: 'RS', name: 'Serbia', flag: '🇷🇸', languages: ['Serbian'], accentHint: 'Serbian accent' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', languages: ['English', 'Mandarin', 'Malay', 'Tamil'], accentHint: 'Singaporean English (Singlish) accent' },
    { code: 'SK', name: 'Slovakia', flag: '🇸🇰', languages: ['Slovak'], accentHint: 'Slovak accent' },
    { code: 'SI', name: 'Slovenia', flag: '🇸🇮', languages: ['Slovenian'], accentHint: 'Slovenian accent' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', languages: ['English', 'Afrikaans', 'Zulu', 'Xhosa'], accentHint: 'South African English accent' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', languages: ['Spanish', 'Catalan', 'Basque', 'Galician'], accentHint: 'Castilian Spanish accent' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', languages: ['Sinhala', 'Tamil', 'English'], accentHint: 'Sri Lankan accent' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', languages: ['Swedish'], accentHint: 'Swedish accent' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', languages: ['German', 'French', 'Italian', 'Romansh'], accentHint: 'Swiss German, French, or Italian accent' },
    { code: 'SY', name: 'Syria', flag: '🇸🇾', languages: ['Arabic'], accentHint: 'Syrian Arabic accent' },
    
    // T
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼', languages: ['Mandarin', 'Taiwanese Hokkien'], accentHint: 'Taiwanese Mandarin accent' },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', languages: ['Tajik', 'Russian'], accentHint: 'Tajik accent' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', languages: ['Swahili', 'English'], accentHint: 'Tanzanian accent' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', languages: ['Thai'], accentHint: 'Thai accent' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', languages: ['Turkish'], accentHint: 'Turkish accent' },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', languages: ['Turkmen', 'Russian'], accentHint: 'Turkmen accent' },
    
    // U
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', languages: ['Ukrainian', 'Russian'], accentHint: 'Ukrainian accent' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', languages: ['Arabic', 'English'], accentHint: 'Emirati Arabic or Gulf English accent' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', languages: ['English'], accentHint: 'British English accent (RP, regional variants)' },
    { code: 'US', name: 'United States', flag: '🇺🇸', languages: ['English', 'Spanish'], accentHint: 'American English accent' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', languages: ['Spanish'], accentHint: 'Uruguayan Spanish accent' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', languages: ['Uzbek', 'Russian'], accentHint: 'Uzbek accent' },
    
    // V
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', languages: ['Spanish'], accentHint: 'Venezuelan Spanish accent' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', languages: ['Vietnamese'], accentHint: 'Vietnamese accent' },
    
    // Y
    { code: 'YE', name: 'Yemen', flag: '🇾🇪', languages: ['Arabic'], accentHint: 'Yemeni Arabic accent' },
    
    // Z
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', languages: ['English', 'Bemba', 'Nyanja'], accentHint: 'Zambian English accent' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', languages: ['English', 'Shona', 'Ndebele'], accentHint: 'Zimbabwean English accent' },
];

// Get region by code
export function getRegionByCode(code: string): Region | undefined {
    return REGIONS.find(r => r.code === code);
}

// Default region
export const DEFAULT_REGION_CODE = 'US';

// Build the prompt hint for Gemini based on region
export function buildLanguageHint(region: Region): string {
    const languages = region.languages.join(', ');
    return `User's region: ${region.name}. Expected languages: ${languages}. ${region.accentHint}.`;
}
