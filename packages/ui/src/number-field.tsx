'use client'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  suffix?: string
  prefix?: string
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  suffix,
  prefix,
}: NumberFieldProps) {
  return (
    <div className="grid gap-1">
      <label className="text-sm opacity-80">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
