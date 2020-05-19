import { TypeDef, ArrayTypeDef } from "../schema/typeDefs";
import { BaseType, ValidationContext, ValidationResult } from "./BaseType";
import { Type } from "./types";
import {
	JSONValue,
	Validation,
	invalidData,
	ValidationError,
	validData,
} from "..";

export class ArrayType<T> extends BaseType<T[]> {
	public readonly kind = "array";

	constructor(public readonly itemType: Type<T>) {
		super();
	}

	public validate(
		source: JSONValue,
		context: ValidationContext
	): ValidationResult<T[]> {
		if (!(source instanceof Array)) {
			return invalidData({
				message: `Expected an array but got a ${typeof source}.`,
			});
		}
		const errors = new Array<ValidationError>();
		for (let i = 0; i < source.length; i++) {
			const r = context.validate(this.itemType, source[i]);
			if (!r.isOk) {
				errors.push(...r.errors.map((e) => e.prependPath(i)));
			}
		}

		if (errors.length > 0) {
			return invalidData(...errors);
		}
		throw new Error("todo");
		return validData(source as any);
	}

	public toTypeDef(): TypeDef {
		return new ArrayTypeDef(this.itemType.toTypeDef());
	}
}
