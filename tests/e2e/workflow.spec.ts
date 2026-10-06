import {test,expect} from "@playwright/test";import {readFile} from "node:fs/promises";
async function login(page:import("@playwright/test").Page){const c=JSON.parse(await readFile(".runtime/e2e-credentials.json","utf8"));await page.goto("/login");await page.getByLabel(/correo/i).fill(c.email);await page.getByLabel(/^contraseña$/i).fill(c.password);await page.getByRole("button",{name:/iniciar sesión|ingresar/i}).click();await expect(page).toHaveURL(/dashboard/);}
test("acceso privado, login y cierre de sesión",async({page})=>{await page.goto("/dashboard");await expect(page).toHaveURL(/login/);await login(page);await expect(page.getByRole("heading",{name:"Inicio",exact:true})).toBeVisible();await page.getByRole("button",{name:/cerrar sesión|salir/i}).click();await expect(page).toHaveURL(/login/);await page.goto("/pedidos");await expect(page).toHaveURL(/login/);});
test("la sesión vencida redirige automáticamente sin extenderla",async({page})=>{
 await login(page);
 let checks=0;
 await page.route('**/api/auth/get-session?disableCookieCache=true&disableRefresh=true',async route=>{
  checks++;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(checks===1?{session:{expiresAt:new Date(Date.now()+1500).toISOString()}}:null)});
 });
 await page.reload();
 await expect(page).toHaveURL(/login/);
 expect(checks).toBeGreaterThanOrEqual(2);
 await expect(page.getByLabel(/correo/i)).toBeVisible();
});
test("login móvil conserva marca y no desborda",async({page})=>{await page.setViewportSize({width:360,height:800});await page.goto("/login");await expect(page.getByLabel(/correo/i)).toBeVisible();await expect(page.getByLabel(/^contraseña$/i)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/login-mobile.png",fullPage:true});});
test("registro público y API administrativa bloqueados",async({request})=>{expect((await request.post("/api/auth/sign-up/email",{data:{name:"Intruso",email:"unwanted@test.test",password:"UnwantedPassword1234"}})).status()).toBeGreaterThanOrEqual(400);expect((await request.post("/api/auth/admin/create-user",{data:{}})).status()).toBeGreaterThanOrEqual(400);});

test("cotizar, convertir, fallar, reimprimir, abonar y entregar",async({page})=>{
 const fieldWarnings:string[]=[];page.on("console",message=>{if(message.text().includes("default value state of an uncontrolled FieldControl"))fieldWarnings.push(message.text());});
 await login(page);const tag=Date.now().toString(),customer="Cliente prueba "+tag,brand="Filamento prueba "+tag,project="Pieza prueba "+tag;
 await page.goto("/clientes");await page.getByLabel(/^Nombre \*/).fill(customer);await page.getByLabel(/^Teléfono$/).fill("3001234567");await page.getByRole("button",{name:"Guardar cliente",exact:true}).click();await expect(page.getByRole("row").filter({hasText:customer})).toBeVisible();
 await page.goto("/filamentos");await page.getByLabel(/^Marca \*/).fill(brand);await page.getByLabel(/^Modelo \*/).fill("PLA estándar");await page.getByLabel(/^Material \*/).fill("PLA");await page.getByLabel(/^Color \*/).fill("Dorado");await page.getByLabel(/Precio del rollo/).fill("80000");await page.getByLabel(/Peso del rollo/).fill("1000");await page.getByRole("button",{name:"Guardar filamento",exact:true}).click();await page.goto("/filamentos?view=table&q="+encodeURIComponent(brand));await expect(page.getByRole("row").filter({hasText:brand})).toBeVisible();
 await page.goto("/cotizaciones/nueva");await page.getByLabel(/Nombre del proyecto/).fill(project);await page.getByLabel("Cliente",{exact:true}).selectOption({label:customer});await page.getByLabel(/Filamento \*/).selectOption({label:brand+" · PLA estándar · PLA · Dorado"});await expect(page.getByLabel(/COP \/ g/)).toHaveValue("80.0");await page.getByLabel(/Gramos \*/).fill("100");await page.getByLabel(/Gramos \*/).blur();await expect(page.getByLabel(/Gramos \*/)).toHaveValue("100.0");await page.getByLabel("Horas",{exact:true}).fill("1");await page.getByLabel(/^Minutos/).fill("30");await page.getByLabel(/^Segundos/).fill("30");await page.getByRole("button",{name:/Medio ·/}).click();await expect(page.locator(".quote-price-option")).toHaveCount(3);await expect(page.locator(".quote-price-option .quote-option-profit").first()).toHaveAttribute("data-tone","positive");await page.getByLabel("Precio manual (COP)",{exact:true}).fill("1000.5");await expect(page.locator(".quote-price-card")).toBeVisible();await expect(page.locator(".quote-grand-total")).toContainText("—");await page.getByLabel("Precio manual (COP)",{exact:true}).fill("1000");await expect(page.locator(".quote-manual-option")).toHaveAttribute("data-selected","true");await expect(page.locator(".quote-manual-option .quote-option-profit")).toHaveAttribute("data-tone","negative");await expect(page.locator(".quote-grand-total")).toContainText("$ 1.000");await expect(page.getByRole("button",{name:/Medio ·/})).toHaveAttribute("aria-pressed","false");await page.getByRole("button",{name:/Medio ·/}).click();await expect(page.getByLabel("Precio manual (COP)",{exact:true})).toHaveValue("");await expect(page.getByRole("button",{name:/Medio ·/})).toHaveAttribute("aria-pressed","true");await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/quote-price-options-mobile.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.getByRole("button",{name:"Guardar borrador",exact:true}).click();await expect(page).toHaveURL(/cotizaciones\/[0-9a-f-]+$/);await expect(page.getByText(project,{exact:true}).first()).toBeVisible();
 const quoteUrl=page.url();await page.goto(quoteUrl+"/editar");await expect(page.getByRole("heading",{name:"Editar cotización",exact:true})).toBeVisible();await expect(page.getByLabel(/Gramos \*/)).toHaveValue("100.0");await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"docs/screenshots/quote-reference-filled-1440.png",fullPage:true});await page.getByRole("button",{name:"Guardar y emitir cotización",exact:true}).click();await expect(page).toHaveURL(quoteUrl);await expect(page.getByRole("button",{name:"Aceptar cotización",exact:true})).toBeVisible();await expect(page.getByText("Materiales y filamentos",{exact:true})).toBeVisible();await expect(page.locator(".quote-detail-price-grid .quote-detail-price")).toHaveCount(3);await expect(page.locator(".quote-commercial-total")).toContainText("$ 30.164");await page.screenshot({path:"docs/screenshots/quote-detail-sent-1440.png",fullPage:true});await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/quote-detail-sent-360.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.getByRole("button",{name:"Aceptar cotización",exact:true}).click();await expect(page.getByRole("button",{name:"Crear pedido",exact:true})).toBeVisible();const quoteId=page.url().split("/").at(-1)!;
 await page.goto("/pedidos/nuevo");await page.getByLabel("Proyecto *",{exact:true}).fill(project);await page.getByLabel("Cliente *",{exact:true}).selectOption({label:customer});await page.getByRole("button",{name:"Crear pedido",exact:true}).click();await expect(page).toHaveURL(/pedidos\/[0-9a-f-]+$/);
 await page.getByLabel("Cotización del cliente",{exact:true}).selectOption(quoteId);await expect(page.getByText("Costo estimado del producto",{exact:true})).toBeVisible();await expect(page.getByText("Precio cotizado al cliente",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Vincular a este pedido",exact:true}).click();await expect(page.getByRole("button",{name:"Iniciar impresión",exact:true})).toBeVisible();
 await page.locator("summary").filter({hasText:"Editar pedido y valores"}).click();await page.getByLabel("Costo del producto (COP) *",{exact:true}).fill("14000");await page.getByLabel("Precio acordado con el cliente (COP) *",{exact:true}).fill("40000");await page.getByLabel("Motivo del ajuste *",{exact:true}).fill("Acabado adicional acordado");await page.getByRole("button",{name:"Guardar valores",exact:true}).click();await expect(page.locator(".order-account-total")).toContainText("$ 40.000");await page.reload();await expect(page.locator(".order-account-total")).toContainText("$ 40.000");
 await page.screenshot({path:"docs/screenshots/order-detail-confirmed-1440.png",fullPage:true});await page.setViewportSize({width:360,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/order-detail-confirmed-360.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});
 const orderUrl=page.url();await page.getByRole("button",{name:"Iniciar impresión",exact:true}).click();await page.locator("summary").filter({hasText:"Registrar fallo"}).click();await expect(page.getByRole("button",{name:"Registrar fallo",exact:true})).toBeVisible();await page.getByLabel(/Motivo del fallo/).fill("Desprendimiento de la base");await page.getByRole("button",{name:"Registrar fallo",exact:true}).click();await expect(page.getByRole("button",{name:"Volver a imprimir",exact:true})).toBeVisible();await page.getByRole("button",{name:"Volver a imprimir",exact:true}).click();await expect(page.getByRole("button",{name:"Finalizar impresión",exact:true})).toBeVisible();await page.getByRole("button",{name:"Finalizar impresión",exact:true}).click();await expect(page.getByRole("button",{name:"Registrar entrega",exact:true})).toBeVisible();
 await expect(page.locator(".order-profit-metrics")).toContainText("$ 14.000");await expect(page.locator(".order-profit-metrics")).toContainText("$ 26.000");await expect(page.getByRole("button",{name:"Registrar costo",exact:true})).toHaveCount(0);await expect(page.getByRole("checkbox",{name:/costos incompletos/})).toHaveCount(0);
 await page.locator("summary").filter({hasText:"Registrar abono"}).click();await page.getByLabel(/Valor recibido/).fill("10000");await page.getByRole("button",{name:"Guardar abono",exact:true}).click();await expect(page.getByText(/10.000/).first()).toBeVisible();await expect(page.getByLabel(/Valor recibido/)).toHaveValue("");if(!await page.getByRole("button",{name:/Registrar saldo|Pagar saldo|Cobrar saldo/}).isVisible())await page.locator("summary").filter({hasText:"Registrar abono"}).click();await page.getByRole("button",{name:/Registrar saldo|Pagar saldo|Cobrar saldo/}).click();await expect(page.getByText("Pagado",{exact:true}).first()).toBeVisible();
 await page.getByLabel("Fecha real de entrega *",{exact:true}).fill("2026-10-04");await page.getByRole("button",{name:"Registrar entrega",exact:true}).click();await expect(page.getByText("Entregado",{exact:true}).first()).toBeVisible();expect(page.url()).toBe(orderUrl);await page.getByLabel("Fecha real de entrega *",{exact:true}).fill("2026-10-03");await page.getByRole("button",{name:"Guardar fecha de entrega",exact:true}).click();await expect(page.locator(".order-delivered-message")).toContainText("2026-10-03");await page.screenshot({path:"docs/screenshots/order-delivery-open.png",fullPage:true});await page.locator("summary").filter({hasText:"Cerrar pedido"}).click();await page.getByRole("checkbox",{name:/Cerrar definitivamente/}).check();await page.getByRole("button",{name:"Cerrar pedido",exact:true}).click();await expect(page.getByText("Pedido cerrado. Disponible solo para consulta.",{exact:true})).toBeVisible();await expect(page.locator(".order-status-timeline li")).toHaveCount(5);await expect(page.locator(".order-status-timeline li[aria-current=step]")).toContainText("Cerrado");await expect(page.locator(".order-detail-page form")).toHaveCount(0);await page.reload();await expect(page.getByText("Pedido cerrado. Disponible solo para consulta.",{exact:true})).toBeVisible();await page.screenshot({path:"docs/screenshots/order-delivery-closed.png",fullPage:true});await page.setViewportSize({width:360,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/order-delivery-closed-360.png",fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.goto("/pedidos?filter=closed");await expect(page.getByRole("row").filter({hasText:project})).toContainText("Cerrado");await page.goto("/finanzas");await expect(page.getByRole("heading",{name:"Finanzas",exact:true})).toBeVisible();await expect(page.locator(".finance-customers").getByRole("link",{name:new RegExp(customer)})).toBeVisible();await page.screenshot({path:"docs/screenshots/finance-desktop.png",fullPage:true});await page.goto("/cotizaciones?q="+encodeURIComponent(project)+"&filter=accepted");await expect(page.getByRole("row").filter({hasText:project})).toBeVisible();await expect(page.locator(".quotes-list-kpis article")).toHaveCount(4);await expect(page.getByRole("link",{name:/Descargar PDF COT-/})).toHaveAttribute("href",new RegExp(quoteId));await page.getByRole("button",{name:"Tarjetas",exact:true}).click();await expect(page.locator(".quotes-list-cards article").filter({hasText:project})).toBeVisible();await expect(page).toHaveURL(/filter=accepted/);await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(fieldWarnings).toEqual([]);
});


test("Inicio muestra ciclo completo y filtros sin desbordar",async({page})=>{
 await login(page);
 await page.setViewportSize({width:1440,height:1000});
 await expect(page.locator(".home-indicators article")).toHaveCount(4);
 await expect(page.locator(".home-cycle-grid>a")).toHaveCount(6);
 await expect(page.getByRole("heading",{name:"Cerrados",exact:true})).toBeVisible();
 await page.screenshot({path:"docs/screenshots/dashboard-reference-1440.png",fullPage:true});
 await page.getByRole("button",{name:"7 días",exact:true}).click();
 await expect(page).toHaveURL(/start=.*end=/);
 await expect(page.getByLabel("Desde",{exact:true})).not.toHaveValue("");
 await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"docs/screenshots/dashboard-reference-360.png",fullPage:true});
 await page.locator(".home-cycle-grid>a").filter({hasText:"Cerrados"}).click();
 await expect(page).toHaveURL(/pedidos\?filter=closed/);
});


test("Clientes: registro, búsqueda por teléfono, tarjetas y detalle",async({page})=>{
 await login(page);await page.goto("/clientes");
 await expect(page.locator(".customer-indicators article")).toHaveCount(4);
 const name="Cliente directorio "+Date.now();
 await page.getByLabel("Nombre *",{exact:true}).fill(name);
 await page.getByLabel("Teléfono",{exact:true}).fill("3107654321");
 await page.getByRole("button",{name:"Guardar cliente",exact:true}).click();
 await expect(page.getByRole("row").filter({hasText:name})).toBeVisible();
 await page.getByRole("textbox",{name:"Buscar clientes",exact:true}).fill("3107654321");
 await page.getByRole("button",{name:"Buscar",exact:true}).click();
 await expect(page.getByRole("row").filter({hasText:name})).toBeVisible();
 await expect(page.getByRole("row").filter({hasText:name}).getByRole("link",{name:"Abrir WhatsApp de "+name,exact:true})).toHaveAttribute("href","https://wa.me/573107654321");
 await page.getByRole("button",{name:"Tarjetas",exact:true}).click();
 await expect(page.locator(".customer-cards article").filter({hasText:name})).toBeVisible();
 await page.getByRole("combobox",{name:"Orden de clientes",exact:true}).selectOption("orders");
 await expect(page).toHaveURL(/sort=orders/);await expect(page).toHaveURL(/q=3107654321/);
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:"docs/screenshots/customers-reference-1440.png",fullPage:true});
 await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"docs/screenshots/customers-reference-360.png",fullPage:true});
 await page.locator(".customer-cards article").filter({hasText:name}).getByRole("link",{name:"Abrir cliente "+name,exact:true}).click();
 await expect(page).toHaveURL(/clientes\/[0-9a-f-]+$/);
 await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();
});


