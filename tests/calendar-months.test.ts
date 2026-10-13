import {describe,it,expect} from "vitest";
import {calendarMonthRange,previousMonth,presetRange} from "../src/lib/dates";
describe("Calendar months in Bogota",()=>{
 it("uses the first day through today for this month",()=>{expect(presetRange("current_month",new Date("2026-10-12T12:00:00Z"))).toEqual({start:"2026-10-01",end:"2026-10-12"});});
 it("uses the entire preceding month and handles year boundaries",()=>{expect(presetRange("previous_month",new Date("2026-01-12T12:00:00Z"))).toEqual({start:"2025-12-01",end:"2025-12-31"});expect(previousMonth("2026-01")).toBe("2025-12");});
 it("handles leap February and non leap February",()=>{expect(calendarMonthRange("2024-02",new Date("2026-10-12T12:00:00Z")).end).toBe("2024-02-29");expect(calendarMonthRange("2025-02",new Date("2026-10-12T12:00:00Z")).end).toBe("2025-02-28");});
 it("uses Bogota when UTC has moved into a new month",()=>{expect(presetRange("current_month",new Date("2026-11-01T04:00:00Z"))).toEqual({start:"2026-10-01",end:"2026-10-31"});});
 it("rejects invalid and future months",()=>{expect(()=>calendarMonthRange("2026-13")).toThrow();expect(()=>calendarMonthRange("2026-11",new Date("2026-10-12T12:00:00Z"))).toThrow();expect(()=>calendarMonthRange("bad")).toThrow();});
});
