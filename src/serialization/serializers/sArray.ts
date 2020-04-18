import {
	JSONValue,
	DeserializationResult,
	deserializationError,
	DeserializationError,
	deserializationValue,
	TypeSystem,
	Type,
	ArrayType,
} from "../..";
import { Serializer } from "..";
import { BaseSerializer } from "./BaseSerializer";
import { SerializeContext, DeserializeContext } from "../Context";

export function sArray<TValue, TSource extends JSONValue>(
	itemSerializer: Serializer<TValue, TSource>
): ArraySerializer<TValue, TSource> {
	return new ArraySerializer(itemSerializer);
}

class ArraySerializer<TValue, TSource extends JSONValue> extends BaseSerializer<
	TValue[],
	TSource[]
> {
	constructor(public readonly itemSerializer: Serializer<TValue, TSource>) {
		super();
	}

	public canSerialize(value: unknown): value is TValue[] {
		return value instanceof Array;
	}

	public serializeWithContext(
		value: TValue[],
		context: SerializeContext
	): TSource[] {
		return value.map(v =>
			this.itemSerializer.serializeWithContext(v, context)
		);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue[]> {
		if (!(value instanceof Array)) {
			return deserializationError({
				message: `Expected an array but got a ${typeof value}.`,
			});
		}
		const errors = new Array<DeserializationError>();
		const result = new Array<TValue>(value.length);
		for (let i = 0; i < value.length; i++) {
			const r = this.itemSerializer.deserializeWithContext(
				value[i],
				context
			);
			if (!r.isOk) {
				errors.push(...r.errors.map(e => e.prependPath(i)));
			} else {
				result[i] = r.value;
			}
		}

		if (errors.length > 0) {
			return deserializationError(...errors);
		}

		return deserializationValue(result);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new ArrayType(this.itemSerializer.getType(typeSystem));
	}
}
