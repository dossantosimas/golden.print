import {describe,it,expect} from "vitest";
import {equilibrium,averageMonths,projectCurrentMonth,monthOffset} from "../src/lib/finance-projections";
describe("Monthly projections",()=>{
 it("uses contribution margin and fixed costs to find equilibrium",()=>{const result=equilibrium({sales:"1000",variableCosts:"600",fixedCosts:"200"});expect(result.target).toBe("500.000000");expect(result.progress).toBe("200.000000");expect(result.gap).toBe("0.000000");expect(result.reached).toBe(true);});
 it("does not invent equilibrium for no sales or negative contribution",()=>{expect(equilibrium({sales:"0",fixedCosts:"100"}).target).toBeNull();expect(equilibrium({sales:"100",variableCosts:"150",fixedCosts:"100"}).target).toBeNull();});
 it("handles zero fixed costs without division by zero",()=>{const result=equilibrium({sales:"100",variableCosts:"50",fixedCosts:"0"});expect(result.target).toBe("0.000000");expect(result.progress).toBeNull();expect(result.reached).toBe(true);});
 it("includes inactive months in the baseline average",()=>{expect(averageMonths([{sales:"300",fixedCosts:"30"},{sales:"0"},{sales:"0"}]).sales).toBe("100.000000");expect(()=>averageMonths([])).toThrow();});
 it("projects sales and variable costs while preserving known fixed costs",()=>{const result=projectCurrentMonth({sales:"1400",variableCosts:"700",fixedCosts:"600",cashNet:"140"},{fixedCosts:"300"},"2026-10-14");expect(result.sales).toBe("3100.000000");expect(result.variableCosts).toBe("1550.000000");expect(result.fixedCosts).toBe("600.000000");expect(result.netProfit).toBe("950.000000");expect(result.cashNet).toBe("310.000000");});
 it("uses the full-month fixed baseline and leap-month duration",()=>{const result=projectCurrentMonth({sales:"100",fixedCosts:"10"},{fixedCosts:"200"},"2024-02-01");expect(result.days).toBe(29);expect(result.fixedCosts).toBe("200.000000");expect(monthOffset("2026-01",-1)).toBe("2025-12");expect(monthOffset("2026-12",1)).toBe("2027-01");});
});
