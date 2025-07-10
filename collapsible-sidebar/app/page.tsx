import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="h-8 w-full rounded-md bg-muted/50" />
                <div className="mt-2 space-y-2">
                  <div className="h-4 w-3/4 rounded-md bg-muted/50" />
                  <div className="h-4 w-1/2 rounded-md bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
