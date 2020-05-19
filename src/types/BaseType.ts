import { TypeDef } from "../schema/typeDefs";
import { ExcludeType, Type, NarrowType } from "./types";
import { JSONValue } from "../JSONValue";
import { Validation } from "../Validation";

export abstract class BaseType<T> {
	public get T(): T {
		throw new Error();
	}

	public abstract validate(
		value: JSONValue,
		context: ValidationContext
	): ValidationResult<T>;

	public abstract toTypeDef(): TypeDef;

	public resolveUnion(): ExcludeType<"union">[] {
		return [this as any];
	}

	public resolveDefinition(): ExcludeType<"definition"> {
		return this as any;
	}
}

export type ValidationResult<T> = Validation<{
	value: T;
	type: TypeAnnotation;
}>;

class BaseTypeAnnotation<T extends Type> {
	constructor(public readonly type: T) {}

	public ab;
}

class ObjectTypeAnnotation extends BaseTypeAnnotation<
	NarrowType<"object" | "map">
> {
	public readonly kind = "object";
}

export type TypeAnnotation =
	| {
			kind: "specific";
			type: NarrowType<
				"any" | "boolean" | "literal" | "null" | "number" | "string"
			>;
	  }
	| {
			kind: "object";
			type: NarrowType<"object" | "map">;
			properties: Record<string, TypeAnnotation>;
	  }
	| {
			kind: "array";
			type: NarrowType<"array">;
			items: TypeAnnotation[];
	  }
	| {
			kind: "abstract";
			type: NarrowType<"definition" | "intersection">;
			specificTypes: TypeAnnotation[];
	  }
	| {
			kind: "union";
			type: NarrowType<"union">;
			possibilities: TypeAnnotation[];
	  };

type TestAssignability<T1, T2 extends T1> = T1 & T2;
type X = TestAssignability<TypeAnnotation["type"]["kind"], Type["kind"]>;

export class ValidationContext {
	validate<T>(type: Type<T>, val: JSONValue): ValidationResult<T> {
		const result = this.validateInSameContext(type, val);

		return result;
	}

	validateInSameContext<T>(
		type: Type<T>,
		val: JSONValue
	): ValidationResult<T> {
		return type.validate(val, this);
	}
}
