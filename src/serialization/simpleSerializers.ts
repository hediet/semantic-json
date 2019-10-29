import {
	Serializer,
	BaseSerializer,
	DeserializeContext,
	DelegatingSerializer,
	NamedSerializer,
	SerializeContext,
} from "./Serializer";
import { JSONValue } from "../JSONValue";
import {
	UnionType,
	TypeSystem,
	Type,
	ArrayType,
	BooleanType,
	NumberType,
	StringType,
	MapType,
} from "../schema/types";
import { NamespacedName, Namespace } from "..";
import { namespace } from "../NamespacedNamed";

export class DowncastSerializer<T extends JSONValue> extends BaseSerializer<
	T,
	T
> {
	public canSerialize(value: unknown): value is T {
		return true;
	}

	public serializeWithContext(value: T): JSONValue {
		return (value as any) as JSONValue;
	}

	public deserializeWithContext(value: JSONValue): DeserializationResult<T> {
		return { kind: "successful", result: value as T };
	}
}

export class LiteralSerializer<T extends JSONValue> extends BaseSerializer<
	T,
	T
> {
	constructor(public readonly value: T) {
		super();
	}

	public canSerialize(value: unknown): value is T {
		return value === this.value;
	}

	public serializeWithContext(value: T): JSONValue {
		return (value as any) as JSONValue;
	}

	public deserializeWithContext(value: JSONValue): DeserializationResult<T> {
		if (value !== this.value) {
			return singleError(
				new ConversionError({
					message: `Expected "${this.value}" but got "${value}".`,
				})
			);
		}

		return { kind: "successful", result: value as T };
	}
}

export function sLiteral<T extends JSONValue>(
	literal: T
): LiteralSerializer<T> {
	return new LiteralSerializer(literal);
}

export type TypeNames = {
	boolean: boolean;
	number: number;
	string: string;
};

export class TypeSerializer<
	TTypeName extends keyof TypeNames
> extends BaseSerializer<TypeNames[TTypeName], TypeNames[TTypeName]> {
	constructor(private readonly typeName: TTypeName) {
		super();
	}

	public canSerialize(value: unknown): value is TypeNames[TTypeName] {
		return typeof value === this.typeName;
	}

	public deserializeWithContext(
		value: JSONValue
	): DeserializationResult<TypeNames[TTypeName]> {
		if (!this.canSerialize(value)) {
			return singleError(
				new ConversionError({
					message: `Expected a ${
						this.typeName
					} but got a ${typeof value}.`,
				})
			);
		}

		return { kind: "successful", result: value };
	}

	public serializeWithContext(value: TypeNames[TTypeName]): JSONValue {
		return value;
	}

	public getType(typeSystem: TypeSystem): Type {
		if (this.typeName === "boolean") {
			return new BooleanType();
		} else if (this.typeName === "number") {
			return new NumberType();
		} else if (this.typeName === "string") {
			return new StringType();
		} else {
			throw new Error();
		}
	}
}

export const sString = new TypeSerializer("string");
export const sBoolean = new TypeSerializer("boolean");
export const sNumber = new TypeSerializer("number");

export class MapSerializer<
	TValue,
	TSource extends JSONValue
> extends BaseSerializer<
	{ [key: string]: TValue },
	{ [key: string]: TSource }
