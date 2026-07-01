import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PtzJoystick from '@/components/ui/ptz-joystick'
import { apiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

function decodeName(b64) {
  try { return atob(b64) } catch { return b64 }
}

export default function PtzDialog({ cam, open, onOpenChange }) {
  const [presets, setPresets] = useState([])
  const [newName, setNewName] = useState('')
  const [loadingPresets, setLoadingPresets] = useState(false)

  useEffect(() => {
    if (open) fetchPresets()
  }, [open])

  async function fetchPresets() {
    setLoadingPresets(true)
    try {
      const res = await apiClient.sendCommand(cam.ip, 'ptz/preset', null, 'get')
      setPresets(res.data.presetList ?? [])
    } catch {
      toast.error('Could not load presets')
    } finally {
      setLoadingPresets(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>PTZ — {cam.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Joystick */}
          <div className="flex-shrink-0">
            <PtzJoystick cam={cam} />
          </div>

          {/* Divider */}
          <div className="w-px bg-border" />

          {/* Preset list */}
          <div className="flex flex-col flex-1 gap-3 min-w-0">
            <Label>Presets</Label>

            <div className="overflow-y-auto max-h-64 grid gap-1 pr-1">
              {loadingPresets ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No presets saved yet.</p>
              ) : (
                presets.map(p => {
                  const name = decodeName(p.name) || `Preset ${p.id}`
                  return (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-muted/20">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.pitch?.toFixed(1)}° · {p.yaw?.toFixed(1)}° · {p.ratio?.toFixed(1)}×
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button size="sm" variant="outline" onClick={() => callPreset(p.id, name)}>Call</Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePreset(p.id, name)}>Del</Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex gap-2 mt-auto pt-2 border-t border-border">
              <Input
                placeholder="Save current position…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && savePreset()}
              />
              <Button onClick={savePreset} disabled={!newName.trim()}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
