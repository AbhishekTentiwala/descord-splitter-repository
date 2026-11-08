import { redirect } from "next/navigation";
import NavigationAction from "./navigation-action";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationItem } from "@/components/navigation/navigation-item";
import { ModeToggle } from "@/components/mode-togglr";
import { UserButton } from "@clerk/nextjs";
import { backendApi } from "@/lib/api-server";

const NavigationSideBar = async () => {
    const servers = await backendApi.get<Array<{ id: string; name: string; imageUrl: string }>>("/api/servers").catch(() => {
        return redirect("/");
    });
    
    return ( 
        <div className="space-y-4 flex flex-col items-center h-full w-full text-primary bg-[#E3E5E8] dark:bg-[#1E1F22] py-3">
            <NavigationAction/>
            <Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounde-md w-10 mx-auto"/>
            <ScrollArea className="flex-1 w-full">
                {servers.map((server)=>(
                    <div key={server.id} className="mb-4">
                        <NavigationItem 
                        id={server.id}
                        name={server.name}
                        imageUrl={server.imageUrl}/>                    
                    </div>
                ))}
            </ScrollArea>
            <div className="pb-3 mt-auto mb-10 flex gap-y-4 flex-col items-center">
                <ModeToggle/>
                <UserButton
                afterSignOutUrl="/"
                 appearance={
                    {elements:{
                        avatarBox:"h-[48px] w-[48px] "
                    }}
                }/>
            </div>
        </div>
     );
}
 
export default NavigationSideBar;