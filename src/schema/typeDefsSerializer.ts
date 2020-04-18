import {
	sRef,
	sObject,
	sLiteral,
	sArray,
	sObjectProp,
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
	NullTypeDef,
	TypeDef,
} from "./typeDefs";
import { deserializationValue } from "../BaseDeserializationResult";
import { namespace } from "../NamespacedNamed";

const typeDefinitionNs = namespace("json-types.org/type-definition");

const typeRef = sRef(() => sTypeDef);

const sUnionType = sObject({
	kind: sLiteral("union"),
	of: sArray(typeRef),
})
	.refine<UnionTypeDef>({
		canSerialize: (val): val is UnionTypeDef => val instanceof UnionTypeDef,
		serialize: val => ({ kind: val.kind, of: val.of }),
		deserialize: val => deserializationValue(new UnionTypeDef(val.of)),
	})
	.defineAs(typeDefinitionNs("UnionType"));

const sIntersectionType = sArray(typeRef)
	.refine<IntersectionTypeDef>({
		canSerialize: (val): val is IntersectionTypeDef =>
			val instanceof IntersectionTypeDef,
		serialize: val => val.of,
		deserialize: val => deserializationValue(new IntersectionTypeDef(val)),
	})
	.defineAs(typeDefinitionNs("IntersectionType"));

const sStringType = sObject({
	kind: sLiteral("string"),
})
	.refine<StringTypeDef>({
		canSerialize: (val): val is StringTypeDef =>
			val instanceof StringTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new StringTypeDef()),
	})
	.defineAs(typeDefinitionNs("StringType"));

const sBooleanType = sObject({
	kind: sLiteral("boolean"),
})
	.refine<BooleanTypeDef>({
		canSerialize: (val): val is BooleanTypeDef =>
			val instanceof BooleanTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new BooleanTypeDef()),
	})
	.defineAs(typeDefinitionNs("BooleanType"));

const sNumberType = sObject({
	kind: sLiteral("number"),
})
	.refine<NumberTypeDef>({
		canSerialize: (val): val is NumberTypeDef =>
			val instanceof NumberTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new NumberTypeDef()),
	})
	.defineAs(typeDefinitionNs("NumberType"));

const sAnyType = sObject({
	kind: sLiteral("any"),
})
	.refine<AnyTypeDef>({
		canSerialize: (val): val is AnyTypeDef => val instanceof AnyTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new AnyTypeDef()),
	})
	.defineAs(typeDefinitionNs("AnyType"));

const sLiteralType = sObject({
	kind: sLiteral("literal"),
	value: sUnion(sString, sNumber, sBoolean),
})
	.refine<LiteralTypeDef>({
		canSerialize: (val): val is LiteralTypeDef =>
			val instanceof LiteralTypeDef,
		serialize: val => ({ kind: val.kind, value: val.value }),
		deserialize: val => deserializationValue(new LiteralTypeDef(val.value)),
	})
	.defineAs(typeDefinitionNs("LiteralType"));

const sNullType = sObject({
	kind: sLiteral("null"),
})
	.refine<NullTypeDef>({
		canSerialize: (val): val is NullTypeDef => val instanceof NullTypeDef,
		serialize: val => ({ kind: val.kind }),
		deserialize: val => deserializationValue(new NullTypeDef()),
	})
	.defineAs(typeDefinitionNs("LiteralType"));

const sObjectProperty = sObject({
	type: typeRef,
	optional: sObjectProp({
		serializer: sBoolean,
		optional: { withDefault: false },
	}),
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
	kind: sLiteral("array"),
	of: typeRef,
})
	.refine<ArrayTypeDef>({
		canSerialize: (item): item is ArrayTypeDef =>
			item instanceof ArrayTypeDef,
		serialize: val => ({ kind: val.kind, of: val.itemType }),
		deserialize: val => deserializationValue(new ArrayTypeDef(val.of)),
	})
	.defineAs(typeDefinitionNs("ArrayType"));

const sObjectType = sObject({
	kind: sLiteral("object"),
	properties: sMap(sObjectProperty),
})
	.refine<ObjectTypeDef>({
		canSerialize: (val): val is ObjectTypeDef =>
			val instanceof ObjectTypeDef,
		serialize: val => ({ kind: val.kind, properties: val.properties }),
		deserialize: val =>
			deserializationValue(new ObjectTypeDef(val.properties)),
	})
	.defineAs(typeDefinitionNs("ObjectType"));

const sMapType = sObject({
	kind: sLiteral("map"),
	valueType: typeRef,
})
	.refine<MapTypeDef>({
		canSerialize: (item): item is MapTypeDef => item instanceof MapTypeDef,
		serialize: val => ({ kind: val.kind, valueType: val.valueType }),
		deserialize: val => deserializationValue(new MapTypeDef(val.valueType)),
	})
	.defineAs(typeDefinitionNs("MapType"));

const sTypeRef = sNamespacedName
	.refine<TypeRefDef>({
		canSerialize: (val): val is TypeRefDef => val instanceof TypeRefDef,
		serialize: val => val.namespacedName,
		deserialize: val => deserializationValue(new TypeRefDef(val)),
	})
	.defineAs(typeDefinitionNs("TypeReference"));

export const sTypeDef: NamedSerializer<TypeDef, any> = sUnion(
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
	sArrayType,
	sTypeRef
).defineAs(typeDefinitionNs("Type"));

export const sTypePackage = sObject({
	packageId: sString,
	typeDefinitions: sMap(sTypeDef),
})
	.refine<TypePackageDef>({
		canSerialize: (val): val is TypePackageDef =>
			val instanceof TypePackageDef,
		serialize: val => ({
			packageId: val.packageNs.namespace,
			typeDefinitions: val.definitions,
		}),
		deserialize: val =>
			deserializationValue(
				new TypePackageDef(
					namespace(val.packageId),
					val.typeDefinitions
				)
			),
	})
	.defineAs(typeDefinitionNs("TypeDefinitions"));