test("Filamentos: color, cálculo en vivo, filtros y vistas",async({page})=>{
 await login(page);await page.goto("/filamentos");
 await expect(page.locator(".filament-indicators article")).toHaveCount(4);
 const brand="Material prueba "+Date.now();
 await page.getByLabel("Marca *",{exact:true}).fill(brand);await page.getByLabel("Modelo *",{exact:true}).fill("Flexible");
 await page.getByLabel("Material *",{exact:true}).fill("TPU");await page.getByLabel("Color *",{exact:true}).fill("Azul");
 await page.getByLabel("Precio del rollo (COP) *",{exact:true}).fill("85000");await page.getByLabel("Peso del rollo (g) *",{exact:true}).fill("1000.5");
 await expect(page.locator(".filament-live-cost")).toContainText("85,0 COP/g");
 await page.getByRole("button",{name:"Guardar filamento",exact:true}).click();
 await expect(page.locator(".filament-catalog-cards article").filter({hasText:brand})).toBeVisible();
 await page.getByRole("combobox",{name:"Filtrar por material",exact:true}).selectOption("TPU");
 await expect(page).toHaveURL(/filter=TPU/);
 await page.getByRole("combobox",{name:"Orden de filamentos",exact:true}).selectOption("unit_asc");
 await expect(page).toHaveURL(/sort=unit_asc/);await expect(page).toHaveURL(/filter=TPU/);
 await page.getByRole("textbox",{name:"Buscar filamentos",exact:true}).fill(brand);await page.getByRole("button",{name:"Buscar",exact:true}).click();
 const card=page.locator(".filament-catalog-cards article").filter({hasText:brand});
 await expect(card.locator(".filament-color")).toContainText("Azul");await expect(card).toContainText("1.000,5 g");
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"docs/screenshots/filaments-reference-1440.png",fullPage:true});
 await page.getByRole("button",{name:"Tabla",exact:true}).click();await expect(page.getByRole("row").filter({hasText:brand})).toBeVisible();
 await page.getByRole("button",{name:"Tarjetas",exact:true}).click();await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/filaments-reference-360.png",fullPage:true});
 await card.getByRole("link",{name:"Abrir detalle",exact:true}).click();await expect(page).toHaveURL(/filamentos\/[0-9a-f-]+$/);
 await expect(page.getByRole("heading",{level:1})).toContainText(brand);
 await expect(page.getByLabel("Peso del rollo (g) *",{exact:true})).toHaveValue("1000.5");
 await page.getByLabel("Precio del rollo (COP) *",{exact:true}).fill("100050");
 await expect(page.locator(".filament-live-cost")).toContainText("100,0 COP/g");
 await page.getByRole("button",{name:"Guardar cambios",exact:true}).click();
 await expect(page.locator(".filament-detail-metrics")).toContainText("100,0 COP/g");
 await page.reload();
 await expect(page.getByLabel("Precio del rollo (COP) *",{exact:true})).toHaveValue("100050");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"docs/screenshots/filament-detail-reference-360.png",fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:"docs/screenshots/filament-detail-reference-1440.png",fullPage:true});
});


