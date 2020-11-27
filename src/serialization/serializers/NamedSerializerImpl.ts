import { Serializer } from "../Serializer";
import { DeserializeResult } from "../DeserializeResult";
import { NamespacedName } from "../../NamespacedNamed";
import {
	DelegatingSerializerImpl,
	DelegatingSerializer,
} from "./DelegatingSerializerImpl";
import { SerializeContext } from "../SerializeContext";
import { JSONValue } from "../..";
import { SerializerSystem } from "../SerializerSystem";
import { SchemaDef, SchemaRefDef } from "../../schema/schemaDefs";

export interface NamedSerializer extends DelegatingSerializer {
	delegationKind: "named";
	name: NamespacedName;
}

export class NamedSerializerImpl<T = any>
	extends DelegatingSerializerImpl<T, T, NamedSerializer>
	implements NamedSerializer {
	public readonly delegationKind = "named";
	private _underlyingSerializer: Serializer<T> | undefined;

	get underlyingSerializer(): Serializer<T> {
		if (!this._underlyingSerializer) {
			throw new Error("no definition");
		}
		return this._underlyingSerializer;
	}

	constructor(
		underlyingSerializer: Serializer<T> | undefined,
		public readonly name: NamespacedName
	) {
		super();

		this._underlyingSerializer = underlyingSerializer;
	}

	public initializeUnderlyingSerializer(serializer: Serializer<T>): void {
		if (this._underlyingSerializer) {
			throw new Error("Already defined");
		}

		this._underlyingSerializer = serializer;
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
		if (!serializerSystem.isSerializerKnown(this.name)) {
			serializerSystem.defineSerializer(
				this.name,
				this.underlyingSerializer
			);
		}
		return new SchemaRefDef(this.name);
	}
}
