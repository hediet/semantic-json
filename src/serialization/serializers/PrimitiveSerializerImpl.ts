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

export interface PrimitiveSerializer<TPrimitiveName = keyof Primitives> {
	kind: "primitive";
	primitive: TPrimitiveName;
}

export abstract class PrimitiveSerializerImpl<
		TPrimitiveName extends keyof Primitives,
		TInterface extends PrimitiveSerializer<TPrimitiveName>
	>
	extends BaseSerializerImpl<Primitives[TPrimitiveName], TInterface>
	implements PrimitiveSerializer {
	public readonly kind = "primitive";

	constructor(public readonly primitive: TPrimitiveName) {
		super();
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<Primitives[TPrimitiveName]> {
		if (typeof source !== this.primitive) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(source, {
					type: this.primitive,
				}),
			});
		}
		return this.internalDeserializePrimitive(source as any, context);
	}

	protected abstract internalDeserializePrimitive(
		source: Primitives[TPrimitiveName],
		context: DeserializeContext
	): DeserializeResult<Primitives[TPrimitiveName]>;

	protected internalCanSerialize(
		value: unknown
	): value is Primitives[TPrimitiveName] {
		return typeof value === this.primitive;
	}

	protected internalSerialize(
		value: Primitives[TPrimitiveName],
		context: SerializeContext
	): JSONValue {
		return value;
	}
}