test("Gastos: clasificación, fechas, categorías y vista móvil",async({page})=>{
 await login(page);await page.goto("/gastos");
 await expect(page.locator(".expense-indicators article")).toHaveCount(4);
 const tag=Date.now(),description="Egreso prueba "+tag,category="Material "+tag;
 await page.getByLabel("Descripción *",{exact:true}).fill(description);
 await page.getByLabel("Clasificación *",{exact:true}).selectOption("material_purchase");
 await expect(page.getByLabel("Comportamiento *",{exact:true})).toHaveCount(0);
 await page.getByLabel("Categoría *",{exact:true}).fill(category);await page.getByLabel("Valor (COP) *",{exact:true}).fill("12000");
 await expect(page.locator(".expense-save-summary")).toContainText("$ 12.000");
 await page.getByRole("button",{name:"Guardar gasto",exact:true}).click();
 await expect(page.getByRole("row").filter({hasText:description})).toBeVisible();
 await page.getByRole("combobox",{name:"Filtrar por categoría",exact:true}).selectOption(category);await expect(page).toHaveURL(/filter=/);
 await page.getByRole("combobox",{name:"Orden de gastos",exact:true}).selectOption("amount_asc");await expect(page).toHaveURL(/sort=amount_asc/);
 await page.getByRole("textbox",{name:"Buscar gastos",exact:true}).fill(description);await page.getByRole("button",{name:"Buscar",exact:true}).click();
 await expect(page.getByRole("row").filter({hasText:description})).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:"docs/screenshots/expenses-reference-1440.png",fullPage:true});
 await page.getByRole("button",{name:"Tarjetas",exact:true}).click();await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:"docs/screenshots/expenses-reference-360.png",fullPage:true});
 await page.locator(".expense-cards article").filter({hasText:description}).getByRole("link",{name:"Abrir gasto "+description,exact:true}).click();await expect(page).toHaveURL(/gastos\/[0-9a-f-]+$/);
 await expect(page.getByRole("heading",{name:description,exact:true})).toBeVisible();
 const originalUrl=page.url();
 await expect(page.locator(".expense-audit")).toContainText("Registro creado");
 await expect(page.getByLabel("Comportamiento *",{exact:true})).toHaveCount(0);
 await page.getByLabel("Motivo de la corrección *",{exact:true}).fill("Reclasificación del gasto de prueba");
 await page.getByLabel("Clasificación *",{exact:true}).selectOption("opex");
 await page.getByLabel("Comportamiento *",{exact:true}).selectOption("variable");
 await page.getByLabel("Valor (COP) *",{exact:true}).fill("15000");
 await page.getByRole("button",{name:"Guardar corrección",exact:true}).click();
 await expect(page).not.toHaveURL(originalUrl);
 await expect(page.locator(".expense-detail-amount")).toContainText("$ 15.000");
 await expect(page.locator(".expense-audit")).toContainText("Corrección registrada");
 await expect(page.getByLabel("Comportamiento *",{exact:true})).toHaveValue("variable");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:"docs/screenshots/expense-detail-reference-360.png",fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:"docs/screenshots/expense-detail-reference-1440.png",fullPage:true});
 const correctedUrl=page.url();
 await page.getByRole("link",{name:"Ver registro original",exact:true}).click();
 await expect(page).toHaveURL(originalUrl);
 await expect(page.locator(".expense-record-state")).toContainText("Registro anulado");
 await expect(page.getByRole("button",{name:"Guardar corrección",exact:true})).toHaveCount(0);
 await page.goto(correctedUrl);
 await page.locator(".expense-detail-void summary").click();
 await page.getByLabel("Motivo de anulación *",{exact:true}).fill("Registro aislado para pruebas");
 await page.getByRole("button",{name:"Anular registro",exact:true}).click();
 await expect(page.locator(".expense-record-state")).toContainText("Registro anulado");
 await expect(page.locator(".expense-audit")).toContainText("Registro anulado");
});

