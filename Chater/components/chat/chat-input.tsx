"use client";

import { useForm } from "react-hook-form";
import qs from "query-string";
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile } from "lucide-react";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-model-store";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/lib/api-client";

// New emoji-picker imports
import Picker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel"
}

const formSchema = z.object({
  content: z.string().min(1),
})

export const ChatInput = ({ apiUrl, query, name, type }: ChatInputProps) => {
  const router = useRouter()
  const { onOpen } = useModal()
  const { resolvedTheme } = useTheme()
  const api = useApiClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: ""
    }
  })

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query
      })
      await api.post(url, values)

      form.reset()
      router.refresh()
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  <button 
                    type="button" 
                    onClick={() => onOpen("messageFile", { apiUrl, query })}
                    className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                  >
                    <Plus className="text-white dark:text-[#313338]" />
                  </button>
                  <Input 
                    disabled={isLoading} 
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder={`Message ${type === 'conversation' ? name : '#' + name}`}
                    {...field}
                  />
                  <div className="absolute top-7 right-8">
                    <Popover>
                      <PopoverTrigger type="button">
                        <Smile className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition" />
                      </PopoverTrigger>
                      <PopoverContent 
                        side="top" 
                        sideOffset={40}
                        className="bg-transparent border-none shadow-none drop-shadow-none mb-8"
                      >
                        <Picker
                          theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                          onEmojiClick={(emojiData) => {
                            field.onChange(`${field.value}${emojiData.emoji}`)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}