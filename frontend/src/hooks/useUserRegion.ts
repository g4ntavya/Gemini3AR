/**
 * useUserRegion hook - Manages user's selected region with localStorage persistence
 * Provides the region code and region data for Gemini transcription optimization
 */

import { useState, useCallback } from 'react';
import { Region, REGIONS, getRegionByCode, DEFAULT_REGION_CODE } from '../data/regions';

const STORAGE_KEY = 'remindar_user_region';

interface UseUserRegionReturn {
    regionCode: string;
    region: Region | undefined;
    setRegionCode: (code: string) => void;
    allRegions: Region[];
}

export function useUserRegion(): UseUserRegionReturn {
    // Initialize from localStorage or default
    const [regionCode, setRegionCodeState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored && getRegionByCode(stored)) {
                return stored;
            }
        }
        return DEFAULT_REGION_CODE;
    });

    // Persist to localStorage when changed
    const setRegionCode = useCallback((code: string) => {
        const region = getRegionByCode(code);
        if (region) {
            setRegionCodeState(code);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, code);
            }
            console.log(`[Region] Set to ${region.name} (${code})`);
        }
    }, []);

    // Get the full region object
    const region = getRegionByCode(regionCode);

    return {
        regionCode,
        region,
        setRegionCode,
        allRegions: REGIONS,
    };
}
