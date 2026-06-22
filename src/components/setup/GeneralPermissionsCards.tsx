"use client";

import type { GeneralPermissionDto } from "@/api/types/general";
import PermissionModuleCard, {
  type PermissionToggle,
} from "@/components/setup/PermissionModuleCard";
import {
  Building2,
  FolderOpen,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { useMemo } from "react";

type GeneralPermFlags = Omit<
  GeneralPermissionDto,
  "id" | "userId" | "userFullName" | "userEmail"
>;

export function defaultGeneralPermissionRow(user: {
  userId: string;
  userFullName: string;
  userEmail: string;
}): GeneralPermissionDto {
  return {
    userId: user.userId,
    userFullName: user.userFullName,
    userEmail: user.userEmail,
    visibleDashboard: true,
    visibleCustomers: false,
    canCreateCustomers: false,
    canUpdateCustomers: false,
    canDeleteCustomers: false,
    visibleMail: false,
    canSendMail: false,
    visibleCompanyFiles: false,
    canUploadCompanyFiles: false,
    canManageCompanyFiles: false,
    visibleSetup: false,
    canManageSetup: false,
    visibleCompanyProfile: false,
    canEditCompanyProfile: false,
    canManageGeneralPermissions: false,
  };
}

export default function GeneralPermissionsCards({
  selected,
  saving,
  onPatch,
}: {
  selected: GeneralPermissionDto;
  saving: boolean;
  onPatch: (next: GeneralPermFlags) => void;
}) {
  const patch = (partial: Partial<GeneralPermFlags>) => {
    onPatch({
      visibleDashboard: selected.visibleDashboard,
      visibleCustomers: selected.visibleCustomers,
      canCreateCustomers: selected.canCreateCustomers,
      canUpdateCustomers: selected.canUpdateCustomers,
      canDeleteCustomers: selected.canDeleteCustomers,
      visibleMail: selected.visibleMail,
      canSendMail: selected.canSendMail,
      visibleCompanyFiles: selected.visibleCompanyFiles,
      canUploadCompanyFiles: selected.canUploadCompanyFiles,
      canManageCompanyFiles: selected.canManageCompanyFiles,
      visibleSetup: selected.visibleSetup,
      canManageSetup: selected.canManageSetup,
      visibleCompanyProfile: selected.visibleCompanyProfile,
      canEditCompanyProfile: selected.canEditCompanyProfile,
      canManageGeneralPermissions: selected.canManageGeneralPermissions,
      ...partial,
    });
  };

  const dashboardToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "visibleDashboard",
        label: "See dashboard",
        description: "Show the operations dashboard in the menu.",
        checked: selected.visibleDashboard,
        disabled: saving,
        onChange: (checked) => patch({ visibleDashboard: checked }),
      },
    ],
    [selected.visibleDashboard, saving]
  );

  const customerToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "canCreateCustomers",
        label: "Create",
        description: "Add new customers.",
        checked: selected.canCreateCustomers,
        disabled: saving || !selected.visibleCustomers,
        onChange: (checked) => patch({ canCreateCustomers: checked }),
      },
      {
        key: "canUpdateCustomers",
        label: "Update",
        description: "Edit customer records.",
        checked: selected.canUpdateCustomers,
        disabled: saving || !selected.visibleCustomers,
        onChange: (checked) => patch({ canUpdateCustomers: checked }),
      },
      {
        key: "canDeleteCustomers",
        label: "Delete",
        description: "Deactivate customers.",
        checked: selected.canDeleteCustomers,
        disabled: saving || !selected.visibleCustomers,
        onChange: (checked) => patch({ canDeleteCustomers: checked }),
      },
    ],
    [
      selected.visibleCustomers,
      selected.canCreateCustomers,
      selected.canUpdateCustomers,
      selected.canDeleteCustomers,
      saving,
    ]
  );

  const mailToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "canSendMail",
        label: "Send mail",
        description: "Compose and send emails to customers.",
        checked: selected.canSendMail,
        disabled: saving || !selected.visibleMail,
        onChange: (checked) => patch({ canSendMail: checked }),
      },
    ],
    [selected.visibleMail, selected.canSendMail, saving]
  );

  const filesToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "canUploadCompanyFiles",
        label: "Upload",
        description: "Upload files to company drive.",
        checked: selected.canUploadCompanyFiles,
        disabled: saving || !selected.visibleCompanyFiles,
        onChange: (checked) => patch({ canUploadCompanyFiles: checked }),
      },
      {
        key: "canManageCompanyFiles",
        label: "Manage",
        description: "Edit, share, and delete own or shared files.",
        checked: selected.canManageCompanyFiles,
        disabled: saving || !selected.visibleCompanyFiles,
        onChange: (checked) => patch({ canManageCompanyFiles: checked }),
      },
    ],
    [
      selected.visibleCompanyFiles,
      selected.canUploadCompanyFiles,
      selected.canManageCompanyFiles,
      saving,
    ]
  );

  const setupToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "canManageSetup",
        label: "Manage setup",
        description: "Create and edit catalogs, categories, engagements, and config.",
        checked: selected.canManageSetup,
        disabled: saving || !selected.visibleSetup,
        onChange: (checked) => patch({ canManageSetup: checked }),
      },
      {
        key: "canManageGeneralPermissions",
        label: "Manage permissions",
        description: "Configure office access for other users.",
        checked: selected.canManageGeneralPermissions,
        disabled: saving || !selected.visibleSetup,
        onChange: (checked) => patch({ canManageGeneralPermissions: checked }),
      },
    ],
    [
      selected.visibleSetup,
      selected.canManageSetup,
      selected.canManageGeneralPermissions,
      saving,
    ]
  );

  const profileToggles: PermissionToggle[] = useMemo(
    () => [
      {
        key: "canEditCompanyProfile",
        label: "Edit profile",
        description: "Update company profile, logo, and sections.",
        checked: selected.canEditCompanyProfile,
        disabled: saving || !selected.visibleCompanyProfile,
        onChange: (checked) => patch({ canEditCompanyProfile: checked }),
      },
    ],
    [selected.visibleCompanyProfile, selected.canEditCompanyProfile, saving]
  );

  return (
    <>
      <PermissionModuleCard
        title="Dashboard"
        description="Operations overview and KPIs."
        icon={LayoutDashboard}
        permissions={dashboardToggles}
      />

      <PermissionModuleCard
        title="Customers"
        description="Customer list, details, and engagements entry point."
        icon={Users}
        enabled={selected.visibleCustomers}
        onEnabledChange={(v) =>
          patch({
            visibleCustomers: v,
            canCreateCustomers: v ? selected.canCreateCustomers : false,
            canUpdateCustomers: v ? selected.canUpdateCustomers : false,
            canDeleteCustomers: v ? selected.canDeleteCustomers : false,
          })
        }
        permissions={customerToggles}
      />

      <PermissionModuleCard
        title="Mail"
        description="Send email to customers from the portal."
        icon={Mail}
        enabled={selected.visibleMail}
        onEnabledChange={(v) =>
          patch({
            visibleMail: v,
            canSendMail: v ? selected.canSendMail : false,
          })
        }
        permissions={mailToggles}
      />

      <PermissionModuleCard
        title="Company files"
        description="Shared company document drive."
        icon={FolderOpen}
        enabled={selected.visibleCompanyFiles}
        onEnabledChange={(v) =>
          patch({
            visibleCompanyFiles: v,
            canUploadCompanyFiles: v ? selected.canUploadCompanyFiles : false,
            canManageCompanyFiles: v ? selected.canManageCompanyFiles : false,
          })
        }
        permissions={filesToggles}
      />

      <PermissionModuleCard
        title="Company profile"
        description="Public company page and branding."
        icon={Building2}
        enabled={selected.visibleCompanyProfile}
        onEnabledChange={(v) =>
          patch({
            visibleCompanyProfile: v,
            canEditCompanyProfile: v ? selected.canEditCompanyProfile : false,
          })
        }
        permissions={profileToggles}
      />

      <PermissionModuleCard
        title="Setup"
        description="Service catalogs, categories, engagements, and office settings."
        icon={Settings}
        enabled={selected.visibleSetup}
        onEnabledChange={(v) =>
          patch({
            visibleSetup: v,
            canManageSetup: v ? selected.canManageSetup : false,
            canManageGeneralPermissions: v
              ? selected.canManageGeneralPermissions
              : false,
          })
        }
        permissions={setupToggles}
      />
    </>
  );
}
