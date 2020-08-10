import {
	sObject,
	sString,
	sBoolean,
	sProp,
	ObjectSerializerImpl,
	Serializer,
	BaseSerializer,
} from "../../src";
import { deepEqual } from "assert";
import { deserializeJson } from "../utils";

describe("sObject", () => {
	const serializer = sObject({
		requiredStr: sString(),
		requiredBool: sBoolean(),
		optionalBool: sProp(sBoolean(), { optional: true }),
		strWithDefaultValue: sProp(sString(), {
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
	});
});
