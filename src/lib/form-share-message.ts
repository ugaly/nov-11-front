export function buildFormShareMessage(params: {
  customerName: string;
  companyName: string;
  engagementTitle: string;
  groupTitle: string;
}): string {
  return `Dear ${params.customerName},

Please find attached the form for ${params.engagementTitle} — ${params.groupTitle}.

Kindly complete all sections in the form. Where attachments are required, please provide the documents separately as indicated on the form.

If you have any questions, please contact our office.

Thank you,
${params.companyName}`;
}

export function formShareEmailSubject(params: {
  companyName: string;
  engagementTitle: string;
  groupTitle: string;
}): string {
  return `${params.companyName} — ${params.engagementTitle} (${params.groupTitle})`;
}
