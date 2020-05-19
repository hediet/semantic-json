import {
	Serializer,
	ObjectSerializerImpl,
	IntersectionSerializerImpl,
	JSONValue,
	sObject,
	sString,
	sNumber,
	sNamespacedName,
	DeserializeError,
} from "../src";
import { deepEqual, equal } from "assert";
import { namespace } from "../src/NamespacedNamed";

function test<T>(s: Serializer<T>, input: JSONValue) {
	const r = s.deserialize(input);
	console.log(r);
}

it("object", () => {
	test(
		sObject({
			p1: sString(),
			p2: sString(),
		}),
		{
			p1: "test",
			p2: 4,
			p3: "",
		}
	);
});

it("intersection", () => {
	/*	test(
		sIntersect(
			sObject({
				p1: sString(),
				p2: sNumber(),
			}),
			sObject({
				p1: sString(),
				p3: sNumber(),
			})
		),
		{
			p1: "test",
			p2: 4,
			p3: "",
			p4: 0,
		}
	);*/
});
