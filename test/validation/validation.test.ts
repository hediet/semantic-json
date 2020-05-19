import { StringType, BooleanType } from "../../src/types/primitiveTypes";
import { ObjectType, ObjectProperty } from "../../src/types/ObjectType";
import { LiteralType } from "../../src/types/LiteralType";
import { UnionType } from "../../src/types/UnionType";
import { IntersectionType } from "../../src/types/IntersectionType";
import { ValidationError } from "../../src";
import { testValidation, t } from "./TypeMap";

describe("Validation", () => {
	it("string", () => {
		testValidation(
			t("T1", new StringType()),
			"",
			{
				kind: "specific",
				type: "T1",
			},
			t
		);
	});

	it("object", () => {
		testValidation(
			t(
				"T1",
				ObjectType.from({
					foo: t("T2", new StringType()),
				})
			),
			{ foo: "myStr" },
			{
				kind: "object",
				properties: {
					foo: {
						kind: "specific",
						type: "T2",
					},
				},
				type: "T1",
			},
			t
		);
	});
});
