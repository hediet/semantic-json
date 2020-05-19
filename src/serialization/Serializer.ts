import { JSONValue } from "../JSONValue";
import { NamespacedName } from "../NamespacedNamed";
import { Validation } from "../Validation";
import { Type } from "../types";
import { TypeSystem } from "../types/TypeSystem";
import { DeserializeContext, SerializeContext } from "./Context";

export interface Serializer<TValue, TSource extends JSONValue = JSONValue> {
	canSerialize(item: unknown): item is TValue;
	serializeWithContext(item: TValue, context: SerializeContext): TSource;

	deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): Validation<TValue>;

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
