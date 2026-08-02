import { ExpressExtractor } from "./express-extractor";
import { FastApiExtractor } from "./fastapi-extractor";
import { BaseExtractor } from "./base-extractor";

export const extractors: BaseExtractor[] = [
  new ExpressExtractor(),
  new FastApiExtractor(),
  // Add other extractors here
];

export function getExtractor(framework: string): BaseExtractor | undefined {
  return extractors.find(e => e.framework === framework);
}
