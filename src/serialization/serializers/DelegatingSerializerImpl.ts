import { BaseSerializer, BaseSerializerImpl } from "../BaseSerializer";
import { Serializer } from "../Serializer";
import {
	DeserializeResult,
	DeserializeResultBuilder,
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
		const b = new DeserializeResultBuilder<T>();
		b.addError(...source.errors);
		if (source.hasValue) {
			const result = this.refineIntermediate(source.value, context);
			if (result.hasValue) {
				b.setValue(result.value);
			}
			b.addError(...result.errors);
		}
		b.addParticipatedClosedObjects(source.participatedClosedObjects);
		return b.build();
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
