import { Hash, Menu } from "lucide-react";
import { Mobiletoggle } from "../mobile-toggle";
import { UserAvatar } from "../ui/user.avatar";
import { SocketIndicator } from "../socket-indicator";
import { ChatVideoButton } from "./chat-video-button";

interface Chatheaderprops{
    serverid:string;
    name:string;
    type:"channel"|"conversation"
    imageUrl?:string
}


const Chatheader = ({serverid,name,type,imageUrl}:Chatheaderprops) => {
    return ( 
        <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800">
            <Mobiletoggle serverid={serverid}/>
            {type==="channel"&& (
                <Hash className="w-5 h-5 text-zinc-500 mr-2 dark:text-zinc-400"/>
                
            )}
            {type==="conversation"&&(
                <UserAvatar src={imageUrl} className="h-8 w-8 mr-2"/>
            )}
            <p className="font-semibold text-md text-black dark:text-white">
                {name}
            </p>
            <div className="ml-auto flex items-center">
                {type === "conversation" ? <ChatVideoButton /> : null}
                <SocketIndicator/>
            </div>

        </div>
     );
}
 
export default Chatheader;