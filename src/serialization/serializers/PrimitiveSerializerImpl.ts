import { BaseSerializerImpl } from "../BaseSerializer";
import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import { JSONValue } from "../../JSONValue";
import { SerializeContext } from "../SerializeContext";
import { getTypeMismatchMessage } from "../getTypeMismatchMessage";

export type Primitives = {
	string: string;
	number: number;
	boolean: boolean;
};

export interface PrimitiveSerializer {
	kind: "primitive";
	primitive: keyof Primitives;
}

export class PrimitiveSerializerImpl<T extends keyof Primitives>
	extends BaseSerializerImpl<Primitives[T], PrimitiveSerializer>
	implements PrimitiveSerializer {
	public readonly kind = "primitive";

	constructor(public readonly primitive: T) {
		super();
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<Primitives[T]> {
		if (typeof source !== this.primitive) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(source, {
					type: this.primitive,
				}),
			});
		}
		return DeserializeResult.fromValue(source as any);
	}

	protected internalCanSerialize(value: unknown): value is Primitives[T] {
		return typeof value === this.primitive;
	}

	protected internalSerialize(
		value: Primitives[T],
		context: SerializeContext
	): JSONValue {
		return value;
	}
}
