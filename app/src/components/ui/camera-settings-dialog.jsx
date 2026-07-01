import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

const RESOLUTIONS = [
  { value: '3840X2160P60',   label: '4K @ 60fps' },
  { value: '3840X2160P59D94',label: '4K @ 59.94fps' },
  { value: '3840X2160P50',   label: '4K @ 50fps' },
  { value: '3840X2160P48',   label: '4K @ 48fps' },
  { value: '3840X2160P30',   label: '4K @ 30fps' },
  { value: '3840X2160P29D97',label: '4K @ 29.97fps' },
  { value: '3840X2160P25',   label: '4K @ 25fps' },
  { value: '3840X2160P23D98',label: '4K @ 23.98fps' },
  { value: '1920X1080P120',  label: '1080p @ 120fps' },
  { value: '1920X1080P60',   label: '1080p @ 60fps' },
  { value: '1920X1080P59D94',label: '1080p @ 59.94fps' },
  { value: '1920X1080P50',   label: '1080p @ 50fps' },
  { value: '1920X1080P48',   label: '1080p @ 48fps' },
  { value: '1920X1080P30',   label: '1080p @ 30fps' },
  { value: '1920X1080P29D97',label: '1080p @ 29.97fps' },
  { value: '1920X1080P25',   label: '1080p @ 25fps' },
  { value: '1920X1080P23D98',label: '1080p @ 23.98fps' },
  { value: '1280X720P120',   label: '720p @ 120fps' },
  { value: '1280X720P60',    label: '720p @ 60fps' },
  { value: '1280X720P59D94', label: '720p @ 59.94fps' },
  { value: '1280X720P50',    label: '720p @ 50fps' },
  { value: '1280X720P48',    label: '720p @ 48fps' },
  { value: '1280X720P30',    label: '720p @ 30fps' },
  { value: '1280X720P29D97', label: '720p @ 29.97fps' },
  { value: '1280X720P25',    label: '720p @ 25fps' },
  { value: '1280X720P23D98', label: '720p @ 23.98fps' },
]

const EV_VALUES = ['-3.0','-2.7','-2.3','-2.0','-1.7','-1.3','-1.0','-0.7','-0.3','0','0.3','0.7','1.0','1.3','1.7','2.0','2.3','2.7','3.0']
const SHUTTER_VALUES = ['1/6400','1/5000','1/3200','1/2500','1/2000','1/1600','1/1250','1/1000','1/800','1/640','1/500','1/400','1/320','1/240','1/200','1/160','1/120','1/100','1/80','1/60','1/50','1/40','1/30']
const ISO_MIN = ['100','200','400','800','1600','3200']
const ISO_MAX = ['200','400','800','1600','3200','6400']
const TABS = ['Camera', 'Recording', 'Exposure', 'White Balance', 'Image Style']

