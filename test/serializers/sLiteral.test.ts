import { deepEqual } from "assert";
import { sLiteral } from "../../src";
import { deserializeJson } from "../utils";

describe("sLiteral", () => {
	describe("Deserialization", () => {
		it("Simple", () => {
			const result = deserializeJson(sLiteral("myString"), "myString");
			deepEqual(result.errors, []);
			deepEqual(result.value, "myString");
		});

		it("Deserialize String Error 1", () => {
			const result = deserializeJson(sLiteral("myString"), 1);
			deepEqual(result.errors, [
				{
					msg:
						'Expected "myString", but got a value of type "number".',
					path: "",
				},
			]);
			deepEqual(result.value, undefined);
		});

		it("Deserialize String Error 2", () => {
			const result = deserializeJson(sLiteral("myString"), null);
			deepEqual(result.errors, [
				{
					msg: 'Expected "myString", but got "null".',
					path: "",
				},
			]);
			deepEqual(result.value, undefined);
		});
	});

	describe("Serialization", () => {
		it("Serialize String", () => {
			const result = sLiteral("myString").serialize("myString");
			deepEqual(result, "myString");
		});
	});
});
