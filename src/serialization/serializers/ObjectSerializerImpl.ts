import { BaseSerializerImpl } from "../BaseSerializer";
import { Serializer, SerializerOfKind } from "../Serializer";
import { JSONValue } from "../../JSONValue";
import { DeserializeContext } from "../DeserializeContext";
import {
	DeserializeResult,
	DeserializeError,
	UnexpectedPropertyTree,
} from "../DeserializeResult";
import { SerializeContext } from "../SerializeContext";
import {
	isValueOfType,
	getTypeMismatchMessage,
} from "../getTypeMismatchMessage";
import { SerializerSystem } from "../SerializerSystem";
import {
	SchemaDef,
	IntersectionSchemaDef,
	ObjectSchemaDef,
	ObjectPropertyDef,
} from "../../schema/schemaDefs";
import { fromEntries } from "../../utils";

export interface ObjectSerializer {
	kind: "object";
	properties: Record<string, ObjectSerializerProperty<any>>;
	allowUnknownProperties: boolean;
	propertiesList: ObjectSerializerProperty<unknown>[];
	opened(): this;
}

export class ObjectSerializerImpl<T extends Record<string, unknown> = any>
	extends BaseSerializerImpl<T, ObjectSerializer>
	implements ObjectSerializer {
	public readonly kind = "object";

	constructor(
		public readonly properties: {
			readonly [TName in keyof T]: ObjectSerializerProperty<T[TName]>;
		},
		public readonly allowUnknownProperties: boolean
	) {
		super();
	}

	get propertiesList(): ObjectSerializerProperty<unknown>[] {
		return [...Object.values(this.properties)];
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T> {
		if (!isValueOfType(source, "object")) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(source, { type: "object" }),
			});
		}

		const errors = new Array<DeserializeError>();
		const result: any = {};
		if (this.allowUnknownProperties) {
			// we want to keep unknown properties
			// known properties will be overwritten
			Object.assign(result, source);
		}

		const innerContext = context.withFirstDeserializationOnValue();
		let propertyInfos:
			| Record<string | number, UnexpectedPropertyTree>
			| undefined = undefined;
		const unexpectedProperties = this.allowUnknownProperties
			? new Set<string>()
			: new Set<string>(Object.keys(source).filter((s) => s !== "$ns"));
		for (const prop of this.propertiesList) {
			if (!(prop.name in source)) {
				if (!prop.isOptional) {
					errors.push(
						DeserializeError.from({
							message: `Required property "${prop.name}" is missing.`,
						})
					);
				} else if (prop.defaultValue) {
					result[prop.name] = prop.defaultValue.value;
				}
			} else {
				const propVal = (source as any)[prop.name];
				unexpectedProperties.delete(prop.name);
				const newPropVal = prop.serializer.deserialize(
					propVal,
					innerContext
				);

				if (newPropVal.unprocessedPropertyTree) {
					if (!propertyInfos) {
						propertyInfos = {};
					}
					propertyInfos[prop.name] =
						newPropVal.unprocessedPropertyTree;
				}

				errors.push(
					...newPropVal.errors.map((e) => e.prependPath(prop.name))
				);
				if (newPropVal.hasValue) {
					result[prop.name] = newPropVal.value;
				} else {
					result[prop.name] = undefined;
				}
			}
		}

		let unexpectedPropTree: UnexpectedPropertyTree | undefined = undefined;
		if (propertyInfos || unexpectedProperties.size !== 0) {
			unexpectedPropTree = new UnexpectedPropertyTree(
				propertyInfos || {},
				unexpectedProperties
			);
		}

		return new DeserializeResult(true, result, errors, unexpectedPropTree);
	}

	protected internalCanSerialize(value: unknown): value is T {
		if (!isValueOfType(value, "object")) {
			return false;
		}

		// does it have all required fields?
		for (const [propName, prop] of Object.entries(this.properties)) {
			if (!(propName in value)) {
				if (!prop.isOptional) {
					return false;
				}
			}
		}

		// do the required properties match?
		for (const [propName, prop] of Object.entries(this.properties)) {
			if (propName in value) {
				const fieldVal = (value as any)[propName];
				if (!prop.serializer.canSerialize(fieldVal)) {
					return false;
				}
			}
		}

		return true;
	}

	protected internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue {
		if (!isValueOfType(value, "object")) {
			throw new Error(getTypeMismatchMessage(value, { type: "object" }));
		}

		const result: Record<string, JSONValue> = {};
		for (const prop of this.propertiesList) {
			if (prop.name in value) {
				const v = (value as any)[prop.name];
				if (!prop.isOptional || v !== undefined) {
					const val = prop.serializer.serialize(v, context);
					result[prop.name] = val;
				}
			} else {
			}
		}

		if (this.allowUnknownProperties) {
			for (const [k, v] of Object.entries(value)) {
				if (!result.hasOwnProperty(k)) {
					result[k] = v as JSONValue;
				}
			}
		}

		return result as any;
	}

	public opened(): this {
		return new ObjectSerializerImpl(this.properties, true) as any;
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return new ObjectSchemaDef(
			fromEntries(
				this.propertiesList.map((p) => [
					p.name,
					p.toSchema(serializerSystem),
				])
			)
		);
	}
}

export type ObjectPropertyKind =
	| "ordinary"
	| "optional"
	| "optionalWithDefault";

