import { JSONValue } from "../JSONValue";
import { NamespacedName } from "../NamespacedNamed";
import { DeserializationResult } from "../BaseDeserializationResult";
import { Type, TypeSystem } from "../types/types";
import { DeserializeContext, SerializeContext } from "./Context";

export interface Serializer<TValue, TSource extends JSONValue = JSONValue> {
	canSerialize(item: unknown): item is TValue;
	serializeWithContext(item: TValue, context: SerializeContext): TSource;

	deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue>;

	getSerializerFor(
		type: NamespacedName
	): Serializer<TValue, TSource> | undefined;

	TValue: TValue;
	TSource: TSource;

	/**
	 * Gets the type that validates the source.
	 */
	getType(typeSystem: TypeSystem): Type;
}