test("Finanzas: período, pérdida, caja y diseño móvil",async({page})=>{
 const fieldWarnings:string[]=[];page.on("console",msg=>{if(msg.text().includes("uncontrolled FieldControl"))fieldWarnings.push(msg.text());});
 await login(page);await page.goto('/finanzas?start=2026-10-01&end=2026-10-05');
 await expect(page.getByRole('heading',{name:'Finanzas',exact:true})).toBeVisible();
 await expect(page.locator('.finance-kpis article')).toHaveCount(4);
 const description='Pérdida financiera prueba '+Date.now();
 const form=page.locator('.finance-loss-form');
 await form.getByLabel('Fecha *',{exact:true}).fill('2026-10-04');
 await form.getByLabel('Categoría *',{exact:true}).fill('Pruebas');
 await form.getByLabel('Descripción *',{exact:true}).fill(description);
 await form.getByLabel('Valor (COP) *',{exact:true}).fill('9001');
 await form.getByLabel('Fecha del desembolso (si se pagó)',{exact:true}).fill('2026-10-04');
 await form.getByLabel('Desembolso efectivo (COP, opcional)',{exact:true}).fill('8000');
 await form.getByRole('button',{name:'Registrar pérdida',exact:true}).click();
 await expect(page.locator('.financial-records article').filter({hasText:description})).toBeVisible();
 await expect(page.locator('.financial-records article').filter({hasText:description})).toContainText('$ 9.001');
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'docs/screenshots/finance-reference-1440.png',fullPage:true});
 await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/finance-reference-360.png',fullPage:true});
 await page.getByLabel('Desde',{exact:true}).fill('2026-09-01');
 await page.getByLabel('Hasta',{exact:true}).fill('2026-09-30');
 await page.getByRole('button',{name:'Aplicar período',exact:true}).click();
 await expect(page).toHaveURL(/start=2026-09-01&end=2026-09-30/);
 await expect(page.locator('.financial-records article').filter({hasText:description})).toHaveCount(0);
 await page.getByRole('button',{name:'Todo',exact:true}).click();
 await expect(page.locator('.financial-records article').filter({hasText:description})).toBeVisible();
 expect(fieldWarnings).toEqual([]);
});

