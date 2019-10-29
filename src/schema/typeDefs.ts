import { NamespacedName, namespace, Namespace } from "../NamespacedNamed";
import { JSONValue } from "../JSONValue";
import {
	sObject,
	sMap,
	sUnion,
	sLiteral,
	sRef,
	sBoolean,
	field,
	NamedSerializer,
	sArray,
	sNamespacedName,
	sNamespace,
} from "../serialization";
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
} from "./types";
import { deserializationValue } from "../result";

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
		return typeSystem.getType(this.namespacedName);
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
			Object.fromEntries(
				Object.entries(this.properties).map(
					([propertyName, propertyInfo]) => [
						propertyName,
						new ObjectProperty(
							propertyName,
							propertyInfo.type.toType(typeSystem),
							propertyInfo.optional,
							propertyInfo.defaultValue
						),
					]
				)
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

const typeDefinitionNs = namespace("json-types.org/type-definition");

const typeRef = sRef(() => sType);

const sUnionType = sObject({
	properties: {
		kind: sLiteral("union"),
		of: sArray(typeRef),
	},
})
	.refine<UnionTypeDef>({
		canSerialize: (val): val is UnionTypeDef => val instanceof UnionTypeDef,
		serialize: val => ({ kind: val.kind, of: val.of }),
		deserialize: val => deserializationValue(new UnionTypeDef(val.of)),
	})
	.defineAs(typeDefinitionNs("StringType"));

const sIntersectionType = sArray(typeRef)
	.refine<IntersectionTypeDef>({
		canSerialize: (val): val is IntersectionTypeDef =>
			val instanceof IntersectionTypeDef,
		serialize: val => val.of,
		deserialize: val => deserializationValue(new IntersectionTypeDef(val)),
	})
	.defineAs(typeDefinitionNs("IntersectionType"));

const sStringType = sObject({
	properties: {
		kind: sLiteral("string"),
	},
})
	.refine<StringTypeDef>({
		canSerialize: (val): val is StringTypeDef =>
			val instanceof StringTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new StringTypeDef()),
	})
	.defineAs(typeDefinitionNs("StringType"));

const sBooleanType = sObject({
	properties: {
		kind: sLiteral("boolean"),
	},
})
	.refine<BooleanTypeDef>({
		canSerialize: (val): val is BooleanTypeDef =>
			val instanceof BooleanTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new BooleanTypeDef()),
	})
	.defineAs(typeDefinitionNs("BooleanType"));

const sNumberType = sObject({
	properties: {
		kind: sLiteral("number"),
	},
})
	.refine<NumberTypeDef>({
		canSerialize: (val): val is NumberTypeDef =>
			val instanceof NumberTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new NumberTypeDef()),
	})
	.defineAs(typeDefinitionNs("NumberType"));

const sObjectProperty = sObject({
	properties: {
		type: typeRef,
		optional: field({
			serializer: sBoolean,
			optional: { withDefault: false },
		}),
	},
})
	.refine<ObjectPropertyDef>({
		canSerialize: (item): item is ObjectPropertyDef =>
			item instanceof ObjectPropertyDef,
		serialize: val => ({ type: val.type, optional: val.optional }),
		deserialize: val =>
			deserializationValue(
				new ObjectPropertyDef(val.type, val.optional, undefined)
			),
	})
	.defineAs(typeDefinitionNs("ObjectProperty"));

const sArrayType = sObject({
	properties: {
		kind: sLiteral("array"),
		of: typeRef,
	},
})
	.refine<ArrayTypeDef>({
		canSerialize: (item): item is ArrayTypeDef =>
			item instanceof ArrayTypeDef,
		serialize: val => ({ kind: val.kind, of: val.itemType }),
		deserialize: val => deserializationValue(new ArrayTypeDef(val.of)),
	})
	.defineAs(typeDefinitionNs("ArrayType"));

const sObjectType = sObject({
	properties: {
		kind: sLiteral("object"),
		properties: sMap(sObjectProperty),
	},
})
	.refine<ObjectTypeDef>({
		canSerialize: (val): val is ObjectTypeDef =>
			val instanceof ObjectTypeDef,
		serialize: val => ({ kind: val.kind, properties: val.properties }),
		deserialize: val =>
			deserializationValue(new ObjectTypeDef(val.properties)),
	})
	.defineAs(typeDefinitionNs("StringType"));

const sMapType = sObject({
	properties: {
		kind: sLiteral("map"),
		value: typeRef,
	},
})
	.refine<MapTypeDef>({
		canSerialize: (item): item is MapTypeDef => item instanceof MapTypeDef,
		serialize: val => ({ kind: val.kind, value: val.valueType }),
		deserialize: val => deserializationValue(new MapTypeDef(val.value)),
	})
	.defineAs(typeDefinitionNs("MapType"));

const sTypeRef = sNamespacedName
	.refine<TypeRefDef>({
		canSerialize: (val): val is TypeRefDef => val instanceof TypeRefDef,
		serialize: val => val.namespacedName,
		deserialize: val => deserializationValue(new TypeRefDef(val)),
	})
	.defineAs(typeDefinitionNs("TypeReference"));

const sType: NamedSerializer<
	| UnionTypeDef
	| IntersectionTypeDef
	| StringTypeDef
	| BooleanTypeDef
	| NumberTypeDef
	| ObjectTypeDef
	| MapTypeDef
	| ArrayTypeDef
	| TypeRefDef,
	any
> = sUnion(
	sUnionType,
	sIntersectionType,
	sStringType,
	sBooleanType,
	sNumberType,
	sObjectType,
	sMapType,
	sArrayType,
	sTypeRef
).defineAs(typeDefinitionNs("Type"));

export const sTypePackage = sObject({
	properties: {
		packageId: sNamespace,
		typeDefinitions: sMap(sType),
	},
})
	.refine<TypePackageDef>({
		canSerialize: (val): val is TypePackageDef =>
			val instanceof TypePackageDef,
		serialize: val => ({
			packageId: val.packageNs,
			typeDefinitions: val.definitions,
		}),
		deserialize: val =>
			deserializationValue(
				new TypePackageDef(val.packageId, val.typeDefinitions)
			),
	})
	.defineAs(typeDefinitionNs("TypeDefinitions"));
