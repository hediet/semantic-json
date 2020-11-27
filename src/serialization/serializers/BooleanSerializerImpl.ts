import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import {
	PrimitiveSerializer,
	PrimitiveSerializerImpl,
} from "./PrimitiveSerializerImpl";
import { BooleanSchemaDef, SchemaDef } from "../../schema/schemaDefs";
import { SerializerSystem } from "../SerializerSystem";

export interface BooleanSerializer extends PrimitiveSerializer<"boolean"> {}

export class BooleanSerializerImpl extends PrimitiveSerializerImpl<
	"boolean",
	BooleanSerializer
> {
	constructor() {
		super("boolean");
	}

	protected internalDeserializePrimitive(
		source: boolean,
		context: DeserializeContext
	): DeserializeResult<boolean> {
		return DeserializeResult.fromValue(source);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return new BooleanSchemaDef();
	}
}
