const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'views');

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  } 
  files.forEach(function (file) {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      let newContent = content
        .replace(/\bspace-y-6\b/g, 'space-y-4')
        .replace(/\bp-6\b/g, 'p-5')
        .replace(/\bgap-6\b/g, 'gap-4')
        .replace(/\brounded-2xl\b/g, 'rounded-xl');
        
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated ' + file);
      }
    }
  });
});
