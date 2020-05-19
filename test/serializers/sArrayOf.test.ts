import { deepEqual } from "assert";
import { sString, sArrayOf, DeserializeResult } from "../../src";
import { deserializeJson } from "../utils";

describe("sArrayOf", () => {
	const serializer = sArrayOf(
		sString().refine<{ val: string }>({
			canSerialize: (item): item is { val: string } => true,
			fromIntermediate: (s) => DeserializeResult.fromValue({ val: s }),
			toIntermediate: ({ val }) => val,
		})
	);

	describe("Deserialization", () => {
		it("Simple", () => {
			const result = deserializeJson(serializer, [
				"myString1",
				"myString2",
			]);
			deepEqual(result.errors, []);
			deepEqual(result.value, [
				{ val: "myString1" },
				{ val: "myString2" },
			]);
		});

		it("Top Level Type Mismatch", () => {
			const result = deserializeJson(serializer, 1);
			deepEqual(result.errors, [
				{
					msg:
						'Expected a value of type "array", but got a value of type "number".',
					path: "",
				},
			]);
			deepEqual(result.value, undefined);
		});

		it("Item Error", () => {
			const result = deserializeJson(serializer, [1, "myString", 3]);
			deepEqual(result.errors, [
				{
					msg:
						'Expected a value of type "string", but got a value of type "number".',
					path: "0",
				},
				{
					msg:
						'Expected a value of type "string", but got a value of type "number".',
					path: "2",
				},
			]);
			deepEqual(result.value, [
				undefined,
				{ val: "myString" },
				undefined,
			]);
		});
	});

	describe("Serialization", () => {
		it("Serialize Array", () => {
			const result = serializer.serialize([{ val: "myString" }]);
			deepEqual(result, ["myString"]);
		});
	});
});
