import { BaseSerializer } from "./BaseSerializer";
import {
	Namespace,
	JSONValue,
	Validation,
	invalidData,
	validData,
	TypeSystem,
	Type,
	StringType,
} from "../..";
import { SerializeContext, DeserializeContext } from "../Context";

class NamespaceSerializer extends BaseSerializer<Namespace, string> {
	public canSerialize(value: unknown): value is Namespace {
		return !!(typeof value === "object" && value && "namespace" in value);
	}
	public serializeWithContext(
		value: Namespace,
		context: SerializeContext
	): string {
		return context.getPrefixForNamespace(value);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): Validation<Namespace> {
		if (typeof value !== "string") {
			return invalidData({ message: "must be of type string" });
		}
		const ns = context.lookupNamespace(value);
		return validData(ns);
	}

	public getType(typeSystem: TypeSystem): Type {
		return new StringType();
	}
}

export const sNamespace = new NamespaceSerializer();
