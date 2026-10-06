import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

test("buscar y limpiar clientes conserva la página y el borrador de creación",async({page})=>{
 const credentials=JSON.parse(await readFile(".runtime/e2e-credentials.json","utf8"));
 await page.goto("/login");
 await page.getByLabel("Correo electrónico",{exact:true}).fill(credentials.email);
 await page.getByLabel("Contraseña",{exact:true}).fill(credentials.password);
 await page.getByRole("button",{name:"Iniciar sesión",exact:true}).click();
 await expect(page).toHaveURL(/dashboard/);
 await page.goto("/clientes?view=cards&sort=name&page=2");
 const form=page.locator("#nuevo-cliente form");
 await form.getByLabel("Nombre *",{exact:true}).fill("Borrador sin guardar");
 await form.getByLabel("Teléfono *",{exact:true}).fill("3001234567");
 const documents:string[]=[];
 const warnings:string[]=[];
 page.on("request",request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())documents.push(request.url());});
 page.on("console",message=>{if(message.text().includes("uncontrolled FieldControl"))warnings.push(message.text());});
 for(const term of ["cliente inexistente","otra búsqueda"]){
  await page.getByLabel("Buscar clientes",{exact:true}).fill(term);
  await page.getByRole("button",{name:"Buscar",exact:true}).click();
  await expect(page).toHaveURL(new RegExp("q="+encodeURIComponent(term).replaceAll("%20","\\+")));
  await expect(page.getByRole("heading",{name:"No encontramos clientes"})).toBeVisible();
  await expect(form.getByLabel("Nombre *",{exact:true})).toHaveValue("Borrador sin guardar");
 }
 await page.getByRole("link",{name:"Limpiar",exact:true}).click();
 await expect(page.getByLabel("Buscar clientes",{exact:true})).toHaveValue("");
 await expect(form.getByLabel("Teléfono *",{exact:true})).toHaveValue("3001234567");
 const url=new URL(page.url());
 expect(url.searchParams.get("view")).toBe("cards");
 expect(url.searchParams.get("sort")).toBe("name");
 expect(url.searchParams.has("page")).toBe(false);
 expect(documents).toEqual([]);
 expect(warnings).toEqual([]);
});
