import { describe, it, expect } from "vitest";
import { __test as pubchemTest } from "@/convex/pubchem";

describe("pubchem getImageUrl builder", () => {
  it("builds base URL without params", () => {
    const url = pubchemTest.buildImageUrl("ethanol", "name");
    expect(url).toBe(
      "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/ethanol/PNG",
    );
  });

  it("adds record_type param", () => {
    const url = pubchemTest.buildImageUrl("CCO", "smiles", "3d");
    expect(url).toBe(
      "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/CCO/PNG?record_type=3d",
    );
  });

  it("adds image_size and record_type params", () => {
    const url = pubchemTest.buildImageUrl("2244", "cid", "2d", "300x300");
    expect(url).toBe(
      "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?record_type=2d&image_size=300x300",
    );
  });

  it("encodes identifier safely", () => {
    const url = pubchemTest.buildImageUrl("benzene ring", "name", "2d");
    expect(url).toBe(
      "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/benzene%20ring/PNG?record_type=2d",
    );
  });
});