test("Usuarios: creación, filtros, vistas y administración de acceso",async({page})=>{
 await login(page);await page.goto('/usuarios');
 await expect(page.getByRole('heading',{name:'Usuarios y permisos',exact:true})).toBeVisible();
 await expect(page.locator('.users-indicators article')).toHaveCount(4);
 await page.getByRole('row').filter({hasText:'Tu cuenta'}).getByRole('link',{name:'Gestionar acceso',exact:true}).click();
 await expect(page.locator('.user-last-admin')).toContainText('último administrador activo');
 await expect(page.getByRole('button',{name:'Desactivar acceso',exact:true})).toHaveCount(0);
 await page.goto('/usuarios');
 
 const tag=Date.now(),name='Operador prueba '+tag,email='operator-ui-'+tag+'@test.invalid';
 const form=page.locator('.user-create');
 await form.getByLabel('Nombre *',{exact:true}).fill(name);
 await form.getByLabel('Correo *',{exact:true}).fill(email);
 await form.getByLabel('Contraseña inicial *',{exact:true}).fill('PruebaOperador2026!');
 await form.getByRole('button',{name:'Crear usuario',exact:true}).click();
 await page.getByRole('textbox',{name:'Buscar usuarios',exact:true}).fill(name);
 await page.getByRole('button',{name:'Buscar',exact:true}).click();
 const row=page.getByRole('row').filter({hasText:email});await expect(row).toBeVisible();
 await page.getByRole('combobox',{name:'Filtrar por rol',exact:true}).selectOption('administrator');
 await expect(page.getByText('No hay usuarios con estos filtros',{exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Filtrar por rol',exact:true}).selectOption('operator');
 await expect(row).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'docs/screenshots/users-reference-1440.png',fullPage:true});
 await page.getByRole('button',{name:'Tarjetas',exact:true}).click();await page.setViewportSize({width:360,height:900});
 const card=page.locator('.users-cards article').filter({hasText:email});await expect(card).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/users-reference-360.png',fullPage:true});
 await card.getByRole('link',{name:'Gestionar acceso',exact:true}).click();await expect(page).toHaveURL(/usuarios\/[0-9a-f-]+$/);
 const renamed=name+' corregido';
 await page.getByLabel('Nombre *',{exact:true}).fill(renamed);
 await page.getByRole('button',{name:'Guardar nombre',exact:true}).click();
 await expect(page.getByRole('heading',{name:renamed,exact:true,level:1})).toBeVisible();
 await page.reload();await expect(page.getByLabel('Nombre *',{exact:true})).toHaveValue(renamed);
 await expect(page.locator('.user-detail-audit')).toContainText('Nombre actualizado');
 await page.setViewportSize({width:1440,height:1000});await expect(page.getByRole('heading',{name:renamed,exact:true,level:1})).toBeVisible();await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);await page.screenshot({path:'docs/screenshots/user-detail-reference-1440.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/user-detail-reference-360.png',fullPage:true});
 
 await page.getByRole('button',{name:'Desactivar acceso',exact:true}).click();
 await expect(page.getByRole('button',{name:'Reactivar acceso',exact:true})).toBeVisible();
 await page.goto('/usuarios');
 await page.getByRole('textbox',{name:'Buscar usuarios',exact:true}).fill(email);await page.getByRole('button',{name:'Buscar',exact:true}).click();
 await page.getByRole('combobox',{name:'Filtrar por acceso',exact:true}).selectOption('inactive');
 await expect(page.getByRole('row').filter({hasText:email})).toContainText('Desactivado');
});


