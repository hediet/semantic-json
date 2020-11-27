import { sUnion, sString, sNumber, sObject, sLiteral } from "../../src";
import { deserializeJson } from "../utils";
import { deepEqual } from "assert";

describe("sUnion", () => {
	class MyStringValue {
		constructor(public readonly value: string) {}

		toString() {
			return `MyStringValue:${this.value}`;
		}
	}

	class MyNumberValue {
		constructor(public readonly value: number) {}

		toString() {
			return `MyNumberValue:${this.value}`;
		}
	}

	class ObjWrapper {
		constructor(
			public readonly tag: string,
			public readonly value: string
		) {}

		toString() {
			return `${this.tag}:${this.value}`;
		}
	}

	const serializer = sUnion([
		sString().refine({
			class: MyStringValue,
			fromIntermediate: (str) => new MyStringValue(str),
			toIntermediate: (val) => val.value,
		}),
		sNumber().refine({
			class: MyNumberValue,
			fromIntermediate: (str) => new MyNumberValue(str),
			toIntermediate: (val) => val.value,
		}),
		sObject({
			tag: sLiteral("tag1"),
			t1Prop: sString(),
		}).refine({
			class: ObjWrapper,
			fromIntermediate: (val) => new ObjWrapper("1", val.t1Prop),
			toIntermediate: (val) => ({ tag: "tag1", t1Prop: val.value }),
			canSerializeInstance: (val) => val.tag === "1",
		}),
		sObject({
			tag: sLiteral("tag2"),
			t2Prop: sString(),
		}).refine({
			class: ObjWrapper,
			fromIntermediate: (val) => new ObjWrapper("2", val.t2Prop),
			toIntermediate: (val) => ({ tag: "tag2", t2Prop: val.value }),
			canSerializeInstance: (val) => val.tag === "2",
		}),
	]);

	describe("Deserialization", () => {
		it("First Union Case", () => {
			const result = deserializeJson(serializer, "myString");
			deepEqual(result.errors, []);
			deepEqual(result.value.toString(), "MyStringValue:myString");
		});

		it("Second Union Case", () => {
			const result = deserializeJson(serializer, 1337);
			deepEqual(result.errors, []);
			deepEqual(result.value.toString(), "MyNumberValue:1337");
		});

		it("tag1", () => {
			const result = deserializeJson(serializer, {
				tag: "tag1",
				t1Prop: "myString",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value.toString(), "1:myString");
		});

		it("tag2", () => {
			const result = deserializeJson(serializer, {
				tag: "tag2",
				t2Prop: "myString",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value.toString(), "2:myString");
		});

		/*
		All alternatives failed to deserialize the value:
			In "/": Required property "t1Prop" is missing.
		Or
			in "/tag": Expected "tag4", "tag5" or "tag6", but got "tag1".
		Or
			in "/": Expected a value of type "string" or "number", but got a value of type "object".
				
		*/

		it("tag2 error", () => {
			const result = deserializeJson(serializer, { tag: "tag1" });
			deepEqual(result.errors, [
				{
					msg: "No serializer could deserialize the value",
					path: "",
					alternatives: [
						{
							alternativeId: "0",
							errors: [
								{
									msg:
										'Expected a value of type "string", but got a value of type "object".',
									path: "",
								},
							],
						},
						{
							alternativeId: "1",
							errors: [
								{
									msg:
										'Expected a value of type "number", but got a value of type "object".',
									path: "",
								},
							],
						},
						{
							alternativeId: "2",
							errors: [
								{
									msg:
										'Required property "t1Prop" is missing.',
									path: "",
								},
							],
						},
						{
							alternativeId: "3",
							errors: [
								{
									msg: 'Expected "tag2", but got "tag1".',
									path: "tag",
								},
								{
									msg:
										'Required property "t2Prop" is missing.',
									path: "",
								},
							],
						},
					],
				},
			]);
		});
	});

	describe("Serialization", () => {
		it("First Union Case", () => {
			const result = serializer.serialize(new MyStringValue("myString"));
			deepEqual(result, "myString");
		});

		it("Second Union Case", () => {
			const result = serializer.serialize(new MyNumberValue(1337));
			deepEqual(result, 1337);
		});

		it("tag1", () => {
			const result = serializer.serialize(new ObjWrapper("1", "foo"));
			deepEqual(result, { tag: "tag1", t1Prop: "foo" });
		});

		it("tag2", () => {
			const result = serializer.serialize(new ObjWrapper("2", "foo"));
			deepEqual(result, { tag: "tag2", t2Prop: "foo" });
		});
	});
});
