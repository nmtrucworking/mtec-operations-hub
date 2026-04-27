const fs = require('fs');

const files = [
  'src/views/RequestsView.tsx',
  'src/views/FinanceView.tsx',
  'src/views/DisciplineView.tsx',
  'src/views/LogisticsView.tsx',
  'src/views/GeneratorView.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content
    .replace(/colors: BrandColors;/g, '')
    .replace(/colors: BrandColors/g, '')
    .replace(/colors,\s*/g, '')
    .replace(/colors\s*:\s*BrandColors/g, '')
    .replace(/\{ colors \}: \w+Props/g, '()')
    .replace(/\{ colors \}/g, '()')
    .replace(/\$\{colors\.bgDark\}/g, 'bg-background')
    .replace(/\$\{colors\.bgCard\}/g, 'bg-card')
    .replace(/\$\{colors\.textGold\}/g, 'text-gold')
    .replace(/\$\{colors\.bgGold\}/g, 'bg-gold')
    .replace(/\$\{colors\.hoverGold\}/g, 'hover:bg-gold-hover')
    .replace(/import type \{ BrandColors \} from '\.\.\/types\/app';\n?/g, '')
    .replace(/import type \{ BrandColors,\s*/g, 'import type { ')
    .replace(/import \{ type BrandColors,\s*/g, 'import { ');
  
  fs.writeFileSync(file, content, 'utf8');
});
