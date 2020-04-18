import { BaseSerializer } from "./BaseSerializer";
import {
	JSONValue,
	DeserializationResult,
	deserializationError,
	DeserializationError,
	deserializationValue,
	TypeSystem,
	Type,
	NullType,
} from "../..";

class VoidSerializer extends BaseSerializer<void, null> {
	public canSerialize(value: unknown): value is void {
		return value === undefined;
	}

	public serializeWithContext(value: void): null {
		return null;
	}

	public deserializeWithContext(
		value: JSONValue
	): DeserializationResult<void> {
		if (value !== null) {
			return deserializationError(
				new DeserializationError({
					message: "Value is expected to be null, but was not.",
				})
			);
		}
		return deserializationValue(undefined);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new NullType();
	}
}

export const sVoid = new VoidSerializer();
