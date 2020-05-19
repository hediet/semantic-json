import { NamespacedName } from "../NamespacedNamed";
import { TypeDef, TypeRefDef } from "../schema/typeDefs";
import { BaseType, ValidationContext, ValidationResult } from "./BaseType";
import { Type, ExcludeType } from "./types";
import { JSONValue } from "../JSONValue";
import { Validation } from "../Validation";

export class TypeDefinition<T = any> extends BaseType<T> {
	public readonly kind = "definition";

	private _definition: Type<T> | undefined;

	public get isDefined(): boolean {
		return !!this._definition;
	}

	public get definition(): Type<T> {
		if (!this._definition) {
			throw new Error("no definition");
		}
		return this._definition;
	}

	constructor(
		public readonly namespacedName: NamespacedName,
		definition: Type<T> | undefined
	) {
		super();

		this._definition = definition;
	}

	public validate(
		source: JSONValue,
		context: ValidationContext
	): ValidationResult<T> {
		return this.definition.validate(source, context);
	}

	public toTypeDef(): TypeDef {
		return new TypeRefDef(this.namespacedName);
	}

	public updateDefinition(newDefinition: Type<T>) {
		this._definition = newDefinition;
	}

	public resolveUnion(): ExcludeType<"union">[] {
		const u = this.definition.resolveUnion();
		if (u.length > 1) {
			return u;
		}
		return [this];
	}

	public resolveDefinition(): ExcludeType<"definition"> {
		return this.definition.resolveDefinition();
	}
}
