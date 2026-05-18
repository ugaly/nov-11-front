"use client";

import { getApiErrorMessage } from "@/api/errors";
import type {
  CurrentUserResponse,
  PatchCurrentUserRequest,
} from "@/api/types/user-me";
import type { Gender } from "@/api/types/auth";
import {
  getCurrentUser,
  patchCurrentUser,
  patchCurrentUserAvatar,
} from "@/api/users/users.api";
import ProfileUpdateModal from "@/components/common/ProfileUpdateModal";
import ChangePasswordModal from "@/components/user-profile/ChangePasswordModal";
import UserAvatar from "@/components/common/UserAvatar";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { updateStoredUser } from "@/lib/auth-storage";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

function strOrNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

/** Tanzania (IANA) — used when API has no time zone yet. */
const DEFAULT_TIME_ZONE = "Africa/Dar_es_Salaam";

function mapUserToForm(u: CurrentUserResponse) {
  const p = u.profile;
  const tz = p?.timeZone?.trim();
  return {
    fullName: u.fullName,
    gender: u.gender,
    countryCode: u.countryCode,
    phoneNumber: u.phoneNumber,
    dateOfBirth: toDateInput(u.dateOfBirth),
    nationality: u.nationality ?? "",
    preferredLanguage: u.preferredLanguage ?? "",
    jobTitle: p?.jobTitle ?? "",
    department: p?.department ?? "",
    bio: p?.bio ?? "",
    locale: p?.locale ?? "",
    timeZone: tz && tz.length > 0 ? tz : DEFAULT_TIME_ZONE,
    professionalLicenseNumber: p?.professionalLicenseNumber ?? "",
    regulatoryBody: p?.regulatoryBody ?? "",
    practiceJurisdictions: p?.practiceJurisdictions ?? "",
    yearsExperience:
      p?.yearsExperience !== null && p?.yearsExperience !== undefined
        ? String(p.yearsExperience)
        : "",
  };
}

function organizationCompanyName(u: CurrentUserResponse): string {
  const root =
    typeof u.companyName === "string" ? u.companyName.trim() : "";
  if (root) return root;
  const prof = u.profile?.companyName?.trim();
  return prof ?? "";
}

function assignedDepartmentLabels(
  deps: CurrentUserResponse["assignedDepartments"]
): string[] {
  if (!Array.isArray(deps) || deps.length === 0) return [];
  const out: string[] = [];
  for (const item of deps) {
    if (item != null && typeof item === "object" && "name" in item) {
      const n = (item as { name?: unknown }).name;
      if (typeof n === "string" && n.trim()) out.push(n.trim());
    } else if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
    }
  }
  return out;
}

