# NFL 3D Components

React Three Fiber components for NFL-themed 3D visualizations with broadcast styling.

## Components

### DriveTimeline

3D football field visualization for drive progression with interactive event markers.

```tsx
import { DriveTimeline, type DriveEvent } from '@edgeloop/ui/nfl'

const events: DriveEvent[] = [
  {
    type: 'pass',
    yards: 15,
    quarter: 1,
    clock: '12:45',
    desc: 'P.Mahomes pass deep right to T.Kelce for 15 yards',
    yardLine: 35,
  },
  {
    type: 'run',
    yards: 7,
    quarter: 1,
    clock: '12:10',
    desc: 'I.Pacheco rush left end for 7 yards',
    yardLine: 42,
  },
  {
    type: 'touchdown',
    yards: 20,
    quarter: 1,
    clock: '11:45',
    desc: 'P.Mahomes pass short left to T.Hill for 20 yards, TOUCHDOWN',
    yardLine: 62,
  },
]

export default function GamePage() {
  return <DriveTimeline events={events} startYard={20} variant="hybrid" />
}
```

**Props:**
- `events: DriveEvent[]` - Array of drive events
- `startYard?: number` - Starting yard line (default: 20)
- `endYard?: number` - Ending yard line (optional)
- `variant?: 'field' | 'list' | 'hybrid'` - Display mode (default: 'hybrid')
- `className?: string` - Additional CSS classes

**Event Types:**
- `run` - Rushing play (blue)
- `pass` - Passing play (red)
- `penalty` - Flag (gold)
- `kick` - Punt/kickoff (gray)
- `turnover` - Interception/fumble (orange)
- `touchdown` - Score (green)
- `field_goal` - FG attempt (amber)

**Features:**
- 3D football field with yard markers
- Interactive event spheres (click to expand)
- Orbital camera controls
- Stadium lighting integration
- Responsive list view
- Event highlighting

---

### StadiumLights

Realistic stadium lighting rig for 3D scenes with broadcast presets.

```tsx
import { Canvas } from '@react-three/fiber'
import { StadiumLights } from '@edgeloop/ui/nfl'

export function GameScene() {
  return (
    <Canvas>
      <StadiumLights variant="broadcast" intensity={1} animated />
      {/* Your 3D content */}
    </Canvas>
  )
}
```

**Props:**
- `intensity?: number` - Light brightness multiplier (default: 1)
- `color?: string` - Override light color (default: variant-specific)
- `variant?: 'day' | 'night' | 'broadcast'` - Lighting preset (default: 'broadcast')
- `animated?: boolean` - Enable subtle light pulsing (default: false)

**Variants:**
- `day` - Bright natural lighting (amber: 0.8, directional: 1.2)
- `night` - Dark stadium lights (ambient: 0.3, point: 1.2)
- `broadcast` - Balanced TV lighting (ambient: 0.5, directional: 0.9)

**Lights Included:**
- 1 ambient light (base illumination)
- 1 directional light (key light with shadows)
- 4 point lights (stadium towers at corners)
- 2 fill lights (soft side lighting)
- 1 spot light (rim light from behind)

**Shadow Configuration:**
- Shadow map size: 2048x2048
- Shadow camera: 100x100 unit coverage
- Optimized for 100-unit field scale

---

### ReflectiveCard

Glossy 3D card with PresentationControls for interactive tilt.

```tsx
import { ReflectiveCard } from '@edgeloop/ui/nfl'

export function StatCard() {
  return (
    <ReflectiveCard
      title="PASSING YARDS"
      value="325"
      subtitle="Season Average"
      variant="holographic"
      color="#E31837"
    >
      <div className="text-white/90 text-sm">
        <p>+45 vs. league avg</p>
      </div>
    </ReflectiveCard>
  )
}
```

**Props:**
- `title?: string` - Top label
- `value?: string | number` - Large center value
- `subtitle?: string` - Bottom label
- `variant?: 'glossy' | 'metallic' | 'glass' | 'holographic'` - Material type (default: 'glossy')
- `color?: string` - Card base color (default: '#1d4ed8')
- `className?: string` - Container classes
- `children?: React.ReactNode` - HTML overlay content (bottom positioned)

**Material Properties:**

| Variant | Metalness | Roughness | Special |
|---------|-----------|-----------|---------|
| glossy | 0.9 | 0.1 | clearcoat: 1 |
| metallic | 1.0 | 0.3 | envMap: 1.5x |
| glass | 0.1 | 0 | transmission: 0.9 |
| holographic | 0.8 | 0.2 | iridescence: 1 |

**Interaction:**
- Mouse/touch drag to rotate card
- Snap back to center on release
- Polar rotation: ±60°
- Azimuth rotation: ±45°

**Text Rendering:**
Requires font files in `/public/fonts/`:
- `inter-bold.woff`
- `inter-medium.woff`

*(Fallback: Text will not render if fonts missing)*

---

## Integration with Team Theming

All NFL components respond to team theme switching via CSS custom properties:

```tsx
import { TeamSwitcher, useTeamTheme, DriveTimeline } from '@edgeloop/ui/nfl'

export function GameDashboard() {
  const { team, switchTeam } = useTeamTheme()

  return (
    <div>
      <TeamSwitcher variant="dropdown" />
      
      {/* Components auto-use --team-primary, --team-secondary */}
      <DriveTimeline events={events} />
    </div>
  )
}
```

