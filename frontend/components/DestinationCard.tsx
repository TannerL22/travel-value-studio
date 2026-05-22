"use client";

import { Star, Shield, Building2, Users, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Destination = {
  name: string;
  valueTopPercent: number | null;
  valueTitle: string;
  cost: string;
  verdict: string;
  starRating: number;
  qualityLabel: string;
  imageUrl?: string;
  region?: string;
  safety?: number | null;
  infra?: number | null;
  arrivals?: number | null;
  purchasingPower?: number | null;
};

type DestinationCardProps = {
  country: Destination;
  index: number;
  travelStyle: "Backpacker" | "Standard" | "Luxury";
  onClick?: () => void;
};

const formatArrivals = (num: number | null | undefined) => {
  if (num == null) return "N/A";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

export function DestinationCard({ country, index, travelStyle, onClick }: DestinationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = country.imageUrl;

  const valueLabel =
    country.valueTopPercent != null ? `${country.valueTopPercent}` : "N/A";

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
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-950/40 shadow-lg shadow-black/20 cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
          }}
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
              className="absolute inset-0 flex flex-col justify-end bg-black/60 backdrop-blur-[2px] p-4"
            >
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      <span>Safety</span>
                    </div>
                    <span className="text-zinc-200 font-medium">{Math.round((country.safety ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(country.safety ?? 0) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-blue-400" />
                      <span>Infra</span>
                    </div>
                    <span className="text-zinc-200 font-medium">{Math.round((country.infra ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(country.infra ?? 0) * 100}%` }}
                      className="h-full bg-blue-400"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-tight text-zinc-500">Annual Visitors</span>
                    <span className="text-xs font-medium text-white">{formatArrivals(country.arrivals)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-tight text-zinc-500">Value Power</span>
                    <span className="text-xs font-medium text-emerald-400">{country.purchasingPower?.toFixed(2)}x</span>
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
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {country.verdict}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={
                    idx < Math.round(country.starRating)
                      ? "h-3 w-3 fill-emerald-500 text-emerald-500"
                      : "h-3 w-3 text-zinc-600"
                  }
                />
              ))}
              <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                {country.qualityLabel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Estimated daily cost
            </p>
            <p
              className="text-xl font-semibold text-white"
              title={`Estimated ${travelStyle} cost per day`}
            >
              {country.cost}
            </p>
          </div>
        </div>
      </div>
      {country.region ? (
        <div className="border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-400">
          {country.region}
        </div>
      ) : null}
    </motion.div>
  );
}
