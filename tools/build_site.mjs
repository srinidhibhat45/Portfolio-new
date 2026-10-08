import { cp, mkdir, rm } from 'node:fs/promises';
const publicFiles=['index.html','robots.txt','sitemap.xml','site.webmanifest','css','js','assets'];
await rm('.dist',{recursive:true,force:true});
await mkdir('.dist',{recursive:true});
for (const file of publicFiles) await cp(file,`.dist/${file}`,{recursive:true,filter:source=>!source.includes('assets/_src')&&!source.includes('__audit__')});
console.log('Public portfolio built in .dist. Local visitor data and development files are excluded.');
