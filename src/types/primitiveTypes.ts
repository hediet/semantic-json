import {
	TypeDef,
	StringTypeDef,
	NumberTypeDef,
	BooleanTypeDef,
	AnyTypeDef,
	NullTypeDef,
} from "../schema/typeDefs";
import { BaseType, ValidationResult } from "./BaseType";
import { JSONValue, Validation, Type, NarrowType } from "..";
import { validData, invalidData, ValidationError } from "../Validation";

type TypeNames = {
	boolean: boolean;
	number: number;
	string: string;
};

function validate<TTypeName extends keyof TypeNames>(
	typeName: TTypeName,
	value: JSONValue,
	type: NarrowType<keyof TypeNames>
): ValidationResult<TypeNames[TTypeName]> {
	if (typeof value === typeName) {
		return validData({
			value: value as any,
			type: { kind: "specific", type },
		});
	} else {
		return invalidData({
			message: `Expected a ${typeName}, but got a ${typeof value}.`,
		});
	}
}

export class StringType extends BaseType<string> {
	public readonly kind = "string";

	public validate(source: JSONValue): ValidationResult<string> {
		return validate("string", source, this);
	}

	public toTypeDef(): TypeDef {
		return new StringTypeDef();
	}
}

export class NumberType extends BaseType<number> {
	public readonly kind = "number";

	public validate(source: JSONValue): ValidationResult<number> {
		return validate("number", source, this);
	}

	public toTypeDef(): TypeDef {
		return new NumberTypeDef();
	}
}

export class BooleanType extends BaseType<boolean> {
	public readonly kind = "boolean";

	public validate(source: JSONValue): ValidationResult<boolean> {
		return validate("boolean", source, this);
	}

	public toTypeDef(): TypeDef {
		return new BooleanTypeDef();
	}
}

export class AnyType extends BaseType<any> {
	public readonly kind = "any";

	public validate(source: JSONValue): ValidationResult<any> {
		return validData({
			value: source,
			type: { kind: "specific", type: this },
		});
	}

	public toTypeDef(): TypeDef {
		return new AnyTypeDef();
	}
}

export class NullType extends BaseType<null> {
	public readonly kind = "null";

	public validate(source: JSONValue): ValidationResult<null> {
		if (source !== null) {
			return invalidData({
				message: "Expected null, but got a non-null value.",
			});
		} else {
			return validData({
				value: null,
				type: { kind: "specific", type: this },
			});
		}
	}

	public toTypeDef(): TypeDef {
		return new NullTypeDef();
	}
}
