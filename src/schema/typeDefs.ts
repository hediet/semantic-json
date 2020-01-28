import { NamespacedName, Namespace } from "../NamespacedNamed";
import { JSONValue } from "../JSONValue";
import {
	TypeSystem,
	Type,
	CustomType,
	UnionType,
	ArrayType,
	IntersectionType,
	StringType,
	NumberType,
	BooleanType,
	ObjectType,
	ObjectProperty,
	MapType,
	LiteralType,
	AnyType,
} from "./types";
import { fromEntries } from "../utils";

export class TypePackageDef {
	constructor(
		public readonly packageNs: Namespace,
		public readonly definitions: Record<string, TypeDef>
	) {}

	public getUsedNamespaces(): Set<string> {
		const s = new Set<string>();
		for (const type of Object.values(this.definitions)) {
			type.collectUsedNamespaces(s);
		}
		return s;
	}

	public addToTypeSystem(typeSystem: TypeSystem): void {
		for (const [defName, def] of Object.entries(this.definitions)) {
			const name = this.packageNs(defName);
			const typeDef = def.toType(typeSystem);
			typeSystem.defineType(name, typeDef);
		}
	}
}

export type TypeDef =
	| UnionTypeDef
	| IntersectionTypeDef
	| StringTypeDef
	| BooleanTypeDef
	| NumberTypeDef
	| AnyTypeDef
	| LiteralTypeDef
	| ObjectTypeDef
	| MapTypeDef
	| ArrayTypeDef
	| TypeRefDef;

export abstract class BaseTypeDef {
	public abstract collectUsedNamespaces(set: Set<string>): void;
	public abstract toType(typeSystem: TypeSystem): Type;
}

export class TypeRefDef extends BaseTypeDef {
	constructor(public readonly namespacedName: NamespacedName) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		set.add(this.namespacedName.namespace);
	}

	public toType(typeSystem: TypeSystem): Type {
		return typeSystem.getOrCreateType(this.namespacedName);
	}
}

export class CustomTypeDef extends BaseTypeDef {
	constructor(public readonly type: NamespacedName) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new CustomType(this.type);
	}
}

export class UnionTypeDef extends BaseTypeDef {
	public readonly kind = "union";
	constructor(public readonly of: TypeDef[]) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of this.of) {
			t.collectUsedNamespaces(set);
		}
	}

	public toType(typeSystem: TypeSystem): Type {
		return new UnionType(this.of.map(t => t.toType(typeSystem)));
	}
}

export class IntersectionTypeDef extends BaseTypeDef {
	public readonly kind = "intersection";
	constructor(public readonly of: TypeDef[]) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of this.of) {
			t.collectUsedNamespaces(set);
		}
	}

	public toType(typeSystem: TypeSystem): Type {
		return new IntersectionType(this.of.map(t => t.toType(typeSystem)));
	}
}

export class StringTypeDef extends BaseTypeDef {
	public readonly kind = "string";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export class NumberTypeDef extends BaseTypeDef {
	public readonly kind = "number";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new NumberType();
	}
}

export class BooleanTypeDef extends BaseTypeDef {
	public readonly kind = "boolean";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new BooleanType();
	}
}

export class AnyTypeDef extends BaseTypeDef {
	public readonly kind = "any";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new AnyType();
	}
}

export class LiteralTypeDef extends BaseTypeDef {
	public readonly kind = "literal";

	constructor(public readonly value: string | number | boolean) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {}

	public toType(typeSystem: TypeSystem): Type {
		return new LiteralType(this.value);
	}
}

export class ObjectTypeDef extends BaseTypeDef {
	public readonly kind = "object";

	constructor(public readonly properties: Record<string, ObjectPropertyDef>) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of Object.values(this.properties)) {
			t.type.collectUsedNamespaces(set);
		}
	}

	public toType(typeSystem: TypeSystem): Type {
		return new ObjectType(
			fromEntries(
				Object.entries(
					this.properties
				).map(([propertyName, propertyInfo]) => [
					propertyName,
					new ObjectProperty(
						propertyName,
						propertyInfo.type.toType(typeSystem),
						propertyInfo.optional,
						propertyInfo.defaultValue
					),
				])
			)
		);
	}
}

export class ObjectPropertyDef {
	constructor(
		public readonly type: TypeDef,
		public readonly optional: boolean,
		public readonly defaultValue: JSONValue | undefined
	) {}
}

export class ArrayTypeDef extends BaseTypeDef {
	public readonly kind = "array";

	constructor(public readonly itemType: TypeDef) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		this.itemType.collectUsedNamespaces(set);
	}

	public toType(typeSystem: TypeSystem): Type {
		return new ArrayType(this.itemType.toType(typeSystem));
	}
}

export class MapTypeDef extends BaseTypeDef {
	public readonly kind = "map";

	constructor(public readonly valueType: TypeDef) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		this.valueType.collectUsedNamespaces(set);
	}

	public toType(typeSystem: TypeSystem): Type {
		return new MapType(this.valueType.toType(typeSystem));
	}
}
