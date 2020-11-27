import { Serializer } from "../Serializer";
import { DeserializeResult } from "../DeserializeResult";
import {
	DelegatingSerializerImpl,
	DelegatingSerializer,
} from "./DelegatingSerializerImpl";
import { SerializeContext } from "../SerializeContext";
import { JSONValue } from "../..";
import { SerializerSystem } from "../SerializerSystem";
import { SchemaDef } from "../../schema/schemaDefs";

export interface LazySerializer extends DelegatingSerializer {
	delegationKind: "lazy";
	name: undefined;
}

export class LazySerializerImpl<T>
	extends DelegatingSerializerImpl<T, T, LazySerializer>
	implements LazySerializer {
	public readonly delegationKind = "lazy";

	public readonly name: undefined;
	private cached: Serializer<T> | undefined = undefined;

	get underlyingSerializer(): Serializer<T> {
		if (!this.cached) {
			this.cached = this.serializerRef();
		}
		return this.cached;
	}

	constructor(public readonly serializerRef: () => Serializer<T>) {
		super();
	}

	public refineIntermediate(value: T): DeserializeResult<T> {
		return DeserializeResult.fromValue(value);
	}

	public refineSource(source: DeserializeResult<T>): DeserializeResult<T> {
		return source;
	}

	protected internalCanSerialize(value: unknown): value is T {
		return this.underlyingSerializer.canSerialize(value);
	}

	protected internalSerialize(
		value: T,
		context: SerializeContext
	): JSONValue {
		return this.underlyingSerializer.serialize(value, context);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return this.underlyingSerializer.toSchema(serializerSystem);
	}
}
