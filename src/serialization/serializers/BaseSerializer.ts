import { JSONValue } from "../../JSONValue";
import { NamespacedName } from "../../NamespacedNamed";
import { Type } from "../../types";
import { TypeSystem } from "../../types/TypeSystem";
import { Validation } from "../../Validation";
import { SerializeContext, DeserializeContext } from "../Context";
import { Serializer } from "../Serializer";

export abstract class BaseSerializer<TValue, TSource extends JSONValue>
	implements Serializer<TValue, TSource> {
	public abstract canSerialize(value: unknown): value is TValue;
	public abstract serializeWithContext(
		value: TValue,
		context: SerializeContext
	): TSource;

	public serialize(value: TValue): JSONValue {
		return this.serializeWithContext(value, SerializeContext.Default);
	}

	public abstract deserializeWithContext(
		value: JSONValue,
		context?: DeserializeContext
	): Validation<TValue>;

	public deserialize(value: JSONValue): Validation<TValue> {
		return this.deserializeWithContext(value, DeserializeContext.Default);
	}

	public deserializeTyped(
		value: TSource,
		context?: DeserializeContext
	): Validation<TValue> {
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

// to avoid circular imports
import { NamedSerializer } from "./NamedSerializer";
import { RefineOptions, RefinedSerializer } from "./RefinedSerializer";
