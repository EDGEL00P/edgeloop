type RuntimeStatus = 'connecting' | 'online' | 'offline'

type RuntimeHealthResponse = {
  status: 'ok'
  startedAt: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'GET', headers: { 'cache-control': 'no-store' } })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`)
  }
  return (await res.json()) as T
}

type ApiModelStatus = {
  modelVersion: string
  dataAsOfIso: string
  drift: { ps: number }
}

type ApiPredictionResponse = {
  asOfIso: string
  modelVersion: string
  predictions: Prediction[]
}

type ApiAlertsResponse = {
  asOfIso: string
  alerts: Alert[]
}

async function refreshFromApi(model: AppModel): Promise<void> {
  const [ms, pr, ar] = await Promise.allSettled([
    fetchJson<ApiModelStatus>('/api/model-status'),
    fetchJson<ApiPredictionResponse>('/api/predictions'),
    fetchJson<ApiAlertsResponse>('/api/alerts'),
  ])

  if (ms.status === 'fulfilled') {
    model.modelVersion = ms.value.modelVersion
    model.dataAsOfIso = ms.value.dataAsOfIso
    model.driftPs = ms.value.drift.ps
  }

  if (pr.status === 'fulfilled') {
    model.modelVersion = pr.value.modelVersion
    model.predictions = pr.value.predictions
  }

  if (ar.status === 'fulfilled') {
    model.alerts = ar.value.alerts
  }
}

type RuntimeSignal = {
  status: RuntimeStatus
  requestId?: string
  startedAt?: string
  detail?: string
}

type Severity = 'info' | 'warn' | 'crit'

type Alert = {
  id: string
  tsIso: string
  severity: Severity
  title: string
  detail: string
  source: string
}

type Prediction = {
  id: string
  away: string
  home: string
  kickoffIso: string
  winProbHome: number // 0..1
  oddsHomeAmerican: number
  impliedProbHome: number
  edgeHome: number
  spreadHome: number // negative favored
  total: number
  confidence: number // 0..1
}

type AppModel = {
  runtime: RuntimeSignal
  modelVersion: string
  dataAsOfIso: string
  predictions: Prediction[]
  alerts: Alert[]
  driftPs: number
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  return node
}

function mustGetElementById(id: string): HTMLElement {
  const node = document.getElementById(id)
  if (!node) throw new Error('Missing #' + id)
  return node
}

function setText(node: HTMLElement, text: string): void {
  node.textContent = text
}

function isoNow(): string {
  return new Date().toISOString()
}

function fmtClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function runtimeLedClass(status: RuntimeStatus): string {
  if (status === 'online') return 'led led--green'
  if (status === 'connecting') return 'led led--amber'
  return 'led led--red'
}

function sevClass(sev: Severity): string {
  if (sev === 'crit') return 'sev sev--crit'
  if (sev === 'warn') return 'sev sev--warn'
  return 'sev sev--info'
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function fmtSpread(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}`
}

