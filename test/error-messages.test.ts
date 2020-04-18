import {
	sString,
	Serializer,
	sNumber,
	sObject,
	sObjectProp,
	sUnion,
	sBoolean,
	sLiteral,
} from "../src";
import { deepEqual } from "assert";
import { DeserializeContext } from "../src/serialization/Context";

function test(
	serializer: Serializer<any, any>,
	data: any,
	errorMessages: { msg: string; path: string }[]
) {
	const result = serializer.deserializeWithContext(
		data,
		DeserializeContext.Default
	);
	if (result.isOk) {
		throw new Error("Should error.");
	}
	deepEqual(
		result.errors.map(e => ({ msg: e.message, path: e.path.join("/") })),
		errorMessages
	);
}

describe("Error Messages", () => {
	it("sString", () => {
		test(sString, 0, [
			{ msg: "Expected a string, but got a number.", path: "" },
		]);
	});

	it("sNumber", () => {
		test(sNumber, "string", [
			{ msg: "Expected a number, but got a string.", path: "" },
		]);
	});

	it("sObject", () => {
		test(sObject({}), "string", [
			{ msg: "Expected an object, but got a string.", path: "" },
		]);

		test(
			sObject({
				prop1: sNumber,
			}),
			{
				prop1: "string",
			},
			[{ msg: "Expected a number, but got a string.", path: "prop1" }]
		);

		test(
			sObject({
				prop1: sNumber,
				prop2: sNumber,
				prop3: sNumber,
				prop4: sObjectProp({ serializer: sNumber, optional: true }),
			}),
			{ prop2: 0, prop5: 0 },
			[
				{ msg: 'Required property "prop1" is missing.', path: "" },
				{ msg: 'Required property "prop3" is missing.', path: "" },
				{
					msg: 'Property "prop5" is not expected here.',
					path: "prop5",
				},
			]
		);
	});

	describe("sUnion", () => {
		it("of sObject", () => {
			test(
				sUnion(
					sObject({
						prop1: sNumber,
					}),
					sObject({
						prop1: sBoolean,
					}),
					sString
				),
				{ prop1: "string" },
				[
					// prop1: Did expect a number or boolean, but got a string.
				]
			);

			test(
				sUnion(
					sObject({
						kind: sLiteral("kind1"),
						foo: sBoolean,
					}),
					sObject({
						kind: sLiteral("kind2"),
					})
				),
				{ kind: "kind1" },
				[
					// Required property "foo" is missing.
				]
			);
		});
	});
});
