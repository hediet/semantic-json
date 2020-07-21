import { NamespacedName, Namespace } from "../NamespacedNamed";
import { JSONValue } from "../JSONValue";
import { fromEntries } from "../utils";
import { SerializerSystem } from "../serialization/SerializerSystem";
import {
	Serializer,
	sIntersectionMany,
	sUnionMany,
	sString,
	sNumber,
	sBoolean,
	sLiteral,
	sNull,
	sObject,
	sObjectProp,
	sArrayOf,
	sAny,
	sMap,
	SerializerOfKind,
} from "../serialization";

export class SchemaPackageDef {
	constructor(
		public readonly packageNs: Namespace,
		public readonly definitions: Record<string, SchemaDef>
	) {}

	public getUsedNamespaces(): Set<string> {
		const s = new Set<string>();
		for (const type of Object.values(this.definitions)) {
			type.collectUsedNamespaces(s);
		}
		return s;
	}

	public addToSerializerSystem(serializerSystem: SerializerSystem): void {
		for (const [defName, def] of Object.entries(this.definitions)) {
			const name = this.packageNs(defName);
			const serializer = def.toSerializer(serializerSystem);
			serializerSystem.defineSerializer(name, serializer);
		}
	}
}

type GenericSerializer = Serializer<AnnotatedJSON>;

export type AnnotatedJSON =
	| SpecificAnnotatedJSON
	| ObjectAnnotatedJSON
	| ArrayAnnotatedJSON
	| AbstractAnnotatedJSON
	| UnionAnnotatedJSON
	| AnyAnnotatedJSON;

abstract class SerializationResultBase {}

export class SpecificAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "specific";
	constructor(
		public readonly type: SerializerOfKind<"primitive" | "literal", any>,
		public readonly value: string | boolean | number | null
	) {
		super();
	}
}

export class AnyAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "any";
	constructor(
		public readonly type: SerializerOfKind<"any", any>,
		public readonly value: JSONValue
	) {
		super();
	}
}

export class ObjectAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "object";
	constructor(
		public readonly type: SerializerOfKind<"object" | "map", any>,
		public readonly properties: Record<string, AnnotatedJSON>
	) {
		super();
	}
}

export class ArrayAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "array";
	constructor(
		public readonly type: SerializerOfKind<"array", any>,
		public readonly items: AnnotatedJSON[]
	) {
		super();
	}
}

export class AbstractAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "abstract";
	constructor(
		public readonly type: SerializerOfKind<
			"delegation" | "intersection",
			any
		>,
		public readonly specificTypes: AnnotatedJSON[]
	) {
		super();
	}
}

export class UnionAnnotatedJSON extends SerializationResultBase {
	public readonly kind = "union";
	constructor(
		public readonly type: SerializerOfKind<"union", any>,
		public readonly possibilities: AnnotatedJSON[]
	) {
		super();
	}
}

export type SchemaDef =
	| UnionSchemaDef
	| IntersectionSchemaDef
	| StringSchemaDef
	| BooleanSchemaDef
	| NumberSchemaDef
	| AnySchemaDef
	| LiteralSchemaDef
	| NullSchemaDef
	| ObjectSchemaDef
	| MapSchemaDef
	| ArraySchemaDef
	| TypeRefDef;

export abstract class BaseSchemaDef {
	public abstract collectUsedNamespaces(set: Set<string>): void;
	public abstract toSerializer(
		serializerSystem: SerializerSystem
	): GenericSerializer;
}

export class TypeRefDef extends BaseSchemaDef {
	constructor(public readonly namespacedName: NamespacedName) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		set.add(this.namespacedName.namespace);
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		return serializerSystem.getOrInitializeEmptySerializer(
			this.namespacedName
		); // TODO refine
	}
}

export class UnionSchemaDef extends BaseSchemaDef {
	public readonly kind = "union";
	constructor(public readonly of: SchemaDef[]) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of this.of) {
			t.collectUsedNamespaces(set);
		}
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sUnionMany(
			this.of.map((t) => t.toSerializer(serializerSystem)),
			{ eager: false }
		);

		return base.refine<AnnotatedJSON>({
			class: UnionAnnotatedJSON,
			fromIntermediate: (i) => new UnionAnnotatedJSON(base, i),
			toIntermediate: notSupported,
		});
	}
}

export class IntersectionSchemaDef extends BaseSchemaDef {
	public readonly kind = "intersection";
	constructor(public readonly of: SchemaDef[]) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of this.of) {
			t.collectUsedNamespaces(set);
		}
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		throw new Error("Not implemented");
		/*return sIntersectionMany(
			this.of.map((t) => t.toSerializer(serializerSystem))
		);*/
	}
}

