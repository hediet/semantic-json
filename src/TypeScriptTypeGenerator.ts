import { Serializer, NamedSerializer } from "./serialization";

export class TypeScriptDefinition {
	public get definingType(): string {
		return this._definingType.value;
	}

	constructor(
		public readonly name: string,
		private readonly _definingType: { value: string }
	) {}

	public getDefinitionSource(options: { exported: boolean }): string {
		const exportStr = options.exported ? "export " : "";
		return `${exportStr}type ${this.name} = ${this.definingType};`;
	}
}

export class TypeScriptTypeGenerator {
	private readonly _definitions = new Map<
		NamedSerializer<any>,
		TypeScriptDefinition
	>();

	public readonly definitions: ReadonlyMap<
		NamedSerializer<any>,
		TypeScriptDefinition
	> = this._definitions;

	public getDefinitionSource(
		options: { exported: boolean } = { exported: false }
	): string {
		return [...this._definitions.values()]
			.map((d) => d.getDefinitionSource(options))
			.join("\n\n");
	}

	public getOrAddDef(s: NamedSerializer<any>): string {
		const existing = this._definitions.get(s);
		if (existing) {
			return existing.name;
		}

		function capitalize(str: string) {
			if (str.length === 0) {
				return "";
			}
			return str[0].toUpperCase() + str.substr(1);
		}

		const defVal = {
			value: undefined! as string,
		};
		const def = new TypeScriptDefinition(capitalize(s.name.name), defVal);
		this._definitions.set(s, def);
		defVal.value = `${this.getType(s.underlyingSerializer)}`;

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
				return `{${s.propertiesList
					.map((prop) => {
						const indent = `\n${"\t".repeat(indentation + 1)}`;
						let result = `${indent}${prop.name}${
							prop.isOptional ? "?" : ""
						}: ${this._getType(prop.serializer, indentation + 1)};`;
						if (prop.description) {
							const lines = prop.description.split("\n");
							result = `${indent}/**${lines.map(
								(l) => `${indent} * ${l}`
							)}${indent} */${result}`;
						}
						return result;
					})
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
