/** ~60% viewport width for setup create/edit form modals (not confirm dialogs). */
export const setupFormModalClass =
  "m-4 w-[min(60vw,calc(100vw-2rem))] max-w-[min(60vw,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto p-6 sm:p-8 lg:p-10";

/** Near-fullscreen modal for image / PDF file previews. */
export const filePreviewModalClass =
  "m-2 flex w-[min(98vw,calc(100vw-0.5rem))] max-w-[96rem] max-h-[98vh] flex-col overflow-hidden p-4 sm:m-3 sm:p-5";

/** Compact confirm / destructive-action dialogs. */
export const setupConfirmModalClass =
  "m-4 w-full max-w-md p-6 sm:p-8";
