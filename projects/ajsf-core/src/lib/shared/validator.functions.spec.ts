import {
  toIsoString,
  toJavaScriptType,
  toSchemaType,
} from "./validator.functions";

describe("Validator functions", () => {
  describe("toIsoString", () => {
    it("should work with timezone", () => {
      expect(toIsoString(new Date("05 October 2011 14:48 UTC"))).toEqual(
        "2011-10-05"
      );
    });
  });
  describe("toJavaScriptType", () => {
    it("Converts an input (probably string) value to a JavaScript primitive type 'string', 'number', 'boolean', or 'null' - before storing in a JSON object.", () => {
      expect(toJavaScriptType("10", "number")).toEqual(10);
      expect(toJavaScriptType("10", "integer")).toEqual(10);
      expect(toJavaScriptType(10, "integer")).toEqual(10);
      expect(toJavaScriptType(10, "string")).toEqual("10");
      expect(toJavaScriptType("10.5", "integer")).toEqual(null);
      expect(toJavaScriptType(10.5, "integer")).toEqual(null);
    });
  });
  describe("toSchemaType", () => {
    it("Number conversion examples", () => {
      expect(toSchemaType(10, ["number", "integer", "string"])).toEqual(10);
      expect(toSchemaType(10, ["number", "string"])).toEqual(10);
      expect(toSchemaType(10, ["string"])).toEqual("10");
      expect(toSchemaType(10.5, ["number", "integer", "string"])).toEqual(10.5);
      expect(toSchemaType(10.5, ["integer", "string"])).toEqual("10.5");
      expect(toSchemaType(10.5, ["integer"])).toEqual(10);
    });
    it("Boolean conversion examples", () => {
      expect(
        toSchemaType("1", ["integer", "number", "string", "boolean"])
      ).toEqual("1");
      expect(toSchemaType("1", ["string", "boolean"])).toEqual("1");
      expect(toSchemaType("1", ["boolean"])).toEqual("1");
      expect(toSchemaType("true", ["number", "string", "boolean"])).toEqual(
        "true"
      );
      expect(toSchemaType("true", ["boolean"])).toEqual("true");
      expect(toSchemaType("true", ["number"])).toEqual(0);
    });
    it("string conversion examples", () => {
      expect(
        toSchemaType("1.58", ["boolean", "number", "integer", "string"])
      ).toEqual("1.58");
      expect(toSchemaType("1.5", ["boolean", "number", "integer"])).toEqual(
        "1.5"
      );
    });
  });
});
