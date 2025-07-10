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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"

export default function CameraDialog({onClick, trigger, camera = null, groups}) {
        
    const [currentCamera, setCurrentCamera] = useState({ name: '', ip: '', groupId: '' });

    useEffect(() => {
        if (camera) {
            setCurrentCamera(camera);
        }
    }, []);

    return (
        <Dialog>
        <form>
            <DialogTrigger asChild>
            <Button>{trigger}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Camera</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={currentCamera.name} onChange={e => setCurrentCamera({ ...currentCamera, name: e.target.value })}/>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="ip">Ip</Label>
                    <Input id="ip" name="ip" value={currentCamera.ip} onChange={e => setCurrentCamera({ ...currentCamera, ip: e.target.value })}/>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="group">Group</Label>
                    <Select
                        value={currentCamera.groupId}
                        onValueChange={value =>setCurrentCamera({...currentCamera, groupId: value}) }>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Group" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button onClick={() => { onClick(currentCamera); setCurrentCamera({name: '', ip: '', groupId: ''})}}>Save changes</Button>
                </DialogClose>
            </DialogFooter>
            </DialogContent>
        </form>
        </Dialog>
    )
}
