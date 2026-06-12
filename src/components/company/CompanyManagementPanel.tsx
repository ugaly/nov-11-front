"use client";

import {
  createCompanyProfileSection,
  deleteCompanyProfileSection,
  deleteCompanySectionAsset,
  getCompanyManagementProfile,
  removeCompanyBanner,
  removeCompanyLogo,
  reorderCompanyProfileSections,
  updateCompanyManagementProfile,
  updateCompanyProfileSection,
  uploadCompanyBanner,
  uploadCompanyLogo,
  uploadCompanySectionAsset,
} from "@/api/company/company-management.api";
import type {
  CompanyManagementProfile,
  CompanyProfileSection,
} from "@/api/types/company-management";
import BrandingImageUpload from "@/components/company/BrandingImageUpload";
import CompanyProfileQrModal from "@/components/company/CompanyProfileQrModal";
import CompanyPublicProfileView from "@/components/company/CompanyPublicProfileView";
import FileDropUpload from "@/components/company/FileDropUpload";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { SetupSectionCard } from "@/components/setup/setup-pro-ui";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { companyPublicProfileUrl } from "@/lib/company/public-profile-url";
import { useMyCompanyId } from "@/lib/company/use-my-company-id";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Copy,
  Eye,
  FileText,
  Loader2,
  Plus,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

type Tab = "details" | "sections" | "preview";

const SECTION_PRESETS = [
  "About Us",
  "Our Services",
  "Our Products",
  "Team Members",
  "Projects",
  "Certifications",
  "Awards",
  "Gallery",
  "Documents",
];

