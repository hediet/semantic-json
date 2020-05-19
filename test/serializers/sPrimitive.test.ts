import { deepEqual } from "assert";
import { sString } from "../../src";
import { deserializeJson } from "../utils";

describe("sPrimitive", () => {
	describe("Deserialization", () => {
		it("Simple", () => {
			const result = deserializeJson(sString(), "myString");
			deepEqual(result.errors, []);
			deepEqual(result.value, "myString");
		});

		it("Deserialize String Error 1", () => {
			const result = deserializeJson(sString(), 1);
			deepEqual(result.errors, [
				{
					msg:
						'Expected a value of type "string", but got a value of type "number".',
					path: "",
				},
			]);
			deepEqual(result.value, undefined);
		});

		it("Deserialize String Error 2", () => {
			const result = deserializeJson(sString(), null);
			deepEqual(result.errors, [
				{
					msg: 'Expected a value of type "string", but got "null".',
					path: "",
				},
			]);
			deepEqual(result.value, undefined);
		});
	});

	describe("Serialization", () => {
		it("Serialize String", () => {
			const result = sString().serialize("myString");
			deepEqual(result, "myString");
		});
	});
});
