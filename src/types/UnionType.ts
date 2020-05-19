import { TypeDef, UnionTypeDef } from "../schema/typeDefs";
import { BaseType, ValidationContext, ValidationResult } from "./BaseType";
import { Type, ExcludeType } from "./types";
import {
	JSONValue,
	Validation,
	ValidationError,
	InvalidData,
	ValidationErrorAlternative,
} from "..";
import { ObjectType } from "./ObjectType";
import { validData } from "../Validation";

export class UnionType<T> extends BaseType<T> {
	public static from<TTypes extends Type[]>(
		...unitedTypes: TTypes
	): UnionType<TTypes[number]["T"]> {
		return new UnionType(unitedTypes as any);
	}

	public readonly kind = "union";
	constructor(public readonly unitedTypes: ReadonlyArray<Type<T>>) {
		super();
	}

	public validate(
		value: JSONValue,
		context: ValidationContext
	): ValidationResult<T> {
		const errors = new Array<ValidationErrorAlternative>();

		if (typeof value === "object" && value) {
		}

		let idx = 0;
		for (const s of this.unitedTypes) {
			const result = context.validateInSameContext(s, value);
			if (result.isOk) {
				return validData({
					value: result.value.value,
					type: {
						kind: "abstract",
						type: this,
						specificTypes: [result.value.type],
					},
				});
			} else {
				errors.push({
					alternativeId: idx.toString(),
					errors: result.errors,
				});
			}
			idx++;
		}
		return new InvalidData([
			new ValidationError({
				message: "No type could validate the given value",
				errorAlternatives: errors,
			}),
		]);
	}

	public toTypeDef(): TypeDef {
		return new UnionTypeDef(this.unitedTypes.map((t) => t.toTypeDef()));
	}

	public resolveUnion(): ExcludeType<"union">[] {
		return new Array<ExcludeType<"union">>().concat(
			...this.unitedTypes.map((t) => t.resolveUnion())
		);
	}
}
