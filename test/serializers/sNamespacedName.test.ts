import { sObject, sNamespacedName } from "../../src";
import { equal, deepEqual } from "assert";
import { namespace } from "../../src/NamespacedNamed";
import { testSerialize, deserializeJson } from "../utils";

describe("sNamespacedName", () => {
	const serializer = sObject({
		name: sNamespacedName(),
	});

	describe("Deserialization", () => {
		it("Simple 1", () => {
			const result = deserializeJson(serializer, {
				$ns: { p: "myNamespace" },
				name: "p#myName",
			});
			deepEqual(result.errors, []);
			deepEqual(result.value.name.toString(), "myNamespace#myName");
		});

		it("Error on Undefined Prefix", () => {
			const result = deserializeJson(serializer, {
				$ns: { p: "myNamespace" },
				name: "p2#myName",
			});
			deepEqual(result.errors, [
				{
					msg: 'Prefix "p2" is not defined.',
					path: "name",
				},
			]);
			equal(result.value.name, undefined);
		});

		it("Error on Malformed Name", () => {
			const result = deserializeJson(serializer, {
				name: "p2",
			});
			deepEqual(result.errors, [
				{
					msg: 'Namespaced name must match the regex "(.*)#(.*)".',
					path: "name",
				},
			]);
			deepEqual(result.value.name, undefined);
		});
	});

	describe("Serialization", () => {
		it("Simple 1", () => {
			const result = serializer.serialize({
				name: namespace("myNamespace")("myName"),
			});
			deepEqual(result, {
				$ns: {
					p1: "myNamespace",
				},
				name: "p1#myName",
			});
		});

		it("Simple 2", () => {
			const myNamespace1 = namespace("myNamespace2");
			const myNamespace2 = namespace("myNamespace1");

			const result = sObject({
				name1: sNamespacedName(),
				name2: sNamespacedName(),
				name3: sNamespacedName(),
				subObj: sObject({
					name1: sNamespacedName(),
				}),
			}).serialize({
				name1: myNamespace1("myName1"),
				name2: myNamespace2("myName2"),
				name3: myNamespace1("myName3"),
				subObj: {
					name1: myNamespace2("myName3"),
				},
			});

			deepEqual(result, {
				$ns: {
					p1: "myNamespace2",
					p2: "myNamespace1",
				},
				name1: "p1#myName1",
				name2: "p2#myName2",
				name3: "p1#myName3",
				subObj: {
					name1: "p2#myName3",
				},
			});
		});
	});
});
