import { LucideIcon, Megaphone, LayoutTemplate, Workflow, Ticket, LayoutDashboard } from "lucide-react";

export interface GuideStep {
  title: string;
  description: string;
}

export interface PageGuide {
  title: string;
  description: string;
  icon: LucideIcon;
  steps: GuideStep[];
}

export const pageGuides: Record<string, PageGuide> = {
  "/dashboard": {
    title: "Dashboard Overview",
    description: "Welcome to VaakuOS! Your central hub for monitoring performance and latest activities across campaigns, tickets, and revenue.",
    icon: LayoutDashboard,
    steps: [
      {
        title: "Check Revenue & Metrics",
        description: "View top-level metrics for revenue, active campaigns, and total contacts at a glance."
      },
      {
        title: "Review Recent Activities",
        description: "The dashboard displays real-time updates regarding new leads and ticket statuses."
      }
    ]
  },
  "/campaigns": {
    title: "Campaign Management",
    description: "Create and blast powerful WhatsApp messages to your audience simultaneously.",
    icon: Megaphone,
    steps: [
      {
        title: "Create Campaign",
        description: "Click the 'New Campaign' button. You'll need to select an audience list."
      },
      {
        title: "Select a Template",
        description: "Choose a pre-approved WhatsApp template to send to your target audience."
      },
      {
        title: "Schedule or Send",
        description: "Decide whether to blast the campaign immediately or schedule it for a later date."
      }
    ]
  },
  "/templates": {
    title: "Template Builder",
    description: "Create pre-approved WhatsApp messages to use across your campaigns and automations.",
    icon: LayoutTemplate,
    steps: [
      {
        title: "Create New Template",
        description: "Click 'Create Template' and choose a category (Marketing, Utility, etc)."
      },
      {
        title: "Design the Message",
        description: "Add a header, body text, footer, and interactive buttons."
      },
      {
        title: "Assign Variables",
        description: "Use double curly braces like {{1}} to insert dynamic content (e.g. user names)."
      },
      {
        title: "Submit for Approval",
        description: "WhatsApp requires new templates to be approved before they can be sent to customers."
      }
    ]
  },
  "/automation": {
    title: "Automated Workflows",
    description: "Set up triggers and actions to automatically send messages based on customer behavior.",
    icon: Workflow,
    steps: [
      {
        title: "Define a Trigger",
        description: "Select an event that starts the automation, such as a tag being added to a contact."
      },
      {
        title: "Add Actions",
        description: "Set up WhatsApp messages to send, or delays (e.g. wait 2 days)."
      },
      {
        title: "Publish Workflow",
        description: "Once your flow is ready, set it to Active."
      }
    ]
  },
  "/tickets": {
    title: "Support Tickets",
    description: "Manage and resolve customer inquiries and support requests efficiently.",
    icon: Ticket,
    steps: [
      {
        title: "View Open Tickets",
        description: "Filter by status to see tickets that require immediate attention."
      },
      {
        title: "Respond to Customer",
        description: "Click into a ticket to reply to the user directly."
      },
      {
        title: "Resolve & Close",
        description: "Mark tickets as resolved once the customer's issue is handled."
      }
    ]
  }
};
