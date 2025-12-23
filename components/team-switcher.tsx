// "use client"

// import * as React from "react"
// import { ChevronsUpDown, Plus } from "lucide-react"
// import { Building2 } from "lucide-react"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"

// interface Team {
//   name: string
//   plan: string
// }

// export function TeamSwitcher({
//   teams,
//   isCollapsed,
// }: {
//   teams: Team[]
//   isCollapsed: boolean
// }) {
//   const [activeTeam, setActiveTeam] = React.useState(teams[0])

//   if (!activeTeam) {
//     return null
//   }

//   return (
//     <div className="border-b border-gray-100 px-4 py-3">
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             variant="ghost"
//             size="sm"
//             className={cn(
//               "w-full justify-start gap-2 px-2",
//               isCollapsed ? "justify-center" : "justify-start"
//             )}
//           >
//             <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-black-1000">
//               <Building2 className="h-4 w-4" />
//             </div>
            
//             {!isCollapsed && (
//               <>
//                 <div className="grid flex-1 text-left text-sm leading-tight">
//                   <span className="truncate font-medium">
//                     {activeTeam.name}
//                   </span>
//                   <span className="truncate text-xs text-muted-foreground">
//                     {activeTeam.plan}
//                   </span>
//                 </div>
//                 <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
//               </>
//             )}
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent
//           className={cn(
//             "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg",
//             isCollapsed ? "ml-2" : ""
//           )}
//           align="end"  // Changed from "start" to "end"
//           side="right" // Explicitly set to open on the right
//           sideOffset={8}
//         >
//           <DropdownMenuLabel className="text-xs text-muted-foreground">
//             Organizations
//           </DropdownMenuLabel>
//           {teams.map((team) => (
//             <DropdownMenuItem
//               key={team.name}
//               onClick={() => setActiveTeam(team)}
//               className="gap-2 p-2"
//             >
//               <div className="flex aspect-square h-6 w-6 items-center justify-center rounded-sm bg-indigo-100 text-black-600">
//                 <Building2 className="h-3 w-3" />
//               </div>
//               <div>
//                 <div className="font-medium">{team.name}</div>
//                 <div className="text-xs text-muted-foreground">{team.plan}</div>
//               </div>
//             </DropdownMenuItem>
//           ))}
//           <DropdownMenuSeparator />
//           <DropdownMenuItem className="gap-2 p-2">
//             <div className="flex aspect-square h-6 w-6 items-center justify-center rounded-md border bg-background">
//               <Plus className="h-3 w-3" />
//             </div>
//             <div className="font-medium text-muted-foreground">Add organization</div>
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     </div>
//   )
// }



"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Team {
  name: string;
  plan: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  isCollapsed?: boolean;
}

export function TeamSwitcher({ teams, isCollapsed = false }: TeamSwitcherProps) {
  const [activeTeam, setActiveTeam] = React.useState<Team>(teams[0]);

  const handleTeamSelect = React.useCallback((team: Team) => {
    setActiveTeam(team);
  }, []);

  if (!activeTeam) return null;

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-2 px-2",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-black-1000">
              <Building2 className="h-4 w-4" />
            </div>

            {!isCollapsed && (
              <>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeTeam.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeTeam.plan}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg",
            isCollapsed ? "ml-2" : ""
          )}
          align="end"
          side="right"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>

          {teams.map((team) => (
            <DropdownMenuItem
              key={team.name}
              onClick={() => handleTeamSelect(team)}
              className="gap-2 p-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-indigo-100 text-black-600">
                <Building2 className="h-3 w-3" />
              </div>
              <div>
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-muted-foreground">{team.plan}</div>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2 p-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
              <Plus className="h-3 w-3" />
            </div>
            <div className="font-medium text-muted-foreground">Add organization</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
