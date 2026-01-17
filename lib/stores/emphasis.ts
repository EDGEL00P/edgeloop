/**
 * Emphasis Store (Zustand)
 * 
 * Event-driven UI orchestration
 * Pattern: TanStack Query = truth (data), Zustand = emphasis (UI)
 * 
 * Example: Injury event → Zustand expands Risk Strip
 *          Market stabilization → Zustand collapses noise
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type EmphasisState = {
  // Risk Strip visibility & expansion
  riskStripExpanded: boolean;
  riskStripPriority: 'high' | 'medium' | 'low' | null;
  
  // Prediction Call emphasis
  predictionCallHighlighted: boolean;
  predictionCallConfidence: number | null;
  
  // Market stability
  marketVolatile: boolean;
  showMarketNoise: boolean;
  
  // Analyst breakdown
  analystExpanded: boolean;
  analystActivePanel: string | null;
  
  // Line movement
  lineMovementActive: boolean;
  lineMovementKeyEvents: string[];
};

export type EmphasisActions = {
  // Event handlers (triggered by NATS events)
  onInjuryEvent: (severity: 'high' | 'medium' | 'low') => void;
  onMarketStabilized: () => void;
  onMarketVolatile: () => void;
  onHighConfidencePrediction: (confidence: number) => void;
  onLineMovementEvent: (event: string) => void;
  
  // UI orchestration
  expandRiskStrip: () => void;
  collapseRiskStrip: () => void;
  highlightPredictionCall: () => void;
  clearPredictionHighlight: () => void;
  toggleAnalyst: (panelId?: string) => void;
  clearEmphasis: () => void;
};

type EmphasisStore = EmphasisState & EmphasisActions;

const initialState: EmphasisState = {
  riskStripExpanded: false,
  riskStripPriority: null,
  predictionCallHighlighted: false,
  predictionCallConfidence: null,
  marketVolatile: false,
  showMarketNoise: true,
  analystExpanded: false,
  analystActivePanel: null,
  lineMovementActive: false,
  lineMovementKeyEvents: [],
};

export const useEmphasisStore = create<EmphasisStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // Event handlers
      onInjuryEvent: (severity) => {
        set({
          riskStripExpanded: true,
          riskStripPriority: severity,
          showMarketNoise: false, // Collapse noise when injury occurs
        });
        
        // Auto-collapse after 30 seconds
        setTimeout(() => {
          set((state) => ({
            ...state,
            riskStripExpanded: severity === 'high' ? state.riskStripExpanded : false,
          }));
        }, 30000);
      },
      
      onMarketStabilized: () => {
        set({
          marketVolatile: false,
          showMarketNoise: false,
          lineMovementActive: false,
        });
      },
      
      onMarketVolatile: () => {
        set({
          marketVolatile: true,
          showMarketNoise: true,
          lineMovementActive: true,
        });
      },
      
      onHighConfidencePrediction: (confidence) => {
        set({
          predictionCallHighlighted: confidence >= 0.8,
          predictionCallConfidence: confidence,
          showMarketNoise: confidence >= 0.85 ? false : true, // Quiet UI on high confidence
        });
      },
      
      onLineMovementEvent: (event) => {
        set((state) => ({
          lineMovementActive: true,
          lineMovementKeyEvents: [...state.lineMovementKeyEvents.slice(-4), event], // Keep last 5
        }));
      },
      
      // UI orchestration
      expandRiskStrip: () => set({ riskStripExpanded: true }),
      collapseRiskStrip: () => set({ riskStripExpanded: false, riskStripPriority: null }),
      
      highlightPredictionCall: () => set({ predictionCallHighlighted: true }),
      clearPredictionHighlight: () => set({ 
        predictionCallHighlighted: false, 
        predictionCallConfidence: null 
      }),
      
      toggleAnalyst: (panelId) => set((state) => ({
        analystExpanded: !state.analystExpanded,
        analystActivePanel: panelId || null,
      })),
      
      clearEmphasis: () => set(initialState),
    }),
    { name: 'EmphasisStore' }
  )
);
