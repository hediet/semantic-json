import { sObject, sString, sBoolean, prop, sOpenObject } from "../../src";
import { deepEqual } from "assert";
import { deserializeJson } from "../utils";

describe("sObject", () => {
	const serializer = sObject({
		requiredStr: sString(),
		requiredBool: sBoolean(),
		optionalBool: prop(sBoolean(), { optional: true }),
		strWithDefaultValue: prop(sString(), {
			optional: { withDefault: "myDefault" },
		}),
	});

	describe("Deserialization", () => {
		it("No Error", () => {
			const result = deserializeJson(serializer, {
				requiredStr: "test",
				requiredBool: true,
			});
			deepEqual(result.errors, []);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "myDefault",
			});
		});

		it("Override default", () => {
			const result = deserializeJson(serializer, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "overriden",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "overriden",
			});
		});

		it("Missing Properties", () => {
			const result = deserializeJson(serializer, {});
			deepEqual(result.errors, [
				{
					msg: 'Required property "requiredStr" is missing.',
					path: "",
				},
				{
					msg: 'Required property "requiredBool" is missing.',
					path: "",
				},
			]);
			deepEqual(result.value, {
				strWithDefaultValue: "myDefault",
			});
		});

		it("Unexpected Property", () => {
			const result = deserializeJson(serializer, {
				requiredStr: "test",
				requiredBool: true,
				unexpectedProp: "unexpected",
			});
			deepEqual(result.errors, [
				{
					msg: 'Unexpected property "unexpectedProp"',
					path: "unexpectedProp",
				},
			]);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "myDefault",
			});
		});

		it("Unexpected Property (Disabled)", () => {
			const result = deserializeJson(serializer, {
				$ignoreUnexpectedProperties: true,
				requiredStr: "test",
				requiredBool: true,
				unexpectedProp: "unexpected",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "myDefault",
			});
		});

		it("Unexpected Property In Open Object", () => {
			const result = deserializeJson(serializer.opened(), {
				requiredStr: "test",
				requiredBool: true,
				unexpectedProp: "unexpected",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: true,
				strWithDefaultValue: "myDefault",
				unexpectedProp: "unexpected",
			});
		});

		it("Error in property", () => {
			const result = deserializeJson(serializer, {
				requiredStr: "test",
				requiredBool: 1,
			});
			deepEqual(result.errors, [
				{
					msg:
						'Expected a value of type "boolean", but got a value of type "number".',
					path: "requiredBool",
				},
			]);
			deepEqual(result.value, {
				requiredStr: "test",
				requiredBool: undefined,
				strWithDefaultValue: "myDefault",
			});
		});
	});

	describe("Serialization", () => {
		it("Should serialize correctly", () => {
			const json = serializer.serialize({
				requiredBool: true,
				requiredStr: "test",
				strWithDefaultValue: "myDefault",
			});
			deepEqual(json, {
				requiredBool: true,
				requiredStr: "test",
				strWithDefaultValue: "myDefault",
			});
		});

		it("serializes unknown properties", () => {
			const serializer = sOpenObject<any>({
				knownObject: sObject({ foo: sString() }),
			}, { allowUnknownProperties: true });

			const json = serializer.serialize({
				knownObject: { foo: 'a', bar: 'b' },
				baz: 'c'
			});

			deepEqual(json, {
				knownObject: { foo: 'a' },
				baz: 'c'
			});
		});
	});
});
