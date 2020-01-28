import { JSONValue } from "../JSONValue";
import { NamespacedName, Namespace, namespace } from "../NamespacedNamed";
import { Type, TypeSystem, TypeDefinition } from "../schema/types";
import { DeserializationResult } from "../result";
import { fromEntries } from "../utils";

export class DeserializeContext {
	constructor(public readonly parent: DeserializeContext | undefined) {}

	public readonly namespaces = new Map<string, Namespace>();

	public lookupNamespace(prefix: string): Namespace {
		const result = this.namespaces.get(prefix);
		if (result) {
			return result;
		}
		if (this.parent) {
			return this.parent.lookupNamespace(prefix);
		}
		throw new Error(`Prefix "${prefix}" is not defined.`);
	}
}

export const DefaultDeserializeContext = new DeserializeContext(undefined);

export class SerializeContext {
	private key = 1;
	public readonly namespaces = new Map<string, string>();

	public getPrefixForNamespace(ns: Namespace): string {
		let prefix = this.namespaces.get(ns.namespace);
		if (!prefix) {
			prefix = `p${this.key++}`;
			this.namespaces.set(ns.namespace, prefix);
		}
		return prefix;
	}
}

class DefaultSerializeContext extends SerializeContext {
	public getPrefixForNamespace(ns: Namespace): string {
		throw new Error("Not in object context!");
	}
}

export interface Serializer<TValue, TSource extends JSONValue> {
	canSerialize(item: unknown): item is TValue;
	serializeWithContext(item: TValue, context: SerializeContext): JSONValue;

	deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue>;

	getSerializerFor(
		type: NamespacedName
	): Serializer<TValue, TSource> | undefined;

	TValue: TValue;
	TSource: TSource;

	getType(typeSystem: TypeSystem): Type;
}

export abstract class BaseSerializer<TValue, TSource extends JSONValue>
	implements Serializer<TValue, TSource> {
	public abstract canSerialize(value: unknown): value is TValue;
	public abstract serializeWithContext(
		value: TValue,
		context: SerializeContext
	): JSONValue;

	public serialize(value: TValue): JSONValue {
		return this.serializeWithContext(value, new DefaultSerializeContext());
	}

	public abstract deserializeWithContext(
		value: JSONValue,
		context?: DeserializeContext
	): DeserializationResult<TValue>;

	public deserialize(value: JSONValue): DeserializationResult<TValue> {
		return this.deserializeWithContext(value, DefaultDeserializeContext);
	}

	public deserializeTyped(
		value: TSource,
		context?: DeserializeContext
	): DeserializationResult<TValue> {
		return this.deserializeWithContext(
			(value as any) as JSONValue,
			context
		);
	}

	public get TValue(): TValue {
		throw new Error();
	}

	public get TSource(): TSource {
		throw new Error();
	}

	public getSerializerFor(
		type: NamespacedName
	): Serializer<TValue, TSource> | undefined {
		return undefined;
	}

	public defineAs(fqn: NamespacedName): NamedSerializer<TValue, TSource> {
		return new NamedSerializer(this, fqn, true);
	}

	public knownAs(fqn: NamespacedName): NamedSerializer<TValue, TSource> {
		return new NamedSerializer(this, fqn, false);
	}

	public refine<TRefined>(
		options: RefineOptions<TValue, TRefined>
	): BaseSerializer<TRefined, TSource> {
		return new RefinedSerializer(this, options);
	}

	public abstract getType(typeSystem: TypeSystem): Type;
}

export interface RefineOptions<TValue, TRefined> {
	canSerialize: (value: unknown) => value is TRefined;
	serialize: (value: TRefined) => TValue;
	deserialize: (value: TValue) => DeserializationResult<TRefined>;
}

class RefinedSerializer<
	TValue,
	TSource extends JSONValue,
	TIndermediateValue
