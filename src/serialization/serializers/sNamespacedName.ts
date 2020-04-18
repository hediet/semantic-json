import { BaseSerializer } from "./BaseSerializer";
import {
	NamespacedName,
	namespace,
	JSONValue,
	DeserializationResult,
	deserializationError,
	deserializationValue,
	TypeSystem,
	Type,
	StringType,
} from "../..";
import { SerializeContext, DeserializeContext } from "../Context";

class NamespacedNameSerializer extends BaseSerializer<NamespacedName, string> {
	public canSerialize(value: unknown): value is NamespacedName {
		return value instanceof NamespacedName;
	}

	public serializeWithContext(
		value: NamespacedName,
		context: SerializeContext
	): string {
		const prefix = context.getPrefixForNamespace(
			namespace(value.namespace)
		);
		return `${prefix}#${value.name}`;
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<NamespacedName> {
		if (typeof value !== "string") {
			return deserializationError({ message: "must be of type string" });
		}
		const regExp = /(.*)#(.*)/;
		const m = regExp.exec(value);
		if (m) {
			const nsPrefix = m[1];
			const name = m[2];
			const ns = context.lookupNamespace(nsPrefix);
			return deserializationValue(ns(name));
		} else {
			throw new Error(`Malformed type "${value}"`);
		}
	}

	public getType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export const sNamespacedName = new NamespacedNameSerializer();
