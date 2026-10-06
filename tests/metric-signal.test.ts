import {expect, it} from "vitest";
import {metricSignal} from "@/lib/metric-signal";

it("distingue pérdida, utilidad y ausencia de base", () => {
  expect(metricSignal("netProfit", "-0.000001").tone).toBe("negative");
  expect(metricSignal("grossProfit", "100").tone).toBe("positive");
  expect(metricSignal("netProfit", "0").tone).toBe("neutral");
  expect(metricSignal("grossMargin", null)).toEqual({tone:"neutral", label:"Sin base"});
});
it("no trata la cartera pendiente ni la impresión activa como pérdidas", () => {
  expect(metricSignal("receivables", "12000").tone).toBe("warning");
  expect(metricSignal("receivables", "0").label).toBe("Sin saldo pendiente");
  expect(metricSignal("printing", "2").tone).toBe("info");
});
it("marca fallos existentes en rojo y ausencia de fallos en verde", () => {
  expect(metricSignal("damaged", "1").tone).toBe("negative");
  expect(metricSignal("damaged", "0")).toEqual({tone:"positive",label:"Sin fallos"});
  expect(metricSignal("finished", "0").tone).toBe("neutral");
});
it("distingue cobro parcial y equilibrio alcanzado sin inventar umbrales", () => {
  expect(metricSignal("collectionRate", "99.999999").tone).toBe("warning");
  expect(metricSignal("collectionRate", "100").tone).toBe("positive");
  expect(metricSignal("breakEvenProgress", "120").tone).toBe("positive");
  expect(metricSignal("directCosts", "10000").tone).toBe("neutral");
});
