import { JSONValue } from "../../JSONValue";
import {
	DeserializationResult,
	deserializationValue,
} from "../../BaseDeserializationResult";
import { AnyType, Type, TypeSystem } from "../../types/types";
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

	public deserializeWithContext(value: JSONValue): DeserializationResult<T> {
		return deserializationValue(value as T);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new AnyType();
	}
}

export const sAny = new DowncastSerializer<any>();
