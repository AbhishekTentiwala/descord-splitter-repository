import { Menu } from "lucide-react"
import { Sheet,SheetTrigger,SheetContent,SheetTitle } from "./ui/sheet"
import { Button } from "./ui/button"
import NavigationSideBar from "./navigation/navigationsidebar"
import { ServerSidebar } from "./sever/server-sidebar"

export const Mobiletoggle=({serverid}:{serverid:string})=>{
    return(
        <Sheet>
            <SheetTrigger asChild>
                <div className="flex items-center">
                    <Button variant={"ghost"} size={"icon"} className="md:hidden">
                    <Menu/>
                </Button>
                <SheetTitle className="hidden">
                    Menu
                </SheetTitle>
                </div>
                
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex gap-0">
                <div className="w-[72px]">
                    <NavigationSideBar/>
                </div>
                <ServerSidebar serverid={serverid}/>
            </SheetContent>
        </Sheet>
    )
}