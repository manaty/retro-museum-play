import {readFile} from 'node:fs/promises';

const packages=new Map();
export async function initialize({sdkRoot,gameRoots={}}){
 for(const root of [sdkRoot,...Object.values(gameRoots)]){
  const metadata=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  packages.set(metadata.name,{root,exports:metadata.exports});
 }
}

export async function resolve(specifier,context,nextResolve){
 for(const [name,{root,exports}] of packages){
  if(specifier===name||specifier.startsWith(name+'/')){
   const target=exports[specifier===name?'.':'.'+specifier.slice(name.length)];
   if(typeof target==='string')return {url:new URL(target,root).href,shortCircuit:true};
  }
 }
 return nextResolve(specifier,context);
}
