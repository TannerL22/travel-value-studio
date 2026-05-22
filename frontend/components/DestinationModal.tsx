"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Building2, Wallet, TrendingUp, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type RankingRow } from "@/app/page";

type DestinationModalProps = {
  country: RankingRow;
  isOpen: boolean;
  onClose: () => void;
  allResults: RankingRow[];
  imageUrl?: string;
  currencySymbol: string;
  onCompare: (country: RankingRow) => void;
  isComparing: boolean;
};

export function DestinationModal({
  country,
  isOpen,
  onClose,
  allResults,
  imageUrl,
  currencySymbol,
  onCompare,
  isComparing
}: DestinationModalProps) {
  if (!isOpen) return null;

  const currentCost = country.est_daily_cost ?? 0;

  // Find similar countries: Same "Quality" (Infra + Safety) but potentially different price/score
  const quality = ((country.score_infra ?? 0) + (country.score_safety ?? 0)) / 2;
  const similar = allResults
    .filter((r) => r.iso3 !== country.iso3)
    .map((r) => ({
      ...r,
      qDiff: Math.abs(((r.score_infra ?? 0) + (r.score_safety ?? 0)) / 2 - quality)
    }))
    .sort((a, b) => a.qDiff - b.qDiff)
    .slice(0, 3);

  // Find better value: Higher overall Score, similar or better Quality
  const betterValue = allResults
    .filter((r) => r.iso3 !== country.iso3 && (r.Score ?? r.score ?? 0) > (country.Score ?? country.score ?? 0))
    .filter((r) => ((r.score_infra ?? 0) + (r.score_safety ?? 0)) / 2 >= quality * 0.9)
    .slice(0, 3);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl flex flex-col sm:flex-row"
        >
          {/* Left Side: Visual & Quick Stats */}
          <div className="w-full sm:w-1/2 relative h-64 sm:h-auto">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-4xl font-bold text-white mb-1">{country.country}</h2>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="text-sm uppercase tracking-widest text-emerald-400 font-semibold">
                  Rank #{allResults.findIndex(r => r.iso3 === country.iso3) + 1}
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-sm">{country.iso3}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Deep Dive Content */}
          <div className="w-full sm:w-1/2 p-6 sm:p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1">Estimated Cost</p>
                <p className="text-3xl font-bold text-white">{currencySymbol}{Math.round(currentCost)}<span className="text-sm font-normal text-zinc-400"> / day</span></p>
              </div>
              <Button
                onClick={() => onCompare(country)}
                variant={isComparing ? "secondary" : "outline"}
                className={`gap-2 h-10 px-4 rounded-full border-white/10 ${isComparing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-zinc-300'}`}
              >
                {isComparing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {isComparing ? "Comparing" : "Compare"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Safety
                    </span>
                    <span className="text-white font-medium">{Math.round((country.score_safety ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(country.score_safety ?? 0) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Infrastructure
                    </span>
                    <span className="text-white font-medium">{Math.round((country.score_infra ?? 0) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(country.score_infra ?? 0) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xl font-bold">{country.value_multiplier_relative?.toFixed(2)}x</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight uppercase tracking-wider">
                  Relative Value Power
                </p>
                <p className="mt-2 text-[9px] text-zinc-400 italic">
                  Your money goes {country.value_multiplier_relative?.toFixed(2)}x further than at home.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Similar Destinations</h3>
                <div className="grid grid-cols-3 gap-2">
                  {similar.map((r) => (
                    <div key={r.iso3} className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:border-white/10 transition-colors">
                      <p className="text-[10px] font-medium text-white truncate">{r.country}</p>
                      <p className="text-[9px] text-zinc-500">{currencySymbol}{Math.round(r.est_daily_cost ?? 0)}/day</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Better Value Alternatives
                </h3>
                <div className="space-y-2">
                  {betterValue.map((r) => (
                    <div key={r.iso3} className="flex items-center justify-between bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
                      <div>
                        <p className="text-xs font-medium text-white">{r.country}</p>
                        <p className="text-[10px] text-zinc-500">Similar quality, better price score.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">Score {Math.round(r.Score ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
