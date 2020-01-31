import {
	Serializer,
	BaseSerializer,
	DeserializeContext,
	SerializeContext,
} from "./Serializer";
import { JSONValue } from "../JSONValue";
import { TypeSystem, ObjectType, ObjectProperty, Type } from "../schema/types";
import {
	DeserializationError,
	DeserializationResult,
	deserializationError,
	deserializationValue,
} from "../result";
import { fromEntries } from "../utils";

export class ObjectSerializer<TFields extends Fields> extends BaseSerializer<
	FieldsToTValue<TFields>,
	FieldsToTSource<TFields>
> {
	constructor(private readonly properties: Record<string, FieldInfo<any>>) {
		super();
	}

	get TValue(): FieldsToTValue<TFields> {
		throw new Error("only for compiletime");
	}

	public canSerialize(value: unknown): value is FieldsToTValue<TFields> {
		if (typeof value !== "object" || value === null) {
			return false;
		}

		// does it have all required fields?
		for (const [fieldName, field] of Object.entries(this.properties)) {
			if (!(fieldName in value)) {
				if (!field.isOptional) {
					return false;
				}
			}
		}

		// do the required fields match?
		for (const [fieldName, field] of Object.entries(this.properties)) {
			if (fieldName in value) {
				const fieldVal = (value as any)[fieldName];
				if (!field.serializer.canSerialize(fieldVal)) {
					return false;
				}
			}
		}

		return true;
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): DeserializationResult<FieldsToTValue<TFields>> {
		if (typeof value !== "object" || value === null) {
			return deserializationError({
				message: `Expected an object, but got ${typeof value}.`,
			});
		}
		const errors = new Array<DeserializationError>();
		const result: any = {};
		for (const [fieldName, field] of Object.entries(this.properties)) {
			if (!(fieldName in value)) {
				if (!field.isOptional) {
					errors.push(
						new DeserializationError({
							message: `Required field ${fieldName} is missing.`,
						})
					);
				} else if (field.defaultValue) {
					//debugger;
					result[fieldName] = field.defaultValue.value;
				}
			} else {
				const fieldVal = (value as any)[fieldName];
				const newFieldVal = field.serializer.deserializeWithContext(
					fieldVal,
					context
				);
				if (!newFieldVal.isOk) {
					errors.push(
						...newFieldVal.errors.map(e => e.prependPath(fieldName))
					);
				} else {
					result[fieldName] = newFieldVal.value;
				}
			}
		}

		for (const [propName, fieldVal] of Object.entries(value)) {
			/*if (fieldName === "$ns" || fieldName === "$type") {
				// the parent handles these fields.
				continue;
			}*/
			const field = this.properties[propName];
			if (!field) {
				errors.push(
					new DeserializationError({
						message: `Did not expect field ${propName}.`,
					})
				);
			}
		}

		if (errors.length > 0) {
			return deserializationError(...errors);
		}

		return deserializationValue(result);
	}

	public serializeWithContext(
		value: FieldsToTValue<TFields>,
		context: SerializeContext
	): FieldsToTSource<TFields> {
		const result: Record<string, JSONValue> = {};
		for (const [fieldName, field] of Object.entries(this.properties)) {
			if (fieldName in value) {
				const v = (value as any)[fieldName];
				if (!field.isOptional || v !== undefined) {
					const val = field.serializer.serializeWithContext(
						v,
						context
					);
					result[fieldName] = val;
				}
			} else {
			}
		}

		return result as FieldsToTSource<TFields>;
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

export type FieldKind = "ordinary" | "optional" | "optionalWithDefault";

export interface FieldType<
	TValue,
	TSource extends JSONValue,
	TKind extends FieldKind
> {
	serializer: Serializer<TValue, TSource>;
	kind: TKind;
}

export class FieldInfo<
	TValue = any,
	TSource extends JSONValue = any,
	TKind extends FieldKind = FieldKind
> {
	get T(): FieldType<TValue, TSource, TKind> {
		throw new Error("Not meant to be accessed at runtime!");
	}

	constructor(
		public readonly name: string,
		public readonly serializer: Serializer<TValue, TSource>,
		public readonly description: string | undefined,
		public readonly isOptional: boolean,
		public readonly defaultValue: { value: TValue } | undefined
	) {}

	public withName(newName: string): FieldInfo<TValue, TSource, TKind> {
		return new FieldInfo(
			newName,
			this.serializer,
			this.description,
			this.isOptional,
			this.defaultValue
		);
	}
}

export type Fields = Record<string, FieldType<any, any, FieldKind>>;
export type AsFields<T extends Fields> = T;

export type FieldsWith<TFields extends Fields, TKind extends FieldKind> = {
	[TKey in keyof TFields]: TFields[TKey] extends FieldType<any, any, TKind>
		? TKey
		: never;
}[keyof TFields];

export type Simplify<T extends object> = T; //{ [TKey in keyof T]: T[TKey] };

export type FieldsToTValue<TFields extends Fields> = Simplify<
	{
		[TKey in FieldsWith<
			TFields,
			"ordinary" | "optionalWithDefault"
		>]: TFields[TKey]["serializer"]["TValue"];
	} &
		{
			[TKey in FieldsWith<
				TFields,
				"optional"
			>]?: TFields[TKey]["serializer"]["TValue"];
		}
>;

export type FieldsToTSource<TFields extends Fields> = Simplify<
	{
		[TKey in FieldsWith<
			TFields,
			"ordinary"
		>]: TFields[TKey]["serializer"]["TSource"];
	} &
		{
			[TKey in FieldsWith<
				TFields,
				"optional" | "optionalWithDefault"
			>]?: TFields[TKey]["serializer"]["TSource"];
		}
>;

export type FieldsOptions = Record<string, FieldInfo | Serializer<any, any>>;

export function sObject<T extends FieldsOptions>(
	properties: T
): ObjectSerializer<ObjectTypeCtor<T>> {
	const normalizedFields = normalizeProperties(properties);
	return new ObjectSerializer<ObjectTypeCtor<T>>(normalizedFields);
}

export function normalizeProperties<T extends FieldsOptions>(
	fields: T
): Record<string, FieldInfo> {
	const normalizedFields: Record<string, FieldInfo> = {};
	for (const [name, val] of Object.entries(fields)) {
		if ("serialize" in val) {
			normalizedFields[name] = new FieldInfo(
				name,
				val,
				undefined,
				false,
				undefined
			);
		} else if (val instanceof FieldInfo) {
			if (!val) {
				console.log(fields);
			}
			normalizedFields[name] = val.withName(name);
		} else {
			throw new Error(`Unexpected field type: ${val}`);
		}
	}
	return normalizedFields;
}

export type ObjectTypeCtor<T extends FieldsOptions> = AsFields<
	{
		[TKey in keyof T]: T[TKey] extends {
			TValue: any;
			TSource: any;
		}
			? FieldType<T[TKey]["TValue"], T[TKey]["TSource"], "ordinary">
			: T[TKey] extends FieldInfo<any>
			? T[TKey]["T"]
			: never;
	}
>;

export interface FieldDescription<TValue, TSource extends JSONValue> {
	serializer: Serializer<TValue, TSource>;
	description?: string;
}

export function field<TType, TSource extends JSONValue>(
	options: FieldDescription<TType, TSource> & {
		optional: { withDefault: TType };
	}
): FieldInfo<TType, TSource, "optionalWithDefault">;
export function field<TType, TSource extends JSONValue>(
	options: FieldDescription<TType, TSource> & { optional: true }
): FieldInfo<TType, TSource, "optional">;
export function field<TType, TSource extends JSONValue>(
	options: FieldDescription<TType, TSource> & {
		optional?: boolean | { withDefault: TType };
	}
): FieldInfo<TType, TSource, "ordinary">;
export function field(
	options: FieldDescription<any, any> & {
		optional?: boolean | { withDefault: any };
	}
): FieldInfo<any, any, any> {
	let defaultVal = undefined;
	if (
		typeof options.optional === "object" &&
		"withDefault" in options.optional
	) {
		defaultVal = { value: options.optional.withDefault };
	}
	return new FieldInfo(
		"(not set yet)",
		options.serializer,
		options.description,
		!!options.optional,
		defaultVal
	);
}
