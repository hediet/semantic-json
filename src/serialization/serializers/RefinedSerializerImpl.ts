import { Serializer } from "../Serializer";
import { DeserializeResult } from "../DeserializeResult";
import {
	DelegatingSerializerImpl,
	DelegatingSerializer,
} from "./DelegatingSerializerImpl";
import { DeserializeContext } from "../DeserializeContext";
import { JSONValue } from "../..";
import { SerializeContext } from "../SerializeContext";
import { Refinement } from "../BaseSerializer";
import { SerializerSystem } from "../SerializerSystem";
import { SchemaDef } from "../../schema/schemaDefs";

export interface RefinedSerializer extends DelegatingSerializer {
	delegationKind: "refined";
}

export class RefinedSerializerImpl<T, TIntermediate>
	extends DelegatingSerializerImpl<T, TIntermediate, RefinedSerializer>
	implements RefinedSerializer {
	public readonly delegationKind = "refined";

	private readonly _canSerialize: (value: unknown) => value is T;
	private readonly _fromIntermediate: (
		value: TIntermediate,
		context: DeserializeContext
	) => DeserializeResult<T> | T;
	private readonly _toIntermediate: (
		value: T,
		context: SerializeContext
	) => TIntermediate;

	constructor(
		public readonly underlyingSerializer: Serializer<TIntermediate>,
		refinement: Refinement<T, TIntermediate>
	) {
		super();

		if ("class" in refinement) {
			this._canSerialize = (value): value is T => {
				if (!(value instanceof refinement.class)) {
					return false;
				}
				if (refinement.canSerializeInstance) {
					return refinement.canSerializeInstance(value);
				}
				return true;
			};
			this._fromIntermediate = refinement.fromIntermediate;
			this._toIntermediate = refinement.toIntermediate;
		} else {
			this._canSerialize = refinement.canSerialize;
			this._fromIntermediate = refinement.fromIntermediate;
			this._toIntermediate = refinement.toIntermediate;
		}
	}

	public refineIntermediate(
		value: TIntermediate,
		context: DeserializeContext
	): DeserializeResult<T> {
		const result = this._fromIntermediate(value, context);
		if (result instanceof DeserializeResult) {
			return result;
		}
		return DeserializeResult.fromValue(result);
	}

	protected internalCanSerialize(value: unknown): value is T {
		return this._canSerialize(value);
	}

	protected internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue {
		const intermediate = this._toIntermediate(value, context);
		return this.underlyingSerializer.serialize(intermediate, context);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return this.underlyingSerializer.toSchema(serializerSystem);
	}
}