> {
	constructor(public readonly itemSerializer: Serializer<TValue, TSource>) {
		super();
	}

	public canSerialize(value: unknown): value is { [key: string]: TValue } {
		if (typeof value !== "object" || value === null) {
			return false;
		}

		// TODO
		return true;
	}

	public serializeWithContext(
		value: { [key: string]: TValue },
		context: SerializeContext
	): JSONValue {
		const result: Record<string, JSONValue> = {};
		for (const [key, val] of Object.entries(value)) {
			result[key] = this.itemSerializer.serializeWithContext(
				val,
				context
			);
		}
		return result;
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<{ [key: string]: TValue }> {
		if (typeof value !== "object" || value === null) {
			return singleError(
				new ConversionError({
					message: `Expected an object, but got ${typeof value}.`,
				})
			);
		}

		const result: { [key: string]: TValue } = {};

		for (const [key, val] of Object.entries(value)) {
			const r = this.itemSerializer.deserializeWithContext(val!, context);
			if (r.kind === "error") {
				return {
					kind: "error",
					errors: r.errors.map(e => e.prependPath(key)),
				};
			}
			result[key] = r.result;
		}

		return {
			kind: "successful",
			result,
		};
	}

	public getType(typeSystem: TypeSystem): Type {
		return new MapType(this.itemSerializer.getType(typeSystem));
	}
}

export function sMap<TValue, TSource extends JSONValue>(
	itemSerializer: Serializer<TValue, TSource>
): MapSerializer<TValue, TSource> {
	return new MapSerializer(itemSerializer);
}

export function sRef<TValue, TSource extends JSONValue>(
	serializerRef: () => NamedSerializer<TValue, TSource>
): BaseSerializer<TValue, TSource> {
	return new RefSerializer(serializerRef);
}

export class RefSerializer<
	TValue,
	TSource extends JSONValue
> extends DelegatingSerializer<TValue, TSource> {
	private cached: Serializer<TValue, TSource> | undefined = undefined;

	get underlyingSerializer(): Serializer<TValue, TSource> {
		if (!this.cached) {
			this.cached = this.serializerRef();
		}
		return this.cached;
	}

	constructor(
		private readonly serializerRef: () => Serializer<TValue, TSource>
	) {
		super();
	}

	public getType(typeSystem: TypeSystem): Type {
		return this.underlyingSerializer.getType(typeSystem);
	}
}

export function sArray<TValue, TSource extends JSONValue>(
	itemSerializer: Serializer<TValue, TSource>
): ArraySerializer<TValue, TSource> {
	return new ArraySerializer(itemSerializer);
}

export class ArraySerializer<
	TValue,
	TSource extends JSONValue
> extends BaseSerializer<TValue[], TSource[]> {
	constructor(public readonly itemSerializer: Serializer<TValue, TSource>) {
		super();
	}

	public canSerialize(value: unknown): value is TValue[] {
		return value instanceof Array;
	}

	public serializeWithContext(
		value: TValue[],
		context: SerializeContext
	): JSONValue {
		return value.map(v =>
			this.itemSerializer.serializeWithContext(v, context)
		);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue[]> {
		if (!(value instanceof Array)) {
			return singleError(
				new ConversionError({
					message: `Expected an array but got a ${typeof value}.`,
				})
			);
		}
		const errors = new ErrorCollector();
		const result = new Array<TValue>(value.length);
		for (let i = 0; i < value.length; i++) {
			const r = this.itemSerializer.deserializeWithContext(
				value[i],
				context
			);
			if (r.kind === "error") {
				errors.push(...r.errors.map(e => e.prependPath(i)));
			} else {
				result[i] = r.result;
			}
		}

		if (errors.hasErrors) {
			return errors;
		}

		return { kind: "successful", result };
	}

	public getType(typeSystem: TypeSystem): Type {
		return new ArrayType(this.itemSerializer.getType(typeSystem));
	}
}

export class UnionSerializer<
	TValue,
	TSource extends JSONValue
> extends BaseSerializer<TValue, TSource> {
	constructor(public readonly serializers: Serializer<TValue, TSource>[]) {
		super();
	}

	public canSerialize(value: unknown): value is TValue {
		return this.serializers.some(s => s.canSerialize(value));
	}

	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): JSONValue {
		for (const s of this.serializers) {
			if (s.canSerialize(value)) {
				return s.serializeWithContext(value, context);
			}
		}
		throw new Error();
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		for (const s of this.serializers) {
			const result = s.deserializeWithContext(value, context);
			if (result.kind === "successful") {
				return result;
			}
		}
		throw new Error();
	}

	public getType(typeSystem: TypeSystem): Type {
		return new UnionType(this.serializers.map(s => s.getType(typeSystem)));
	}
}

export function sUnion<TSerializer extends Serializer<any, any>[]>(
	...serializers: TSerializer
): UnionSerializer<
	TSerializer[number]["TValue"],
	TSerializer[number]["TSource"]
> {
	return new UnionSerializer(serializers);
}

export class NamespacedNameSerializer extends BaseSerializer<
	NamespacedName,
	string
> {
	public canSerialize(value: unknown): value is NamespacedName {
		return value instanceof NamespacedName;
	}

	public serializeWithContext(
		value: NamespacedName,
		context: SerializeContext
	): JSONValue {
		const prefix = context.getPrefixForNamespace(
			namespace(value.namespace)
		);
		return `${prefix}#${value.name}`;
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<NamespacedName> {
		if (typeof value !== "string") {
			return singleError(
				new ConversionError({ message: "must be of type string" })
			);
		}
		const regExp = /(.*)#(.*)/;
		const m = regExp.exec(value);
		if (m) {
			const nsPrefix = m[1];
			const name = m[2];
			const ns = context.lookupNamespace(nsPrefix);
			return ok(ns(name));
		} else {
			throw new Error(`Malformed type "${value}"`);
		}
	}

	public getType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export const sNamespacedName = new NamespacedNameSerializer();

export class NamespaceSerializer extends BaseSerializer<Namespace, string> {
	public canSerialize(value: unknown): value is Namespace {
		return !!(typeof value === "object" && value && "namespace" in value);
	}
	public serializeWithContext(
		value: Namespace,
		context: SerializeContext
	): JSONValue {
		return context.getPrefixForNamespace(value);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<Namespace> {
		if (typeof value !== "string") {
			return singleError(
				new ConversionError({ message: "must be of type string" })
			);
		}
		const ns = context.lookupNamespace(value);
		return ok(ns);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export const sNamespace = new NamespaceSerializer();
