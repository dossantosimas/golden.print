import {it,expect} from "vitest";
import {comparisonSignal} from "../src/lib/comparison-signal";
it("treats growing revenue, receipts, profit and net cash as improvements",()=>{for(const key of ["sales","receipts","netProfit","cashIn","cashNet"]){expect(comparisonSignal(key,"100").tone).toBe("positive");expect(comparisonSignal(key,"-100").tone).toBe("negative");}expect(comparisonSignal("netProfit","5176555").tone).toBe("positive");});
it("reverses costs, expenses, losses, cash outflows and receivables",()=>{for(const key of ["directCosts","opex","independentLosses","cashOut","receivables"]){expect(comparisonSignal(key,"-100").tone).toBe("positive");expect(comparisonSignal(key,"100").tone).toBe("negative");}});
it("keeps zero, missing and invalid comparisons neutral",()=>{for(const value of ["0","-0",undefined,null,"NaN","Infinity"]){expect(comparisonSignal("sales",value).tone).toBe("neutral");}expect(comparisonSignal("unknown","100").tone).toBe("neutral");});
