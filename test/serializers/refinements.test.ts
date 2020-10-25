import { deepEqual } from "assert";
import { sLiteral, sObject, sString } from "../../src";
import { deserializeJson } from "../utils";

describe("Refinement", () => {
	it("works", () => {
		const result = deserializeJson(
			sObject({ foo: sString(), bar: sString() }).refine({
				fromIntermediate: ({ foo, bar }) => {
					return "intermediate";
				},
				toIntermediate: (val) => ({ foo: "test", bar: "test" }),
				canSerialize: (val): val is any => true,
			}),
			{ foo: "test", bar: "test" }
		);
		deepEqual(result.errors, []);
		deepEqual(result.value, "intermediate");
	});

	it("Does not refine on error", () => {
		const result = deserializeJson(
			sObject({ foo: sString(), bar: sString() }).refine({
				fromIntermediate: ({ foo, bar }) => {
					throw new Error("Must not be called");
					return undefined;
				},
				toIntermediate: (val) => ({ foo: "test", bar: "test" }),
				canSerialize: (val): val is any => true,
			}),
			{ foo: "test" }
		);
		deepEqual(result.errors, [
			{
				msg: 'Required property "bar" is missing.',
				path: "",
			},
		]);
		deepEqual(result.value, undefined);
	});
});
