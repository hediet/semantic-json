import {
	sLazy,
	sObject,
	sLiteral,
	prop,
	sBoolean,
	sMap,
	sNamespacedName,
	sUnion,
	sString,
	sNumber,
	sArrayOf,
	Serializer,
	NamedSerializer,
	optionalProp,
} from "../serialization";
import {
	UnionSchemaDef,
	IntersectionSchemaDef,
	StringSchemaDef,
	BooleanSchemaDef,
	NumberSchemaDef,
	ObjectPropertyDef,
	ArraySchemaDef,
	ObjectSchemaDef,
	MapSchemaDef,
	SchemaRefDef,
	SchemaPackageDef,
	AnySchemaDef,
	LiteralSchemaDef,
	NullSchemaDef,
	SchemaDef,
} from "./schemaDefs";
import { namespace } from "../NamespacedNamed";

const SchemaDefinitionNs = namespace("json-types.org/type-definition");

const typeRef = sLazy(() => sSchemaDef);

const sUnionType = sObject({
	kind: sLiteral("union"),
	of: sArrayOf(typeRef),
})
	.refine({
		class: UnionSchemaDef,
		fromIntermediate: (val) => new UnionSchemaDef(val.of),
		toIntermediate: (val) => ({ kind: val.kind, of: val.of }),
	})
	.defineAs(SchemaDefinitionNs("UnionType"));

const sIntersectionType = sArrayOf(typeRef)
	.refine<IntersectionSchemaDef>({
		class: IntersectionSchemaDef,
		fromIntermediate: (val) => new IntersectionSchemaDef(val),
		toIntermediate: (val) => val.of,
	})
	.defineAs(SchemaDefinitionNs("IntersectionType"));

const sStringType = sObject({
	kind: sLiteral("string"),
})
	.refine<StringSchemaDef>({
		class: StringSchemaDef,
		fromIntermediate: (val) => new StringSchemaDef(),
		toIntermediate: (val) => ({ kind: val.kind }),
	})
	.defineAs(SchemaDefinitionNs("StringType"));

const sBooleanType = sObject({
	kind: sLiteral("boolean"),
})
	.refine<BooleanSchemaDef>({
		class: BooleanSchemaDef,
		fromIntermediate: (val) => new BooleanSchemaDef(),
		toIntermediate: (val) => ({ kind: val.kind }),
	})
	.defineAs(SchemaDefinitionNs("BooleanType"));

const sNumberType = sObject({
	kind: sLiteral("number"),
})
	.refine<NumberSchemaDef>({
		class: NumberSchemaDef,
		fromIntermediate: (val) => new NumberSchemaDef(),
		toIntermediate: (val) => ({ kind: val.kind }),
	})
	.defineAs(SchemaDefinitionNs("NumberType"));

const sAnyType = sObject({
	kind: sLiteral("any"),
})
	.refine({
		class: AnySchemaDef,
		fromIntermediate: (val) => new AnySchemaDef(),
		toIntermediate: (val) => ({ kind: val.kind }),
	})
	.defineAs(SchemaDefinitionNs("AnyType"));

const sLiteralType = sObject({
	kind: sLiteral("literal"),
	value: sUnion([sString(), sNumber(), sBoolean()]),
})
	.refine({
		class: LiteralSchemaDef,
		fromIntermediate: (val) => new LiteralSchemaDef(val.value),
		toIntermediate: (val) => ({ kind: val.kind, value: val.value }),
	})
	.defineAs(SchemaDefinitionNs("LiteralType"));

const sNullType = sObject({
	kind: sLiteral("null"),
})
	.refine<NullSchemaDef>({
		class: NullSchemaDef,
		fromIntermediate: (val) => new NullSchemaDef(),
		toIntermediate: (val) => ({ kind: val.kind }),
	})
	.defineAs(SchemaDefinitionNs("LiteralType"));

const sObjectProperty = sObject({
	schema: typeRef,
	optional: prop(sBoolean(), {
		optional: { withDefault: false },
	}),
})
	.refine<ObjectPropertyDef>({
		class: ObjectPropertyDef,
		fromIntermediate: (val) =>
			new ObjectPropertyDef(val.schema, val.optional, undefined),
		toIntermediate: (val) => ({
			schema: val.schema,
			optional: val.optional,
		}),
	})
	.defineAs(SchemaDefinitionNs("ObjectProperty"));

const sArrayOfType = sObject({
	kind: sLiteral("array"),
	minLength: optionalProp(sNumber()),
	maxLength: optionalProp(sNumber()),
	of: typeRef,
})
	.refine<ArraySchemaDef>({
		class: ArraySchemaDef,
		fromIntermediate: (val) =>
			new ArraySchemaDef(val.of, val.minLength, val.maxLength),
		toIntermediate: (val) => ({ kind: val.kind, of: val.itemSchema }),
	})
	.defineAs(SchemaDefinitionNs("ArrayType"));

const sObjectType = sObject({
	kind: sLiteral("object"),
	properties: sMap(sObjectProperty),
})
	.refine<ObjectSchemaDef>({
		class: ObjectSchemaDef,
		fromIntermediate: (val) => new ObjectSchemaDef(val.properties),
		toIntermediate: (val) => ({
			kind: val.kind,
			properties: val.properties,
		}),
	})
	.defineAs(SchemaDefinitionNs("ObjectType"));

const sMapType = sObject({
	kind: sLiteral("map"),
	valueType: typeRef,
})
	.refine<MapSchemaDef>({
		class: MapSchemaDef,
		fromIntermediate: (val) => new MapSchemaDef(val.valueType),
		toIntermediate: (val) => ({ kind: val.kind, valueType: val.valueType }),
	})
	.defineAs(SchemaDefinitionNs("MapType"));

const sTypeRef = sNamespacedName()
	.refine({
		class: SchemaRefDef,
		fromIntermediate: (val) => new SchemaRefDef(val),
		toIntermediate: (val) => val.namespacedName,
	})
	.defineAs(SchemaDefinitionNs("TypeReference"));

export const sSchemaDef: NamedSerializer<SchemaDef> = sUnion([
	sUnionType,
	sIntersectionType,
	sStringType,
	sBooleanType,
	sNumberType,
	sAnyType,
	sLiteralType,
	sNullType,
	sObjectType,
	sMapType,
	sArrayOfType,
	sTypeRef,
]).defineAs(SchemaDefinitionNs("Type"));

export const sTypePackage = sObject({
	packageId: sString(),
	schemaDefinitions: sMap(sSchemaDef),
})
	.refine<SchemaPackageDef>({
		class: SchemaPackageDef,
		toIntermediate: (val) => ({
			packageId: val.packageNs.namespace,
			schemaDefinitions: val.definitions,
		}),
		fromIntermediate: (val) =>
			new SchemaPackageDef(
				namespace(val.packageId),
				val.schemaDefinitions
			),
	})
	.defineAs(SchemaDefinitionNs("SchemaDefinitions"));
