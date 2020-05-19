import { JSONValue } from "../../JSONValue";
import { Validation, validData } from "../../Validation";
import { AnyType, Type } from "../../types";
import { TypeSystem } from "../../types/TypeSystem";
import { BaseSerializer } from "./BaseSerializer";

export class DowncastSerializer<T extends JSONValue> extends BaseSerializer<
	T,
	T
> {
	public canSerialize(value: unknown): value is T {
		return true;
	}

	public serializeWithContext(value: T): T {
		return (value as any) as T;
	}

	public deserializeWithContext(value: JSONValue): Validation<T> {
		return validData(value as T);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new AnyType();
	}
}

export const sAny = new DowncastSerializer<any>();