function fmtEdge(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${(n * 100).toFixed(1)}pp`
}

function renderTopbar(model: AppModel): HTMLElement {
  const bar = el('header', 'cr-topbar')

  const brand = el('div', 'brand')
  const mark = el('div', 'brand-mark')
  const stack = el('div')
  const title = el('div', 'brand-title')
  setText(title, 'EdgeLoop · NFL Predictions')
  const sub = el('div', 'brand-sub')
  setText(sub, `model=${model.modelVersion} · dataAsOf=${model.dataAsOfIso.slice(11, 19)}Z`)
  stack.append(title, sub)
  brand.append(mark, stack)

  const right = el('div', 'topbar-right')

  const runtime = el('div', 'pill pill--kpi')
  const led = el('div', runtimeLedClass(model.runtime.status))
  const rtLabel = el('div')
  rtLabel.setAttribute('data-role', 'runtime-label')
  setText(rtLabel, `runtime=${model.runtime.status}`)
  runtime.append(led, rtLabel)

  const clock = el('div', 'clock')
  clock.setAttribute('data-role', 'clock')
  setText(clock, fmtClock(new Date()))

  right.append(runtime, clock)

  bar.append(brand, right)
  return bar
}

function renderNav(model: AppModel): HTMLElement {
  const wrap = el('aside', 'cr-left')

  const panel = el('div', 'panel')
  const header = el('div', 'panel__header')
  const title = el('div', 'panel__title')
  setText(title, 'Models')
  const hint = el('div', 'panel__hint')
  hint.setAttribute('data-role', 'alerts-count')
  setText(hint, `alerts=${model.alerts.length}`)
  header.append(title, hint)

  const body = el('div', 'panel__body')
  const nav = el('nav', 'nav')

  const sec1 = el('div', 'nav__section')
  setText(sec1, 'Views')

  const item1 = el('div', 'nav__item nav__item--active')
  const i1l = el('div', 'nav__label')
  setText(i1l, 'Predictions')
  const i1m = el('div', 'nav__meta')
  setText(i1m, 'week')
  item1.append(i1l, i1m)

  const item2 = el('div', 'nav__item')
  const i2l = el('div', 'nav__label')
  setText(i2l, 'Calibration')
  const i2m = el('div', 'nav__meta')
  setText(i2m, 'beta')
  item2.append(i2l, i2m)

  const sec2 = el('div', 'nav__section')
  setText(sec2, 'Ops')

  const item3 = el('div', 'nav__item')
  const i3l = el('div', 'nav__label')
  setText(i3l, 'Alerts')
  const i3m = el('div', 'nav__meta')
  i3m.setAttribute('data-role', 'alerts-count-chip')
  setText(i3m, String(model.alerts.length))
  item3.append(i3l, i3m)

  nav.append(sec1, item1, item2, sec2, item3)
  body.append(nav)

  panel.append(header, body)
  wrap.append(panel)
  return wrap
}

function renderPredictionCard(p: Prediction): HTMLElement {
  const card = el('div', 'card')

  const header = el('div', 'card__header')
  const teams = el('div', 'teams')
  const main = el('div', 'teams__main')
  setText(main, `${p.away} @ ${p.home}`)
  const sub = el('div', 'teams__sub')
  setText(sub, `kickoff=${p.kickoffIso.slice(0, 16).replace('T', ' ')}Z`)
  teams.append(main, sub)

  const conf = el('div', 'pill pill--kpi')
  conf.setAttribute('data-role', `conf-${p.id}`)
  setText(conf, `conf=${pct(p.confidence)}`)

  header.append(teams, conf)

  const body = el('div', 'card__body')

  const prob = el('div', 'prob')
  const probRow = el('div', 'prob__row')
  setText(probRow, `${p.home} win prob`)
  const probPct = el('div', 'prob__row')
  probPct.style.justifyContent = 'flex-end'
  probPct.setAttribute('data-role', `wp-${p.id}`)
  setText(probPct, pct(p.winProbHome))

  const bar = el('div', 'prob__bar')
  const fill = el('div', 'prob__fill')
  fill.setAttribute('data-role', `wpbar-${p.id}`)
  fill.style.width = `${Math.round(p.winProbHome * 100)}%`
  bar.append(fill)

  prob.append(probRow, probPct, bar)

  const kv = el('div', 'kv')
  const k1 = el('div', 'kv__item')
  const k1l = el('div', 'kv__label')
  setText(k1l, 'spread (home)')
  const k1v = el('div', 'kv__value')
  k1v.setAttribute('data-role', `spread-${p.id}`)
  setText(k1v, fmtSpread(p.spreadHome))
  k1.append(k1l, k1v)

  const k2 = el('div', 'kv__item')
  const k2l = el('div', 'kv__label')
  setText(k2l, 'total')
  const k2v = el('div', 'kv__value')
  k2v.setAttribute('data-role', `total-${p.id}`)
  setText(k2v, p.total.toFixed(1))
  k2.append(k2l, k2v)

  const k3 = el('div', 'kv__item')
  const k3l = el('div', 'kv__label')
  setText(k3l, 'implied (home)')
  const k3v = el('div', 'kv__value')
  k3v.setAttribute('data-role', `imp-${p.id}`)
  setText(k3v, pct(p.impliedProbHome))
  k3.append(k3l, k3v)

  const k4 = el('div', 'kv__item')
  const k4l = el('div', 'kv__label')
  setText(k4l, 'edge (home)')
  const k4v = el('div', 'kv__value')
  k4v.setAttribute('data-role', `edgep-${p.id}`)
  setText(k4v, fmtEdge(p.edgeHome))
  k4.append(k4l, k4v)

  kv.append(k1, k2, k3, k4)

  body.append(prob, kv)
  card.append(header, body)
  return card
}

function renderPredictions(model: AppModel): HTMLElement {
  const wrap = el('section', 'cr-main')

  const panel = el('div', 'panel')
  const header = el('div', 'panel__header')
  const title = el('div', 'panel__title')
  setText(title, 'Predictions')
  const hint = el('div', 'panel__hint')
  hint.setAttribute('data-role', 'data-age')
  setText(hint, 'dataAge=—')
  header.append(title, hint)

  const body = el('div', 'panel__body')

  if (model.runtime.status !== 'online') {
    const banner = el('div', 'banner')
    const rid = model.runtime.requestId
      ? `requestId=${model.runtime.requestId}`
      : 'requestId=unavailable'
    setText(
      banner,
      `Runtime ${model.runtime.status}. healthz unavailable on this preview server · ${rid}`,
    )
    body.append(banner)
  }

  const cards = el('div', 'cards')
  for (const p of model.predictions) cards.append(renderPredictionCard(p))
  body.append(cards)

  panel.append(header, body)
  wrap.append(panel)
  return wrap
}

function renderAlerts(model: AppModel): HTMLElement {
  const wrap = el('aside', 'cr-right')

  const panel = el('div', 'panel')
  const header = el('div', 'panel__header')
  const title = el('div', 'panel__title')
  setText(title, 'Alerts + Data Health')
  const hint = el('div', 'panel__hint')
  hint.setAttribute('data-role', 'alerts-summary')
  setText(hint, `count=${model.alerts.length}`)
  header.append(title, hint)

  const body = el('div', 'panel__body')

  const list = el('div', 'list')
  for (const a of model.alerts.slice(0, 6)) {
    const row = el('div', 'row')
    const left = el('div', 'row__left')

    const top = el('div', 'row__title')
    setText(top, a.title)

    const sub = el('div', 'row__sub')
    setText(sub, `${a.tsIso.slice(11, 19)}Z · source=${a.source} · ${a.detail}`)

    left.append(top, sub)

    const meta = el('div', sevClass(a.severity))
    setText(meta, a.severity)

    row.append(left, meta)
    list.append(row)
  }

  const health = el('div', 'list')
  const h1 = el('div', 'row')
  const h1l = el('div', 'row__left')
  const h1t = el('div', 'row__title')
  setText(h1t, 'Data freshness')
  const h1s = el('div', 'row__sub')
  setText(h1s, `asOf=${model.dataAsOfIso.slice(11, 19)}Z`)
  h1l.append(h1t, h1s)
  const h1m = el('div', 'kpi')
  h1m.setAttribute('data-role', 'data-freshness')
  setText(h1m, 'age=—')
  h1.append(h1l, h1m)

  const h2 = el('div', 'row')
  const h2l = el('div', 'row__left')
  const h2t = el('div', 'row__title')
  setText(h2t, 'Model drift')
  const h2s = el('div', 'row__sub')
  setText(h2s, 'calibration')
  h2l.append(h2t, h2s)
  const h2m = el('div', 'kpi')
  h2m.setAttribute('data-role', 'drift')
  setText(h2m, `ps=${model.driftPs.toFixed(3)}`)
  h2.append(h2l, h2m)

  health.append(h1, h2)

  body.append(list, el('div', 'panel__hint'), health)
  panel.append(header, body)
  wrap.append(panel)
  return wrap
}

function renderSlate(model: AppModel): HTMLElement {
  const wrap = el('section', 'cr-rundown')

  const panel = el('div', 'panel')
  const header = el('div', 'panel__header')
  const title = el('div', 'panel__title')
  setText(title, 'Slate')
  const hint = el('div', 'panel__hint')
  setText(hint, 'edges (placeholder)')
  header.append(title, hint)

  const body = el('div', 'panel__body')
  const list = el('div', 'list')

  for (const p of model.predictions) {
    const row = el('div', 'row')
    const left = el('div', 'row__left')
    const t = el('div', 'row__title')
    setText(t, `${p.away} @ ${p.home}`)
    const s = el('div', 'row__sub')
    setText(
      s,
      `wp(home)=${pct(p.winProbHome)} · spread=${fmtSpread(p.spreadHome)} · total=${p.total.toFixed(1)}`,
    )
    left.append(t, s)
    const meta = el('div', 'kpi')
    meta.setAttribute('data-role', `edge-${p.id}`)
    setText(meta, 'edge=—')
    row.append(left, meta)
    list.append(row)
  }

  body.append(list)
  panel.append(header, body)
  wrap.append(panel)
  return wrap
}

function mount(root: HTMLElement, model: AppModel): void {
  root.textContent = ''

  const shell = el('div', 'cr-shell')
  shell.append(
    renderTopbar(model),
    renderNav(model),
    renderPredictions(model),
    renderAlerts(model),
    renderSlate(model),
  )

  root.append(shell)
}

function startTicker(model: AppModel): void {
  const tick = () => {
    const now = new Date()
    const clock = document.querySelector<HTMLElement>('[data-role="clock"]')
    if (clock) clock.textContent = fmtClock(now)

    const runtimeLabel = document.querySelector<HTMLElement>('[data-role="runtime-label"]')
    if (runtimeLabel) runtimeLabel.textContent = `runtime=${model.runtime.status}`

    const ageMs = now.getTime() - new Date(model.dataAsOfIso).getTime()
    const ageS = Math.max(0, Math.round(ageMs / 1000))

    const dataAge = document.querySelector<HTMLElement>('[data-role="data-age"]')
    if (dataAge) dataAge.textContent = `dataAge=${ageS}s`

    const freshness = document.querySelector<HTMLElement>('[data-role="data-freshness"]')
    if (freshness) freshness.textContent = `age=${ageS}s`

    const drift = document.querySelector<HTMLElement>('[data-role="drift"]')
    if (drift) {
      drift.textContent = `ps=${model.driftPs.toFixed(3)}`
    }

    for (const p of model.predictions) {
      const wp = document.querySelector<HTMLElement>(`[data-role="wp-${p.id}"]`)
      if (wp) wp.textContent = pct(p.winProbHome)

      const fill = document.querySelector<HTMLElement>(`[data-role="wpbar-${p.id}"]`)
      if (fill) fill.style.width = `${Math.round(p.winProbHome * 100)}%`

      const conf = document.querySelector<HTMLElement>(`[data-role="conf-${p.id}"]`)
      if (conf) conf.textContent = `conf=${pct(p.confidence)}`

      const edge = document.querySelector<HTMLElement>(`[data-role="edge-${p.id}"]`)
      if (edge) {
        edge.textContent = `edge=${fmtEdge(p.edgeHome)}`
      }

      const imp = document.querySelector<HTMLElement>(`[data-role="imp-${p.id}"]`)
      if (imp) imp.textContent = pct(p.impliedProbHome)

      const edgep = document.querySelector<HTMLElement>(`[data-role="edgep-${p.id}"]`)
      if (edgep) edgep.textContent = fmtEdge(p.edgeHome)
    }

    const aCount = document.querySelector<HTMLElement>('[data-role="alerts-count"]')
    if (aCount) aCount.textContent = `alerts=${model.alerts.length}`

    const aChip = document.querySelector<HTMLElement>('[data-role="alerts-count-chip"]')
    if (aChip) aChip.textContent = String(model.alerts.length)

    const aSum = document.querySelector<HTMLElement>('[data-role="alerts-summary"]')
    if (aSum) aSum.textContent = `count=${model.alerts.length}`
  }

  tick()
  window.setInterval(tick, 500)
}

const root = mustGetElementById('app')

const model: AppModel = {
  runtime: { status: 'connecting' },
  modelVersion: 'v0.1-hud',
  dataAsOfIso: isoNow(),
  driftPs: 0,
  predictions: [
    {
      id: 'g1',
      away: 'KC',
      home: 'BUF',
      kickoffIso: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      winProbHome: 0.58,
      oddsHomeAmerican: -135,
      impliedProbHome: 0.574,
      edgeHome: 0.006,
      spreadHome: -2.5,
      total: 48.5,
      confidence: 0.74,
    },
    {
      id: 'g2',
      away: 'SF',
      home: 'DAL',
      kickoffIso: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      winProbHome: 0.44,
      oddsHomeAmerican: 120,
      impliedProbHome: 0.455,
      edgeHome: -0.015,
      spreadHome: +1.5,
      total: 44.0,
      confidence: 0.62,
    },
  ],
  alerts: [
    {
      id: 'a-seed-1',
      tsIso: isoNow(),
      severity: 'info',
      title: 'Model warm start',
      detail: 'loaded priors',
      source: 'model',
    },
  ],
}

mount(root, model)
startTicker(model)

// Poll API surfaces (predictions + alerts + model status).
// Works through scripts/serve-control-room.js proxy when using the preview server.
const poll = async () => {
  try {
    await refreshFromApi(model)
    mount(root, model)
  } catch {
    // Keep last known data.
  }
}
void poll()
window.setInterval(() => void poll(), 10_000)

async function bootstrap(): Promise<void> {
  try {
    const res = await fetch('/healthz', {
      method: 'GET',
      headers: { 'cache-control': 'no-store' },
    })

    const requestId = res.headers.get('x-request-id') ?? undefined

    if (!res.ok) {
      model.runtime = {
        status: 'offline',
        ...(requestId ? { requestId } : {}),
        detail: `HTTP ${res.status}`,
      }
      mount(root, model)
      return
    }

    const data = (await res.json()) as Partial<RuntimeHealthResponse>
    if (data.status !== 'ok' || typeof data.startedAt !== 'string') {
      model.runtime = {
        status: 'offline',
        ...(requestId ? { requestId } : {}),
        detail: 'schema mismatch from /healthz',
      }
      mount(root, model)
      return
    }

    model.runtime = {
      status: 'online',
      ...(requestId ? { requestId } : {}),
      startedAt: data.startedAt,
    }

    // Best-effort refresh
    await poll()
    mount(root, model)
  } catch (err) {
    model.runtime = {
      status: 'offline',
      detail: String(err),
    }
    mount(root, model)
  }
}

void bootstrap()
