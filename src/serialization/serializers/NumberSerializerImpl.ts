import { DeserializeResult } from "../DeserializeResult";
import { DeserializeContext } from "../DeserializeContext";
import {
	PrimitiveSerializer,
	PrimitiveSerializerImpl,
} from "./PrimitiveSerializerImpl";
import { NumberSchemaDef, SchemaDef } from "../../schema/schemaDefs";
import { SerializerSystem } from "../SerializerSystem";

type Boundary = [number, "inclusive" | "exclusive"];

export interface NumberSerializer extends PrimitiveSerializer<"number"> {
	lowerBound?: number;
	lowerBoundExclusive?: boolean;
	upperBound?: number;
	upperBoundExclusive?: boolean;
	integer: boolean | undefined;
}

export interface NumberSerializerOptions {
	lowerBound?: number;
	lowerBoundExclusive?: boolean;
	upperBound?: number;
	upperBoundExclusive?: boolean;
	integer?: boolean;
}

export class NumberSerializerImpl
	extends PrimitiveSerializerImpl<"number", NumberSerializer>
	implements NumberSerializer {
	public readonly lowerBound: number | undefined;
	public readonly lowerBoundExclusive: boolean;
	public readonly upperBound: number | undefined;
	public readonly upperBoundExclusive: boolean;
	public readonly integer: boolean | undefined;

	constructor(options: NumberSerializerOptions) {
		super("number");

		this.lowerBound = options.lowerBound;
		this.lowerBoundExclusive = options.lowerBoundExclusive || false;
		this.upperBound = options.upperBound;
		this.upperBoundExclusive = options.upperBoundExclusive || false;
		this.integer = options.integer;
	}

	protected internalDeserializePrimitive(
		source: number,
		context: DeserializeContext
	): DeserializeResult<number> {
		// TODO test constraints
		return DeserializeResult.fromValue(source);
	}

	public toSchema(serializerSystem: SerializerSystem): SchemaDef {
		return new NumberSchemaDef(
			this.integer,
			this.lowerBound,
			this.lowerBoundExclusive,
			this.upperBound,
			this.upperBoundExclusive
		);
	}
}

function normalizeBound(bound: number | Boundary): Boundary {
	if (typeof bound === "number") {
		return [bound, "inclusive"];
	}
	return bound;
}
