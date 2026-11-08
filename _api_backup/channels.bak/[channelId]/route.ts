import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function DELETE(
    req:Request,
    {params}:{params:{channelId:string}}
){
    try {
        const profile =await currentProfile()
        const {searchParams}=new URL(req.url)

        const serverid=searchParams.get("serverid")

        if(!profile){
            return new NextResponse("Unauthorised",{status:401})
        }
        if(!serverid){
            return new NextResponse("Server id missing",{status:400})
        }
        if(!params.channelId){
            return new NextResponse("channel id missing",{status:400})
        }

        const server=await db.server.update({
            where:{
                id:serverid,
                members:{
                    some:{
                        profileId:profile.id,
                        role:{
                            in:[MemberRole.Admin,MemberRole.Moderater]
                        }
                    }
                }
            },
            data:{
                channels:{
                    delete:{
                        id:params.channelId,
                        name:{
                            not:"general"
                        }
                    }
                }
            }
        });
        return NextResponse.json(server)        
    } catch (error) {
        console.log("[DELETE-CHANNEL-ID]",error);
        return new NextResponse("Internal error",{status:500})        
    }

}


export async function PATCH(
    req:Request,
    {params}:{params:{channelId:string}}
){
    try {
        const profile =await currentProfile()
        const {name,type}=await req.json()
        const {searchParams}=new URL(req.url)

        const serverid=searchParams.get("serverid")

        if(!profile){
            return new NextResponse("Unauthorised",{status:401})
        }
        if(!serverid){
            return new NextResponse("Server id missing",{status:400})
        }
        if(!params.channelId){
            return new NextResponse("channel id missing",{status:400})
        }
        if(name==='general'){
            return new NextResponse("name can not be general",{status:400})
        }

        const server=await db.server.update({
            where:{
                id:serverid,
                members:{
                    some:{
                        profileId:profile.id,
                        role:{
                            in:[MemberRole.Admin,MemberRole.Moderater]
                        }
                    }
                }
            },
            data:{
                channels:{
                    update:{
                        where:{
                            id:params.channelId,
                            NOT:{
                                name:"general",
                            },

                        },
                        data:{
                            name,
                            type
                        }
                    }
                }
            }
        });
        return NextResponse.json(server)        
    } catch (error) {
        console.log("[PATCH-CHANNEL-ID]",error);
        return new NextResponse("Internal error",{status:500})        
    }

}