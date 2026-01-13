'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBetSlip, useSettings } from '@/lib/store';
import { X, ChevronUp, Trash2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { americanToDecimal, formatDecimalOdds, formatCurrency } from '@/lib/oddsUtils';

export function FloatingBetSlip() {
  const { selections, isExpanded, stake, removeSelection, clearSelections, toggleExpanded, setStake } = useBetSlip();
  const { reduceMotion } = useSettings();
  const [isHovered, setIsHovered] = useState(false);

  const totalOdds = selections.reduce((acc, sel) => {
    const decimal = americanToDecimal(sel.odds);
    return acc * decimal;
  }, 1);

  const potentialPayout = stake * totalOdds;
  const potentialProfit = potentialPayout - stake;

  if (selections.length === 0) return null;

  const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40" data-testid="floating-betslip">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={reduceMotion ? {} : { opacity: 0, scale: 0.9, y: 20 }}
            animate={reduceMotion ? {} : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? {} : { opacity: 0, scale: 0.9, y: 20 }}
            transition={springConfig}
            className="glass-betslip rounded-2xl w-80 max-h-[70vh] overflow-hidden"
            data-testid="betslip-expanded"
          >
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <span className="font-display text-foreground">Bet Slip</span>
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                    {selections.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive btn-press"
                    onClick={clearSelections}
                    data-testid="button-clear-selections"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground btn-press"
                    onClick={toggleExpanded}
                    data-testid="button-collapse-betslip"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto scrollbar-hide">
              {selections.map((selection, index) => (
                <motion.div
                  key={selection.id}
                  initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
                  animate={reduceMotion ? {} : { opacity: 1, x: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 border-b border-border/20 hover:bg-muted/20 transition-colors"
                  data-testid={`betslip-selection-${selection.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {selection.selection}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selection.type.charAt(0).toUpperCase() + selection.type.slice(1)}
                        {selection.line !== undefined && ` (${selection.line > 0 ? '+' : ''}${selection.line})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="odds-display text-sm">
                        {formatDecimalOdds(americanToDecimal(selection.odds))}
                      </span>
                      <button
                        onClick={() => removeSelection(selection.id)}
                        className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors btn-press"
                        data-testid={`button-remove-selection-${selection.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 space-y-3 bg-background/30">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stake:</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value) || 0)}
                    className="pl-7 h-9 text-sm font-mono"
                    data-testid="input-stake"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Combined Odds:</span>
                  <span className="odds-display">{formatDecimalOdds(totalOdds)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Potential Profit:</span>
                  <motion.span
                    key={potentialProfit}
                    initial={reduceMotion ? {} : { scale: 1.1 }}
                    animate={reduceMotion ? {} : { scale: 1 }}
                    className="value-positive"
                  >
                    +{formatCurrency(potentialProfit)}
                  </motion.span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Total Payout:</span>
                  <motion.span
                    key={potentialPayout}
                    initial={reduceMotion ? {} : { scale: 1.1 }}
                    animate={reduceMotion ? {} : { scale: 1 }}
                    className="font-display text-foreground font-bold"
                  >
                    {formatCurrency(potentialPayout)}
                  </motion.span>
                </div>
              </div>

              <Button
                className="w-full gradient-espn text-white border-0 font-medium btn-press"
                data-testid="button-place-bet"
              >
                Place Bet
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={reduceMotion ? {} : { scale: 0 }}
            animate={reduceMotion ? {} : { scale: 1 }}
            exit={reduceMotion ? {} : { scale: 0 }}
            whileHover={reduceMotion ? {} : { scale: 1.05 }}
            whileTap={reduceMotion ? {} : { scale: 0.95 }}
            transition={springConfig}
            onClick={toggleExpanded}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "glass-betslip rounded-2xl p-4 cursor-pointer touch-target",
              "flex items-center gap-3 transition-all"
            )}
            data-testid="betslip-collapsed"
          >
            <div className="relative">
              <Receipt className="w-6 h-6 text-primary" />
              <motion.span
                initial={reduceMotion ? {} : { scale: 0 }}
                animate={reduceMotion ? {} : { scale: 1 }}
                className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
              >
                {selections.length}
              </motion.span>
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Payout:</span>
                    <span className="value-positive text-sm">{formatCurrency(potentialPayout)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
