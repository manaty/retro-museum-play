import {spawnSync} from 'node:child_process';import {dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.resolve('@manaty/game-zx80/package'))),'..');
for(const file of ['scripts/setup-zx80.mjs','build.mjs']){const result=spawnSync(process.execPath,[file],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
