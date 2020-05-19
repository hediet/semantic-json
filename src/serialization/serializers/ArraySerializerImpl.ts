import { BaseSerializer, BaseSerializerImpl } from "../BaseSerializer";
import {
	Serializer,
	DeserializeContext,
	DeserializeResult,
	DeserializeError,
} from "..";
import { SerializeContext } from "../SerializeContext";
import { JSONValue } from "../..";
import {
	isJSONValueOfType,
	getTypeMismatchMessage,
} from "../getTypeMismatchMessage";

export interface ArraySerializer {
	kind: "array";
	itemSerializer: Serializer<any>;
}

export class ArraySerializerImpl<TValue>
	extends BaseSerializerImpl<TValue[], ArraySerializer>
	implements ArraySerializer {
	public readonly kind = "array";

	constructor(public readonly itemSerializer: Serializer<TValue>) {
		super();
	}

	protected internalDeserialize(
		value: JSONValue,
		context: DeserializeContext
	): DeserializeResult<TValue[]> {
		if (!isJSONValueOfType(value, "array")) {
			return DeserializeResult.fromError({
				message: getTypeMismatchMessage(value, { type: "array" }),
			});
		}

		const errors = new Array<DeserializeError>();
		const result = new Array<TValue>(value.length);
		for (let i = 0; i < value.length; i++) {
			const r = this.itemSerializer.deserialize(value[i], context);
			if (r.errors.length > 0) {
				errors.push(...r.errors.map((e) => e.prependPath(i)));
			}
			if (r.hasValue) {
				result[i] = r.value;
			} else {
				result[i] = undefined as any;
			}
		}

		if (errors.length > 0) {
			return DeserializeResult.fromValueWithError(result, ...errors);
		}

		return DeserializeResult.fromValue(result);
	}

	protected internalCanSerialize(value: unknown): value is TValue[] {
		return value instanceof Array;
	}

	protected internalSerialize(
		value: TValue[],
		context: SerializeContext
	): JSONValue {
		return value.map((v) => this.itemSerializer.serialize(v, context));
	}
}
