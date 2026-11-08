"use client";
import { useForm } from "react-hook-form";
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useApiClient } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-model-store";
import { useUser } from "@clerk/nextjs";
import { generateUsernameCandidates, getAvailableSuggestions } from "@/lib/username-suggestions";

const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z][a-zA-Z0-9\-_\.]{2,19}$/, "Must start with a letter, only letters, numbers, -, _, .")
  .transform(val => val.toLowerCase());

const formSchema = z.object({
  username: usernameSchema,
});

export const InitialModel = () => {
  const [mounted, setmounted] = useState(false)
  const router = useRouter()
  const api = useApiClient();
  const { onClose } = useModal();
  const { user } = useUser();
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setmounted(true)
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    }
  });

  const isLoading = form.formState.isSubmitting;

  const debouncedCheckUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameError(null);
      return;
    }
    setCheckingUsername(true);
    setUsernameError(null);
    try {
      const result = await api.checkUsername(username);
      if (!result.available) {
        setUsernameError(result.error || "Username already taken");
      } else {
        setUsernameError(null);
      }
    } catch (error) {
      console.error("Username check failed:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const onUsernameChange = (value: string) => {
    const lowerValue = value.toLowerCase();
    form.setValue("username", lowerValue, { shouldValidate: true });
    
    // Debounce the username check
    clearTimeout((form as any)._debounceTimer);
    (form as any)._debounceTimer = setTimeout(() => {
      debouncedCheckUsername(lowerValue);
      
      // Fetch suggestions when user stops typing
      if (user && lowerValue.length >= 2) {
        getAvailableSuggestions(user, api.checkUsername).then(setSuggestions);
        setShowSuggestions(true);
      }
    }, 300);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Step 1: Create/update profile with chosen username
      await api.post("/api/profile", { username: values.username });
      
      // Step 2: Create server
      const response = await api.post("/api/servers", {
        name: `${values.username}'s Server`,
        imageUrl: "/Default_Server_Image.png"
      });
      const server = response.data;
      
      const generalChannel = server.channels?.find((c: { name: string }) => c.name === "general");
      
      if (generalChannel) {
        router.push(`/servers/${server.id}/channels/${generalChannel.id}`);
      } else {
        router.push(`/servers/${server.id}`);
      }
      
      form.reset();
      onClose();
      
    } catch (error: any) {
      if (error.response?.status === 409) {
        setUsernameError(error.response.data.error || "Username already taken");
      } else if (error.response?.status === 403) {
        setUsernameError(error.response.data.error || "Username cannot be changed");
      } else if (error.response?.status === 400) {
        setUsernameError(error.response.data.error || "Invalid username");
      } else {
        console.log(error);
        setUsernameError("Something went wrong. Please try again.");
      }
    }
    
  }
  
  if (!mounted) {
    return null;
  }
  
  return (
    <Dialog open>
      <DialogContent className="bg-white text-black fixed p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold"> 
            Create your username
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Choose what you'd like to be called. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-8 px-6">
              <FormField 
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isLoading}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0" 
                        placeholder="Enter Username" 
                        onChange={(e) => onUsernameChange(e.target.value)}
                        value={field.value}
                      />
                    </FormControl>
                    {checkingUsername && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        <span>Checking availability...</span>
                      </div>
                    )}
                    {usernameError && (
                      <FormMessage className="text-red-500">{usernameError}</FormMessage>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              form.setValue("username", suggestion);
                              setUsernameError(null);
                              setShowSuggestions(false);
                            }}
                            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button variant={"primary"} disabled={isLoading || !!usernameError || checkingUsername}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}