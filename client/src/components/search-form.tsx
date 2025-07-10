
"use client"

import { Search } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"

export function SearchForm({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  return (
    <SidebarGroup className="py-0" {...props}>
      <SidebarGroupContent className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <SidebarInput placeholder="Search..." className="pl-8" />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
