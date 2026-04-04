/**
 * RegionSelector - Dropdown component for selecting user's region
 * Styled to match the sign-in/logout buttons on the landing page
 */

import { useState, useRef, useEffect } from 'react';
import { Region } from '../data/regions';

interface RegionSelectorProps {
    currentRegion: Region | undefined;
    regions: Region[];
    onSelect: (code: string) => void;
}

export function RegionSelector({ currentRegion, regions, onSelect }: RegionSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Filter regions by search query
    const filteredRegions = regions.filter(region =>
        region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        region.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (code: string) => {
        onSelect(code);
        setIsOpen(false);
        setSearchQuery('');
    };

    const toggleDropdown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    return (
        <div ref={dropdownRef} className="relative z-[60]">
            {/* Region Button - matches auth button style */}
            <button
                onClick={toggleDropdown}
                onTouchEnd={toggleDropdown}
                className="text-[10px] sm:text-sm md:text-base px-3 py-2 md:px-4 md:py-3 border border-black/20 text-black/60 hover:bg-remindar-button-brown hover:text-remindar-button-text hover:border-remindar-button-brown transition-all duration-300 relative z-50 cursor-pointer flex items-center gap-1.5 md:gap-2"
                style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                title="Select your region for voice optimization"
            >
                <span className="text-base sm:text-lg md:text-xl leading-none">
                    {currentRegion?.flag || '🌍'}
                </span>
                <span className="hidden sm:inline">
                    {currentRegion?.code || 'Region'}
                </span>
                {/* Dropdown arrow */}
                <svg 
                    className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-64 sm:w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-black/10 overflow-hidden"
                    style={{ maxHeight: '320px' }}
                >
                    {/* Search Input */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-2 border-b border-black/10">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-black/20 rounded-md focus:outline-none focus:border-remindar-button-brown"
                            style={{ fontFamily: 'HelveticaNeue-Light' }}
                        />
                    </div>

                    {/* Region List */}
                    <div 
                        className="overflow-y-auto"
                        style={{ maxHeight: '260px' }}
                    >
                        {filteredRegions.length === 0 ? (
                            <div 
                                className="px-4 py-3 text-sm text-black/50 text-center"
                                style={{ fontFamily: 'HelveticaNeue-Light' }}
                            >
                                No countries found
                            </div>
                        ) : (
                            filteredRegions.map((region) => (
                                <button
                                    key={region.code}
                                    onClick={() => handleSelect(region.code)}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-remindar-button-brown/20 transition-colors duration-150 text-left ${
                                        currentRegion?.code === region.code ? 'bg-remindar-button-brown/10' : ''
                                    }`}
                                >
                                    <span className="text-xl leading-none flex-shrink-0">
                                        {region.flag}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div 
                                            className="text-sm text-black truncate"
                                            style={{ fontFamily: 'HelveticaNeue-Light' }}
                                        >
                                            {region.name}
                                        </div>
                                        <div 
                                            className="text-xs text-black/70 truncate"
                                            style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                        >
                                            {region.languages.slice(0, 3).join(', ')}
                                            {region.languages.length > 3 && '...'}
                                        </div>
                                    </div>
                                    {currentRegion?.code === region.code && (
                                        <svg className="w-4 h-4 text-remindar-button-brown flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer hint */}
                    <div 
                        className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-3 py-2 border-t border-black/10 text-xs text-black/40 text-center"
                        style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                    >
                        Optimizes voice recognition for your region
                    </div>
                </div>
            )}
        </div>
    );
}