export default function CompanyManagementPanel() {
  const toast = useToast();
  const { companyId, loading: idLoading, error: idError } = useMyCompanyId();
  const [tab, setTab] = useState<Tab>("details");
  const [profile, setProfile] = useState<CompanyManagementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CompanyProfileSection | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  const [form, setForm] = useState({
    name: "",
    registrationNumber: "",
    taxVatNumber: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    headquartersAddress: "",
    headquartersCountry: "",
    headquartersRegion: "",
    headquartersCity: "",
    description: "",
  });

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await getCompanyManagementProfile(companyId);
      setProfile(data);
      setForm({
        name: data.name ?? "",
        registrationNumber: data.registrationNumber ?? "",
        taxVatNumber: data.taxVatNumber ?? "",
        industry: data.industry ?? "",
        contactEmail: data.contactEmail ?? "",
        contactPhone: data.contactPhone ?? "",
        website: data.website ?? "",
        headquartersAddress: data.headquartersAddress ?? "",
        headquartersCountry: data.headquartersCountry ?? "",
        headquartersRegion: data.headquartersRegion ?? "",
        headquartersCity: data.headquartersCity ?? "",
        description: data.description ?? "",
      });
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not load company profile.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (companyId) setPublicUrl(companyPublicProfileUrl(companyId));
  }, [companyId]);

  if (idLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
      </div>
    );
  }

  if (!companyId || idError) {
    return (
      <p className="text-sm text-gray-500">{idError ?? "Company not available."}</p>
    );
  }

  if (!profile) {
    return <p className="text-sm text-gray-500">Company profile could not be loaded.</p>;
  }

  async function saveDetails() {
    if (!companyId) return;
    setSaving(true);
    try {
      setProfile(
        await updateCompanyManagementProfile(companyId, {
          name: form.name.trim(),
          registrationNumber: form.registrationNumber.trim() || undefined,
          taxVatNumber: form.taxVatNumber.trim() || undefined,
          industry: form.industry.trim() || undefined,
          contactEmail: form.contactEmail.trim() || undefined,
          contactPhone: form.contactPhone.trim() || undefined,
          website: form.website.trim() || undefined,
          headquartersAddress: form.headquartersAddress.trim() || undefined,
          headquartersCountry: form.headquartersCountry.trim() || undefined,
          headquartersRegion: form.headquartersRegion.trim() || undefined,
          headquartersCity: form.headquartersCity.trim() || undefined,
          description: form.description.trim() || undefined,
        })
      );
      toast.showSuccess("Company details saved.");
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function openCreateSection(preset?: string) {
    setEditingSection(null);
    setSectionTitle(preset ?? "");
    setSectionDescription("");
    setSectionModalOpen(true);
  }

  function openEditSection(section: CompanyProfileSection) {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description ?? "");
    setSectionModalOpen(true);
  }

  async function saveSection() {
    if (!companyId || !sectionTitle.trim()) {
      toast.showError("Section title is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingSection) {
        await updateCompanyProfileSection(companyId, editingSection.id, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim() || undefined,
        });
        toast.showSuccess("Section updated.");
      } else {
        await createCompanyProfileSection(companyId, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim() || undefined,
        });
        toast.showSuccess("Section created.");
      }
      setSectionModalOpen(false);
      await load();
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Could not save section.");
    } finally {
      setSaving(false);
    }
  }

  async function moveSection(index: number, direction: -1 | 1) {
    if (!companyId || !profile) return;
    const sections = [...profile.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const swapped = [...sections];
    [swapped[index], swapped[target]] = [swapped[target]!, swapped[index]!];
    try {
      const reordered = await reorderCompanyProfileSections(
        companyId,
        swapped.map((s) => s.id)
      );
      setProfile({ ...profile, sections: reordered });
    } catch (e) {
      toast.showError(e instanceof Error ? e.message : "Reorder failed.");
    }
  }

  const sortedSections = [...profile.sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            <Building2 className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Company</h1>
            <p className="text-sm text-gray-500">Manage your company profile and portfolio</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="mr-1.5 size-4" aria-hidden />
            QR code
          </Button>
          <Link href={`/company/${companyId}`} target="_blank">
            <Button type="button" size="sm" variant="outline">
              <Eye className="mr-1.5 size-4" aria-hidden />
              Public profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1 dark:border-gray-800">
        {(
          [
            ["details", "Company details"],
            ["sections", "Profile sections"],
            ["preview", "Preview"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="space-y-6">
          <SetupSectionCard title="Share public profile">
            <p className="mb-3 text-sm text-gray-500">
              Anyone with this link can view your company portfolio — no login required.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                readOnly
                value={publicUrl}
                className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(publicUrl);
                    toast.showSuccess("Link copied.");
                  }}
                >
                  <Copy className="mr-1.5 size-4" aria-hidden />
                  Copy link
                </Button>
                <Button type="button" size="sm" onClick={() => setQrOpen(true)}>
                  <QrCode className="mr-1.5 size-4" aria-hidden />
                  Preview QR code
                </Button>
              </div>
            </div>
          </SetupSectionCard>

          <SetupSectionCard title="Branding">
            <div className="grid gap-8 lg:grid-cols-2">
              <BrandingImageUpload
                label="Company logo"
                imageUrl={profile.logoUrl}
                emptyHint="JPEG, PNG, GIF, or WebP — shown on your public profile."
                onUpload={async (file, onProgress) => {
                  const updated = await uploadCompanyLogo(companyId, file, onProgress);
                  setProfile(updated);
                  toast.showSuccess(profile.logoUrl ? "Logo updated." : "Logo uploaded.");
                }}
                onRemove={async () => {
                  if (!confirm("Remove the company logo?")) return;
                  setProfile(await removeCompanyLogo(companyId));
                  toast.showSuccess("Logo removed.");
                }}
              />
              <BrandingImageUpload
                label="Cover / banner image"
                imageUrl={profile.bannerUrl}
                previewClassName="h-32 w-full object-cover"
                emptyHint="Wide image for the top of your public profile page."
                onUpload={async (file, onProgress) => {
                  const updated = await uploadCompanyBanner(companyId, file, onProgress);
                  setProfile(updated);
                  toast.showSuccess(profile.bannerUrl ? "Banner updated." : "Banner uploaded.");
                }}
                onRemove={async () => {
                  if (!confirm("Remove the cover banner?")) return;
                  setProfile(await removeCompanyBanner(companyId));
                  toast.showSuccess("Banner removed.");
                }}
              />
            </div>
          </SetupSectionCard>

          <SetupSectionCard title="Company information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Company name *</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Registration number</Label>
                <Input className="mt-1.5" value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Tax / VAT number</Label>
                <Input className="mt-1.5" value={form.taxVatNumber} onChange={(e) => setForm((f) => ({ ...f, taxVatNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Industry</Label>
                <Input className="mt-1.5" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1.5" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Website</Label>
                <Input className="mt-1.5" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>Physical address</Label>
                <Input className="mt-1.5" value={form.headquartersAddress} onChange={(e) => setForm((f) => ({ ...f, headquartersAddress: e.target.value }))} />
              </div>
              <div>
                <Label>Country</Label>
                <Input className="mt-1.5" value={form.headquartersCountry} onChange={(e) => setForm((f) => ({ ...f, headquartersCountry: e.target.value }))} />
              </div>
              <div>
                <Label>Region / state</Label>
                <Input className="mt-1.5" value={form.headquartersRegion} onChange={(e) => setForm((f) => ({ ...f, headquartersRegion: e.target.value }))} />
              </div>
              <div>
                <Label>City</Label>
                <Input className="mt-1.5" value={form.headquartersCity} onChange={(e) => setForm((f) => ({ ...f, headquartersCity: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label>About us / description</Label>
                <textarea className={`${textareaClass} mt-1.5 min-h-[120px]`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button disabled={saving} onClick={() => void saveDetails()}>
                {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : <Save className="mr-1.5 size-4" aria-hidden />}
                Save details
              </Button>
            </div>
          </SetupSectionCard>
        </div>
      ) : null}

      {tab === "sections" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Build your public company portfolio with custom sections.
            </p>
            <Button size="sm" onClick={() => openCreateSection()}>
              <Plus className="mr-1 size-4" aria-hidden />
              Add section
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SECTION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => openCreateSection(preset)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
              >
                + {preset}
              </button>
            ))}
          </div>

          {sortedSections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700">
              No sections yet. Add one to start your company portfolio.
            </p>
          ) : (
            sortedSections.map((section, index) => (
              <SetupSectionCard
                key={section.id}
                title={section.title}
                action={
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => void moveSection(index, -1)}>
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={index === sortedSections.length - 1} onClick={() => void moveSection(index, 1)}>
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => openEditSection(section)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void (async () => {
                          if (!confirm(`Delete section "${section.title}"?`)) return;
                          await deleteCompanyProfileSection(companyId, section.id);
                          toast.showSuccess("Section deleted.");
                          await load();
                        })()
                      }
                    >
                      <Trash2 className="size-4 text-rose-600" aria-hidden />
                    </Button>
                  </div>
                }
              >
                {section.description ? (
                  <p className="mb-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                ) : null}

                {section.assets.length > 0 ? (
                  <ul className="mb-4 space-y-2">
                    {section.assets.map((asset) => (
                      <li key={asset.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                        <span className="flex min-w-0 items-center gap-2">
                          {asset.kind === "IMAGE" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={asset.url} alt="" className="size-10 rounded object-cover" />
                          ) : (
                            <FileText className="size-4 shrink-0 text-gray-400" aria-hidden />
                          )}
                          <span className="truncate">{asset.fileName}</span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void (async () => {
                              await deleteCompanySectionAsset(companyId, section.id, asset.id);
                              await load();
                            })()
                          }
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <FileDropUpload
                  label="Add images or documents to this section"
                  onUpload={async (file, onProgress) => {
                    await uploadCompanySectionAsset(companyId, section.id, file, onProgress);
                    toast.showSuccess("File uploaded.");
                    await load();
                  }}
                />
              </SetupSectionCard>
            ))
          )}
        </div>
      ) : null}

      {tab === "preview" && profile ? (
        <CompanyPublicProfileView profile={profile} />
      ) : null}

      <CompanyProfileQrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        companyName={profile.name}
        publicUrl={publicUrl}
      />

      <Modal isOpen={sectionModalOpen} onClose={() => setSectionModalOpen(false)} className="max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editingSection ? "Edit section" : "New section"}
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Title *</Label>
            <Input className="mt-1.5" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea className={`${textareaClass} mt-1.5 min-h-[100px]`} value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSectionModalOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void saveSection()}>
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