const notSupported = (): never => {
	throw new Error("Not supported");
};

export class StringSchemaDef extends BaseSchemaDef {
	public readonly kind = "string";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sString();
		return base.refine<AnnotatedJSON>({
			class: SpecificAnnotatedJSON,
			fromIntermediate: (s) => new SpecificAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class NumberSchemaDef extends BaseSchemaDef {
	public readonly kind = "number";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sNumber();
		return base.refine<AnnotatedJSON>({
			class: SpecificAnnotatedJSON,
			fromIntermediate: (s) => new SpecificAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class BooleanSchemaDef extends BaseSchemaDef {
	public readonly kind = "boolean";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sBoolean();
		return base.refine<AnnotatedJSON>({
			class: SpecificAnnotatedJSON,
			fromIntermediate: (s) => new SpecificAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class AnySchemaDef extends BaseSchemaDef {
	public readonly kind = "any";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sAny();
		return base.refine<AnnotatedJSON>({
			class: AnyAnnotatedJSON,
			fromIntermediate: (s) => new AnyAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class LiteralSchemaDef extends BaseSchemaDef {
	public readonly kind = "literal";

	constructor(public readonly value: string | number | boolean) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sLiteral(this.value);
		return base.refine<AnnotatedJSON>({
			class: SpecificAnnotatedJSON,
			fromIntermediate: (s) => new SpecificAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class NullSchemaDef extends BaseSchemaDef {
	public readonly kind = "null";

	public collectUsedNamespaces(set: Set<string>): void {}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sNull();
		return base.refine<AnnotatedJSON>({
			class: SpecificAnnotatedJSON,
			fromIntermediate: (s) => new SpecificAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class ObjectSchemaDef extends BaseSchemaDef {
	public readonly kind = "object";

	constructor(public readonly properties: Record<string, ObjectPropertyDef>) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const t of Object.values(this.properties)) {
			t.schema.collectUsedNamespaces(set);
		}
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sObject(
			fromEntries(
				Object.entries(this.properties).map(
					([propertyName, propertyInfo]) => [
						propertyName,
						sObjectProp({
							serializer: propertyInfo.schema.toSerializer(
								serializerSystem
							),
							optional: propertyInfo.optional,
							// TODO other props
						}),
					]
				)
			)
		);

		return base.refine<AnnotatedJSON>({
			class: ObjectAnnotatedJSON,
			fromIntermediate: (s) => new ObjectAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

export class ObjectPropertyDef {
	constructor(
		public readonly schema: SchemaDef,
		public readonly optional: boolean,
		public readonly defaultValue: JSONValue | undefined
	) {}
}

export class ArraySchemaDef extends BaseSchemaDef {
	public readonly kind = "array";

	constructor(public readonly itemSchema: SchemaDef) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		this.itemSchema.collectUsedNamespaces(set);
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sArrayOf(this.itemSchema.toSerializer(serializerSystem));
		return base.refine<AnnotatedJSON>({
			class: ArrayAnnotatedJSON,
			fromIntermediate: (s) => new ArrayAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}

/*
export class TupleSchemaDef extends BaseSchemaDef {
	public readonly kind = "tuple";

	constructor(
		public readonly entries: TupleEntryDef[],
		public readonly optionalEntries: OptionalTupleEntryDef[],
		public readonly additionalEntries?: TupleEntryDef
	) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		for (const e of this.entries) {
			e.type.collectUsedNamespaces(set);
		}
		for (const e of this.optionalEntries) {
			e.type.collectUsedNamespaces(set);
		}
	}

	public toSerializer(serializerSystem: SerializerSystem): SerializeT {}
}

export class TupleEntryDef {
	constructor(public readonly type: SchemaDef) {}
}

export class OptionalTupleEntryDef {
	constructor(
		public readonly type: SchemaDef,
		public readonly defaultValue: JSONValue | undefined
	) {}
}*/

export class MapSchemaDef extends BaseSchemaDef {
	public readonly kind = "map";

	constructor(public readonly valueType: SchemaDef) {
		super();
	}

	public collectUsedNamespaces(set: Set<string>): void {
		this.valueType.collectUsedNamespaces(set);
	}

	public toSerializer(serializerSystem: SerializerSystem): GenericSerializer {
		const base = sMap(this.valueType.toSerializer(serializerSystem));

		return base.refine<AnnotatedJSON>({
			class: ObjectAnnotatedJSON,
			fromIntermediate: (s) => new ObjectAnnotatedJSON(base, s),
			toIntermediate: notSupported,
		});
	}
}
