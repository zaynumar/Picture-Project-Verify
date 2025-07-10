
"use client"

import * as React from "react"
import { ChevronRight, Home, LayoutDashboard, Settings, Users, Plus, RefreshCw, List } from "lucide-react"
import { useLocation } from "wouter"

import { SearchForm } from "./search-form"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation data for manager dashboard
const navigationItems = [
  {
    title: "Overview",
    url: "/manager/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Dashboard",
    url: "/manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    icon: List,
    items: [
      {
        title: "All Jobs",
        url: "/manager/dashboard",
      },
      {
        title: "Create Job",
        url: "/manager/create-job",
      },
    ],
  },
  {
    title: "Team",
    icon: Users,
    items: [
      {
        title: "Members",
        url: "/manager/manage-users",
      },
      {
        title: "Permissions",
        url: "/manager/permissions",
      },
      {
        title: "Invitations",
        url: "/manager/invitations",
      },
    ],
  },
  {
    title: "Settings",
    url: "/manager/settings",
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="font-semibold">Manager Portal</div>
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) =>
              item.items ? (
                <Collapsible key={item.title} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-1 border-l pl-2">
                        {item.items.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton asChild isActive={location === subItem.url}>
                              <a href={subItem.url} className="text-sm">
                                {subItem.title}
                              </a>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <a href={item.url}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
