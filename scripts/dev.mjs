import {register} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

// Preview shared host/UI changes without publishing or changing release pins.
const sdkRoot=process.env.RETRO_MUSEUM_SDK_DIR
 ? pathToFileURL(resolve(process.env.RETRO_MUSEUM_SDK_DIR)+'/')
 : new URL('../../retro-museum-sdk/',import.meta.url);
const gameRoots=Object.fromEntries(Object.entries(JSON.parse(process.env.RETRO_MUSEUM_GAME_DIRS||'{}')).map(([name,path])=>[name,pathToFileURL(resolve(path)+'/').href]));
for(const root of [sdkRoot.href,...Object.values(gameRoots)]){
 const command=process.env.npm_execpath?process.execPath:'npm';
 const args=process.env.npm_execpath?[process.env.npm_execpath,'run','build']:['run','build'];
 const build=spawnSync(command,args,{cwd:fileURLToPath(root),stdio:'inherit'});
 if(build.error)throw build.error;
 if(build.status!==0)process.exit(build.status||1);
}
register('./local-sdk-loader.mjs',import.meta.url,{data:{sdkRoot:sdkRoot.href,gameRoots}});
await import('../server.js');
