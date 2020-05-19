import { JSONValue, Validation } from "../..";
import { BaseSerializer } from "./BaseSerializer";
import { Serializer } from "..";
import { SerializeContext, DeserializeContext } from "../Context";

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
	): TSource {
		return this.underlyingSerializer.serializeWithContext(value, context);
	}
	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): Validation<TValue> {
		return this.underlyingSerializer.deserializeWithContext(value, context);
	}
}
