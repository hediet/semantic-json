import {
	sObject,
	sString,
	sArrayOf,
	namespace,
	optionalProp,
	TypeScriptTypeGenerator,
	sTypePackage,
} from "../../src";
import { expect } from "chai";
import { equal, deepEqual } from "assert";
import { SerializerSystem } from "../../src/serialization/SerializerSystem";
import { SchemaPackageDef } from "../../src/schema/schemaDefs";

describe("demo", () => {
	it("Readme Demo 1", () => {
		const contactBook = sArrayOf(
			sObject({
				firstName: sString(),
				lastName: sString(),
				city: optionalProp(sString(), {
					description: "The city where the contact lives in.",
				}),
			}),
			{ minLength: 1 }
		);

		expect(() => {
			const value = contactBook
				.deserialize([{ firstName: "Test" }])
				// getValidValue throws and complains that "lastName" is missing.
				.getValidValue();
			// value is of type { firstName: string, lastName: string, city?: string }[]
			console.log(value[0].firstName, value[0].lastName);
		}).to.throw();
	});

	it("Readme Demo 2", () => {
		const myNs = namespace("demo.org");

		const contactBook = sArrayOf(
			sObject({
				firstName: sString(),
				lastName: sString(),
				city: optionalProp(sString(), {
					description: "The city where the contact lives in.",
				}),
			}).defineAs(myNs("Contact"))
		).defineAs(myNs("ContactBook"));

		const ts = new SerializerSystem();

		contactBook.toSchema(ts);

		const packages = ts.getDefinedPackages();
		/*
		deepEqual(packages, [
			{
				$ns: { p1: "demo.org" },
				packageId: "demo.org",
				schemaDefinitions: {
					ContactBook: { kind: "array", of: "p1#Contact" },
					Contact: {
						kind: "object",
						properties: {
							firstName: {
								schema: { kind: "string" },
								optional: false,
							},
							lastName: {
								schema: { kind: "string" },
								optional: false,
							},
							city: {
								schema: { kind: "string" },
								optional: true,
							},
						},
					},
				},
			},
		]);
*/

		/*
		console.log(
			JSON.stringify(
				ts.getDefinedPackages().map((p) => sTypePackage.serialize(p))
			)
		);*/
	});

	it("Readme Demo 3", () => {
		const myNs = namespace("demo.org");

		const contactBook = sArrayOf(
			sObject({
				firstName: sString(),
				lastName: sString(),
				city: optionalProp(sString(), {
					description: "The city where the contact lives in.",
				}),
			}).defineAs(myNs("Contact"))
		).defineAs(myNs("ContactBook"));

		const ts = new SerializerSystem();

		const g = new TypeScriptTypeGenerator();
		const tsType = g.getType(contactBook);
		equal(tsType, "ContactBook");

		if (false) {
			// TODO

			equal(
				g.getDefinitionSource(),
				`type ContactBook = (Contact)[];

type Contact = {
	firstName: string;
    lastName: string;
    /**
     * The city where the contact lives in.
     */
    city?: string;
};`
			);
		}
	});
});
