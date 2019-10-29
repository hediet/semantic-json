import {
	DowncastSerializer,
	LiteralSerializer,
	TypeSerializer,
	ArraySerializer,
} from "./simpleSerializers";
import { Serializer } from "./Serializer";

export function sDowncast<T>(): DowncastSerializer<T> {
	return new DowncastSerializer();
}

export function sLiteral<
	T extends string | null | undefined | number | boolean
>(val: T): LiteralSerializer<T> {
	return new LiteralSerializer(val);
}

export const sNull = sLiteral(null);
export const sUndefined = sLiteral(undefined);

export const sString = new TypeSerializer("string");
export const sBoolean = new TypeSerializer("boolean");
export const sNumber = new TypeSerializer("number");

export { sObject, field } from "./ObjectSerializer";

export function sArray<T, TOther>(itemSerializer: Serializer<T, TOther>) {
	return new ArraySerializer<T, TOther>(itemSerializer);
}
