import puppeteer from "puppeteer";
import { FinanceRecord, Workspace } from "@prisma/client";

export const generateFinancePdf = async (
  record: FinanceRecord & { project?: any },
  clientName: string,
  workspace: Workspace | null
): Promise<Buffer> => {
  const metadata: any = record.metadata || {};
  const lineItems: any[] = metadata.lineItems || [];
  const subtotal = metadata.subtotal || 0;
  const totalGst = metadata.totalGst || 0;
  const taxType = metadata.taxType || "INTRA";

  const cgst = taxType === "INTRA" ? totalGst / 2 : 0;
  const sgst = taxType === "INTRA" ? totalGst / 2 : 0;
  const igst = taxType === "INTER" ? totalGst : 0;

  const displayType = record.type.startsWith("PURCHASE_ORDER") ? "Purchase Order" : 
                      record.type === "QUOTATION" ? "Estimate" : "Invoice";

  const date = record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : "-";
  const dueDate = record.dueDate ? new Date(record.dueDate).toISOString().split('T')[0] : "-";

  const previewData: Record<string, string> = {
    "company.name": workspace?.legalName || workspace?.displayName || "Company Name",
    "company.logo": workspace?.logoUrl 
      ? `<img src="${workspace.logoUrl}" style="max-height: 40px; object-fit: contain;" />` 
      : `<div style="width:60px;height:40px;background:#1e293b;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold;">LOGO</div>`,
    "company.address": workspace?.address || "Company Address",
    "company.gstin": workspace?.gstin || "N/A",
    "company.email": workspace?.contactEmail || "billing@company.com",
    "doc.type": displayType,
    "doc.number": record.title || "DOC-001",
    "doc.issuedDate": date,
    "doc.dueDate": dueDate,
    "client.name": clientName,
    "client.address": record.project?.client?.address || "N/A",
    "client.gstin": record.project?.client?.notes || "N/A",
    "lineItems.html": lineItems.map(item => `
      <tr>
        <td>${item.description || '—'}</td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">${record.currency} ${Number(item.rate || 0).toLocaleString()}</td>
        <td style="text-align: center;">${item.gst || 0}%</td>
        <td style="text-align: right;">${record.currency} ${Number((item.qty || 0) * (item.rate || 0)).toLocaleString()}</td>
      </tr>
    `).join(''),
    "financial.subtotal": `${record.currency} ${Number(subtotal).toLocaleString()}`,
    "financial.tax": `${record.currency} ${Number(totalGst).toLocaleString()}`,
    "financial.total": `${record.currency} ${Number(record.amount).toLocaleString()}`
  };

  let html = "";

  if (metadata.customHtml) {
    let processedHtml = metadata.customHtml;
    Object.keys(previewData).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, previewData[key] || '');
    });

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${record.title || 'Document'}</title>
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 20px; }
          ${metadata.customCss || ''}
        </style>
      </head>
      <body>
        ${processedHtml}
      </body>
      </html>
    `;
  } else {
    // Generate Default HTML
    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${record.title || 'Document'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
            <div>
              <h1 class="text-3xl font-extrabold text-gray-900">${workspace?.displayName || 'Company'}</h1>
              <p class="text-sm text-gray-500 mt-1">${workspace?.legalName || ''}</p>
              <p class="text-sm text-gray-500">${workspace?.contactEmail || ''}</p>
            </div>
            <div class="text-right">
              <h2 class="text-2xl font-bold text-[#5438FF] uppercase tracking-wider">${displayType}</h2>
              <p class="text-gray-900 font-bold mt-2">${record.title}</p>
              <p class="text-sm text-gray-500">Date: ${date}</p>
              <p class="text-sm text-gray-500">Due: ${dueDate}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h3>
              <p class="font-bold text-gray-900">${clientName}</p>
              <p class="text-sm text-gray-600">${record.project?.name || ''}</p>
            </div>
            <div class="text-right">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount Due</h3>
              <p class="text-2xl font-extrabold text-gray-900">${record.currency} ${Number(record.amount).toLocaleString()}</p>
            </div>
          </div>

          <table class="w-full text-left mb-8">
            <thead>
              <tr class="border-b-2 border-gray-900">
                <th class="py-3 text-sm font-bold text-gray-900">Description</th>
                <th class="py-3 text-sm font-bold text-gray-900 text-center">Qty</th>
                <th class="py-3 text-sm font-bold text-gray-900 text-right">Rate</th>
                <th class="py-3 text-sm font-bold text-gray-900 text-center">GST %</th>
                <th class="py-3 text-sm font-bold text-gray-900 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${lineItems.map(item => `
                <tr>
                  <td class="py-4">
                    <p class="font-bold text-gray-900 text-sm">${item.description}</p>
                  </td>
                  <td class="py-4 text-center text-sm">${item.qty}</td>
                  <td class="py-4 text-right text-sm">${Number(item.rate).toLocaleString()}</td>
                  <td class="py-4 text-center text-sm">${item.gst || 18}%</td>
                  <td class="py-4 text-right text-sm font-bold">${(item.qty * item.rate).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-end">
            <div class="w-64 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-bold text-gray-900">${Number(subtotal).toLocaleString()}</span>
              </div>
              ${taxType === 'INTRA' ? `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">CGST:</span>
                  <span class="font-medium text-gray-800">${Number(cgst).toLocaleString()}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">SGST:</span>
                  <span class="font-medium text-gray-800">${Number(sgst).toLocaleString()}</span>
                </div>
              ` : `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">IGST:</span>
                  <span class="font-medium text-gray-800">${Number(igst).toLocaleString()}</span>
                </div>
              `}
              <div class="flex justify-between border-t border-gray-900 pt-3">
                <span class="font-bold text-gray-900">Total:</span>
                <span class="font-bold text-gray-900 text-lg">${record.currency} ${Number(record.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '40px', bottom: '40px', left: '20px', right: '20px' }
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
};