export default function ProfileAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");
  const [locale, setLocale] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [professionalLicenseNumber, setProfessionalLicenseNumber] =
    useState("");
  const [regulatoryBody, setRegulatoryBody] = useState("");
  const [practiceJurisdictions, setPracticeJurisdictions] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const applyUser = useCallback((u: CurrentUserResponse) => {
    setUser(u);
    const f = mapUserToForm(u);
    setFullName(f.fullName);
    setGender(f.gender);
    setCountryCode(f.countryCode);
    setPhoneNumber(f.phoneNumber);
    setDateOfBirth(f.dateOfBirth);
    setNationality(f.nationality);
    setPreferredLanguage(f.preferredLanguage);
    setJobTitle(f.jobTitle);
    setDepartment(f.department);
    setBio(f.bio);
    setLocale(f.locale);
    setTimeZone(f.timeZone);
    setProfessionalLicenseNumber(f.professionalLicenseNumber);
    setRegulatoryBody(f.regulatoryBody);
    setPracticeJurisdictions(f.practiceJurisdictions);
    setYearsExperience(f.yearsExperience);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentUser();
      applyUser(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace("/");
        return;
      }
      setError(
        getApiErrorMessage(err, "Could not load your profile. Try again.")
      );
    } finally {
      setLoading(false);
    }
  }, [applyUser, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("changePassword") !== "1") return;
    setChangePasswordOpen(true);
    router.replace("/profile", { scroll: false });
  }, [searchParams, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    let years: number | null = null;
    if (yearsExperience.trim() !== "") {
      const n = Number.parseInt(yearsExperience.trim(), 10);
      if (Number.isNaN(n) || n < 0 || n > 80) {
        setError("Years of experience must be a whole number from 0 to 80.");
        return;
      }
      years = n;
    }

    const body: PatchCurrentUserRequest = {
      fullName: trimmedName,
      gender,
      countryCode: countryCode.trim(),
      phoneNumber: phoneNumber.trim(),
      dateOfBirth: dateOfBirth ? dateOfBirth : null,
      nationality: strOrNull(nationality),
      preferredLanguage: strOrNull(preferredLanguage),
      profile: {
        jobTitle: strOrNull(jobTitle),
        department: strOrNull(department),
        bio: strOrNull(bio),
        locale: strOrNull(locale),
        timeZone: strOrNull(timeZone),
        professionalLicenseNumber: strOrNull(professionalLicenseNumber),
        regulatoryBody: strOrNull(regulatoryBody),
        practiceJurisdictions: strOrNull(practiceJurisdictions),
        yearsExperience: years,
      },
    };

    setSaving(true);
    try {
      const updated = await patchCurrentUser(body);
      applyUser(updated);
      updateStoredUser(updated);
      setFeedback({
        variant: "success",
        title: "Profile updated",
        message: "Your changes were saved successfully.",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace("/");
        return;
      }
      setFeedback({
        variant: "error",
        title: "Update failed",
        message: getApiErrorMessage(
          err,
          "Could not save changes. Check the form and try again."
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
  const AVATAR_ACCEPT = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  async function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_ACCEPT.includes(file.type)) {
      setFeedback({
        variant: "error",
        title: "Invalid file type",
        message: "Please choose a JPEG, PNG, GIF, or WebP image.",
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFeedback({
        variant: "error",
        title: "File too large",
        message: "Please choose an image under 5 MB.",
      });
      return;
    }

    setUploadingAvatar(true);
    setFeedback(null);
    try {
      const updated = await patchCurrentUserAvatar(file);
      applyUser(updated);
      updateStoredUser(updated);
      setFeedback({
        variant: "success",
        title: "Photo updated",
        message: "Your profile picture was uploaded successfully.",
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.replace("/");
        return;
      }
      setFeedback({
        variant: "error",
        title: "Upload failed",
        message: getApiErrorMessage(
          err,
          "Could not upload the image. Try another file or format."
        ),
      });
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading profile…
      </p>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
        <p className="text-sm text-error-800 dark:text-error-100">{error}</p>
        <Button className="mt-3" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const orgCompany = organizationCompanyName(user);
  const deptLabels = assignedDepartmentLabels(user.assignedDepartments);

  return (
    <>
      <ProfileUpdateModal
        isOpen={feedback !== null}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        message={feedback?.message ?? ""}
        onClose={() => setFeedback(null)}
      />
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onUpdated={(u) => {
          applyUser(u);
          updateStoredUser(u);
        }}
        onNotify={setFeedback}
      />
      <form onSubmit={handleSave} className="space-y-6">
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-100"
        >
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarSelected}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-200 ring-2 ring-transparent transition hover:ring-brand-400 focus:outline-hidden focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:hover:ring-brand-500"
              title="Change profile photo"
            >
              <UserAvatar
                fullName={user.fullName}
                avatarUrl={user.avatarUrl}
                sizeClass="h-20 w-20"
                textClass="text-lg"
              />
              <span className="absolute inset-0 flex items-end justify-center bg-black/55 pb-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                {uploadingAvatar ? "…" : "Upload"}
              </span>
            </button>
            <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {user.fullName}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                @{user.username} · {user.userType.replaceAll("_", " ")}
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Status: {user.status}
                {user.lastLoginAt
                  ? ` · Last sign-in: ${new Date(user.lastLoginAt).toLocaleString()}`
                  : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Account (read-only)
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.email}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Email verified
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.emailVerified ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Phone verified
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.phoneVerified ? "Yes" : "No"}
            </p>
          </div>
          {user.companyId != null && user.companyId !== "" ? (
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Company id
              </p>
              <p className="break-all font-mono text-sm text-gray-800 dark:text-white/90">
                {user.companyId}
              </p>
            </div>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Organization
            </p>
            <input
              type="text"
              readOnly
              disabled
              value={orgCompany}
              aria-label="Organization name from workspace"
              className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          {user.officeId != null && user.officeId !== "" ? (
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Office id
              </p>
              <p className="break-all font-mono text-sm text-gray-800 dark:text-white/90">
                {user.officeId}
              </p>
            </div>
          ) : null}
          {deptLabels.length > 0 ? (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Assigned departments
              </p>
              <div className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900/80">
                {deptLabels.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Editable details
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          These fields map to{" "}
          <code className="rounded bg-gray-100 px-1 dark:bg-white/10">
            PATCH /api/users/me
          </code>
          . Display name, username, email, user type, and status
          cannot be changed here. Organization name is shown in Account
          (read-only). Password changes use{" "}
          <strong className="font-medium text-gray-700 dark:text-gray-300">
            Change password
          </strong>{" "}
          (separate sign-in update).
        </p>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Label>Display name</Label>
            <Input
              value={
                user.displayName?.trim() ||
                user.username ||
                ""
              }
              disabled
              onChange={() => {}}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>
              Full name <span className="text-error-500">*</span>
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Gender</Label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div>
            <Label>Country code</Label>
            <Input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="255"
            />
          </div>

          <div>
            <Label>Phone number</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="769000000"
            />
          </div>

          <DatePicker
            id="profile-date-of-birth"
            label="Date of birth"
            placeholder="Select date of birth"
            value={dateOfBirth}
            onValueChange={setDateOfBirth}
          />

          <div>
            <Label>Nationality</Label>
            <Input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="TZ"
            />
          </div>

          <div>
            <Label>Preferred language</Label>
            <Input
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              placeholder="en"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Professional profile
        </h4>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div>
            <Label>Job title</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Department</Label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Bio</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              placeholder="Short professional bio"
            />
          </div>
          <div>
            <Label>Locale</Label>
            <Input value={locale} onChange={(e) => setLocale(e.target.value)} />
          </div>
          <div>
            <Label>Time zone</Label>
            <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
              Default for Tanzania: {DEFAULT_TIME_ZONE}
            </p>
            <Input
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            />
          </div>
          <div>
            <Label>Professional license #</Label>
            <Input
              value={professionalLicenseNumber}
              onChange={(e) => setProfessionalLicenseNumber(e.target.value)}
            />
          </div>
          <div>
            <Label>Regulatory body</Label>
            <Input
              value={regulatoryBody}
              onChange={(e) => setRegulatoryBody(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Practice jurisdictions</Label>
            <Input
              value={practiceJurisdictions}
              onChange={(e) => setPracticeJurisdictions(e.target.value)}
            />
          </div>
          <div>
            <Label>Years experience (0–80)</Label>
            <Input
              type="text"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="e.g. 12"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="md"
          disabled={saving}
          className="!bg-black !text-white hover:!bg-gray-900 disabled:!opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          size="md"
          variant="outline"
          disabled={saving}
          onClick={() => void load()}
        >
          Reload from server
        </Button>
        <Button
          type="button"
          size="md"
          variant="outline"
          disabled={saving}
          onClick={() => setChangePasswordOpen(true)}
        >
          Change password
        </Button>
      </div>
    </form>
    </>
  );
}
