import {it,expect} from "vitest";
import {summarizeExpensePayers,includeExpensePayers} from "../src/lib/expense-payers";
it("groups by actual funding source, not by company record responsible",()=>{
 const rows=summarizeExpensePayers([{fundingSource:"company",responsibleUserId:"a",amount:"100",classification:"opex"},{fundingSource:"company",responsibleUserId:"b",amount:"200",classification:"material_purchase"},{fundingSource:"user",responsibleUserId:"a",responsibleName:"Ana",amount:"50",classification:"opex"},{fundingSource:"user",responsibleUserId:"b",responsibleName:"Luis",amount:"75",classification:"material_purchase"}]);
 expect(rows.find(row=>row.id==="company")).toMatchObject({total:"300",operating:"100",materials:"200",count:2});expect(rows.find(row=>row.id==="user:a")?.total).toBe("50");expect(rows.find(row=>row.id==="user:b")?.total).toBe("75");
});
it("excludes voided records and preserves replacement totals",()=>{const rows=summarizeExpensePayers([{fundingSource:"company",amount:"999",classification:"opex",voidedAt:"2026-10-25"},{fundingSource:"user",responsibleUserId:"a",amount:"80",classification:"opex"}]);expect(rows).toHaveLength(1);expect(rows[0].total).toBe("80");});
it("includes company and all users with zero totals without duplicating payers",()=>{const rows=includeExpensePayers([{id:"user:a",name:"Old",count:1,total:"10",operating:"10",materials:"0"}],[{id:"a",name:"Ana"},{id:"b",name:"Luis"}]);expect(rows.map(row=>row.name)).toEqual(["Empresa","Ana","Luis"]);expect(rows[1].total).toBe("10");expect(rows[2].total).toBe("0");});
