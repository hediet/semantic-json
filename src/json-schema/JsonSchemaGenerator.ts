import { NamedSerializer, Serializer } from "..";
import { JsonSchema, JsonSchemaReference } from "./types";
import { fromEntries } from "../utils";

export class JsonSchemaGenerator {
	private readonly definitions = new Map<
		NamedSerializer<any>,
		{ ref: JsonSchemaReference; name: string; definition: JsonSchema }
	>();

	public getOrAddDef(s: NamedSerializer<any>): JsonSchemaReference {
		const existing = this.definitions.get(s);
		if (existing) {
			return existing.ref;
		}

		const def = {
			name: s.name.name,
			ref: { $ref: `#/definitions/${s.name.name}` },
			definition: undefined! as JsonSchema,
		};
		this.definitions.set(s, def);
		def.definition = this.getJsonSchema(s.underlyingSerializer);

		return def.ref;
	}

	public getJsonSchemaWithDefinitions(s: Serializer<any>): JsonSchema {
		const schema = this.getJsonSchema(s);
		return Object.assign(
			{
				definitions: fromEntries(
					[...this.definitions.values()].map((v) => [
						v.name,
						v.definition,
					])
				),
			},
			schema
		);
	}

	private getJsonSchema(s: Serializer<any>): JsonSchema {
		switch (s.kind) {
			case "any":
				return {};
			case "literal":
				return { enum: [s.value] };
			case "array":
				return {
					type: "array",
					items: this.getJsonSchema(s.itemSerializer),
				};
			case "union":
				const united = s.unitedSerializers.map((s) =>
					this.getJsonSchema(s)
				);

				return s.exclusive
					? {
							oneOf: united,
					  }
					: {
							anyOf: united,
					  };
			case "intersection":
				return {
					allOf: s.intersectedSerializers.map((s) =>
						this.getJsonSchema(s)
					),
				};
			case "primitive":
				return { type: s.primitive };
			case "object":
				return {
					type: "object",
					properties: fromEntries(
						s.propertiesList.map((p) => [
							p.name,
							this.getJsonSchema(p.serializer),
						])
					),
					required: s.propertiesList
						.filter((p) => !p.isOptional)
						.map((p) => p.name),
				};
			case "map":
				throw new Error("not implemented");

			case "delegation":
				if (
					s.delegationKind === "lazy" ||
					s.delegationKind === "refined"
				) {
					return this.getJsonSchema(s.underlyingSerializer);
				} else if (s.delegationKind === "named") {
					return this.getOrAddDef(s);
				}
			default:
				const n: never = s;
				throw new Error("Cannot happen");
		}
	}
}
