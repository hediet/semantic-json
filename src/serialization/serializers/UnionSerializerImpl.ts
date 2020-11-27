import { BaseSerializerImpl } from "../BaseSerializer";
import { Serializer } from "../Serializer";
import { JSONValue } from "../../JSONValue";
import { DeserializeContext } from "../DeserializeContext";
import {
	DeserializeResult,
	DeserializeErrorAlternative,
	DeserializeError,
} from "../DeserializeResult";
import { SerializeContext } from "../SerializeContext";
import { UnionSchemaDef, SchemaDef } from "../../schema/schemaDefs";
import { SerializerSystem } from "../SerializerSystem";

export interface UnionSerializer {
	kind: "union";
	exclusive: boolean;
	unitedSerializers: readonly Serializer<any>[];
}

export type UnionProcessingStrategy = "all" | "first" | "firstExclusive";

export class UnionSerializerImpl<T>
	extends BaseSerializerImpl<T[], UnionSerializer>
	implements UnionSerializer {
	public readonly kind = "union";

	public readonly exclusive = this.processingStrategy === "firstExclusive";

	constructor(
		public readonly unitedSerializers: readonly Serializer<T>[],
		public readonly processingStrategy: UnionProcessingStrategy
	) {
		super();
	}

	protected internalDeserialize(
		source: JSONValue,
		context: DeserializeContext
	): DeserializeResult<T[]> {
		const innerContext = context.withoutFirstDeserializationOnValue();
		const alternatives = new Array<DeserializeErrorAlternative>();
		let idx = 0;
		const result = new Array<T>();

		for (const s of this.unitedSerializers) {
			const r = s.deserialize(source, innerContext);
			if (r.errors.length === 0) {
				result.push(r.value);
				if (this.processingStrategy !== "all") {
					break;
				}
			} else {
				alternatives.push({
					alternativeId: idx.toString(),
					errors: r.errors,
				});
			}
			idx++;
		}

		if (result.length > 0) {
			return DeserializeResult.fromValue(result);
		}

		return DeserializeResult.fromError(
			DeserializeError.from({
				message: "No serializer could deserialize the value",
				alternatives,
			})
		);
	}

	protected internalCanSerialize(value: unknown): value is T[] {
		// TODO
		return Array.isArray(value);
	}

	protected internalSerialize(
		values: T[],
		context: SerializeContext
	): JSONValue {
		if (values.length === 0) {
			throw new Error("Must have at least one value");
		}

		const results = [];
		for (const value of values) {
			let couldSerialize = false;
			for (const serializer of this.unitedSerializers) {
				if (serializer.canSerialize(value)) {
					const r = serializer.serialize(value, context);
					results.push(r);
					couldSerialize = true;
					break;
				}
			}
			if (!couldSerialize) {
				throw new Error(
					`No serializer can handle the value "${values}"`
				);
			}
		}

		if (results.length === 1) {
			return results[0];
		}

		return Object.assign({}, ...results);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return new UnionSchemaDef(
			this.unitedSerializers.map((s) => s.toSchema(serializerSystem))
		);
	}
}
