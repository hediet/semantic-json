import { BaseSerializer } from "./BaseSerializer";
import {
	JSONValue,
	Validation,
	invalidData,
	ValidationError,
	validData,
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

	public deserializeWithContext(value: JSONValue): Validation<void> {
		if (value !== null) {
			return invalidData(
				new ValidationError({
					message: "Value is expected to be null, but was not.",
				})
			);
		}
		return validData(undefined);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new NullType();
	}
}

export const sVoid = new VoidSerializer();
