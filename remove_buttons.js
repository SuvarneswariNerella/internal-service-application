const fs = require('fs');
const path = require('path');

const templatesDir = 'C:/Users/Suvarna/OneDrive/Desktop/internla server application/internal-service-application/Invoice_Templates';
const files = ['Classic.html', 'Minimal.html', 'Modern.html'].map(f => path.join(templatesDir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the buttons div
  content = content.replace(/<div class="tm_invoice_btns tm_hide_print">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '</div>\n  </div>');
  
  // Remove the scripts
  content = content.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/jquery[\s\S]*?<\/script>/g, '');
  
  fs.writeFileSync(file, content);
  console.log('Successfully updated ' + file);
});
