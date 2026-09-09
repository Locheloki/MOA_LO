import ExcelJS from 'exceljs';
import { RecordItem } from '../types';

export async function exportToExcel(records: RecordItem[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('MOA & LO Records');

  // Columns definition
  worksheet.columns = [
    { header: 'Control Number', key: 'controlNumber', width: 18 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Title', key: 'title', width: 45 },
    { header: 'Description', key: 'description', width: 45 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Issue / Request Date', key: 'date', width: 18 },
    { header: 'Expiration Date', key: 'expirationDate', width: 18 },
    { header: 'Parties', key: 'parties', width: 35 },
    { header: 'Signatories / Counsel', key: 'signatories', width: 35 },
    { header: 'Sync Status', key: 'syncStatus', width: 15 }
  ];

  // Add records
  records.forEach((record) => {
    const isMOA = record.type === 'MOA';
    worksheet.addRow({
      controlNumber: record.controlNumber,
      type: record.type,
      title: record.title,
      description: record.description,
      status: record.status,
      date: isMOA ? (record.issueDate || '') : (record.requestDate || ''),
      expirationDate: isMOA 
        ? (record.isIndefinite ? 'Indefinite' : (record.expirationDate || '')) 
        : 'N/A',
      parties: isMOA && record.parties ? record.parties.join(' | ') : 'N/A',
      signatories: isMOA 
        ? (record.signatories ? record.signatories.join(' | ') : '') 
        : (record.assignedCounsel || ''),
      syncStatus: record.syncStatus
    });
  });

  // Apply visual styling to Excel headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' } // Slate 800 background
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 26;

  // Zebra striping for data rows & borders
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.alignment = { vertical: 'middle' };
      
      // Row borders
      row.border = {
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
      };

      // Zebra background color
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8FAFC' } // Slate 50 background
        };
      }
    }
  });

  // Generate binary Excel buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `MOA_LO_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  
  // Clean up references
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