> extends BaseSerializer<TValue, TSource> {
	constructor(
		public readonly underlyingSerializer: Serializer<
			TIndermediateValue,
			TSource
		>,
		private readonly options: RefineOptions<TIndermediateValue, TValue>
	) {
		super();
	}

	public canSerialize(value: unknown): value is TValue {
		return this.options.canSerialize(value);
	}
	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): JSONValue {
		const intermediate = this.options.serialize(value);
		return this.underlyingSerializer.serializeWithContext(
			intermediate,
			context
		);
	}
	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		const r = this.underlyingSerializer.deserializeWithContext(
			value,
			context
		);

		if (!r.isOk) {
			return r;
		} else {
			return this.options.deserialize(r.value);
		}
	}

	public getType(typeSystem: TypeSystem): Type {
		return this.underlyingSerializer.getType(typeSystem);
	}
}

export abstract class DelegatingSerializer<
	TValue,
	TSource extends JSONValue
> extends BaseSerializer<TValue, TSource> {
	abstract get underlyingSerializer(): Serializer<TValue, TSource>;

	public canSerialize(value: unknown): value is TValue {
		return this.underlyingSerializer.canSerialize(value);
	}
	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): JSONValue {
		return this.underlyingSerializer.serializeWithContext(value, context);
	}
	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		return this.underlyingSerializer.deserializeWithContext(value, context);
	}
}

export class NamedSerializer<
	TValue,
	TSource extends JSONValue
> extends DelegatingSerializer<TValue, TSource> {
	constructor(
		readonly underlyingSerializer: Serializer<TValue, TSource>,
		public readonly namespacedName: NamespacedName,
		public readonly isDefinition: boolean
	) {
		super();
	}

	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): JSONValue {
		let newContext = false;
		if (context instanceof DefaultSerializeContext) {
			context = new SerializeContext();
			newContext = true;
		}
		const r = this.underlyingSerializer.serializeWithContext(
			value,
			context
		);
		if (newContext) {
			if (typeof r !== "object" || Array.isArray(r) || !r) {
				throw new Error("Invalid context");
			}
			r["$ns"] = fromEntries(
				[...context.namespaces.entries()].map(([key, value]) => [
					value,
					key,
				])
			);
		}
		return r;
	}

	public getSerializerFor(
		type: NamespacedName
	): Serializer<TValue, TSource> | undefined {
		if (type.equals(this.namespacedName)) {
			return this.underlyingSerializer;
		}
		return this.underlyingSerializer.getSerializerFor(type);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		if (typeof value === "object" && value && "$ns" in value) {
			const ns = value["$ns"] as object;
			delete value["$ns"];
			context = new DeserializeContext(context);
			for (const [prefix, nsValue] of Object.entries(ns)) {
				if (typeof nsValue !== "string") {
					throw new Error(
						`${nsValue} has invalid type. Must be string.`
					);
				}
				context.namespaces.set(prefix, namespace(nsValue));
			}
		}

		let type: NamespacedName | undefined = undefined;
		if (typeof value === "object" && value && "$type" in value) {
			const typeName = value["$type"] as string;
			const regExp = /(.*)#(.*)/;
			const m = regExp.exec(typeName);
			if (m) {
				const nsPrefix = m[1];
				const name = m[2];
				const ns = context.lookupNamespace(nsPrefix);
				type = ns(name);
			} else {
				throw new Error(`Malformed type "${typeName}"`);
			}
			delete value["$type"];
		}

		if (type) {
			const s = this.getSerializerFor(type);
			if (!s) {
				throw new Error(`Invalid type ${type}.`);
			}
			return s.deserializeWithContext(value, context);
		}
		return super.deserializeWithContext(value, context);
	}

	public getType(typeSystem: TypeSystem): TypeDefinition {
		if (this.isDefinition && !typeSystem.isTypeKnown(this.namespacedName)) {
			typeSystem.getOrCreateType(this.namespacedName);
			const definingType = this.underlyingSerializer.getType(typeSystem);
			typeSystem.defineType(this.namespacedName, definingType);
		}
		return typeSystem.getOrCreateType(this.namespacedName);
	}
}
