import { TypeDef, IntersectionTypeDef } from "../schema/typeDefs";
import {
	BaseType,
	ValidationContext,
	ValidationResult,
	TypeAnnotation,
} from "./BaseType";
import { Type } from "./types";
import { JSONValue } from "../JSONValue";
import {
	Validation,
	ValidationError,
	invalidData,
	validData,
} from "../Validation";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I
) => void
	? I
	: never;

export class IntersectionType<TTypes extends Type[]> extends BaseType<
	UnionToIntersection<TTypes[number]["T"]>
> {
	public static from<TTypes extends Type[]>(
		...types: TTypes
	): IntersectionType<TTypes> {
		return new IntersectionType(types);
	}

	public readonly kind = "intersection";
	constructor(public readonly intersectedTypes: TTypes) {
		super();
	}

	public validate(
		value: JSONValue,
		context: ValidationContext
	): ValidationResult<this["T"]> {
		const errors = new Array<ValidationError>();
		const specificTypes = new Array<TypeAnnotation>();

		for (const i of this.intersectedTypes) {
			const result = context.validateInSameContext(i, value);
			if (!result.isOk) {
				errors.push(...result.errors);
			} else {
				specificTypes.push(result.value.type);
			}
		}

		if (errors.length > 0) {
			return invalidData(...errors);
		}
		return validData({
			value: value as this["T"],
			type: { kind: "abstract", type: this, specificTypes },
		});
	}

	public toTypeDef(): TypeDef {
		return new IntersectionTypeDef(
			this.intersectedTypes.map((t) => t.toTypeDef())
		);
	}
}
