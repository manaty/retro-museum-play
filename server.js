import {createGameHost,loadGame,fileRoomStore} from '@manaty/retro-museum-sdk/host';
import {Storage} from '@google-cloud/storage';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createZX80Runtime} from '@manaty/game-zx80/engine';
import {createCatalogSync} from './catalog.js';
const games=['tanks','uno','kart','monopoly','werewolf','zx80'];
const zxRoot=resolve(dirname(fileURLToPath(import.meta.resolve('@manaty/game-zx80/package'))),'..');
const rom=await readFile(resolve(zxRoot,'.local/roms/zx80.rom'));
const definitions=await Promise.all(games.map(game=>loadGame(fileURLToPath(import.meta.resolve('@manaty/game-'+game+'/package')),game==='zx80'?{createEngine:(...args)=>createZX80Runtime(rom,...args)}:{})));
let store=fileRoomStore(resolve(process.env.DATA_DIR||'.local/rooms'));
if(process.env.ROOM_BUCKET){const bucket=new Storage().bucket(process.env.ROOM_BUCKET);store={
 async list(){const [files]=await bucket.getFiles({prefix:'rooms/'});const result=[];for(const file of files){try{const [bytes]=await file.download();result.push(JSON.parse(bytes));}catch(error){console.error('Room checkpoint unavailable',file.name,error.code);}}return result;},
 async put(room){await bucket.file('rooms/'+room.id+'.json').save(JSON.stringify(room),{resumable:false,contentType:'application/json'});},
 async putPackage(hash,source){try{await bucket.file('packages/'+hash+'.json').save(source,{resumable:false,contentType:'application/json',preconditionOpts:{ifGenerationMatch:0}});}catch(error){if(error.code!==412)throw error;}},
 async getPackage(hash){if(!/^[a-f0-9]{64}$/.test(hash))throw Error('Invalid package hash');const [bytes]=await bucket.file('packages/'+hash+'.json').download();return bytes.toString('utf8');}
};}
let catalog;
const app=await createGameHost({definitions,store,publicOrigin:process.env.PUBLIC_ORIGIN,allowedOrigins:(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean),refreshGames:()=>catalog?.refresh(),maxRooms:Number(process.env.MAX_ROOMS)||32});
if(process.env.CATALOG_ORIGIN)catalog=createCatalogSync({origin:process.env.CATALOG_ORIGIN,host:app,protectedIds:definitions.map(d=>d.pack.manifest.id)});
await catalog?.refresh();const catalogTimer=setInterval(()=>catalog?.refresh(),60000);
app.server.listen(Number(process.env.PORT)||8080,'0.0.0.0',()=>console.log('Manaty Play ready: '+games.join(', ')));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{clearInterval(catalogTimer);await catalog?.close();await app.close();process.exit(0);});
