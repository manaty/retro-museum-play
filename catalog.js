import {parsePackage,digest,MAX_PACKAGE_BYTES,manifest} from '@manaty/retro-museum-sdk/manifest';
import {isDeepStrictEqual} from 'node:util';

// The configured publisher is trusted; submitted repository URLs never become fetch targets.
export function createCatalogSync({origin,host,protectedIds=[],fetcher=fetch,clock=Date.now,report=console.warn,maxBytes=128*1024*1024,maxGames=64}){
 const base=new URL(origin).origin;if(new URL(base).protocol!=='https:')throw Error('Catalog must use HTTPS');
 const protectedGames=new Set(protectedIds),managed=new Map();let pending,last=-Infinity,stopped=false;
 async function bytes(path,limit){const response=await fetcher(base+path,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Catalog HTTP '+response.status);if(Number(response.headers.get('content-length'))>limit)throw Error('Catalog response too large');const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>limit)throw Error('Catalog response too large');chunks.push(chunk);}return Buffer.concat(chunks);}
 async function sync(){
  let catalog;try{catalog=JSON.parse(await bytes('/api/catalog',2*1024*1024));if(catalog.schemaVersion!==1||!Array.isArray(catalog.games)||catalog.games.length>500)throw Error('Invalid catalog');}catch(error){report('Catalog refresh deferred: '+error.message);return;}
  const available=new Set();
  for(const entry of catalog.games){
   if(stopped)return;
   if(protectedGames.has(entry.id)||entry.catalogType==='publisher_preview'||entry.withdrawn||!entry.publishedAt||!/^[a-f0-9]{32}$/.test(entry.reportId||'')||!/^[a-f0-9]{64}$/.test(entry.sha256||''))continue;
   try{if(managed.get(entry.id)?.hash!==entry.sha256){if(!managed.has(entry.id)&&managed.size>=maxGames)throw Error('Host catalog capacity reached');const source=await bytes('/packages/'+entry.sha256+'.json',MAX_PACKAGE_BYTES);const used=[...managed].reduce((n,[id,value])=>n+(id===entry.id?0:value.size),0);if(used+source.length>maxBytes)throw Error('Host catalog capacity reached');if(digest(source)!==entry.sha256)throw Error('Package integrity mismatch');const pack=parsePackage(source);if(pack.manifest.id!==entry.id||!isDeepStrictEqual(pack.manifest,manifest(entry.manifest)))throw Error('Catalog manifest mismatch');if(stopped)return;await host.registerGame({pack,source:source.toString('utf8'),hash:entry.sha256});managed.set(entry.id,{hash:entry.sha256,size:source.length});}available.add(entry.id);
   }catch(error){report('Catalog game unavailable: '+String(entry.id).slice(0,50)+' ('+error.message+')');}
  }
  for(const id of managed.keys())if(!available.has(id)){host.removeGame(id);managed.delete(id);}
 }
 return {refresh({force=false}={}){if(stopped)return Promise.resolve();if(pending)return pending;if(!force&&clock()-last<5000)return Promise.resolve();last=clock();pending=sync().finally(()=>pending=null);return pending;},async close(){stopped=true;await pending;}};
}
