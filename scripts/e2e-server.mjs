import {loadEnvFile} from "node:process"; import {spawn,execFile} from "node:child_process"; import {randomBytes} from "node:crypto"; import {mkdir,writeFile,access} from "node:fs/promises"; import {Pool} from "pg"; import {drizzle} from "drizzle-orm/node-postgres"; import {migrate} from "drizzle-orm/node-postgres/migrator";
loadEnvFile(".env.local");
const url=new URL(process.env.DATABASE_URL);if(!["127.0.0.1","localhost"].includes(url.hostname))throw new Error("E2E solo PostgreSQL local.");
url.pathname="/golden_print_e2e";const dbUrl=url.toString(),pool=new Pool({connectionString:dbUrl,max:1});
await migrate(drizzle(pool),{migrationsFolder:"./drizzle"});
const rows=await pool.query("select id from organization where singleton_key=1");
await mkdir(".runtime",{recursive:true});
const credentialPath=".runtime/e2e-credentials.json";
let credentials;try {await access(credentialPath);credentials=JSON.parse(await (await import("node:fs/promises")).readFile(credentialPath,"utf8"));}catch{credentials={email:"admin-e2e@golden-print.test",password:randomBytes(24).toString("base64url")};await writeFile(credentialPath,JSON.stringify(credentials));}
if(!rows.rowCount){const env={...process.env,DATABASE_URL:dbUrl,MIGRATION_DATABASE_URL:dbUrl,BOOTSTRAP_NAME:"Administrador de pruebas",BOOTSTRAP_EMAIL:credentials.email,BOOTSTRAP_PASSWORD:credentials.password};await new Promise((resolve,reject)=>{const child=spawn(process.execPath,["node_modules/tsx/dist/cli.mjs","scripts/bootstrap.ts"],{env,stdio:"inherit"});child.on("exit",code=>code===0?resolve():reject(new Error("Bootstrap E2E falló")));});}
await pool.end();
const env={...process.env,DATABASE_URL:dbUrl,GOLDEN_PRINT_E2E:"1",BETTER_AUTH_URL:"http://localhost:3001"};
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--port","3001"],{env,stdio:"inherit"});
function shutdown(){if(process.platform==="win32")execFile("taskkill",["/PID",String(child.pid),"/T","/F"],{windowsHide:true},()=>process.exit(0));else{child.kill("SIGTERM");process.exit(0);}}
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);child.on("exit",code=>process.exit(code??0));
