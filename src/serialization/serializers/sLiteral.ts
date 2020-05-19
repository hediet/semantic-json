import { BaseSerializer } from "./BaseSerializer";

import {
	JSONValue,
	Validation,
	invalidData,
	validData,
	TypeSystem,
	Type,
	LiteralType,
} from "../..";

export function sLiteral<T extends string | number | boolean>(
	literal: T
): LiteralSerializer<T> {
	return new LiteralSerializer(literal);
}

class LiteralSerializer<
	T extends string | number | boolean
> extends BaseSerializer<T, T> {
	constructor(public readonly value: T) {
		super();
	}

	public canSerialize(value: unknown): value is T {
		return value === this.value;
	}

	public serializeWithContext(value: T): T {
		return (value as any) as T;
	}

	public deserializeWithContext(value: JSONValue): Validation<T> {
		if (value !== this.value) {
			return invalidData({
				message: `Expected "${this.value}" but got "${value}".`,
			});
		}

		return validData(value as T);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new LiteralType(this.value);
	}
}
