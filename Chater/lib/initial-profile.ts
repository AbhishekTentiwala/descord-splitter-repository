import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api-server";
import { auth } from "@clerk/nextjs/server";

export const initialProfile = async (clerkToken?: string) => {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  try {
    const profile = await backendApi.get<{
      id: string;
      userId: string;
      username: string;
      imageUrl: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    }>("/api/profile", { clerkToken });

    return profile;
  } catch (error) {
    console.error("[INITIAL_PROFILE]", error);
    return redirect("/sign-in");
  }
};