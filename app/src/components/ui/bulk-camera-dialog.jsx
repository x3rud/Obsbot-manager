import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"

function parseLines(text, groupId) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // split on tab or 2+ spaces
      const parts = line.split(/\t|  +/)
      const name = parts[0]?.trim()
      const ip   = parts[1]?.trim()
      return { name, ip, groupId }
    })
    .filter(c => c.name && c.ip)
}

export default function BulkCameraDialog({ groupId, groupName, onImport, trigger }) {
  const [text, setText] = useState('')

  const preview = parseLines(text, groupId)

  function handleSave() {
    if (preview.length === 0) return
    onImport(preview)
    setText('')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{trigger ?? 'Bulk Add'}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Bulk Add Cameras — {groupName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Paste camera list (Name → Tab/spaces → IP, one per line)</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[160px] focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder={"SEC1-POV-Cam-1\t10.19.67.11\nSEC1-POV-Cam-2\t10.19.67.12"}
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          {preview.length > 0 && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Preview ({preview.length} cameras)</Label>
              <ul className="text-xs font-mono space-y-0.5 max-h-40 overflow-y-auto">
                {preview.map((c, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-green-400 w-40 truncate">{c.name}</span>
                    <span className="text-gray-400">{c.ip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button disabled={preview.length === 0} onClick={handleSave}>
              Add {preview.length > 0 ? `${preview.length} cameras` : ''}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
