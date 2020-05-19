import { TypeDef, LiteralTypeDef } from "../schema/typeDefs";
import { BaseType, ValidationResult } from "./BaseType";
import { JSONValue, Validation, invalidData, validData } from "..";

export class LiteralType<T extends string | number | boolean> extends BaseType<
	T
> {
	public readonly kind = "literal";

	constructor(public readonly value: T) {
		super();
	}

	public validate(value: JSONValue): ValidationResult<T> {
		if (value !== this.value) {
			return invalidData({
				message: `Expected "${this.value}" but got "${value}".`,
			});
		}

		return validData({
			value: value as T,
			type: { kind: "specific", type: this },
		});
	}

	public toTypeDef(): TypeDef {
		return new LiteralTypeDef(this.value);
	}
}
