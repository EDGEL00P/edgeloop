'use client'

import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { cn } from '../utils'

export interface DriveEvent {
  type: 'run' | 'pass' | 'penalty' | 'kick' | 'turnover' | 'touchdown' | 'field_goal'
  yards: number
  quarter: number
  clock: string
  desc: string
  yardLine: number
}

export interface DriveTimelineProps {
  events: DriveEvent[]
  startYard?: number
  endYard?: number
  className?: string
  variant?: 'field' | 'list' | 'hybrid'
}

export function DriveTimeline({
  events,
  startYard = 20,
  endYard,
  variant = 'hybrid',
  className,
}: DriveTimelineProps) {
  const [selectedEvent, setSelectedEvent] = React.useState<number | null>(null)

  if (variant === 'list') {
    return <DriveTimelineList events={events} className={className} />
  }

  if (variant === 'field') {
    return (
      <DriveTimelineField
        events={events}
        startYard={startYard}
        endYard={endYard}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <DriveTimelineField
        events={events}
        startYard={startYard}
        endYard={endYard}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
      />
      <DriveTimelineList events={events} selectedEvent={selectedEvent} compact />
    </div>
  )
}

function DriveTimelineField({
  events,
  startYard,
  endYard,
  selectedEvent,
  onSelectEvent,
  className,
}: {
  events: DriveEvent[]
  startYard: number
  endYard?: number
  selectedEvent: number | null
  onSelectEvent: (index: number | null) => void
  className?: string
}) {
  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-gradient-to-b from-[#2d5016] to-[#1a3010] h-64', className)}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 40, 60]} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.5} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
        <spotLight position={[0, 50, 0]} intensity={0.5} angle={0.3} penumbra={1} castShadow />

        {/* Football Field */}
        <Field startYard={startYard} endYard={endYard} />

        {/* Drive Events */}
        {events.map((event, i) => (
          <EventMarker
            key={i}
            event={event}
            index={i}
            isSelected={selectedEvent === i}
            onClick={() => onSelectEvent(selectedEvent === i ? null : i)}
            totalEvents={events.length}
          />
        ))}
      </Canvas>
    </div>
  )
}

function Field({ startYard, endYard }: { startYard: number; endYard?: number }) {
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 50]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>

      {/* Yard lines */}
      {Array.from({ length: 11 }).map((_, i) => {
        const yard = i * 10
        return (
          <group key={i}>
            {/* White line */}
            <mesh position={[(i - 5) * 10, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.3, 50]} />
              <meshBasicMaterial color="white" />
            </mesh>
            
            {/* Yard number (simplified) */}
            <Html position={[(i - 5) * 10, 0, -20]} center>
              <div className="text-white text-xs font-bold opacity-50 pointer-events-none">
                {yard === 50 ? '50' : yard > 50 ? 100 - yard : yard}
              </div>
            </Html>
          </group>
        )
      })}

      {/* Hash marks */}
      {Array.from({ length: 99 }).map((_, i) => (
        <mesh key={i} position={[(i - 49) * 1, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 1]} />
          <meshBasicMaterial color="white" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* End zones */}
      <mesh position={[-55, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 50]} />
        <meshStandardMaterial color="#013369" opacity={0.3} transparent />
      </mesh>
      <mesh position={[55, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 50]} />
        <meshStandardMaterial color="#D50A0A" opacity={0.3} transparent />
      </mesh>
    </group>
  )
}

function EventMarker({
  event,
  index,
  isSelected,
  onClick,
  totalEvents,
}: {
  event: DriveEvent
  index: number
  isSelected: boolean
  onClick: () => void
  totalEvents: number
}) {
  const meshRef = React.useRef<any>(null)

  // Convert yard line to 3D position
  const x = ((event.yardLine - 50) / 50) * 50

  const color = getEventColor(event.type)

  React.useEffect(() => {
    if (meshRef.current && isSelected) {
      meshRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.5 + 2
    }
  }, [isSelected])

  return (
    <group position={[x, 1, 0]}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Event label */}
      <Html position={[0, 3, 0]} center>
        <div className={cn(
          'px-3 py-1 rounded-full text-xs font-bold transition-all',
          isSelected ? 'scale-110 bg-black/90 text-white' : 'bg-black/60 text-white/80'
        )}>
          {event.yards > 0 ? `+${event.yards}` : event.yards}
        </div>
      </Html>

      {isSelected && (
        <Html position={[0, -2, 0]} center>
          <div className="bg-black/90 text-white p-3 rounded-lg max-w-xs shadow-2xl">
            <div className="text-xs font-bold uppercase mb-1">{event.type}</div>
            <div className="text-sm">{event.desc}</div>
            <div className="text-xs text-white/60 mt-1">
              Q{event.quarter} • {event.clock}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function DriveTimelineList({
  events,
  selectedEvent,
  compact,
  className,
}: {
  events: DriveEvent[]
  selectedEvent?: number | null
  compact?: boolean
  className?: string
}) {
  return (
    <ol className={cn('space-y-2', compact && 'max-h-48 overflow-y-auto', className)}>
      {events.map((event, i) => (
        <li
          key={i}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg transition-all',
            selectedEvent === i ? 'bg-brand/10 border border-brand' : 'bg-card border border-border',
            compact && 'p-2'
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: getEventColor(event.type) }}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted-foreground">{event.type}</span>
              <span className={cn(
                'text-sm font-bold',
                event.yards > 0 ? 'text-confidence-high' : event.yards < 0 ? 'text-confidence-low' : 'text-muted-foreground'
              )}>
                {event.yards > 0 ? `+${event.yards}` : event.yards} yds
              </span>
            </div>
            <div className="text-sm text-foreground mt-1">{event.desc}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Q{event.quarter}</span>
              <span>•</span>
              <span>{event.clock}</span>
              <span>•</span>
              <span>Yard {event.yardLine}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function getEventColor(type: DriveEvent['type']): string {
  const colors = {
    run: '#0080C6',
    pass: '#E31837',
    penalty: '#FFB81C',
    kick: '#A5ACAF',
    turnover: '#FF3C00',
    touchdown: '#10B981',
    field_goal: '#F59E0B',
  }
  return colors[type] || '#869397'
}
