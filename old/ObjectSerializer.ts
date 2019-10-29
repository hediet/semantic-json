import {
	Serializer,
	ConversionResult,
	singleError,
	ConversionError,
	ErrorCollector,
} from "./Serializer";

export type FieldKind = "ordinary" | "optional" | "optionalWithDefault";

export interface FieldType<
	TSerializer extends Serializer<any, any>,
	TKind extends FieldKind
> {
	serializer: TSerializer;
	kind: TKind;
}

export class FieldInfo<
	TSerializer extends Serializer<any, any> = Serializer<any, any>,
	TKind extends FieldKind = FieldKind
> {
	get type(): FieldType<TSerializer, TKind> {
		throw new Error("Not meant to be accessed at runtime!");
	}

	constructor(
		public readonly name: string,
		public readonly serializer: Serializer<any, any>,
		public readonly description: string | undefined,
		public readonly isOptional: boolean,
		public readonly defaultValue: { value: TSerializer["T"] } | undefined
	) {}

	public withName(newName: string): FieldInfo<TSerializer, TKind> {
		return new FieldInfo(
			newName,
			this.serializer,
			this.description,
			this.isOptional,
			this.defaultValue
		);
	}
}

export type Fields = Record<string, FieldType<Serializer<any, any>, FieldKind>>;
export type AsFields<T extends Fields> = T;

export class ObjectSerializer<TFields extends Fields> extends Serializer<
	FieldsToT<TFields>,
	FieldsToTOther<TFields>
> {
	constructor(private readonly fields: Record<string, FieldInfo>) {
		super();
	}

	public tryDeserialize(
		value: unknown
	): ConversionResult<FieldsToT<TFields>> {
		if (typeof value !== "object") {
			return singleError(
				new ConversionError({
					message: `Expected an object, but got ${typeof value}.`,
				})
			);
		}
		if (value === null) {
			return singleError(
				new ConversionError({
					message: `Expected a non-null object, but got null.`,
				})
			);
		}
		const errors = new ErrorCollector();
		const result: any = {};
		for (const [fieldName, field] of Object.entries(this.fields)) {
			if (!(fieldName in value)) {
				if (!field.isOptional) {
					errors.push(
						new ConversionError({
							message: `Required field ${fieldName} is missing.`,
						})
					);
				} else if (field.defaultValue) {
					result[fieldName] = field.defaultValue.value;
				}
			} else {
				const fieldVal = (value as any)[fieldName];
				const newFieldVal = field.serializer.tryDeserialize(fieldVal);
				if (newFieldVal.kind === "error") {
					errors.push(
						...newFieldVal.errors.map(e => e.prependPath(fieldName))
					);
				} else {
					result[fieldName] = newFieldVal;
				}
			}
		}

		for (const [field, fieldVal] of Object.entries(value)) {
			const f = this.fields[field];
			if (!f) {
				throw "";
			}
		}

		if (errors.hasErrors) {
			return errors;
		}

		return {
			kind: "successful",
			result: result,
		};
	}

	public trySerialize(
		value: unknown
	): ConversionResult<FieldsToTOther<TFields>> {
		return null!;
	}
}

export type FieldsWith<TFields extends Fields, TKind extends FieldKind> = {
	[TKey in keyof TFields]: TFields[TKey] extends FieldType<any, TKind>
		? TKey
		: never
}[keyof TFields];

export type Simplify<T extends object> = { [TKey in keyof T]: T[TKey] };

export type FieldsToT<TFields extends Fields> = Simplify<
	{
		[TKey in FieldsWith<
			TFields,
			"ordinary" | "optionalWithDefault"
		>]: TFields[TKey]["serializer"]["T"]
	} &
		{
			[TKey in FieldsWith<
				TFields,
				"optional"
			>]?: TFields[TKey]["serializer"]["T"]
		}
>;

export type FieldsToTOther<TFields extends Fields> = Simplify<
	{
		[TKey in FieldsWith<
			TFields,
			"ordinary"
		>]: TFields[TKey]["serializer"]["TOther"]
	} &
		{
			[TKey in FieldsWith<
				TFields,
				"optional" | "optionalWithDefault"
			>]?: TFields[TKey]["serializer"]["TOther"]
		}
>;

export type FieldsOptions = Record<string, FieldInfo | Serializer<any, any>>;

export function sObject<T extends FieldsOptions>(
	fields: T
): ObjectSerializer<ObjectTypeCtor<T>> {
	const normalizedFields = normalizeFields(fields);
	return new ObjectSerializer<ObjectTypeCtor<T>>(normalizedFields);
}

export function normalizeFields<T extends FieldsOptions>(
	fields: T
): Record<string, FieldInfo> {
	const normalizedFields: Record<string, FieldInfo> = {};
	for (const [name, val] of Object.entries(fields)) {
		if (val instanceof Serializer) {
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
		[TKey in keyof T]: T[TKey] extends Serializer<any, any>
			? FieldType<T[TKey], "ordinary">
			: T[TKey] extends FieldInfo
			? T[TKey]["type"]
			: never
	}
>;

export interface FieldDescription<TType extends Serializer<any, any>> {
	type: TType;
	description?: string;
}

export function field<TType extends Serializer<any, any>>(
	options: FieldDescription<TType> & {
		optional: { withDefault: TType["T"] };
	}
): FieldInfo<TType, "optionalWithDefault">;
export function field<TType extends Serializer<any, any>>(
	options: FieldDescription<TType> & { optional: true }
): FieldInfo<TType, "optional">;
export function field<TType extends Serializer<any, any>>(
	options: FieldDescription<TType> & {
		optional?: boolean | { withDefault: TType["T"] };
	}
): FieldInfo<TType, "ordinary">;
export function field(
	options: FieldDescription<any> & {
		optional?: boolean | { withDefault: any };
	}
): FieldInfo<any, any> {
	let defaultVal = undefined;
	if (
		typeof options.optional === "object" &&
		"withDefault" in options.optional
	) {
		defaultVal = { value: options.optional.withDefault };
	}
	return new FieldInfo(
		"(not set yet)",
		options.type,
		options.description,
		options.optional !== false,
		defaultVal
	);
}
