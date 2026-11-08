import { currentProfile } from "@/lib/current-profile";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";
import { MemberRole } from "@prisma/client";
import { error } from "console";
import { NextApiRequest } from "next";

export default async function handler(
    req:NextApiRequest,
    res:NextApiResponseServerIo
){
    if(req.method!=="DELETE"&&req.method!=="PATCH"){
        return res.status(405).json({error:"Method is not allowed"})
    }
    try {
        const profile = await currentProfilePages(req);
        const {memberId,serverId,channelId,messageId}=req.query;
        const {content}=req.body;

        if(!profile){
            return res.status(401).json({error:"Unauthorised"})
        }
        
        if(!serverId){
            return res.status(400).json({error:"Server Id missing"})
        }
        if(!channelId){
            return res.status(400).json({error:"Channel Id missing"})
        }

        const server=await db.server.findFirst({
            where:{
                id:serverId as string,
                members:{
                    some:{
                        profileId:profile.id
                    }
                }
            },
            include:{
                members:true
            }
        })

        if(!server){
            return res.status(404).json({error:"Server not found"})
        }

        const channel=await db.channel.findFirst({
            where:{
                id:channelId as string,
                serverId:serverId as string,
            }
        })

        if(!channel){
            return res.status(404).json({error:"channel not found"})
        }

        const member=server.members.find((member)=>member.profileId===profile.id);
        if(!member){
            return res.status(404).json({error:"member not found"})
        }
        let message=await db.message.findFirst({
            where:{
                id:messageId as string,
                channelId:channelId as string,
            },
            include:{
                member:{
                    include:{
                        profile:true
                    }
                }
            }
        })
        if(!message ||message.deleted){
            return res.status(404).json({error:"message not found"})
        }
        const isMessageOwner=message.memberId===member.id;
        const isadmin=member.role===MemberRole.Admin
        const isModerater=member.role===MemberRole.Moderater
        const canModify=isMessageOwner||isadmin||isModerater
        if(!canModify){
            return res.status(401).json({error:"Unauthorised"})
        }

        if(req.method==="DELETE"){
            message=await db.message.update({
                where:{
                    id:messageId as string,
                },
                data:{
                    fileUrl:"",
                    content:"This message has been deleted",
                    deleted:true
                },
                include:{
                    member:{
                        include:{
                            profile:true
                        }
                    }
                }
            })
        }

        if(req.method==="PATCH"){

            if(!isMessageOwner){
                return res.status(401).json({error:"Unauthorised"})
            }
            message=await db.message.update({
                where:{
                    id:messageId as string,
                },
                data:{
                    content,
                },
                include:{
                    member:{
                        include:{
                            profile:true
                        }
                    }
                }
            })
        }

        const updateKey=`chat:${channelId}:messages.update`;


        res?.socket?.server?.io?.emit(updateKey,message)
        return res.status(200).json(message)


    } catch (error) {
        console.log("MESSAGE_ID",error);
        return res.status(500).json({error:"Internal error"})
    }
}