import {test, expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

test("los formularios de creación se limpian al guardar y conservan datos si hay error", async ({page}) => {
 const credentials=JSON.parse(await readFile(".runtime/e2e-credentials.json","utf8"));
 await page.goto("/login");
 await page.getByLabel("Correo electrónico",{exact:true}).fill(credentials.email);
 await page.getByLabel("Contraseña",{exact:true}).fill(credentials.password);
 await page.getByRole("button",{name:"Iniciar sesión",exact:true}).click();
 await expect(page).toHaveURL(/dashboard/);
 const tag=Date.now();
 const warnings:string[]=[];
 page.on("console",m=>{if(m.text().includes("uncontrolled FieldControl"))warnings.push(m.text());});

 await page.goto("/clientes");
 const customer=page.locator("#nuevo-cliente form");
 for(const suffix of ["A","B"]){
  const name=`Cliente reset ${tag} ${suffix}`;
  await customer.getByLabel("Nombre *",{exact:true}).fill(name);
  await customer.getByLabel("Teléfono *",{exact:true}).fill("3001234567");
  await customer.getByLabel("Notas / Preferencias",{exact:true}).fill("Una nota");
  await customer.getByRole("button",{name:"Guardar cliente",exact:true}).click();
  await expect(customer.getByRole("status")).toHaveText("Guardado correctamente.");
  await expect(customer.getByLabel("Nombre *",{exact:true})).toHaveValue("");
  await expect(customer.getByLabel("Teléfono *",{exact:true})).toHaveValue("");
  await expect(customer.getByLabel("Notas / Preferencias",{exact:true})).toHaveValue("");
  await expect(page.getByRole("row").filter({hasText:name})).toBeVisible();
 }

 await page.goto("/filamentos");
 const filament=page.locator("form").filter({has:page.getByRole("button",{name:"Guardar filamento",exact:true})});
 await filament.getByLabel("Marca *",{exact:true}).fill(`Marca reset ${tag}`);
 await filament.getByLabel("Modelo *",{exact:true}).fill("Prueba");
 await filament.getByLabel("Material *",{exact:true}).fill("PETG");
 await filament.getByLabel("Color *",{exact:true}).fill("Rojo");
 await filament.getByLabel("Precio del rollo (COP) *",{exact:true}).fill("90000");
 await filament.getByLabel("Peso del rollo (g) *",{exact:true}).fill("750");
 await filament.getByRole("button",{name:"Guardar filamento",exact:true}).click();
 await expect(filament.getByRole("status")).toHaveText("Guardado correctamente.");
 await expect(filament.getByLabel("Marca *",{exact:true})).toHaveValue("");
 await expect(filament.getByLabel("Color *",{exact:true})).toHaveValue("");
 await expect(filament.getByLabel("Material *",{exact:true})).toHaveValue("PLA");
 await expect(filament.getByLabel("Peso del rollo (g) *",{exact:true})).toHaveValue("1000.0");
 await expect(filament.locator(".filament-live-cost strong")).toHaveText("—");

 await page.goto("/gastos");
 const expense=page.locator("form").filter({has:page.getByRole("button",{name:"Guardar gasto",exact:true})});
 const date=await expense.getByLabel("Fecha *",{exact:true}).inputValue();
 await expense.getByLabel("Descripción *",{exact:true}).fill(`Compra reset ${tag}`);
 await expense.getByLabel("Clasificación *",{exact:true}).selectOption("material_purchase");
 await expense.getByLabel("Categoría *",{exact:true}).fill("Materiales");
 await expense.getByLabel("Valor (COP) *",{exact:true}).fill("90000");
 await expense.getByRole("button",{name:"Guardar gasto",exact:true}).click();
 await expect(expense.getByRole("status")).toHaveText("Guardado correctamente.");
 await expect(expense.getByLabel("Descripción *",{exact:true})).toHaveValue("");
 await expect(expense.getByLabel("Valor (COP) *",{exact:true})).toHaveValue("");
 await expect(expense.getByLabel("Fecha *",{exact:true})).toHaveValue(date);
 await expect(expense.getByLabel("Clasificación *",{exact:true})).toHaveValue("opex");
 await expect(expense.getByLabel("Comportamiento *",{exact:true})).toHaveValue("fixed");
 await expect(expense.locator(".expense-save-summary strong")).toHaveText("—");

 await page.goto("/usuarios");
 const user=page.locator(".user-create form");
 await user.getByLabel("Nombre *",{exact:true}).fill(`Usuario reset ${tag}`);
 await user.getByLabel("Correo *",{exact:true}).fill(credentials.email);
 await user.getByLabel("Contraseña inicial *",{exact:true}).fill("PruebaReset2026!");
 await user.getByRole("button",{name:"Crear usuario",exact:true}).click();
 await expect(user.getByText("No se pudo guardar",{exact:true})).toBeVisible();
 await expect(user.getByLabel("Nombre *",{exact:true})).toHaveValue(`Usuario reset ${tag}`);
 await expect(user.getByLabel("Contraseña inicial *",{exact:true})).toHaveValue("PruebaReset2026!");
 await user.getByLabel("Correo *",{exact:true}).fill(`reset-${tag}@golden-print.test`);
 await user.getByRole("button",{name:"Crear usuario",exact:true}).click();
 await expect(user.getByRole("status")).toHaveText("Guardado correctamente.");
 await expect(user.getByLabel("Nombre *",{exact:true})).toHaveValue("");
 await expect(user.getByLabel("Correo *",{exact:true})).toHaveValue("");
 await expect(user.getByLabel("Contraseña inicial *",{exact:true})).toHaveValue("");
 await expect(user.getByLabel("Rol *",{exact:true})).toHaveValue("operator");

 await page.goto("/finanzas");
 const loss=page.locator(".finance-loss-form form");
 await loss.getByLabel("Categoría *",{exact:true}).fill("Pruebas");
 await loss.getByLabel("Descripción *",{exact:true}).fill(`Pérdida reset ${tag}`);
 await loss.getByLabel("Valor (COP) *",{exact:true}).fill("1000");
 await loss.getByRole("button",{name:"Registrar pérdida",exact:true}).click();
 await expect(loss.getByRole("status")).toHaveText("Guardado correctamente.");
 await expect(loss.getByLabel("Categoría *",{exact:true})).toHaveValue("");
 await expect(loss.getByLabel("Descripción *",{exact:true})).toHaveValue("");
 await expect(loss.getByLabel("Valor (COP) *",{exact:true})).toHaveValue("");
 expect(warnings).toEqual([]);
});
