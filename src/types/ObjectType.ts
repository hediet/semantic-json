import { TypeDef, ObjectTypeDef, ObjectPropertyDef } from "../schema/typeDefs";
import { fromEntries } from "../utils";
import {
	BaseType,
	ValidationContext,
	ValidationResult,
	TypeAnnotation,
} from "./BaseType";
import { Type } from ".";
import {
	JSONValue,
	Validation,
	invalidData,
	ValidationError,
	validData,
} from "..";

export class ObjectType<T extends Record<string, unknown>> extends BaseType<T> {
	public static from<TProps extends Record<string, Type>>(
		props: TProps
	): ObjectType<
		{
			[TName in keyof TProps]: TProps[TName]["T"];
		}
	> {
		const obj = fromEntries(
			Object.entries(props).map(([propName, prop]) => [
				propName,
				new ObjectProperty(propName, prop, false, undefined),
			])
		);
		return new ObjectType(obj as any);
	}

	public readonly kind = "object";

	public get propertyList(): ObjectProperty<any>[] {
		return Object.values(this.properties);
	}

	constructor(
		public readonly properties: {
			[TName in keyof T]: ObjectProperty<T[TName]>;
		}
	) {
		super();
	}

	public validate(
		value: JSONValue,
		context: ValidationContext
	): ValidationResult<T> {
		if (typeof value !== "object" || value === null) {
			return invalidData({
				message: `Expected an object, but got a ${typeof value}.`,
			});
		}
		const errors = new Array<ValidationError>();
		const result: any = {};
		const resultType: Record<string, TypeAnnotation> = {};
		for (const prop of this.propertyList) {
			if (!(prop.name in value)) {
				if (!prop.isOptional) {
					errors.push(
						new ValidationError({
							message: `Required property "${prop.name}" is missing.`,
						})
					);
				}
			} else {
				const propVal = (value as any)[prop.name];
				const newPropVal = context.validate(prop.type, propVal);
				if (!newPropVal.isOk) {
					errors.push(
						...newPropVal.errors.map((e) =>
							e.prependPath(prop.name)
						)
					);
				} else {
					result[prop.name] = newPropVal.value;
					resultType[prop.name] = newPropVal.value.type;
				}
			}
		}
		/*
		for (const [propName, propVal] of Object.entries(value)) {
			const prop = this.properties[propName];
			if (!prop) {
				errors.push(
					new ValidationError({
						message: `Property "${propName}" is not expected here.`,
						path: [propName],
					})
				);
			}
		}*/

		if (errors.length > 0) {
			return invalidData(...errors);
		}

		return validData({
			value: result,
			type: { kind: "object", properties: resultType, type: this },
		});
	}

	public toTypeDef(): TypeDef {
		return new ObjectTypeDef(
			fromEntries(
				Object.entries(this.properties).map(([name, prop]) => [
					name,
					prop.toObjectPropertyDef(),
				])
			)
		);
	}
}

export class ObjectProperty<T> {
	constructor(
		public readonly name: string,
		public readonly type: Type<T>,
		public readonly isOptional: boolean,
		public readonly defaultValue: JSONValue | undefined
	) {}

	public toObjectPropertyDef(): ObjectPropertyDef {
		return new ObjectPropertyDef(
			this.type.toTypeDef(),
			this.isOptional,
			this.defaultValue
		);
	}
}
