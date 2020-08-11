import { BaseSerializer, Serializer, NamedSerializer } from "./serialization";

export class TypeScriptTypeGenerator {
	private readonly definitions = new Map<
		NamedSerializer<any>,
		{ name: string; definition: string }
	>();

	public getDefinitionSource(): string {
		return [...this.definitions.values()]
			.map((d) => d.definition)
			.join("\n\n");
	}

	public getOrAddDef(s: NamedSerializer<any>): string {
		const existing = this.definitions.get(s);
		if (existing) {
			return existing.name;
		}

		function capitalize(str: string) {
			if (str.length === 0) {
				return "";
			}
			return str[0].toUpperCase() + str.substr(1);
		}

		const def = {
			name: capitalize(s.name.name),
			definition: undefined! as string,
		};
		this.definitions.set(s, def);
		def.definition = `type ${def.name} = ${this.getType(
			s.underlyingSerializer
		)};`;

		return def.name;
	}

	public getType(s: Serializer<any>): string {
		return this._getType(s, 0);
	}

	private _getType(s: Serializer<any>, indentation: number): string {
		switch (s.kind) {
			case "any":
				return "any";
			case "literal":
				return JSON.stringify(s.value);
			case "array":
				return `(${this._getType(s.itemSerializer, indentation)})[]`;
			case "union":
				return s.unitedSerializers
					.map((s) => this._getType(s, indentation))
					.join(" | ");
			case "intersection":
				return s.intersectedSerializers
					.map((s) => this._getType(s, indentation))
					.join(" & ");
			case "primitive":
				return s.primitive;
			case "object":
				return `{${Object.entries(s.properties)
					.map(
						([k, v]) =>
							`\n${"\t".repeat(indentation + 1)}${k}${
								v.isOptional ? "?" : ""
							}: ${this._getType(v.serializer, indentation + 1)};`
					)
					.join("")}\n${"\t".repeat(indentation)}}`;
			case "map":
				return `Record<string, ${this._getType(
					s.valueSerializer,
					indentation
				)}>`;
			case "delegation":
				if (
					s.delegationKind === "lazy" ||
					s.delegationKind === "refined"
				) {
					return this._getType(s.underlyingSerializer, indentation);
				} else if (s.delegationKind === "named") {
					return this.getOrAddDef(s);
				}
			default:
				const n: never = s;
				throw new Error("Cannot happen");
		}
	}
}