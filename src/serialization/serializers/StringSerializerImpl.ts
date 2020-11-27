import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import {
	PrimitiveSerializerImpl,
	PrimitiveSerializer,
} from "./PrimitiveSerializerImpl";
import { StringSchemaDef, SchemaDef } from "../../schema/schemaDefs";
import { SerializerSystem } from "../SerializerSystem";

export interface StringSerializer extends PrimitiveSerializer<"string"> {
	minLength: number | undefined;
	maxLength: number | undefined;
	// https://json-schema.org/understanding-json-schema/reference/regular_expressions.html
	regex: string | undefined;
}

export interface StringSerializerOptions {
	minLength?: number;
	maxLength?: number;
	regex?: string;
}

export class StringSerializerImpl extends PrimitiveSerializerImpl<
	"string",
	StringSerializer
> {
	public readonly minLength: number | undefined;
	public readonly maxLength: number | undefined;
	public readonly regex: string | undefined;

	constructor(options: StringSerializerOptions) {
		super("string");

		this.minLength = options.minLength;
		this.maxLength = options.maxLength;
		this.regex = options.regex;
	}

	protected internalDeserializePrimitive(
		source: string,
		context: DeserializeContext
	): DeserializeResult<string> {
		return DeserializeResult.fromValue(source);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return new StringSchemaDef();
	}
}
