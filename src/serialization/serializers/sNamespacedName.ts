import { BaseSerializer } from "./BaseSerializer";
import {
	NamespacedName,
	namespace,
	JSONValue,
	Validation,
	invalidData,
	validData,
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
	): Validation<NamespacedName> {
		if (typeof value !== "string") {
			return invalidData({ message: "must be of type string" });
		}
		const regExp = /(.*)#(.*)/;
		const m = regExp.exec(value);
		if (m) {
			const nsPrefix = m[1];
			const name = m[2];
			const ns = context.lookupNamespace(nsPrefix);
			return validData(ns(name));
		} else {
			throw new Error(`Malformed type "${value}"`);
		}
	}

	public getType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export const sNamespacedName = new NamespacedNameSerializer();