test("Ajustes: parámetros, cálculo en vivo y guardados consecutivos",async({page})=>{
 const pageErrors:string[]=[];page.on("pageerror",error=>pageErrors.push(error.message));
 await login(page);await page.goto('/ajustes');
 await expect(page.getByRole('heading',{name:'Ajustes',exact:true})).toBeVisible();
 const energy=page.getByLabel('Energía (COP / kWh) *',{exact:true});
 const original=await energy.inputValue();
 const updated=String(Number(original)+10);
 await energy.fill(updated);
 await expect(page.locator('.settings-reference-metrics')).toContainText(new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(updated)));
 await page.getByRole('button',{name:'Guardar parámetros',exact:true}).first().click();
 await expect(page.getByRole('status')).toContainText('Parámetros guardados.');
 await page.reload();await expect(energy).toHaveValue(updated);
 await energy.fill(String(Number(original)+11));
 await page.getByRole('button',{name:'Guardar parámetros',exact:true}).last().click();
 await expect(page.getByRole('status')).toContainText('Parámetros guardados.');
 await energy.fill(original);
 await page.getByRole('button',{name:'Guardar parámetros',exact:true}).last().click();
 await expect(page.getByRole('status')).toContainText('Parámetros guardados.');
 await page.reload();await expect(energy).toHaveValue(original);
 await page.setViewportSize({width:1440,height:1000});
 await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
 await page.getByRole('heading',{name:'Ajustes',exact:true}).click();
 await page.screenshot({path:'docs/screenshots/settings-reference-1440.png',fullPage:true});
 await page.setViewportSize({width:360,height:900});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/settings-reference-360.png',fullPage:true});
 await page.getByLabel('Multiplicador mínimo *',{exact:true}).fill('0');
 expect(await page.getByLabel('Multiplicador mínimo *',{exact:true}).evaluate((input:HTMLInputElement)=>input.validity.rangeUnderflow)).toBe(true);
 await page.getByRole('button',{name:'Restablecer valores iniciales',exact:true}).click();
 await expect(page.getByLabel('Multiplicador mínimo *',{exact:true})).toHaveValue('2');
 await expect(page.getByRole('status')).toContainText('Guarda para aplicarlos.');
 expect(pageErrors).toEqual([]);
});


