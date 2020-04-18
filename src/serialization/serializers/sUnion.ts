import { Serializer } from "..";
import {
	JSONValue,
	DeserializationResult,
	DeserializationError,
	ErrorDeserializationResult,
	TypeSystem,
	Type,
	UnionType,
} from "../..";
import { BaseSerializer } from "./BaseSerializer";
import { SerializeContext, DeserializeContext } from "../Context";

export function sUnion<TSerializer extends Serializer<any, any>[]>(
	...serializers: TSerializer
): UnionSerializer<
	TSerializer[number]["TValue"],
	TSerializer[number]["TSource"]
> {
	return new UnionSerializer(serializers);
}

class UnionSerializer<TValue, TSource extends JSONValue> extends BaseSerializer<
	TValue,
	TSource
> {
	constructor(public readonly serializers: Serializer<TValue, TSource>[]) {
		super();
	}

	public canSerialize(value: unknown): value is TValue {
		return this.serializers.some(s => s.canSerialize(value));
	}

	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): TSource {
		for (const s of this.serializers) {
			if (s.canSerialize(value)) {
				return s.serializeWithContext(value, context);
			}
		}
		throw new Error("No serializer could deserialize the given value");
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		const errors = new Array<{
			index: number;
			errors: DeserializationError[];
		}>();
		let idx = 0;
		for (const s of this.serializers) {
			const result = s.deserializeWithContext(value, context);
			if (result.isOk) {
				return result;
			} else {
				errors.push({ index: idx, errors: result.errors });
			}
			idx++;
		}
		return new ErrorDeserializationResult([
			new DeserializationError({
				message:
					"No serializer could deserialize the given value:\n" +
					errors
						.map(
							e =>
								`${e.index + 1}: ${e.errors
									.map(
										e =>
											`(${e.path.join("/")}) ${e.message}`
									)
									.join("\n")}`
						)
						.join("\n"),
			}),
		]);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new UnionType(this.serializers.map(s => s.getType(typeSystem)));
	}
}
