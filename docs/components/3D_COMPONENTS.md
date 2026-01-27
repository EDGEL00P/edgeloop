# 3D Advanced UX Components

## 🎯 Overview

Complete suite of advanced 3D UX components with glassmorphism, depth effects, animations, and holographic displays for the Edgeloop platform.

## 📦 Components Created

### 1. **GlassCard** - Glassmorphism Cards
Premium frosted glass effect cards with multiple variants.

**Variants:**
- `default` - Standard glass with backdrop blur
- `frosted` - Heavy frosted glass effect
- `translucent` - Ultra-transparent glass
- `holographic` - Rainbow gradient glass with shimmer

**Features:**
- 3D tilt on hover (disable with `hover3d={false}`)
- Adjustable depth: `flat`, `shallow`, `medium`, `deep`
- Optional glow effect
- Perspective transforms

**Usage:**
```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@edgeloop/ui'

<GlassCard variant="holographic" depth="deep" glow hover3d>
  <GlassCardHeader>
    <GlassCardTitle>Premium Stats</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    {/* Your content */}
  </GlassCardContent>
</GlassCard>
```

### 2. **DepthCard** - Multi-Layer Depth
Cards with stacked shadow layers creating 3D depth.

**Features:**
- Configurable number of layers (1-5)
- Interactive lift on hover
- Elevated shadow system
- Stagger effect on layers

**Usage:**
```tsx
import { DepthCard } from '@edgeloop/ui'

<DepthCard layers={3} elevated interactive>
  <div className="p-6">
    {/* Card content with 3 shadow layers */}
  </div>
</DepthCard>
```

### 3. **FloatingActionButton** - 3D FAB
Floating action buttons with gradient backgrounds and glow effects.

**Variants:**
- `primary` - Brand gradient
- `secondary` - Secondary colors
- `success` - Green confidence gradient
- `danger` - Red alert gradient
- `broadcast` - Red to dark red TV theme

**Positions:**
- `bottom-right`, `bottom-left`, `top-right`, `top-left`

**Features:**
- Scale animations on hover/click
- Ripple effect
- Glow halo
- Optional pulse animation

**Usage:**
```tsx
import { FloatingActionButton } from '@edgeloop/ui'
import { Plus } from 'lucide-react'

<FloatingActionButton 
  variant="broadcast" 
  size="lg" 
  position="bottom-right"
  pulse
>
  <Plus className="h-6 w-6" />
</FloatingActionButton>
```

### 4. **AnimatedGradient** - Background Effects
Animated gradient backgrounds for depth and atmosphere.

**Variants:**
- `aurora` - Northern lights effect
- `mesh` - Radial mesh gradient
- `wave` - Flowing wave animation
- `holographic` - Rainbow hologram
- `neon` - Neon color flow

**Usage:**
```tsx
import { AnimatedGradient, ParallaxContainer } from '@edgeloop/ui'

<div className="relative">
  <AnimatedGradient variant="aurora" speed="slow" opacity={0.3} />
  <div className="relative z-10">
    {/* Content appears above gradient */}
  </div>
</div>

<ParallaxContainer depth={20}>
  {/* Content moves with mouse parallax */}
</ParallaxContainer>
```

### 5. **HolographicStat** - Futuristic Stats
Holographic stat displays with scan lines and corner accents.

**Variants:**
- `default` - Brand colors
- `neon` - Neon green glow
- `cyber` - Red/gold cyberpunk
- `broadcast` - TV broadcast theme

**Features:**
- Animated scan line effect
- Corner accent borders
- Trend indicators (up/down/neutral)
- Gradient text
- Hover glow

**Usage:**
```tsx
import { HolographicStat, NeonText } from '@edgeloop/ui'

<HolographicStat
  label="Win Rate"
  value="67.8%"
  trend={{ direction: 'up', value: '+5.2%' }}
  variant="neon"
  animate
/>

<NeonText color="gold" intensity="high">
  LIVE
</NeonText>
```

### 6. **GameCard3D** - Flippable Game Cards
3D flip cards for game displays with prediction details on back.

**Variants:**
- `default` - Standard card
- `premium` - Gold border broadcast theme
- `live` - Pulsing red border for live games

**Features:**
- Click to flip animation (800ms)
- Team logos with hover scale
- Live score display
- Odds information
- Prediction confidence on back
- Perspective 3D transform

**Usage:**
```tsx
import { GameCard3D } from '@edgeloop/ui'

<GameCard3D
  homeTeam={{ name: 'Chiefs', score: 28, record: '12-5' }}
  awayTeam={{ name: 'Bills', score: 24, record: '11-6' }}
  gameTime="Sun 4:30 PM"
  status="live"
  odds={{ spread: 'KC -3.5', total: 'O/U 52.5' }}
  prediction={{ winner: 'home', confidence: 72 }}
  variant="premium"
/>
```

### 7. **Neumorphic Components** - Soft UI
Neumorphic (soft UI) buttons and effects.

