import {
	JSONValue,
	NamespacedName,
	DeserializationResult,
	namespace,
	TypeSystem,
	TypeDefinition,
} from "../..";
import { DelegatingSerializer } from "./DelegatingSerializer";
import { Serializer } from "..";
import { SerializeContext, DeserializeContext } from "../Context";
import { fromEntries } from "../../utils";

export class NamedSerializer<
	TValue,
	TSource extends JSONValue
> extends DelegatingSerializer<TValue, TSource> {
	constructor(
		readonly underlyingSerializer: Serializer<TValue, TSource>,
		public readonly namespacedName: NamespacedName,
		public readonly isDefinition: boolean
	) {
		super();
	}

	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): TSource {
		let newContext = false;
		if (SerializeContext.isDefault(context)) {
			context = new SerializeContext();
			newContext = true;
		}
		const r = this.underlyingSerializer.serializeWithContext(
			value,
			context
		);
		if (newContext) {
			if (typeof r !== "object" || Array.isArray(r) || !r) {
				throw new Error("Invalid context");
			}
			r["$ns"] = fromEntries(
				[...context.namespaces.entries()].map(([key, value]) => [
					value,
					key,
				])
			);
		}
		return r;
	}

	public getSerializerFor(
		type: NamespacedName
	): Serializer<TValue, TSource> | undefined {
		if (type.equals(this.namespacedName)) {
			return this.underlyingSerializer;
		}
		return this.underlyingSerializer.getSerializerFor(type);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<TValue> {
		if (typeof value === "object" && value && "$ns" in value) {
			const ns = value["$ns"] as object;
			delete value["$ns"];
			context = new DeserializeContext(context);
			for (const [prefix, nsValue] of Object.entries(ns)) {
				if (typeof nsValue !== "string") {
					throw new Error(
						`${nsValue} has invalid type. Must be string.`
					);
				}
				context.namespaces.set(prefix, namespace(nsValue));
			}
		}

		let type: NamespacedName | undefined = undefined;
		if (typeof value === "object" && value && "$type" in value) {
			const typeName = value["$type"] as string;
			const regExp = /(.*)#(.*)/;
			const m = regExp.exec(typeName);
			if (m) {
				const nsPrefix = m[1];
				const name = m[2];
				const ns = context.lookupNamespace(nsPrefix);
				type = ns(name);
			} else {
				throw new Error(`Malformed type "${typeName}"`);
			}
			delete value["$type"];
		}

		if (type) {
			const s = this.getSerializerFor(type);
			if (!s) {
				throw new Error(`Invalid type ${type}.`);
			}
			return s.deserializeWithContext(value, context);
		}
		return super.deserializeWithContext(value, context);
	}

	public getType(typeSystem: TypeSystem): TypeDefinition {
		if (this.isDefinition && !typeSystem.isTypeKnown(this.namespacedName)) {
			typeSystem.getOrCreateType(this.namespacedName);
			const definingType = this.underlyingSerializer.getType(typeSystem);
			typeSystem.defineType(this.namespacedName, definingType);
		}
		return typeSystem.getOrCreateType(this.namespacedName);
	}
}
