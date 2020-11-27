import { BaseSerializerImpl } from "../BaseSerializer";
import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import { JSONValue } from "../../JSONValue";
import { SerializeContext } from "../SerializeContext";
import { getTypeMismatchMessage } from "../getTypeMismatchMessage";
import {
	LiteralSchemaDef,
	NullSchemaDef,
	SchemaDef,
} from "../../schema/schemaDefs";
import { SerializerSystem } from "../SerializerSystem";

export type LiteralType = string | number | boolean | null;

export interface LiteralSerializer {
	kind: "literal";
	value: LiteralType;
}

export class LiteralSerializerImpl<T extends LiteralType>
	extends BaseSerializerImpl<T, LiteralSerializer>
	implements LiteralSerializer {
	public readonly kind = "literal";

	constructor(public readonly value: T) {
		super();
	}

	protected internalDeserialize(
		value: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T> {
		if (value !== this.value) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(value, { value: this.value }),
			});
		}

		return DeserializeResult.fromValue(value as any);
	}

	protected internalCanSerialize(value: unknown): value is T {
		return value === this.value;
	}

	protected internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue {
		if (value !== this.value) {
			throw new Error(
				`Invalid value. Expected ${this.value}, but got ${value}`
			);
		}
		return this.value;
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		if (this.value === null) {
			return new NullSchemaDef();
		}
		return new LiteralSchemaDef(this.value!);
	}
}
