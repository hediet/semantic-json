import { JSONValue } from "./test";

class JsonEncoder<T> {
	decode(val: JSONValue): DecodeResult<T>;
	encode(val: T): JSONValue;
}

class QualifiedName {}