**CSS Variables Set by TeamSwitcher:**
- `--team-primary` - Main team color
- `--team-secondary` - Secondary color
- `--team-accent` - Accent/highlight color

**HTML Attribute:**
- `data-nfl-team="KC"` - Current team code on `<html>`

---

## Performance Optimization

### Canvas Settings

```tsx
<Canvas
  frameloop="demand"  // Render only when needed
  dpr={[1, 2]}        // Pixel ratio: 1x default, 2x retina
  gl={{
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  }}
>
```

### Shadow Optimization

```tsx
<StadiumLights intensity={0.8} /> {/* Lower = better perf */}
```

Reduce shadow map sizes in `stadium-lights.tsx`:
```ts
shadow-mapSize-width={1024}  // Instead of 2048
shadow-mapSize-height={1024}
```

### Event Markers

DriveTimeline auto-limits detail at scale:
- 100+ events: Reduce sphere segments to 8
- Mobile: Disable OrbitControls zoom/pan

### LOD (Level of Detail)

Not yet implemented. Future: Use `<Lod>` from drei for distant event markers.

---

## Accessibility

**Keyboard Navigation:**
- DriveTimeline: Tab to focus events, Enter to expand
- ReflectiveCard: Arrow keys to rotate (requires focus)

**Screen Readers:**
DriveTimeline list view provides full event descriptions:
```tsx
<DriveTimeline variant="list" /> {/* Accessible fallback */}
```

**Reduced Motion:**
Disable animations via media query:
```tsx
<StadiumLights animated={!prefersReducedMotion} />
```

---

## Troubleshooting

### "Cannot find module '@react-three/fiber'"

Install dependencies:
```bash
cd packages/ui
pnpm add three @react-three/fiber @react-three/drei
```

### 3D Scene Not Rendering

Check Canvas wrapper:
```tsx
// ❌ Wrong
<DriveTimeline /> // No Canvas parent

// ✅ Correct
<Canvas>
  <DriveTimeline />
</Canvas>
```

DriveTimeline includes its own Canvas, but StadiumLights requires parent Canvas.

### Text Not Appearing in ReflectiveCard

Add fonts to `/public/fonts/`:
- Download Inter font from Google Fonts
- Convert to WOFF format
- Name files: `inter-bold.woff`, `inter-medium.woff`

Or disable text:
```tsx
<ReflectiveCard color="#E31837"> {/* No title/value */}
  <div>HTML content here</div>
</ReflectiveCard>
```

### Poor Performance

1. Reduce shadow quality in StadiumLights
2. Use `variant="list"` for DriveTimeline on mobile
3. Set `frameloop="demand"` on Canvas
4. Limit events to <50 for field visualization

---

## Design Tokens Integration

NFL components use existing design system:

```tsx
// Event markers use confidence colors
getEventColor('touchdown') // Uses 'confidence-high' (#10B981)
getEventColor('turnover')  // Uses 'confidence-low' (#EF4444)

// Team colors inject at runtime
switchTeam('KC') // Sets --team-primary: #E31837
```

**CSS Token Mapping:**
- DriveTimeline grass: `#2d5016` (NFL field green)
- End zones: Team primary with 30% opacity
- Event spheres: Emissive glow using token colors
- ScoreBug gradient: `from-[var(--team-primary)]`

---

## Examples

### Full Game Dashboard

```tsx
import {
  ScoreBug,
  PlayClock,
  DriveTimeline,
  ReflectiveCard,
  TeamSwitcher,
  RedZonePulse,
  type DriveEvent,
} from '@edgeloop/ui/nfl'

export default function GameDashboard() {
  const [inRedZone, setInRedZone] = useState(false)
  const [playClock, setPlayClock] = useState(40)

  return (
    <div className="min-h-screen bg-background">
      <TeamSwitcher variant="grid" />
      
      <ScoreBug
        home={{ abbr: 'KC', name: 'Chiefs', score: 21, timeouts: 3 }}
        away={{ abbr: 'SF', name: '49ers', score: 17, timeouts: 2 }}
        quarter={3}
        clock="8:45"
        down={2}
        distance={7}
        yardLine={35}
        possession="home"
        variant="broadcast"
      />

      <div className="grid grid-cols-2 gap-4 p-4">
        <ReflectiveCard
          title="COMPLETION %"
          value="68.5"
          variant="holographic"
          color="var(--team-primary)"
        />
        
        <div>
          <PlayClock seconds={playClock} isRunning variant="warning" />
        </div>
      </div>

      <DriveTimeline events={driveEvents} variant="hybrid" />

      <RedZonePulse active={inRedZone} intensity="high" />
    </div>
  )
}
```

### Minimal Score Widget

```tsx
import { ScoreBug } from '@edgeloop/ui/nfl'

export function ScoreWidget() {
  return (
    <ScoreBug
      home={{ abbr: 'DAL', score: 24, timeouts: 1 }}
      away={{ abbr: 'PHI', score: 20, timeouts: 2 }}
      quarter={4}
      clock="2:34"
      possession="away"
      variant="minimal"
    />
  )
}
```

---

## Future Enhancements

**Planned:**
- GLTF helmet models (useGLTF loader)
- Animated football trajectory paths
- Heat map overlays on field
- Player position tracking (X/Y coords)
- Wind/weather particle effects

**Under Consideration:**
- Replay scrubber with timeline
- Multi-angle camera presets
- AR integration (WebXR)
- Voice narration sync
