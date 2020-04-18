import { BaseSerializer } from "./BaseSerializer";
import {
	JSONValue,
	DeserializationResult,
	deserializationError,
	deserializationValue,
	TypeSystem,
	Type,
	BooleanType,
	NumberType,
	StringType,
} from "../..";

type TypeNames = {
	boolean: boolean;
	number: number;
	string: string;
};

class TypeSerializer<TTypeName extends keyof TypeNames> extends BaseSerializer<
	TypeNames[TTypeName],
	TypeNames[TTypeName]
> {
	constructor(private readonly typeName: TTypeName) {
		super();
	}

	public canSerialize(value: unknown): value is TypeNames[TTypeName] {
		return typeof value === this.typeName;
	}

	public deserializeWithContext(
		value: JSONValue
	): DeserializationResult<TypeNames[TTypeName]> {
		if (!this.canSerialize(value)) {
			return deserializationError({
				message: `Expected a ${
					this.typeName
				}, but got a ${typeof value}.`,
			});
		}

		return deserializationValue(value);
	}

	public serializeWithContext(
		value: TypeNames[TTypeName]
	): TypeNames[TTypeName] {
		return value;
	}

	public getType(typeSystem: TypeSystem): Type {
		if (this.typeName === "boolean") {
			return new BooleanType();
		} else if (this.typeName === "number") {
			return new NumberType();
		} else if (this.typeName === "string") {
			return new StringType();
		} else {
			throw new Error();
		}
	}
}

export const sString = new TypeSerializer("string");
export const sBoolean = new TypeSerializer("boolean");
export const sNumber = new TypeSerializer("number");
