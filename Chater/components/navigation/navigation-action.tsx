"use client";

import { Plus } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { useModal } from "@/hooks/use-model-store";

const NavigationAction = () => {
    const {onOpen}=useModal();
    return ( 
    <div>
        <ActionTooltip
        side="right" align="center" lebel="Add a Server">
            <button 
            onClick={()=> onOpen("createServer")} className="group">
            <div className="flex mx-3 h-[48px] w-[48px] rounded-[48px] group-hover:rounded-[16px] transition-all overflow-hidden items-center justify-center bg-gray-300  group-hover:bg-orange-500 ">
                <Plus className="group-hover:text-white transition text-orange-500" size={25}
                />
            </div>
            </button>
        </ActionTooltip>
        
    </div> );
}
 
export default NavigationAction;