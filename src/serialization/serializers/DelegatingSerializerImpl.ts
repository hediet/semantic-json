import { BaseSerializer, BaseSerializerImpl } from "../BaseSerializer";
import { Serializer } from "../Serializer";
import {
	DeserializeResult,
	DeserializeResultBuilder,
	DeserializeError,
} from "../DeserializeResult";
import { JSONValue } from "../../JSONValue";
import { DeserializeContext } from "../DeserializeContext";

export interface DelegatingSerializer {
	kind: "delegation";
	underlyingSerializer: Serializer<any>;

	refineSource(
		source: DeserializeResult<any>,
		context: DeserializeContext
	): DeserializeResult<any>;
}

export abstract class DelegatingSerializerImpl<
	T,
	TIntermediate,
	TInterface extends DelegatingSerializer
> extends BaseSerializerImpl<T, TInterface> implements DelegatingSerializer {
	public readonly kind = "delegation";
	public abstract get underlyingSerializer(): Serializer<TIntermediate>;

	protected abstract refineIntermediate(
		value: TIntermediate,
		context: DeserializeContext
	): DeserializeResult<T>;

	public refineSource(
		source: DeserializeResult<TIntermediate>,
		context: DeserializeContext
	): DeserializeResult<T> {
		const errors = [...source.errors];
		let hasValue = false;
		let value: T | undefined = undefined;
		if (!source.hasErrors) {
			const result = this.refineIntermediate(source.value, context);
			if (result.hasValue) {
				hasValue = true;
				value = result.value;
			}
			errors.push(...result.errors);
		}
		// TODO if source.hasValue try refineInvalidIntermediate!
		return new DeserializeResult(
			hasValue,
			value,
			errors,
			source.unprocessedPropertyTree
		);
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T> {
		const val = this.underlyingSerializer.deserialize(
			source,
			context.withoutFirstDeserializationOnValue()
		);
		return this.refineSource(val, context);
	}
}
