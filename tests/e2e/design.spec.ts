import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";
test("diseño adaptable de todos los módulos y controles de acceso uniformes",async({page})=>{
 test.setTimeout(240000);
 const credentials=JSON.parse(await readFile(".runtime/e2e-credentials.json","utf8"));
 await page.setViewportSize({width:1440,height:1000});await page.goto("/login");
 const email=await page.getByLabel("Correo electrónico",{exact:true}).boundingBox();const password=await page.locator('[data-slot="input-group"]').filter({has:page.getByLabel("Contraseña",{exact:true})}).boundingBox();
 expect(email?.height).toBe(password?.height);expect(email?.width).toBe(password?.width);
 await page.getByLabel("Correo electrónico",{exact:true}).fill(credentials.email);await page.getByLabel("Contraseña",{exact:true}).fill(credentials.password);await page.getByRole("button",{name:"Iniciar sesión",exact:true}).click();await expect(page).toHaveURL(/dashboard/);
 for(const width of [1920,1440,768,360,320]){
  await page.setViewportSize({width,height:1000});
  for(const route of ["/dashboard","/pedidos","/pedidos/nuevo","/cotizaciones","/cotizaciones/nueva","/clientes","/filamentos","/gastos","/finanzas","/usuarios","/ajustes","/perfil"]){
   await page.goto(route);if(route==="/dashboard")await expect(page.getByRole("heading",{name:"Inicio",exact:true})).toBeAttached();else await expect(page.locator("main h1")).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+" @"+width).toBe(true);
   if(width===1920){const layout=await page.locator('main').boundingBox();expect(layout?.width,route+' uses the available desktop width').toBeGreaterThan(1600);}
   await expect(page.locator(".workspace-header")).toHaveCount(0);
   if(route==="/dashboard"){if(width===360){await page.getByRole("button",{name:"Abrir menú"}).click();await expect(page.getByRole("dialog").getByRole("link",{name:"Clientes",exact:true})).toBeVisible();await page.keyboard.press("Escape");}
    await expect(page.getByText("Tu taller",{exact:true})).toHaveCount(0);await expect(page.locator(".header-profile")).toHaveCount(0);await expect(page.getByRole("region",{name:"Filtrar por período"}).getByRole("button",{name:"Nuevo pedido",exact:true})).toBeVisible();}
   expect(await page.getByText("No pudimos cargar",{exact:false}).count(),route+" loaded").toBe(0);
   if(["/dashboard","/pedidos/nuevo","/cotizaciones","/cotizaciones/nueva","/finanzas","/clientes"].includes(route)&&[1440,360].includes(width))await page.screenshot({path:"docs/screenshots/redesign-"+route.slice(1).replaceAll("/","-")+"-"+width+".png",fullPage:true});
  }
 }
 await page.setViewportSize({width:1920,height:1080});await page.goto('/filamentos');
 const search=await page.getByRole('search').boundingBox();const view=await page.getByRole('group',{name:'Vista',exact:true}).boundingBox();
 expect(search).not.toBeNull();expect(view).not.toBeNull();expect(Math.abs((search?.y??0)-(view?.y??0))).toBeLessThan(35);
 const colorModel='Color personalizado '+Date.now();await page.getByLabel('Marca *',{exact:true}).fill('Prueba visual');await page.getByLabel('Modelo *',{exact:true}).fill(colorModel);await page.getByLabel('Material *',{exact:true}).fill('PLA');
 await page.getByLabel('Elegir color visual',{exact:true}).fill('#12a6ba');await expect(page.getByLabel('Color *',{exact:true})).toHaveValue('#12a6ba');
 await page.getByLabel('Precio del rollo (COP) *',{exact:true}).fill('90000');await page.getByLabel('Peso del rollo (g) *',{exact:true}).fill('1000');await page.getByRole('button',{name:'Guardar',exact:true}).click();
 const row=page.getByRole('row').filter({hasText:colorModel});await expect(row).toBeVisible();await expect(row.locator('.color-swatch')).toHaveCSS('background-color','rgb(18, 166, 186)');
 await page.screenshot({path:'docs/screenshots/full-width-filamentos-1920.png',fullPage:true});
 await page.getByRole('button',{name:'Tarjetas',exact:true}).click();const card=page.locator('.mobile-record').filter({hasText:colorModel});await expect(card).toBeVisible();await expect(card.locator('.color-swatch')).toHaveCSS('background-color','rgb(18, 166, 186)');
 await card.getByRole('link',{name:'Abrir detalle'}).click();await expect(page).toHaveURL(/\/filamentos\/[^/?]+$/);await expect(page.locator('main .data-summary .color-swatch')).toHaveCSS('background-color','rgb(18, 166, 186)');
});
