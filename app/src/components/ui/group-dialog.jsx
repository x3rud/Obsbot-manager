import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function GroupDialog({onClick, trigger}) {
        
    const [currentGroup, setCurrentGroup] = useState({ name: ''});

    return (
        <Dialog>
        <form>
            <DialogTrigger asChild>
            <Button>{trigger}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Group</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={currentGroup.name} onChange={e => setCurrentGroup({ ...currentGroup, name: e.target.value })}/>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={() => { onClick(currentGroup); setCurrentGroup({name: ''})}}>Save changes</Button>
                </DialogClose>
            </DialogFooter>
            </DialogContent>
        </form>
        </Dialog>
    )
}
