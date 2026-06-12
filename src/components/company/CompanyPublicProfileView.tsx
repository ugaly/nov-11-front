"use client";

import type { CompanyManagementProfile } from "@/api/types/company-management";
import { Download, FileText, Mail, MapPin, Phone } from "lucide-react";

export default function CompanyPublicProfileView({
  profile,
}: {
  profile: CompanyManagementProfile;
}) {
  const activeSections = profile.sections.filter((s) => s.active);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {profile.bannerUrl ? (
          <div className="h-40 w-full bg-gray-100 sm:h-52 dark:bg-gray-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-28 bg-gradient-to-r from-gray-900 to-gray-700 sm:h-36" />
        )}
        <div className="relative px-6 pb-6 pt-4 sm:px-8">
          <div className="-mt-14 mb-4 flex items-end gap-4 sm:-mt-16">
            {profile.logoUrl ? (
              <div className="size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg dark:border-gray-950 dark:bg-gray-900 sm:size-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-gray-900 text-2xl font-bold text-white shadow-lg dark:border-gray-950 sm:size-28">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 pb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {profile.name}
              </h1>
              {profile.industry ? (
                <p className="text-sm text-gray-500">{profile.industry}</p>
              ) : null}
            </div>
          </div>

          {profile.description ? (
            <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {profile.description}
            </p>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {profile.headquartersAddress || profile.headquartersCity ? (
              <div className="flex gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {[profile.headquartersAddress, profile.headquartersCity, profile.headquartersRegion, profile.headquartersCountry]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : null}
            {profile.contactEmail ? (
              <div className="flex gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                <a href={`mailto:${profile.contactEmail}`} className="hover:underline">
                  {profile.contactEmail}
                </a>
              </div>
            ) : null}
            {profile.contactPhone ? (
              <div className="flex gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{profile.contactPhone}</span>
              </div>
            ) : null}
            {profile.website ? (
              <div className="flex gap-2 text-gray-600 dark:text-gray-400 sm:col-span-2">
                <span className="font-medium text-gray-500">Website</span>
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 hover:underline dark:text-brand-400"
                >
                  {profile.website}
                </a>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {activeSections.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No profile sections published yet.</p>
      ) : (
        activeSections.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h2>
            {section.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            ) : null}

            {section.assets.filter((a) => a.kind === "IMAGE").length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.assets
                  .filter((a) => a.kind === "IMAGE")
                  .map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.fileName}
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                  ))}
              </div>
            ) : null}

            {section.assets.filter((a) => a.kind === "DOCUMENT").length > 0 ? (
              <ul className="mt-6 space-y-2">
                {section.assets
                  .filter((a) => a.kind === "DOCUMENT")
                  .map((asset) => (
                    <li key={asset.id}>
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                      >
                        <FileText className="size-4" aria-hidden />
                        {asset.fileName}
                        <Download className="ml-1 size-3.5 opacity-60" aria-hidden />
                      </a>
                    </li>
                  ))}
              </ul>
            ) : null}
          </section>
        ))
      )}
    </div>
  );
}
