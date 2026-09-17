import demoJson from "@/lib/data/demo.json";
import { DemoDataset } from "@/lib/data/types";

/**
 * The single point where lib/data/demo.json is read and validated. Everything else
 * (MockDataSource, lib/access/*) imports the already-validated `dataset` from here —
 * never the raw JSON file directly — so a shape drift fails loudly at import time
 * instead of silently producing `undefined`s three components deep.
 */
export const dataset: DemoDataset = DemoDataset.parse(demoJson);
