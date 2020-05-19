import { Validation, JSONValue, TypeSystem, Type } from "../..";
import { BaseSerializer } from "./BaseSerializer";
import { Serializer } from "..";
import { SerializeContext, DeserializeContext } from "../Context";

export interface RefineOptions<TValue, TRefined> {
	canSerialize: (value: unknown) => value is TRefined;
	serialize: (value: TRefined) => TValue;
	deserialize: (value: TValue) => Validation<TRefined>;
}

export class RefinedSerializer<
	TValue,
	TSource extends JSONValue,
	TIndermediateValue
> extends BaseSerializer<TValue, TSource> {
	constructor(
		public readonly underlyingSerializer: Serializer<
			TIndermediateValue,
			TSource
		>,
		private readonly options: RefineOptions<TIndermediateValue, TValue>
	) {
		super();
	}

	public canSerialize(value: unknown): value is TValue {
		return this.options.canSerialize(value);
	}

	public serializeWithContext(
		value: TValue,
		context: SerializeContext
	): TSource {
		const intermediate = this.options.serialize(value);
		return this.underlyingSerializer.serializeWithContext(
			intermediate,
			context
		);
	}

	public deserializeWithContext(
		value: JSONValue,
		context: DeserializeContext
	): Validation<TValue> {
		const r = this.underlyingSerializer.deserializeWithContext(
			value,
			context
		);

		if (!r.isOk) {
			return r;
		} else {
			return this.options.deserialize(r.value);
		}
	}

	public getType(typeSystem: TypeSystem): Type {
		return this.underlyingSerializer.getType(typeSystem);
	}
}
