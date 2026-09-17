"use client";

import { Star, Shield, Building2, Users, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Destination = {
  name: string;
  valueTopPercent: number | null;
  valueTitle: string;
  verdict: string;
  starRating: number;
  qualityLabel: string;
  imageUrl?: string;
  region?: string;
  stability?: number | null;
  serviceDepth?: number | null;
  arrivals?: number | null;
  purchasingPower?: number | null;
};

type DestinationCardProps = {
  country: Destination;
  index: number;
  onClick?: () => void;
};

const formatArrivals = (num: number | null | undefined) => {
  if (num == null) return "N/A";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

export function DestinationCard({ country, index, onClick }: DestinationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = country.imageUrl;
  const valueLabel = country.valueTopPercent != null ? `${country.valueTopPercent}` : "N/A";
  const pp = country.purchasingPower;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 shadow-lg shadow-black/20"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : "none" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 text-white" title={country.valueTitle}>
          <div className="text-xl font-semibold tracking-tight">{valueLabel}</div>
          <div className="mt-1 h-0.5 w-4 rounded-full bg-white/80" />
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 backdrop-blur-[2px]"
            >
              <div className="mb-2 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      <span>Stability</span>
                    </div>
                    <span className="font-medium text-zinc-200">{Math.round((country.stability ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(country.stability ?? 0) * 100}%` }} className="h-full bg-emerald-500" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-blue-400" />
                      <span>Service depth</span>
                    </div>
                    <span className="font-medium text-zinc-200">{Math.round((country.serviceDepth ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(country.serviceDepth ?? 0) * 100}%` }} className="h-full bg-blue-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-tight text-zinc-500">Arrivals proxy</span>
                    <span className="text-xs font-medium text-white">{formatArrivals(country.arrivals)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-tight text-zinc-500">Purchasing power</span>
                    <span className="text-xs font-medium text-emerald-400">{pp != null ? `${pp.toFixed(2)}x` : "N/A"}</span>
                  </div>
                  <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3 bg-zinc-950/80 px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">{country.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{country.verdict}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={idx < Math.round(country.starRating) ? "h-3 w-3 fill-emerald-500 text-emerald-500" : "h-3 w-3 text-zinc-600"}
                />
              ))}
              <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{country.qualityLabel}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Structural purchasing power</p>
            <p className="text-xl font-semibold text-white" title="Broad purchasing power relative to the selected origin">
              {pp != null ? `${pp.toFixed(2)}x` : "N/A"}
            </p>
          </div>
        </div>
      </div>
      {country.region ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-400">{country.region}</div>
      ) : null}
    </motion.div>
  );
}
