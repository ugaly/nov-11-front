/** Shared field styles for invoice forms and modals. */
export const invoiceFieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export const invoiceNotesTextareaClass = `${invoiceFieldClass} min-h-[140px] resize-y py-3 leading-relaxed`;

export const invoiceMessageTextareaClass = `${invoiceFieldClass} min-h-[min(420px,52vh)] resize-y py-3 leading-relaxed`;
