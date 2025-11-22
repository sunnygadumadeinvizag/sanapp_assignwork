import * as React from "react"
import { cn } from "@/lib/utils"

interface NavigationProps extends React.ComponentProps<"nav"> {
  appName?: string
}

function Navigation({ className, appName = "App", children, ...props }: NavigationProps) {
  return (
    <nav
      className={cn(
        "bg-card border-b",
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">{appName}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {children}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavigationItem({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "text-sm text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      {...props}
    />
  )
}

function NavigationUser({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Navigation, NavigationItem, NavigationUser }
