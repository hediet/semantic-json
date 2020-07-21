import { BaseSerializerImpl } from "../BaseSerializer";
import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import { JSONValue } from "../../JSONValue";
import { SerializeContext } from "../SerializeContext";

export interface AnySerializer {
	kind: "any";
}

export class AnySerializerImpl extends BaseSerializerImpl<any, AnySerializer>
	implements AnySerializer {
	public readonly kind = "any";

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<any> {
		return DeserializeResult.fromValue(source as any);
	}

	protected internalCanSerialize(value: unknown): value is any {
		return true;
	}

	protected internalSerialize(
		value: any,
		context: SerializeContext
	): JSONValue {
		return value;
	}
}
