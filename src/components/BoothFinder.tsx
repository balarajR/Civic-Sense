/**
 * @file   BoothFinder.tsx
 * @module BoothFinder
 * @description Polling booth locator component. Accepts a locality or EPIC ID,
 *              renders an embedded Google Maps iframe (if API key is available),
 *              and provides a direct link to the official ECI electoral search.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, motion/react, lucide-react
 * @exports      BoothFinder (default)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Search, Navigation, Info, ExternalLink } from 'lucide-react';

/**
 * BoothFinder — Interactive polling booth locator with Google Maps embed
 * and a link to the official ECI electoral search portal.
 *
 * @returns {React.JSX.Element} The booth locator panel.
 */
export default function BoothFinder(): React.JSX.Element {
  const [address, setAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const query = `${address.trim()} polling station Karnataka`;
  const officialSearchUrl = 'https://electoralsearch.eci.gov.in';
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      setShowMap(true);
    }
  };

  const handleNavigate = () => {
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Booth Locator</h3>
        <p className="text-xs font-bold text-slate-500 italic">Enter your EPIC number or locality to find your assigned booth.</p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ENTER_LOCALITY_OR_EPIC_ID..."
            aria-label="Enter your locality or EPIC ID to find your polling booth"
            autoComplete="off"
            className="w-full bg-slate-50 border-2 border-black p-4 text-sm font-bold uppercase placeholder:opacity-30 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
          />
          <button 
            type="submit"
            aria-label="Search for polling booth"
            className="absolute right-2 top-2 bottom-2 bg-black text-white px-4 font-black text-xs uppercase hover:bg-slate-800 transition-colors"
          >
            <Search size={16} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </form>

      {showMap ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="border-4 border-black bold-shadow bg-white overflow-hidden relative aspect-square lg:aspect-video">
            {mapsApiKey ? (
              <iframe
                title="Google Maps polling booth location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/search?key=${mapsApiKey}&q=${encodeURIComponent(query)}`}
              />
            ) : (
              <div className="h-full p-8 flex flex-col items-center justify-center text-center bg-slate-50">
                <MapPin size={56} strokeWidth={3} className="text-orange-500 mb-4" />
                <p className="text-lg font-black uppercase italic">Official verification needed</p>
                <p className="text-xs font-bold text-slate-500 mt-2 max-w-sm">
                  Map preview needs a Google Maps API key. Use the official ECI portal to confirm your assigned polling station.
                </p>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 bg-white border-2 border-black p-3 bold-shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 border-2 border-black flex items-center justify-center">
                    <MapPin size={16} strokeWidth={3} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase leading-none">Polling booth search ready</p>
                    <p className="text-[9px] font-bold opacity-60">Verify final assignment with ECI/BLO records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNavigate}
                className="bg-black text-white p-2 border border-black hover:bg-slate-800"
                aria-label="Navigate to polling booth"
              >
                <Navigation size={14} strokeWidth={3} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-black p-4 flex gap-3 text-[10px] font-bold text-black uppercase italic leading-tight">
            <Info size={16} strokeWidth={3} className="shrink-0 text-blue-600" />
            <p>Verification Required: Always cross-check with your official voter slip distributed by the BLO.</p>
          </div>

          <a 
            href={officialSearchUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Open official ECI electoral search portal (opens in new tab)"
            className="w-full flex items-center justify-center gap-2 border-2 border-black py-3 font-black uppercase text-xs hover:bg-slate-50 transition-all bold-shadow-hover"
          >
            OFFICIAL ECI PORTAL <ExternalLink size={14} strokeWidth={3} aria-hidden="true" />
          </a>
        </motion.div>
      ) : (
        <div className="p-12 border-2 border-dashed border-slate-300 flex flex-col items-center text-center text-slate-400 space-y-4">
            <MapPin size={48} strokeWidth={3} className="opacity-10" />
            <p className="text-sm font-black uppercase italic">Map Terminal Offline</p>
            <p className="text-xs font-bold">Input search parameters to initialize visual tracking.</p>
        </div>
      )}
    </div>
  );
}
