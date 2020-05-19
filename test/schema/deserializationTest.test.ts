import { sString, sArrayOf, DeserializeResult, sTypePackage } from "../../src";
import { SerializerSystem } from "../../src/serialization/SerializerSystem";
import { NamespacedName } from "../../src/NamespacedNamed";

describe("schema", () => {
	it("Test1", () => {
		const result = sTypePackage.deserialize({
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
		});

		const serializerSystem = new SerializerSystem();

		const pkg = result.value;
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

		console.log("test", JSON.stringify(result2, undefined, 4));
	});
});
