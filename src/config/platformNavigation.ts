import { Icons } from "@/components/Icons";
import { Permission } from "@/lib/permissions";

export const platformNavigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: Icons.Dashboard,
    permission: Permission.TENANT_READ,
  },
  {
    name: "Abandoned Carts",
    href: "/abandoned-carts",
    icon: Icons.Cart,
    permission: Permission.CAMPAIGNS_READ,
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Icons.Contacts,
    permission: Permission.CONTACTS_READ,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: Icons.Templates,
    permission: Permission.TEMPLATES_READ,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Icons.Campaigns,
    permission: Permission.CAMPAIGNS_READ,
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: Icons.Inbox,
    permission: Permission.INBOX_READ,
  },
  {
    name: "Automation",
    href: "/automation",
    icon: Icons.Automation,
    permission: Permission.AUTOMATION_READ,
  },
  {
    name: "Tickets",
    href: "/tickets",
    icon: Icons.Ticket,
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: Icons.Integrations,
    permission: Permission.INTEGRATIONS_READ,
  },
];
