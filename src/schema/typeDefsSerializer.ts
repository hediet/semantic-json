import {
	sRef,
	sObject,
	sLiteral,
	sArray,
	field,
	sBoolean,
	sMap,
	sNamespacedName,
	NamedSerializer,
	sUnion,
	sNamespace,
	sString,
	sNumber,
} from "../serialization";
import {
	UnionTypeDef,
	IntersectionTypeDef,
	StringTypeDef,
	BooleanTypeDef,
	NumberTypeDef,
	ObjectPropertyDef,
	ArrayTypeDef,
	ObjectTypeDef,
	MapTypeDef,
	TypeRefDef,
	TypePackageDef,
	AnyTypeDef,
	LiteralTypeDef,
} from "./typeDefs";
import { deserializationValue } from "../result";
import { namespace } from "../NamespacedNamed";

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

const sAnyType = sObject({
	properties: {
		kind: sLiteral("any"),
	},
})
	.refine<AnyTypeDef>({
		canSerialize: (val): val is AnyTypeDef => val instanceof AnyTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new AnyTypeDef()),
	})
	.defineAs(typeDefinitionNs("AnyType"));

const sLiteralType = sObject({
	properties: {
		kind: sLiteral("literal"),
		value: sUnion(sString, sNumber, sBoolean),
	},
})
	.refine<LiteralTypeDef>({
		canSerialize: (val): val is LiteralTypeDef =>
			val instanceof LiteralTypeDef,
		serialize: val => ({ kind: val.kind, value: val.value }),
		deserialize: val => deserializationValue(new LiteralTypeDef(val.value)),
	})
	.defineAs(typeDefinitionNs("BooleanType"));

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
	| AnyTypeDef
	| LiteralTypeDef
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
	sAnyType,
	sLiteralType,
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