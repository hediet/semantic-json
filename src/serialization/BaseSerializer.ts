import { JSONValue } from "../JSONValue";
import { DeserializeContext } from "./DeserializeContext";
import { DeserializeResult, DeserializeError } from "./DeserializeResult";
import { NamespacedName, namespace } from "../NamespacedNamed";
import { Serializer, NamedSerializer, SerializerOfKind } from "./Serializer";
import { fromEntries } from "../utils";
import { SerializeContext } from "./SerializeContext";

export abstract class BaseSerializer<T> {
	public get T(): T {
		throw new Error("Only for compile time");
	}

	public asSerializer(): Serializer<T> {
		return this as any;
	}

	public deserialize(
		source: JSONValue,
		context: DeserializeContext = DeserializeContext.default
	): DeserializeResult<T> {
		if (source === undefined) {
			throw new Error("Got 'undefined' which is not valid JSON!");
		}

		if (typeof source === "object" && source !== null) {
			if ("$ns" in source && context.firstDeserializationOnValue) {
				const ns = source["$ns"] as object;

				context = context.withPrefixes(
					fromEntries(
						Object.entries(ns).map(([key, nsValue]) => {
							if (typeof nsValue !== "string") {
								// todo don't throw
								throw new Error(
									`${nsValue} has invalid type. Must be string.`
								);
							}
							return [key, namespace(nsValue)];
						})
					)
				);
			}
		}

		const r = this.internalDeserialize(source, context);

		if (typeof source === "object" && source !== null) {
			if (
				context.firstDeserializationOnValue &&
				r.participatedClosedObjects.length > 0
			) {
				const unexpectedProperties = new Set(Object.keys(source));
				for (const o of r.participatedClosedObjects) {
					if (o.allowUnknownProperties) {
						unexpectedProperties.clear();
						break;
					}
					for (const p of o.propertiesList) {
						unexpectedProperties.delete(p.name);
					}
				}
				if (unexpectedProperties.size > 0) {
					const errors = r.errors.slice(0);
					for (const unexpectedPropName of unexpectedProperties) {
						if (unexpectedPropName === "$ns") {
							continue;
						}
						errors.push(
							DeserializeError.from({
								message: `Unexpected property "${unexpectedPropName}"`,
								path: [unexpectedPropName],
							})
						);
					}
					return new DeserializeResult(
						r.hasValue,
						r.value,
						errors,
						[]
					);
				}
			}
		}
		return r;
	}

	public defineAs(name: NamespacedName): NamedSerializer<T> {
		return new NamedSerializerImpl(
			(this as any) as Serializer<T>,
			name,
			true
		);
	}

	public knownAs(name: NamespacedName): NamedSerializer<T> {
		return new NamedSerializerImpl<T>(
			(this as any) as Serializer<T>,
			name,
			false
		);
	}

	public refine<TNew>(refinement: Refinement<TNew, T>): Serializer<TNew> {
		return new RefinedSerializerImpl<TNew, T>(this as any, refinement);
	}

	protected abstract internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T>;

	public canSerialize(value: unknown): value is T {
		return this.internalCanSerialize(value);
	}

	protected abstract internalCanSerialize(value: unknown): value is T;

	public serialize(value: T, context?: SerializeContext): JSONValue {
		if (!context) {
			context = new SerializeContext();
		}

		let prefixesEnabled = context.prefixesEnabled;
		if (!prefixesEnabled) {
			context.prefixesEnabled = true;
		}

		const result = this.internalSerialize(value, context);

		if (!prefixesEnabled) {
			if (typeof result === "object" && result !== null) {
				const definedPrefixes = context.getDefinedPrefixes();
				if (definedPrefixes.length > 0) {
					const prefixes: Record<string, string> = {};
					if ("$ns" in (result as any)) {
						throw new Error("This is unexpected");
					}
					(result as any)["$ns"] = prefixes;
					for (const { prefix, namespace } of definedPrefixes) {
						prefixes[prefix] = namespace;
					}
				}

				context.prefixesEnabled = false;
			}
		}

		return result;
	}

	protected abstract internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue;
}

export abstract class BaseSerializerImpl<T, TInterface> extends BaseSerializer<
	T
> {
	public get TInterface(): TInterface {
		throw new Error("Only For Runtime");
	}

	public get TSerializer(): TInterface & BaseSerializer<T> {
		throw new Error("Only For Runtime");
	}
}

export type Refinement<T, TIntermediate> =
	| {
			canSerialize: (value: unknown) => value is T;
			fromIntermediate: (
				value: TIntermediate,
				context: DeserializeContext
			) => DeserializeResult<T> | T;
			toIntermediate: (
				value: T,
				context: SerializeContext
			) => TIntermediate;
	  }
	| {
			class: new (...args: any[]) => T;
			canSerializeInstance?: (value: T) => boolean;
			fromIntermediate: (
				value: TIntermediate,
				context: DeserializeContext
			) => DeserializeResult<T> | T;
			toIntermediate: (
				value: T,
				context: SerializeContext
			) => TIntermediate;
	  };

import { NamedSerializerImpl, RefinedSerializerImpl } from "./serializers";
