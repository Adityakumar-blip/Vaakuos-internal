export const roleDesignData = {
  Dashboard: {
    View: true,
    Analytics: {
      checked: false,
      children: {
        ViewReports: false,
        ExportData: false,
      }
    },
  },
  Team: {
    Users: {
      checked: false,
      children: {
        View: false,
        Create: false,
        Update: false,
        Delete: false,
        ManageStatus: {
          checked: false,
          children: {
            Activate: false,
            Deactivate: false,
          }
        },
      }
    },
    Roles: {
      checked: false,
      children: {
        View: false,
        Create: false,
        Update: false,
        Delete: false,
        AssignPermissions: false,
      }
    },
  },
  Agencies: {
    View: false,
    Create: false,
    Update: false,
    Delete: false,
    Suspend: false,
    ManageBrands: {
      checked: false,
      children: {
        ViewBrands: false,
        AddBrands: false,
        RemoveBrands: false,
      }
    },
  },
  Brands: {
    View: false,
    Create: false,
    Update: false,
    Delete: false,
    Suspend: false,
    ManageSettings: {
      checked: false,
      children: {
        UpdateConfiguration: false,
        ManageIntegrations: false,
      }
    },
  },
  Billing: {
    View: false,
    ManageInvoices: {
      checked: false,
      children: {
        ViewInvoices: false,
        DownloadInvoices: false,
        GenerateInvoices: false,
      }
    },
    ManagePayments: {
      checked: false,
      children: {
        ProcessPayments: false,
        RefundPayments: false,
        ViewPaymentHistory: false,
      }
    },
  },
  Subscription: {
    View: false,
    Create: false,
    Update: false,
    Delete: false,
    ManagePlans: {
      checked: false,
      children: {
        ActivatePlan: false,
        DeactivatePlan: false,
        UpdatePricing: false,
      }
    },
  },
  Coupon: {
    View: false,
    Create: false,
    Update: false,
    Delete: false,
    ManageCoupons: {
      checked: false,
      children: {
        GenerateCodes: false,
        ActivateCoupon: false,
        DeactivateCoupon: false,
        ViewUsage: false,
      }
    },
  },
  Features: {
    View: false,
    ManageFeatureFlags: {
      checked: false,
      children: {
        EnableFeature: false,
        DisableFeature: false,
        ConfigureFeature: false,
      }
    },
  },
  Monitoring: {
    View: false,
    ViewMetrics: {
      checked: false,
      children: {
        SystemHealth: false,
        Performance: false,
        UserActivity: false,
      }
    },
    ManageAlerts: {
      checked: false,
      children: {
        CreateAlert: false,
        UpdateAlert: false,
        DeleteAlert: false,
      }
    },
  },
  Logs: {
    View: false,
    Export: false,
    ManageLogs: {
      checked: false,
      children: {
        ViewSystemLogs: false,
        ViewAuditLogs: false,
        ViewErrorLogs: false,
        ClearLogs: false,
      }
    },
  },
  Config: {
    View: false,
    Update: false,
    ManageSystemSettings: {
      checked: false,
      children: {
        UpdateGeneralSettings: false,
        UpdateSecuritySettings: false,
        UpdateEmailSettings: false,
        UpdateAPISettings: false,
      }
    },
  },
  Emergency: {
    View: false,
    TriggerEmergencyMode: false,
    SystemShutdown: false,
    DataBackup: {
      checked: false,
      children: {
        CreateBackup: false,
        RestoreBackup: false,
        DeleteBackup: false,
      }
    },
  },
  Templates: {
    View: false,
    Create: false,
    Update: false,
    Delete: false,
    Moderate: {
      checked: false,
      children: {
        ApproveTemplate: false,
        RejectTemplate: false,
        PublishTemplate: false,
      }
    },
  },
};