export class ObjectSerializerProperty<
	T = any,
	TKind extends ObjectPropertyKind = ObjectPropertyKind
> {
	get T(): T {
		throw new Error("Not meant to be accessed at runtime!");
	}

	get TKind(): TKind {
		throw new Error("Not meant to be accessed at runtime!");
	}

	constructor(
		public readonly name: string,
		public readonly serializer: Serializer<T>,
		public readonly description: string | undefined,
		public readonly isOptional: boolean,
		public readonly defaultValue: { value: T } | undefined
	) {}

	public withName(newName: string): ObjectSerializerProperty<T, TKind> {
		return new ObjectSerializerProperty(
			newName,
			this.serializer,
			this.description,
			this.isOptional,
			this.defaultValue
		);
	}

	public toSchema(serializerSystem: SerializerSystem): ObjectPropertyDef {
		const defaultValue = this.defaultValue
			? this.serializer.serialize(this.defaultValue.value)
			: undefined;
		return new ObjectPropertyDef(
			this.serializer.toSchema(serializerSystem),
			this.isOptional,
			defaultValue
		);
	}
}

type Force<T> = { val: { [TKey in keyof T]: T[TKey] } }["val"];

export function sOpenObject<
	TProperties extends ObjectSerializerPropertiesOptions
>(
	properties: TProperties,
	options?: {}
): SerializerOfKind<"object", Force<ObjectSerializerTypeCtor<TProperties>>> {
	return sObject<TProperties>(properties, {
		allowUnknownProperties: true,
	});
}

export function sObject<TProperties extends ObjectSerializerPropertiesOptions>(
	properties: TProperties,
	options?: {
		allowUnknownProperties?: boolean;
	}
): SerializerOfKind<"object", Force<ObjectSerializerTypeCtor<TProperties>>> {
	options = options || {};
	return new ObjectSerializerImpl<any>(
		normalizeProperties(properties),
		!!options.allowUnknownProperties
	);
}

export type ObjectSerializerPropertiesOptions = Record<
	string,
	ObjectSerializerProperty | Serializer
>;

function normalizeProperties<T extends ObjectSerializerPropertiesOptions>(
	props: T
): Record<string, ObjectSerializerProperty> {
	const normalizedProps: Record<string, ObjectSerializerProperty> = {};
	for (const [name, val] of Object.entries(props)) {
		if ("deserialize" in val) {
			normalizedProps[name] = new ObjectSerializerProperty(
				name,
				val,
				undefined,
				false,
				undefined
			);
		} else if (val instanceof ObjectSerializerProperty) {
			if (!val) {
				console.log(props);
			}
			normalizedProps[name] = val.withName(name);
		} else {
			throw new Error(`Unexpected field type: ${val}`);
		}
	}
	return normalizedProps;
}

export function optionalProp<TType>(
	serializer: Serializer<TType>,
	objectPropInfo: ObjectPropInfo = {}
): ObjectSerializerProperty<TType, "optional"> {
	return new ObjectSerializerProperty(
		"(not set yet)",
		serializer,
		objectPropInfo.description,
		true,
		undefined
	);
}

export function prop<TType>(
	serializer: Serializer<TType>,
	objectPropInfo: ObjectPropInfo & {
		optional: { withDefault: TType };
	}
): ObjectSerializerProperty<TType, "optionalWithDefault">;
export function prop<TType>(
	serializer: Serializer<TType>,
	objectPropInfo: ObjectPropInfo & { optional: true }
): ObjectSerializerProperty<TType, "optional">;
export function prop<TType>(
	serializer: Serializer<TType>,
	objectPropInfo: ObjectPropInfo & {
		optional?: boolean | { withDefault: TType };
	}
): ObjectSerializerProperty<TType, "ordinary">;
export function prop(
	serializer: Serializer<any>,
	objectPropInfo: ObjectPropInfo & {
		optional?: boolean | { withDefault: any };
	}
): ObjectSerializerProperty<any, any> {
	let defaultVal = undefined;
	if (
		typeof objectPropInfo.optional === "object" &&
		"withDefault" in objectPropInfo.optional
	) {
		defaultVal = { value: objectPropInfo.optional.withDefault };
	}
	return new ObjectSerializerProperty(
		"(not set yet)",
		serializer,
		objectPropInfo.description,
		!!objectPropInfo.optional,
		defaultVal
	);
}

export interface ObjectPropInfo {
	description?: string;
}

const t: ObjectSerializerTypeCtor<{
	foo: ObjectSerializerImpl<{ baz: number }>;
}> = null as any;

export type ObjectSerializerTypeCtor<
	TProps extends ObjectSerializerPropertiesOptions
> = {
	[TKey in PropertiesWith<
		TProps,
		"ordinary" | "optionalWithDefault"
	>]: TProps[TKey]["T"];
} &
	{
		[TKey in PropertiesWith<TProps, "optional">]?: TProps[TKey]["T"];
	};

export type PropertiesWith<
	TProps extends ObjectSerializerPropertiesOptions,
	TKind extends ObjectPropertyKind
> = {
	[TKey in keyof TProps]: TProps[TKey] extends ObjectSerializerProperty<
		any,
		TKind
	>
		? TKey
		: TProps[TKey] extends Serializer<any>
		? TKind extends "ordinary"
			? TKey
			: never
		: never;
}[keyof TProps];
