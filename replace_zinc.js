const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = [
  ...walkSync(path.join(__dirname, 'app')),
  ...walkSync(path.join(__dirname, 'components'))
].filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replacements
  content = content.replace(/bg-zinc-950/g, 'bg-card');
  content = content.replace(/bg-zinc-900\/50/g, 'bg-muted/50');
  content = content.replace(/bg-zinc-900/g, 'bg-muted');
  content = content.replace(/bg-zinc-800/g, 'bg-muted');
  content = content.replace(/border-zinc-800/g, 'border-border');
  content = content.replace(/text-zinc-100/g, 'text-card-foreground');
  content = content.replace(/text-zinc-200/g, 'text-card-foreground');
  content = content.replace(/text-zinc-300/g, 'text-foreground');
  content = content.replace(/text-zinc-400/g, 'text-muted-foreground');
  content = content.replace(/text-zinc-500/g, 'text-muted-foreground');
  content = content.replace(/text-zinc-600/g, 'text-muted-foreground');
  content = content.replace(/text-white/g, 'text-foreground'); // For some active states
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