**Components:**
- `NeumorphicButton` - Raised/pressed soft buttons
- `GlowingBorder` - Animated glowing borders
- `PulsingDot` - Status indicators

**Usage:**
```tsx
import { NeumorphicButton, GlowingBorder, PulsingDot } from '@edgeloop/ui'

<NeumorphicButton variant="raised" size="lg">
  Place Bet
</NeumorphicButton>

<GlowingBorder color="gold" thickness={2} animated>
  <div className="p-6">Premium content</div>
</GlowingBorder>

<PulsingDot color="success" size="md" /> Live
```

## 🎨 New CSS Utilities

Added to `packages/tokens/theme.css`:

### Shadows
- `.shadow-3xl` - Extra deep shadow

### Glassmorphism
- `.glass` - Light glass effect
- `.glass-dark` - Dark glass effect

### 3D Transforms
- `.perspective-1000` - 1000px perspective
- `.perspective-2000` - 2000px perspective
- `.transform-style-3d` - Preserve 3D
- `.backface-hidden` - Hide card back
- `.rotate-y-180` - Flip 180°

### Neon Glows
- `.neon-glow-brand` - Blue glow
- `.neon-glow-success` - Green glow
- `.neon-glow-gold` - Gold glow

### Animations
- `.animate-pulse-border` - Pulsing border
- `.animate-gradient` - Gradient animation
- `.animate-gradient-slow` - Slow gradient
- `.animate-gradient-fast` - Fast gradient
- `.animate-shimmer` - Holographic shimmer
- `.animate-float` - Floating effect

## 🎯 Use Cases

### Dashboard Stats
```tsx
<div className="grid grid-cols-3 gap-4">
  <HolographicStat
    label="Total Profit"
    value="$12,450"
    trend={{ direction: 'up', value: '+15%' }}
    variant="neon"
  />
  <HolographicStat
    label="Win Rate"
    value="68%"
    trend={{ direction: 'up', value: '+3%' }}
    variant="cyber"
  />
  <HolographicStat
    label="Active Bets"
    value="23"
    variant="broadcast"
  />
</div>
```

### Game Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {games.map(game => (
    <GameCard3D key={game.id} {...game} variant="premium" />
  ))}
</div>
```

### Premium Alert Card
```tsx
<GlassCard variant="holographic" depth="deep" glow>
  <GlassCardHeader>
    <GlassCardTitle>
      <NeonText color="gold" intensity="high">
        HIGH VALUE ALERT
      </NeonText>
    </GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    <HolographicStat
      label="Expected Value"
      value="+8.5%"
      variant="neon"
      animate
    />
  </GlassCardContent>
</GlassCard>
```

### Floating Actions
```tsx
{/* Add new bet */}
<FloatingActionButton variant="broadcast" position="bottom-right">
  <Plus />
</FloatingActionButton>

{/* Live updates */}
<FloatingActionButton variant="success" position="top-right" pulse>
  <Activity />
</FloatingActionButton>
```

### Animated Background
```tsx
<div className="min-h-screen relative">
  <AnimatedGradient variant="aurora" speed="slow" opacity={0.2} />
  
  <div className="relative z-10 container">
    <ParallaxContainer depth={30}>
      {/* Page content with parallax */}
    </ParallaxContainer>
  </div>
</div>
```

## 🎨 Design Tokens Used

All components integrate with existing design system:
- `--color-brand` - Primary brand blue
- `--color-broadcast-*` - Broadcast theme colors
- `--color-confidence-*` - Confidence indicators
- `--color-market-*` - Market colors
- All theme variants supported

## ♿ Accessibility

- Reduced motion support via `prefers-reduced-motion`
- Keyboard navigation on interactive elements
- ARIA labels where appropriate
- Focus visible states
- Semantic HTML structure

## 📱 Responsive Design

All components are mobile-responsive:
- Touch-friendly sizes
- Disabled 3D effects on mobile (optional)
- Stacked layouts on small screens
- Optimized animations for performance

## 🚀 Performance

- GPU-accelerated transforms
- CSS-only animations where possible
- `will-change` hints for transforms
- Optimized re-renders with React.memo
- Lazy loading support

## 📁 Files Created

```
packages/ui/src/3d/
├── index.ts
├── glass-card.tsx
├── depth-card.tsx
├── floating-action-button.tsx
├── animated-background.tsx
├── holographic-stat.tsx
├── game-card-3d.tsx
└── neumorphic.tsx
```

## 🎯 Next Steps

Optional enhancements:
- [ ] VR/AR preview mode
- [ ] Custom shader effects
- [ ] WebGL backgrounds
- [ ] Physics-based animations
- [ ] Gesture controls
- [ ] Voice command integration

---

**Status:** ✅ All 6 components complete  
**Total Components:** 7 component families with 20+ variants  
**Animations:** 10+ custom keyframe animations  
**Effects:** Glassmorphism, Neumorphism, Holographic, Neon, 3D transforms
