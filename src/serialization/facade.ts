import {
	PrimitiveSerializerImpl,
	LiteralSerializerImpl,
	UnionSerializerImpl,
	IntersectionSerializerImpl,
	ArraySerializerImpl,
	AnySerializerImpl,
	MapSerializerImpl,
	LazySerializerImpl,
	StringSerializerImpl,
	NumberSerializerImpl,
	BooleanSerializerImpl,
} from "./serializers";
import { LiteralType } from "./serializers/LiteralSerializerImpl";
import { BaseSerializer } from "./BaseSerializer";
import { NamespacedName, namespace } from "../NamespacedNamed";
import { Serializer, NamedSerializer } from "./Serializer";
import { DeserializeResult } from "./DeserializeResult";
import { UnionToIntersection } from "./serializers/IntersectionSerializerImpl";
import { UnionProcessingStrategy } from "./serializers/UnionSerializerImpl";
import { NumberSerializerOptions } from "./serializers/NumberSerializerImpl";
import { StringSerializerOptions } from "./serializers/StringSerializerImpl";
import { ArraySerializeOptions } from "./serializers/ArraySerializerImpl";

export {
	sObject,
	sOpenObject,
	prop,
	optionalProp,
	ObjectPropInfo,
} from "./serializers/ObjectSerializerImpl";

export function sAny(): AnySerializerImpl["TSerializer"] {
	return new AnySerializerImpl();
}
export function sString(
	options: StringSerializerOptions = {}
): StringSerializerImpl["TSerializer"] {
	return new StringSerializerImpl(options);
}

export function sNumber(
	options: NumberSerializerOptions = {}
): NumberSerializerImpl["TSerializer"] {
	return new NumberSerializerImpl(options);
}

export function sInteger(
	options: Omit<NumberSerializerOptions, "integer"> = {}
): NumberSerializerImpl["TSerializer"] {
	return new NumberSerializerImpl({ ...options, integer: true });
}

export function sBoolean(): BooleanSerializerImpl["TSerializer"] {
	return new BooleanSerializerImpl();
}

export function sNull(): LiteralSerializerImpl<null>["TSerializer"] {
	return new LiteralSerializerImpl(null);
}

export function sLiteral<T extends LiteralType>(
	value: T
): LiteralSerializerImpl<T>["TSerializer"] {
	return new LiteralSerializerImpl(value);
}

export function sUnionMany<T extends Serializer<any>[]>(
	unitedSerializers: T,
	options: { processingStrategy: UnionProcessingStrategy }
): UnionSerializerImpl<T[number]["T"]>["TSerializer"] {
	return new UnionSerializerImpl(
		unitedSerializers as any,
		options.processingStrategy
	);
}

export function sIntersectionMany<T extends Serializer<any>[]>(
	intersectedSerializers: T
): Serializer<
	{
		[TName in keyof T]: T[TName] extends BaseSerializer<infer Y>
			? Y
			: never;
	}
> {
	return new IntersectionSerializerImpl(intersectedSerializers) as any;
}

export function sUnion<T extends Serializer<any>[]>(
	unitedSerializers: T,
	options: { inclusive?: boolean } = {}
): Serializer<T[number]["T"]> {
	return sUnionMany(unitedSerializers, {
		processingStrategy: options.inclusive ? "first" : "firstExclusive",
	}).refine<any>({
		canSerialize: (item): item is T[number]["T"] =>
			unitedSerializers.some((s) => s.canSerialize(item)),
		fromIntermediate: (item) => DeserializeResult.fromValue(item[0]),
		toIntermediate: (item) => [item],
	});
}

export function sIntersect<T extends Serializer<any>[]>(
	intersectedSerializers: T
): Serializer<UnionToIntersection<T[number]["T"]>> {
	return sIntersectionMany(intersectedSerializers).refine<
		UnionToIntersection<T[number]["T"]>
	>({
		canSerialize: (val): val is UnionToIntersection<T[number]["T"]> =>
			Array.isArray(val),
		fromIntermediate: (val) =>
			DeserializeResult.fromValue(Object.assign({}, ...val)),
		toIntermediate: (val) => [val] as any,
	});
}

function sRegEx(): Serializer<RegExp> {
	throw "";
}

export function sArrayOf<T>(
	itemSerializer: Serializer<T>,
	options: ArraySerializeOptions = {}
): ArraySerializerImpl<T>["TSerializer"] {
	return new ArraySerializerImpl<any>(itemSerializer, options);
}

function sTuple() {}

export function sMap<TValue>(
	valueSerializer: Serializer<TValue>
): MapSerializerImpl<TValue>["TSerializer"] {
	return new MapSerializerImpl(valueSerializer);
}

/**
 * Creates a lazy reference to a named serializer.
 * @param serializerRef The lazily referenced serializer. Must be named to avoid unnamed cycles.
 */
export function sLazy<TValue>(
	serializerRef: () => NamedSerializer<TValue>
): Serializer<TValue> {
	return new LazySerializerImpl(serializerRef);
}

export function sNamespacedName(): Serializer<NamespacedName> {
	return sString().refine<NamespacedName>({
		canSerialize: (v): v is NamespacedName => v instanceof NamespacedName,
		fromIntermediate: (value, context) => {
			const regExp = /(.*)#(.*)/;
			const m = regExp.exec(value);
			if (!m) {
				return DeserializeResult.fromError({
					message: `Namespaced name must match the regex "(.*)#(.*)".`,
				});
			}
			const nsPrefix = m[1];
			const name = m[2];
			const ns = context.lookupNamespace(nsPrefix);
			if (!ns) {
				return DeserializeResult.fromError({
					message: `Prefix "${nsPrefix}" is not defined.`,
				});
			}
			return DeserializeResult.fromValue(ns(name));
		},
		toIntermediate: (v, context) => {
			const prefix = context.getPrefixForNamespace(
				namespace(v.namespace)
			);
			return `${prefix}#${v.name}`;
		},
	});
}
