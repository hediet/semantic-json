import { StringType, BooleanType } from "../../src/types/primitiveTypes";
import { ObjectType, ObjectProperty } from "../../src/types/ObjectType";
import { deepEqual } from "assert";
import { Type } from "../../src/types";
import { LiteralType } from "../../src/types/LiteralType";
import { UnionType } from "../../src/types/UnionType";
import { IntersectionType } from "../../src/types/IntersectionType";
import { ValidationError } from "../../src";
import { ValidationContext } from "../../src/types/BaseType";

interface ErrorMessage {
	msg: string;
	path: string;
	errorAlternatives?: {
		alternativeId: string;
		errors: ErrorMessage[];
	}[];
}

function testValidationError(
	type: Type<any>,
	data: any,
	errorMessages: ErrorMessage[]
) {
	const result = type.validate(data, new ValidationContext());
	if (result.isOk) {
		throw new Error("Should error.");
	}

	function mapValidationError(e: ValidationError): ErrorMessage {
		return {
			msg: e.message,
			path: e.path.join("/"),
			...(e.errorAlternatives.length > 0
				? {
						errorAlternatives: e.errorAlternatives.map((a) => ({
							alternativeId: a.alternativeId,
							errors: a.errors.map(mapValidationError),
						})),
				  }
				: {}),
		};
	}

	deepEqual(result.errors.map(mapValidationError), errorMessages);
}

describe("Validation Error Messages", () => {
	it("string", () => {
		testValidationError(new StringType(), 4, [
			{
				msg: "Expected a string, but got a number.",
				path: "",
			},
		]);

		testValidationError(new LiteralType(5), 4, [
			{
				msg: 'Expected "5" but got "4".',
				path: "",
			},
		]);
	});

	it("object", () => {
		const objType = ObjectType.from({
			foo: new StringType(),
		});

		testValidationError(objType, {}, [
			{
				msg: 'Required property "foo" is missing.',
				path: "",
			},
		]);

		testValidationError(objType, { foo: 1 }, [
			{
				msg: "Expected a string, but got a number.",
				path: "foo",
			},
		]);

		testValidationError(objType, { foo: "test", bar: 1 }, [
			{
				msg: 'Property "bar" is not expected here.',
				path: "bar",
			},
		]);
	});

	it("union", () => {
		const type = UnionType.from(
			ObjectType.from({
				kind: new LiteralType("kind1"),
				foo: new BooleanType(),
			}),
			ObjectType.from({
				kind: new LiteralType("kind2"),
			}),
			ObjectType.from({
				kind: new LiteralType("kind3"),
				bla: new BooleanType(),
				foo: new BooleanType(),
			})
		);

		// ((A | X) & B) | C
		/*
		testValidationError(type, { foo: true, kind: "kind2" }, [
			// Expected "kind1" or "kind3", but got "kind2".
		]);

		testValidationError(type, {}, [
			// Property "kind" is missing.
		]);

		testValidationError(type, { kind: "kind4" }, [
			// Expected "kind1" or "kind2", but got "kind4".
		]);

		testValidationError(type, { kind: "kind1" }, [
			// Required property "foo" is missing.
		]);*/

		testValidationError(type, { kind: "kind2", foo: true }, [
			{
				msg: "No type could validate the given value",
				path: "",
				errorAlternatives: [
					{
						alternativeId: "0",
						errors: [
							{
								msg: 'Expected "kind1" but got "kind2".',
								path: "kind",
							},
						],
					},
					{
						alternativeId: "1",
						errors: [
							{
								msg: 'Property "foo" is not expected here.',
								path: "foo",
							},
						],
					},
					{
						alternativeId: "2",
						errors: [
							{
								msg: 'Expected "kind3" but got "kind2".',
								path: "kind",
							},
							{
								msg: 'Required property "bla" is missing.',
								path: "",
							},
						],
					},
				],
			},
		]);
	});

	it("fast union", () => {
		const u1 = ObjectType.from({
			u1: new LiteralType(true),
		});

		const u2 = ObjectType.from({
			u2: new LiteralType(true),
		});

		const u1u2 = ObjectType.from({
			u1: new LiteralType(true),
			u2: new LiteralType(true),
		});
	});

	it("intersection", () => {
		testValidationError(
			IntersectionType.from(
				ObjectType.from({
					foo: new StringType(),
				}),
				ObjectType.from({
					bar: new StringType(),
				})
			),
			{ foo: "", bar: "", baz: "" },
			[
				{
					msg: 'Property "bar" is not expected here.',
					path: "bar",
				},
				{
					msg: 'Property "baz" is not expected here.',
					path: "baz",
				},
				{
					msg: 'Property "foo" is not expected here.',
					path: "foo",
				},
				{
					msg: 'Property "baz" is not expected here.',
					path: "baz",
				},
			]
		);
	});

	it("intersection debug visualizer", () => {
		const text = ObjectType.from({
			kind: ObjectType.from({
				text: new LiteralType(true),
			}),
			text: new StringType(),
		});

		const svg = IntersectionType.from(
			text,
			ObjectType.from({
				kind: ObjectType.from({
					svg: new LiteralType(true),
				}),
			})
		);

		const validTypes = UnionType.from(text, svg);
	});
});
