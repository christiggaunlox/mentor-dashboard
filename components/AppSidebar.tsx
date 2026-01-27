"use client"

import {
  CreditCard,
  LayoutDashboard,
  BookOpen,
  Logs,
  School,
  ShieldAlert,
  Truck,
  Users,
  IndianRupee,
  ShieldHalf,
  GraduationCap,
} from "lucide-react";
import Logo from "@/public/images/Logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Curriculums",
    url: "/addcurriculums",
    icon: BookOpen,
  },
  {
    title: "Schedule Classes",
    url: "/scheduleclass",
    icon: School,
  },
];


export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <Link href="/">
          <Image src={Logo} alt="Logo" height={20} />
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                let isDark = false;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center gap-4 rounded-lg px-3 py-6 my-0.5 ${isDark ? "hover:text-black" : ""} ${isActive ? "bg-blue-500 text-white hover:bg-blue-500 hover:text-white" : "hover:bg-red"
                        }`}
                    >
                      <Link
                        href={item.url}
                        className="hover:bg-blue-100"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
