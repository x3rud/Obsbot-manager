import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

function decodeName(b64) {
  try { return atob(b64) } catch { return b64 }
}

export default function CameraPresetsDialog({ cam, trigger }) {
  const [open, setOpen] = useState(false)
  const [presets, setPresets] = useState([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) fetchPresets()
  }, [open])

  async function fetchPresets() {
    setLoading(true)
    try {
      const res = await apiClient.sendCommand(cam.ip, 'ptz/preset', null, 'get')
      setPresets(res.data.presetlist ?? [])
    } catch {
      toast.error('Could not load presets')
    } finally {
      setLoading(false)
    }
  }

  async function savePreset() {
    const name = newName.trim()
    if (!name) return
    const usedIds = new Set(presets.map(p => p.id))
    let nextId = 0
    while (usedIds.has(nextId) && nextId < 254) nextId++

    try {
      await apiClient.sendCommand(cam.ip, 'ptz/preset', {
        operation: 'set',
        id: nextId,
        name: btoa(name),
      }, 'put')
      setNewName('')
      await fetchPresets()
      toast.success(`Preset "${name}" saved`)
    } catch {
      toast.error('Failed to save preset')
    }
  }

  async function callPreset(id, name) {
    try {
      await apiClient.sendCommand(cam.ip, 'ptz/preset', { operation: 'call', id }, 'put')
      toast.success(`Recalled "${name}"`)
    } catch {
      toast.error('Failed to recall preset')
    }
  }

  async function deletePreset(id, name) {
    try {
      await apiClient.sendCommand(cam.ip, 'ptz/preset', { operation: 'delete', id }, 'put')
      await fetchPresets()
      toast.success(`Deleted "${name}"`)
    } catch {
      toast.error('Failed to delete preset')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Presets — {cam.name}</DialogTitle>
        </DialogHeader>

        {/* Save current position */}
        <div className="grid gap-2">
          <Label>Save current position</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Preset name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && savePreset()}
            />
            <Button onClick={savePreset} disabled={!newName.trim()}>Save</Button>
          </div>
        </div>

        {/* Preset list */}
        <div className="grid gap-1 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-2">Loading…</p>
          ) : presets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No presets saved yet.</p>
          ) : (
            presets.map(p => {
              const name = decodeName(p.name) || `Preset ${p.id}`
              return (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">ID {p.id} · {p.pitch?.toFixed(1)}° pitch · {p.yaw?.toFixed(1)}° yaw · {p.ratio?.toFixed(1)}× zoom</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => callPreset(p.id, name)}>Call</Button>
                    <Button size="sm" variant="destructive" onClick={() => deletePreset(p.id, name)}>Del</Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
