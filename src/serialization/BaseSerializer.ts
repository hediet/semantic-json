import { JSONValue } from "../JSONValue";
import { DeserializeContext } from "./DeserializeContext";
import {
	DeserializeResult,
	DeserializeError,
	UnexpectedPropertyTree,
} from "./DeserializeResult";
import { NamespacedName, namespace } from "../NamespacedNamed";
import { Serializer, NamedSerializer } from "./Serializer";
import { fromEntries } from "../utils";
import { SerializeContext } from "./SerializeContext";

/**
 * Represents the base class for all serializer implementations.
 * Don't extend it outside this library!
 * This class does not allow for easy reflection.
 * Use the `Serialize<T>` type to get type narrowing!
 */
export abstract class BaseSerializer<T> {
	public get T(): T {
		throw new Error("Only for compile time");
	}

	/**
	 * Casts this serializer to the union serializer type.
	 * Sometimes, `BaseSerialize<T>` allows to avoid certain typescript type errors.
	 * Use this method to go back to `Serialize<T>`.
	 */
	public asSerializer(): Serializer<T> {
		return this as any;
	}

	/**
	 * Converts the given json value to an instance of T.
	 */
	public deserialize(
		source: JSONValue,
		context: DeserializeContext = DeserializeContext.default
	): DeserializeResult<T> {
		if (source === undefined) {
			throw new Error("Got 'undefined' which is not valid JSON!");
		}

		let childContext = context.withoutReportUnexpectedPropertiesAsError();

		if (typeof source === "object" && source !== null) {
			if (
				childContext.firstDeserializationAttemptOfValue &&
				"$ignoreUnexpectedProperties" in source &&
				source["$ignoreUnexpectedProperties"] === true
			) {
				context = context.withoutReportUnexpectedPropertiesAsError();
			}

			if (
				"$ns" in source &&
				childContext.firstDeserializationAttemptOfValue
			) {
				const ns = source["$ns"] as object;

				childContext = childContext.withPrefixes(
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

		let r = this.internalDeserialize(source, childContext);

		if (context.reportUnexpectedPropertiesAsError) {
			const errors = [...r.errors];
			const processPropertyTree = (
				path: (number | string)[],
				tree: UnexpectedPropertyTree
			) => {
				for (const unexpectedPropName of tree.unprocessedProperties) {
					errors.push(
						DeserializeError.from({
							message: `Unexpected property "${unexpectedPropName}"`,
							path: [...path, unexpectedPropName],
						})
					);
				}
				for (const [key, value] of Object.entries(tree.properties)) {
					processPropertyTree([...path, key], value);
				}
			};

			if (r.unprocessedPropertyTree) {
				processPropertyTree([], r.unprocessedPropertyTree);
			}
			r = new DeserializeResult(
				r.hasValue,
				r.value,
				errors,
				r.unprocessedPropertyTree
			);
		}

		return r;
	}

	/**
	 * Creates a named serializer.
	 * This does not change the semantics of the serializer.
	 */
	public defineAs(name: NamespacedName): NamedSerializer<T> {
		return new NamedSerializerImpl((this as any) as Serializer<T>, name);
	}

	/**
	 * Creates a new serializer that post-processes deserialized values
	 * and preprocesses values that are about to be serialized.
	 */
	public refine<TNew>(refinement: Refinement<TNew, T>): Serializer<TNew> {
		return new RefinedSerializerImpl<TNew, T>(this as any, refinement);
	}

	protected abstract internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T>;

	/**
	 * Tests whether the given value can be serialized by this serializer.
	 * If so, the value must be of type `T`.
	 */
	public canSerialize(value: unknown): value is T {
		return this.internalCanSerialize(value);
	}

	protected abstract internalCanSerialize(value: unknown): value is T;

	/**
	 * Converts the given value to json.
	 */
	public serialize(value: T, context?: SerializeContext): JSONValue {
		if (!context) {
			context = new SerializeContext();
		}

		let prefixesEnabled = context.prefixesEnabled;
		if (!prefixesEnabled) {
			context = new SerializeContext(true);
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
			}
		}

		return result;
	}

	protected abstract internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue;

	public abstract toSchema(serializerSystem: SerializerSystem): SchemaDef;
}

export abstract class BaseSerializerImpl<
	T,
	TInterface
> extends BaseSerializer<T> {
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
import { SchemaDef } from "../schema/schemaDefs";
import { SerializerSystem } from "./SerializerSystem";