test("Estándar visual: encabezado y ubicación en todas las páginas",async({page})=>{
 test.setTimeout(180000);
 await login(page);
 const routes=["/dashboard","/pedidos","/cotizaciones","/clientes","/filamentos","/gastos","/finanzas","/usuarios","/ajustes","/perfil","/pedidos/nuevo","/cotizaciones/nueva"];
 for(const section of ['pedidos','cotizaciones','clientes','filamentos','gastos','usuarios']){
  await page.goto('/'+section);
  const href=await page.locator('a[href^="/'+section+'/"]').evaluateAll((links,section)=>links.map(link=>link.getAttribute('href')).find(href=>new RegExp('^/'+section+'/[0-9a-f-]{36}$').test(href??''))??null,section);
  expect(href,'Debe existir una ficha para revisar '+section).not.toBeNull();
  routes.push(href!);
  if(section==='cotizaciones')routes.push(href!+'/editar');
 }
 for(const route of routes){
  await page.setViewportSize({width:1440,height:1000});await page.goto(route);
  const header=page.locator('.app-page-header');
  await expect(header).toBeVisible();await expect(page.locator('h1')).toHaveCount(1);
  await expect(header.getByRole('navigation',{name:'Ubicación de página'})).toBeVisible();
  await expect(header.getByRole('link',{name:'Mi taller',exact:true})).toHaveAttribute('href','/dashboard');
  expect(await header.locator('h1').evaluate(el=>getComputedStyle(el).fontSize)).toBe('26px');
  expect(await header.locator('[aria-current=page]').evaluate(el=>getComputedStyle(el).fontSize)).toBe('12px');
  const contrast=await page.locator('[data-slot="badge"][data-status]').evaluateAll(elements=>elements.filter(el=>el.getClientRects().length).map(el=>{
   const css=getComputedStyle(el);const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);
   const luminance=(value:string)=>rgb(value).map(n=>n/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[0.2126,0.7152,0.0722][i],0);
   const a=luminance(css.color),b=luminance(css.backgroundColor);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  }));
  for(const ratio of contrast)expect(ratio,'Contraste de estado en '+route).toBeGreaterThanOrEqual(4.5);

  await header.locator('h1').click();
  const name=route.replaceAll('/','-').slice(1);
  await page.screenshot({path:'docs/screenshots/standard-'+name+'-1440.png',fullPage:true});
  await page.setViewportSize({width:360,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desbordamiento en '+route).toBe(true);
  await expect(header).toBeVisible();
  await page.screenshot({path:'docs/screenshots/standard-'+name+'-360.png',fullPage:true});
 }
});
