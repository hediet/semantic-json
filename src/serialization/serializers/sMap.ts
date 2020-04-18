import {
	JSONValue,
	DeserializationResult,
	deserializationError,
	deserializationValue,
	TypeSystem,
	Type,
	MapType,
} from "../..";
import { Serializer } from "..";
import { BaseSerializer } from "./BaseSerializer";
import { SerializeContext, DeserializeContext } from "../Context";

export function sMap<TValue, TSource extends JSONValue>(
	itemSerializer: Serializer<TValue, TSource>
): MapSerializer<TValue, TSource> {
	return new MapSerializer(itemSerializer);
}

class MapSerializer<TValue, TSource extends JSONValue> extends BaseSerializer<
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
	): { [key: string]: TSource } {
		const result: Record<string, TSource> = {};
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
			return deserializationError({
				message: `Expected an object, but got ${typeof value}.`,
			});
		}

		const result: { [key: string]: TValue } = {};

		for (const [key, val] of Object.entries(value)) {
			const r = this.itemSerializer.deserializeWithContext(val!, context);
			if (!r.isOk) {
				return deserializationError(
					...r.errors.map(e => e.prependPath(key))
				);
			}
			result[key] = r.value;
		}

		return deserializationValue(result);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new MapType(this.itemSerializer.getType(typeSystem));
	}
}
