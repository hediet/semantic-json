import {
	sString,
	sArrayOf,
	DeserializeResult,
	sTypePackage,
	NamedSerializer,
	sObject,
	DeserializeError,
	Serializer,
	BaseSerializer,
} from "../../src";
import { SerializerSystem } from "../../src/serialization/SerializerSystem";
import { NamespacedName, namespace } from "../../src/NamespacedNamed";

abstract class Constraint {
	constructor() {
		if ((this as any).constructor.serializer === undefined) {
			throw new Error("Static `serializer` property must be set!");
		}
	}

	public abstract validate(value: unknown): ReadonlyArray<DeserializeError>;
}

const defaultConstraintNs = namespace("hediet.de/constraints");

class RegExConstraint extends Constraint {
	public static serializer = sObject({})
		.refine({
			class: RegExConstraint,
			fromIntermediate: (o) => new RegExConstraint(),
			toIntermediate: (o) => ({}),
		})
		.defineAs(defaultConstraintNs("RegExConstraint"));

	public validate(value: unknown): DeserializeError[] {
		return [];
	}
}

describe("schema", () => {
	it("Test1", () => {
		const pkg = sTypePackage
			.deserialize({
				$ns: {
					m: "myPkg",
				},
				packageId: "myPkg",
				schemaDefinitions: {
					ContactBook: {
						kind: "array",
						of: "m#Contact",
					},
					Contact: {
						kind: "object",
						properties: {
							firstname: { schema: { kind: "string" } },
							lastname: { schema: { kind: "string" } },
						},
					},
				},
			})
			.getValidValue();

		const serializerSystem = new SerializerSystem();
		pkg.addToSerializerSystem(serializerSystem);
		// TODO test refercening non existing definitions

		const contactSerializer = serializerSystem.getSerializer(
			new NamespacedName("myPkg", "ContactBook")
		)!;
		const result2 = contactSerializer.deserialize([
			{
				firstname: "test",
			},
		]);

		console.log(
			"test",
			JSON.stringify(
				result2,
				(key, value) =>
					value instanceof BaseSerializer ? value.toString() : value,
				4
			)
		);
	});
});
