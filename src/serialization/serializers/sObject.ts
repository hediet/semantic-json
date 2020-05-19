import { Serializer } from "../Serializer";
import { BaseSerializer } from "./BaseSerializer";
import { JSONValue } from "../../JSONValue";
import { ObjectType, ObjectProperty, Type } from "../../types";
import { TypeSystem } from "../../types/TypeSystem";
import {
	ValidationError,
	Validation,
	invalidData,
	validData,
} from "../../Validation";
import { fromEntries } from "../../utils";
import { DeserializeContext, SerializeContext } from "../Context";

export function sObject<T extends ObjectPropertiesOptions>(
	properties: T
): ObjectSerializer<ObjectTypeCtor<T>> {
	const normalizedProps = normalizeProperties(properties);
	return new ObjectSerializer<ObjectTypeCtor<T>>(normalizedProps);
}

export class ObjectSerializer<
	TProps extends ObjectProperties
> extends BaseSerializer<PropsToTValue<TProps>, PropsToTSource<TProps>> {
	constructor(
		private readonly properties: Record<string, PropertyInfo<any>>
	) {
		super();
	}

	get TValue(): PropsToTValue<TProps> {
		throw new Error("only for compiletime");
	}

	public canSerialize(value: unknown): value is PropsToTValue<TProps> {
		if (typeof value !== "object" || value === null) {
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

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): Validation<PropsToTValue<TProps>> {
		if (typeof value !== "object" || value === null) {
			return invalidData({
				message: `Expected an object, but got a ${typeof value}.`,
			});
		}
		const errors = new Array<ValidationError>();
		const result: any = {};
		for (const [propName, prop] of Object.entries(this.properties)) {
			if (!(propName in value)) {
				if (!prop.isOptional) {
					errors.push(
						new ValidationError({
							message: `Required property "${propName}" is missing.`,
						})
					);
				} else if (prop.defaultValue) {
					//debugger;
					result[propName] = prop.defaultValue.value;
				}
			} else {
				const propVal = (value as any)[propName];
				const newPropVal = prop.serializer.deserializeWithContext(
					propVal,
					context
				);
				if (!newPropVal.isOk) {
					errors.push(
						...newPropVal.errors.map((e) => e.prependPath(propName))
					);
				} else {
					result[propName] = newPropVal.value;
				}
			}
		}

		for (const [propName, propVal] of Object.entries(value)) {
			/*if (fieldName === "$ns" || fieldName === "$type") {
				// the parent handles these fields.
				continue;
			}*/
			const prop = this.properties[propName];
			if (!prop) {
				errors.push(
					new ValidationError({
						message: `Property "${propName}" is not expected here.`,
						path: [propName],
					})
				);
			}
		}

		if (errors.length > 0) {
			return invalidData(...errors);
		}

		return validData(result);
	}

	public serializeWithContext(
		value: PropsToTValue<TProps>,
		context: SerializeContext
	): PropsToTSource<TProps> {
		const result: Record<string, JSONValue> = {};
		for (const [propName, prop] of Object.entries(this.properties)) {
			if (propName in value) {
				const v = (value as any)[propName];
				if (!prop.isOptional || v !== undefined) {
					const val = prop.serializer.serializeWithContext(
						v,
						context
					);
					result[propName] = val;
				}
			} else {
			}
		}

		return result as PropsToTSource<TProps>;
	}

	public getType(typeSystem: TypeSystem): Type {
		return new ObjectType(
			fromEntries(
				Object.entries(this.properties).map(([key, val]) => [
					key,
					new ObjectProperty(
						key,
						val.serializer.getType(typeSystem),
						val.isOptional,
						val.defaultValue
					),
				])
			)
		);
	}
}

export type PropKind = "ordinary" | "optional" | "optionalWithDefault";

export interface PropType<
	TValue,
	TSource extends JSONValue,
	TKind extends PropKind
> {
	serializer: Serializer<TValue, TSource>;
	kind: TKind;
}

export class PropertyInfo<
	TValue = any,
	TSource extends JSONValue = any,
	TKind extends PropKind = PropKind
> {
	get T(): PropType<TValue, TSource, TKind> {
		throw new Error("Not meant to be accessed at runtime!");
	}

	constructor(
		public readonly name: string,
		public readonly serializer: Serializer<TValue, TSource>,
		public readonly description: string | undefined,
		public readonly isOptional: boolean,
		public readonly defaultValue: { value: TValue } | undefined
	) {}

	public withName(newName: string): PropertyInfo<TValue, TSource, TKind> {
		return new PropertyInfo(
			newName,
			this.serializer,
			this.description,
			this.isOptional,
			this.defaultValue
		);
	}
}

export type ObjectProperties = Record<string, PropType<any, any, PropKind>>;
export type AsObjectProperties<T extends ObjectProperties> = T;

export type PropertiesWith<
	TProps extends ObjectProperties,
	TKind extends PropKind
> = {
	[TKey in keyof TProps]: TProps[TKey] extends PropType<any, any, TKind>
		? TKey
		: never;
}[keyof TProps];

export type Simplify<T extends object> = T; //{ [TKey in keyof T]: T[TKey] };

export type PropsToTValue<TProps extends ObjectProperties> = Simplify<
	{
		[TKey in PropertiesWith<
			TProps,
			"ordinary" | "optionalWithDefault"
		>]: TProps[TKey]["serializer"]["TValue"];
	} &
		{
			[TKey in PropertiesWith<
				TProps,
				"optional"
			>]?: TProps[TKey]["serializer"]["TValue"];
		}
>;

export type PropsToTSource<TProps extends ObjectProperties> = Simplify<
	{
		[TKey in PropertiesWith<
			TProps,
			"ordinary"
		>]: TProps[TKey]["serializer"]["TSource"];
	} &
		{
			[TKey in PropertiesWith<
				TProps,
				"optional" | "optionalWithDefault"
			>]?: TProps[TKey]["serializer"]["TSource"];
		}
>;

export type ObjectPropertiesOptions = Record<
	string,
	PropertyInfo | Serializer<any, any>
>;

export function normalizeProperties<T extends ObjectPropertiesOptions>(
	propsp: T
): Record<string, PropertyInfo> {
	const normalizedProps: Record<string, PropertyInfo> = {};
	for (const [name, val] of Object.entries(propsp)) {
		if ("serialize" in val) {
			normalizedProps[name] = new PropertyInfo(
				name,
				val,
				undefined,
				false,
				undefined
			);
		} else if (val instanceof PropertyInfo) {
			if (!val) {
				console.log(propsp);
			}
			normalizedProps[name] = val.withName(name);
		} else {
			throw new Error(`Unexpected field type: ${val}`);
		}
	}
	return normalizedProps;
}

export type ObjectTypeCtor<
	T extends ObjectPropertiesOptions
> = AsObjectProperties<
	{
		[TKey in keyof T]: T[TKey] extends {
			TValue: any;
			TSource: any;
		}
			? PropType<T[TKey]["TValue"], T[TKey]["TSource"], "ordinary">
			: T[TKey] extends PropertyInfo<any>
			? T[TKey]["T"]
			: never;
	}
>;

export interface ObjectPropertyDescription<TValue, TSource extends JSONValue> {
	serializer: Serializer<TValue, TSource>;
	description?: string;
}

export function sObjectProp<TType, TSource extends JSONValue>(
	options: ObjectPropertyDescription<TType, TSource> & {
		optional: { withDefault: TType };
	}
): PropertyInfo<TType, TSource, "optionalWithDefault">;
export function sObjectProp<TType, TSource extends JSONValue>(
	options: ObjectPropertyDescription<TType, TSource> & { optional: true }
): PropertyInfo<TType, TSource, "optional">;
export function sObjectProp<TType, TSource extends JSONValue>(
	options: ObjectPropertyDescription<TType, TSource> & {
		optional?: boolean | { withDefault: TType };
	}
): PropertyInfo<TType, TSource, "ordinary">;
export function sObjectProp(
	options: ObjectPropertyDescription<any, any> & {
		optional?: boolean | { withDefault: any };
	}
): PropertyInfo<any, any, any> {
	let defaultVal = undefined;
	if (
		typeof options.optional === "object" &&
		"withDefault" in options.optional
	) {
		defaultVal = { value: options.optional.withDefault };
	}
	return new PropertyInfo(
		"(not set yet)",
		options.serializer,
		options.description,
		!!options.optional,
		defaultVal
	);
}