function SliderRow({ label, value, displayValue, min, max, step = 1, onChange }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{displayValue ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-white" />
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function CameraSettingsDialog({ cam, trigger, groups = [], onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Camera')
  const [loading, setLoading] = useState(false)
  const [s, setS] = useState({})
  const [camEdit, setCamEdit] = useState({ name: cam.name, ip: cam.ip, groupId: cam.groupId })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const upd = (key, val) => setS(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    if (open) load()
  }, [open])

  async function load() {
    setLoading(true)
    const get = (cmd) => apiClient.sendCommand(cam.ip, cmd, null, 'get').then(r => r.data).catch(() => ({}))
    try {
      const [
        rec, bitrate, enc,
        expMode, autoMode, evbias, isorange, antiflick,
        shutter, manIso,
        wb,
        styleMode, bright, contrast, sat, sharp,
      ] = await Promise.all([
        get('record/resolution'),
        get('record/bitrate'),
        get('record/encoder'),
        get('image/exposure/mode'),
        get('image/exposure/auto/mode'),
        get('image/exposure/auto/compensation'),
        get('image/exposure/auto/isorange'),
        get('image/exposure/antiflick/mode'),
        get('image/exposure/manual/shuttertime'),
        get('image/exposure/manual/iso'),
        get('image/whitebalance/config'),
        get('image/style/mode'),
        get('image/style/brightness'),
        get('image/style/contrast'),
        get('image/style/saturation'),
        get('image/style/sharpness'),
      ])
      setS({
        resolution: rec.resolution ?? '1920X1080P30',
        bitrate: bitrate.bitrate ?? 80,
        encoder: enc.encoder ?? 'h264',
        exposureMode: expMode.mode ?? 'auto',
        autoMode: autoMode.mode ?? 'global',
        evbias: String(evbias.evbias ?? 0),
        isomin: String(isorange.isomin ?? 100),
        isomax: String(isorange.isomax ?? 6400),
        antiflick: antiflick.mode ?? 'off',
        shutter: shutter.shutter ?? '1/30',
        manIso: manIso.iso ?? 100,
        wbMode: wb.mode ?? 'auto',
        wbTemp: wb.temperature ?? 5000,
        styleMode: styleMode.mode ?? 'standard',
        brightness: bright.brightness ?? 50,
        contrast: contrast.contrast ?? 50,
        saturation: sat.saturation ?? 50,
        sharpness: sharp.sharpness ?? 50,
      })
    } catch {
      toast.error('Failed to load camera settings')
    } finally {
      setLoading(false)
    }
  }

  const put = (cmd, data) => apiClient.sendCommand(cam.ip, cmd, data, 'put')

  async function applyRecording() {
    await toast.promise(
      Promise.all([
        //put('record/resolution', { resolution: s.resolution }),
        put('record/bitrate', { bitrate: Number(s.bitrate) }),
        put('record/encoder', { encoder: s.encoder }),
      ]),
      { loading: 'Applying…', success: 'Recording settings applied', error: e => `Failed: ${e.message}` }
    )
  }

  async function applyExposure() {
    const tasks = [
      put('image/exposure/mode', { mode: s.exposureMode }),
      put('image/exposure/antiflick/mode', { mode: s.antiflick }),
    ]
    if (s.exposureMode === 'auto') {
      tasks.push(
        put('image/exposure/auto/mode', { mode: s.autoMode }),
        put('image/exposure/auto/compensation', { evbias: Number(s.evbias) }),
        put('image/exposure/auto/isorange', { isomin: Number(s.isomin), isomax: Number(s.isomax) }),
      )
    } else {
      tasks.push(
        put('image/exposure/manual/shuttertime', { shutter: s.shutter }),
        put('image/exposure/manual/iso', { iso: Number(s.manIso) }),
      )
    }
    await toast.promise(Promise.all(tasks),
      { loading: 'Applying…', success: 'Exposure settings applied', error: e => `Failed: ${e.message}` }
    )
  }

  async function applyWhiteBalance() {
    const data = { mode: s.wbMode }
    if (s.wbMode === 'manual') data.temperature = Number(s.wbTemp)
    await toast.promise(put('image/whitebalance/config', data),
      { loading: 'Applying…', success: 'White balance applied', error: e => `Failed: ${e.message}` }
    )
  }

  async function applyImageStyle() {
    const tasks = [put('image/style/mode', { mode: s.styleMode })]
    if (s.styleMode === 'manual') {
      tasks.push(
        put('image/style/brightness', { brightness: s.brightness }),
        put('image/style/contrast', { contrast: s.contrast }),
        put('image/style/saturation', { saturation: s.saturation }),
        put('image/style/sharpness', { sharpness: s.sharpness }),
      )
    }
    await toast.promise(Promise.all(tasks),
      { loading: 'Applying…', success: 'Image style applied', error: e => `Failed: ${e.message}` }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Settings — {cam.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Loading settings…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Tab bar */}
            <div className="flex border-b border-border">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Camera ── */}
            {activeTab === 'Camera' && (
              <div className="grid gap-4">
                <FieldRow label="Name">
                  <Input value={camEdit.name} onChange={e => setCamEdit(p => ({ ...p, name: e.target.value }))} />
                </FieldRow>
                <FieldRow label="IP Address">
                  <Input value={camEdit.ip} onChange={e => setCamEdit(p => ({ ...p, ip: e.target.value }))} />
                </FieldRow>
                {groups.length > 0 && (
                  <FieldRow label="Group">
                    <Select value={String(camEdit.groupId)} onValueChange={v => setCamEdit(p => ({ ...p, groupId: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                )}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { onEdit?.({ ...cam, ...camEdit }); setOpen(false) }}>Save</Button>
                  <Button variant="destructive" onClick={() => setConfirmDelete(true)}>Delete</Button>
                </div>
                {confirmDelete && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 grid gap-2">
                    <p className="text-sm text-destructive font-medium">This will permanently delete this camera.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                      <Button size="sm" variant="destructive" onClick={() => { onDelete?.(cam.id); setOpen(false) }}>Yes, delete</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Recording ── */}
            {activeTab === 'Recording' && (
              <div className="grid gap-4">
                <FieldRow label="Resolution (Don't even try  change res not working from SDK)">
                  <Select value={s.resolution} onValueChange={v => upd('resolution', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {RESOLUTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>

                <FieldRow label="Encoder">
                  <Select value={s.encoder} onValueChange={v => upd('encoder', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h264">H.264</SelectItem>
                      <SelectItem value="h265">H.265</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                <SliderRow label="Bitrate" value={s.bitrate} displayValue={`${s.bitrate} Mbps`} min={1} max={160}
                  onChange={v => upd('bitrate', v)} />

                <Button onClick={applyRecording}>Apply Recording Settings</Button>
              </div>
            )}

            {/* ── Exposure ── */}
            {activeTab === 'Exposure' && (
              <div className="grid gap-4">
                <FieldRow label="Exposure Mode">
                  <Select value={s.exposureMode} onValueChange={v => upd('exposureMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                {s.exposureMode === 'auto' ? (
                  <>
                    <FieldRow label="AE Mode">
                      <Select value={s.autoMode} onValueChange={v => upd('autoMode', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="face">Face</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldRow>

                    <FieldRow label="EV Compensation">
                      <Select value={s.evbias} onValueChange={v => upd('evbias', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EV_VALUES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>

                    <div className="grid grid-cols-2 gap-3">
                      <FieldRow label="ISO Min">
                        <Select value={s.isomin} onValueChange={v => upd('isomin', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ISO_MIN.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </FieldRow>
                      <FieldRow label="ISO Max">
                        <Select value={s.isomax} onValueChange={v => upd('isomax', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ISO_MAX.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </FieldRow>
                    </div>
                  </>
                ) : (
                  <>
                    <FieldRow label="Shutter Speed">
                      <Select value={s.shutter} onValueChange={v => upd('shutter', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-52">
                          {SHUTTER_VALUES.map(v => <SelectItem key={v} value={v}>{v}s</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FieldRow>

                    <SliderRow label="ISO" value={s.manIso} min={100} max={6400} step={100}
                      onChange={v => upd('manIso', v)} />
                  </>
                )}

                <FieldRow label="Anti-flicker">
                  <Select value={s.antiflick} onValueChange={v => upd('antiflick', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="50hz">50 Hz</SelectItem>
                      <SelectItem value="60hz">60 Hz</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                <Button onClick={applyExposure}>Apply Exposure Settings</Button>
              </div>
            )}

            {/* ── White Balance ── */}
            {activeTab === 'White Balance' && (
              <div className="grid gap-4">
                <FieldRow label="White Balance Mode">
                  <Select value={s.wbMode} onValueChange={v => upd('wbMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="daylight">Daylight</SelectItem>
                      <SelectItem value="fluorescent">Fluorescent</SelectItem>
                      <SelectItem value="tungsten">Tungsten</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                {s.wbMode === 'manual' && (
                  <SliderRow label="Color Temperature" value={s.wbTemp} displayValue={`${s.wbTemp} K`}
                    min={2000} max={10000} step={100}
                    onChange={v => upd('wbTemp', v)} />
                )}

                <Button onClick={applyWhiteBalance}>Apply White Balance</Button>
              </div>
            )}

            {/* ── Image Style ── */}
            {activeTab === 'Image Style' && (
              <div className="grid gap-4">
                <FieldRow label="Style Mode">
                  <Select value={s.styleMode} onValueChange={v => upd('styleMode', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                {s.styleMode === 'manual' && (
                  <>
                    <SliderRow label="Brightness" value={s.brightness} min={0} max={100} onChange={v => upd('brightness', v)} />
                    <SliderRow label="Contrast"   value={s.contrast}   min={0} max={100} onChange={v => upd('contrast', v)} />
                    <SliderRow label="Saturation" value={s.saturation} min={0} max={100} onChange={v => upd('saturation', v)} />
                    <SliderRow label="Sharpness"  value={s.sharpness}  min={0} max={100} onChange={v => upd('sharpness', v)} />
                  </>
                )}

                <Button onClick={applyImageStyle}>Apply Image Style</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
