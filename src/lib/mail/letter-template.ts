import type { LetterComposeDetails, MailTemplate } from "@/api/types/mail";

export const LETTER_TEMPLATE_ID = "letter";

export function isLetterTemplate(templateId: string): boolean {
  return templateId === LETTER_TEMPLATE_ID;
}

export function letterDetailsFromTemplate(
  template: MailTemplate | undefined
): LetterComposeDetails {
  return {
    contactEmail: template?.letterContactEmail ?? "info@companies.co.tz",
    contactPhone: template?.letterContactPhone ?? "0717117991/0763007190",
    contactAddress:
      template?.letterContactAddress ??
      `14th Floor Exchange Tower
NHC Morocco Square
Cnr Bagamoyo Road /Mwai Kibaki
P O Box 8350 Dar es Salaam`,
    recipientAddress:
      template?.letterRecipientAddress ??
      `DIRECTOR
KINONDONI MUNICIPAL
P O BOX 31902
DAR ES SALAAM`,
    reLine: template?.letterReLine ?? "Re: Registered Office",
    signatoryName: template?.letterSignatoryName ?? "Xaveria Benigna Tharsis Hyera",
    signatoryTitle: template?.letterSignatoryTitle ?? "Managing Director",
  };
}
