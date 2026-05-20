import * as XLSX from "xlsx";

export type ExcelMergeRange = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: string[][];
  /** Row/column merges (0-based), e.g. group name rowspan. */
  merges?: ExcelMergeRange[];
};

export function downloadExcel(
  filename: string,
  sheets: ExcelSheet[]
): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = [sheet.headers, ...sheet.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    if (sheet.merges?.length) {
      worksheet["!merges"] = sheet.merges;
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
