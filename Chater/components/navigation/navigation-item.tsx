"use client";

import Image from "next/image";
import { useParams,useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/action-tooltip";
import { on } from "node:stream";



interface NavigationItemProp{
    id:string;
    imageUrl:string;
    name:string;
}   

export const NavigationItem=({id,imageUrl,name}:NavigationItemProp)=>{

    const params=useParams();
    const router=useRouter();

    const onClick=()=>{
        router.push(`/servers/${id}`)
    }


    return (
        <ActionTooltip side="right" align="center" lebel={name}>
            <button
            onClick={onClick}
            className="group relative flex items-center">
                <div className={cn(
                    "absolute left-0 bg-primary rounded-r-full transition-all w-[4px]",
                    params?.serverid!==id && "group-hover:h-[20px]",
                    (params?.serverid === id) ? "h-[36px]":"h-[8px]"

                )}/>
                <div className={cn("relative group h-[48px] w-[48px] rounded-[48px] group-hover:rounded-[16px] transition-all overflow-hidden flex mx-3", 
                    params?.serverId===id && "bg-primary/10 text-primary rounded-[16px] ")}>
                    <Image fill src={imageUrl} alt="Channel"/>
                </div>

            </button>
        </ActionTooltip>
    )
}