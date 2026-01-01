import customersInfo from "@/config/customersInfo.json";

export async function generateReceiptHtml(sale: any, items: any[]) {
  const profile = "AbdulLaptop";
  const info = (customersInfo as any)[profile];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          margin: 0;
          size: 80mm 297mm; /* Standard 80mm roll height can vary */
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 72mm; /* Printable width for 80mm paper */
          margin: 0 auto;
          padding: 5mm 0;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .header { margin-bottom: 5mm; }
        .title { font-size: 16px; margin: 0; }
        .address, .contact { font-size: 10px; margin: 1mm 0; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 11px; }
        .table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
        .table th { text-align: left; border-bottom: 1px solid #000; font-size: 11px; }
        .table td { padding: 1mm 0; font-size: 11px; vertical-align: top; }
        .totals { margin-top: 2mm; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
        .footer { margin-top: 5mm; font-size: 10px; }
        
        /* Ensure no colors/backgrounds interfere with thermal printing */
        * { background: transparent !important; color: #000 !important; }
      </style>
    </head>
    <body>
      <div class="header text-center">
        <h1 class="title font-bold">${info.Title}</h1>
        <div class="address">${info.Address}</div>
        <div class="contact">Contact: ${info.Contact}</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-row">
        <span>Inv# No: ${sale.ID}</span>
        <span>OT: ${sale.OrderType || 'Dine In'}</span>
      </div>
      <div class="info-row">
        <span>Client: ${sale.ClientName || '-'}</span>
      </div>
      ${sale.PhoneNo ? `<div class="info-row"><span>Phone: ${sale.PhoneNo}</span></div>` : ''}
      ${sale.DeliveryAddress ? `<div class="info-row"><span>Address: ${sale.DeliveryAddress}</span></div>` : ''}
      
      <div class="divider"></div>
      
      <table class="table">
        <thead>
          <tr>
            <th width="50%">Item</th>
            <th width="10%" class="text-center">Qty</th>
            <th width="20%" class="text-right">Price</th>
            <th width="20%" class="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.itemName}</td>
              <td class="text-center">${item.qty}</td>
              <td class="text-right">${item.price}</td>
              <td class="text-right">${(item.qty * item.price).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <div class="totals text-right">
        <div class="total-row font-bold">
          <span>Net Total</span>
          <span>${sale.TotalAmount}</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-row">
        <span>User: ${sale.UserID || 'System'}</span>
        <span>Date: ${new Date(sale.SaleDate).toLocaleDateString()}</span>
      </div>
      
      <div class="footer text-center">
        <div>${info.WaterMark}</div>
        <div>Thank You For Your Visit!</div>
      </div>
    </body>
    </html>
  `;
  return html;
}
